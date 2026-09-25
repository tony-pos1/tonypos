import { db } from '../db';
import { AppSettings, DailyCloseSummary, Order, ShiftRecord } from '../../types';
import { getBusinessDate, getPreviousBusinessDate } from '../../utils/businessDay';

export interface IDailyCloseRepo {
  getDailyClosings(): Promise<DailyCloseSummary[]>;
  getDailyClosing(businessDate: string): Promise<DailyCloseSummary | undefined>;
  saveDailyClosing(summary: DailyCloseSummary): Promise<string>;
  checkAndPerformDailyClose(
    orders: Order[],
    currentSettings: AppSettings,
    shifts: ShiftRecord[]
  ): Promise<{ newlyClosed: DailyCloseSummary[]; hasOpenShift: boolean }>;
}

export class DexieDailyCloseRepo implements IDailyCloseRepo {
  async getDailyClosings(): Promise<DailyCloseSummary[]> {
    try {
      const list = await db.dailyClosings.toArray();
      return list.sort((a, b) => b.businessDate.localeCompare(a.businessDate));
    } catch (err) {
      console.warn('[DailyCloseRepo] Could not load daily closings:', err);
      return [];
    }
  }

  async getDailyClosing(businessDate: string): Promise<DailyCloseSummary | undefined> {
    try {
      return await db.dailyClosings.get(businessDate);
    } catch (err) {
      console.warn('[DailyCloseRepo] Could not load daily closing for', businessDate, err);
      return undefined;
    }
  }

  async saveDailyClosing(summary: DailyCloseSummary): Promise<string> {
    try {
      await db.dailyClosings.put(summary);
      return summary.id;
    } catch (err) {
      console.error('[DailyCloseRepo] Failed to save daily closing:', err);
      throw err;
    }
  }

  /**
   * Evaluates if any finished business days (< current business day) need to be closed.
   * Runs safely on app startup and every 30s timer.
   * Handles missed days without duplicating or overwriting already closed summaries.
   */
  async checkAndPerformDailyClose(
    orders: Order[],
    currentSettings: AppSettings,
    shifts: ShiftRecord[]
  ): Promise<{ newlyClosed: DailyCloseSummary[]; hasOpenShift: boolean }> {
    const closingTime = currentSettings.dailyClosingTime || '00:00';
    const now = Date.now();
    const currentBizDate = getBusinessDate(now, closingTime);
    const existingClosings = await this.getDailyClosings();
    const closedDateSet = new Set(existingClosings.map((c) => c.businessDate));

    // Find all distinct past business dates that need closing
    const datesToCloseSet = new Set<string>();

    // Always check the immediately preceding business day
    const prevDay = getPreviousBusinessDate(currentBizDate);
    if (!closedDateSet.has(prevDay)) {
      datesToCloseSet.add(prevDay);
    }

    // Check all paid and voided orders to see if any past business days were missed
    for (const o of orders) {
      const orderBizDate = getBusinessDate(o.closedAt || o.createdAt, closingTime);
      if (orderBizDate < currentBizDate && !closedDateSet.has(orderBizDate)) {
        datesToCloseSet.add(orderBizDate);
      }
    }

    const unclosedDates = Array.from(datesToCloseSet).sort((a, b) => a.localeCompare(b));
    if (unclosedDates.length === 0) {
      return { newlyClosed: [], hasOpenShift: false };
    }

    const newlyClosed: DailyCloseSummary[] = [];

    // Find currently open/held bills to list as carried-over
    const carriedOverBills = orders
      .filter((o) => (o.status === 'open' || o.status === 'held' || o.status === 'billed') && !o.isPaid)
      .map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        tableName: o.tableName,
        netTotal: o.netTotal || 0,
      }));

    for (const targetDate of unclosedDates) {
      // Collect orders for this specific past business day
      const dayPaidOrders = orders.filter(
        (o) =>
          o.status === 'paid' &&
          getBusinessDate(o.closedAt || o.createdAt, closingTime) === targetDate
      );

      const dayVoidedOrders = orders.filter(
        (o) =>
          o.status === 'voided' &&
          getBusinessDate(o.closedAt || o.createdAt, closingTime) === targetDate
      );

      // Totals
      const orderCount = dayPaidOrders.length;
      const grossSales = dayPaidOrders.reduce((sum, o) => sum + (o.subtotal || 0), 0);
      const discountAmount = dayPaidOrders.reduce((sum, o) => sum + (o.discountAmount || 0), 0);
      const serviceChargeAmount = dayPaidOrders.reduce((sum, o) => sum + (o.serviceChargeAmount || 0), 0);
      const vatAmount = dayPaidOrders.reduce((sum, o) => sum + (o.vatAmount || 0), 0);
      const netTotal = dayPaidOrders.reduce((sum, o) => sum + (o.netTotal || 0), 0);

      // Payment breakdown
      const paymentMethods = {
        cash: 0,
        promptpay: 0,
        credit_card: 0,
        digital_wallet: 0,
      };

      for (const o of dayPaidOrders) {
        for (const p of o.payments || []) {
          if (p.method === 'cash') paymentMethods.cash += p.amount;
          else if (p.method === 'promptpay') paymentMethods.promptpay += p.amount;
          else if (p.method === 'credit_card') paymentMethods.credit_card += p.amount;
          else if (p.method === 'digital_wallet') paymentMethods.digital_wallet += p.amount;
        }
      }

      // Top selling items
      const itemMap: Record<string, { quantity: number; sales: number }> = {};
      for (const o of dayPaidOrders) {
        for (const l of o.lines || []) {
          if (l.status !== 'voided') {
            const name = l.name_th || l.name_en || 'Unknown Item';
            if (!itemMap[name]) itemMap[name] = { quantity: 0, sales: 0 };
            itemMap[name].quantity += l.quantity;
            itemMap[name].sales += l.unitPrice * l.quantity;
          }
        }
      }

      const topItems = Object.entries(itemMap)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 10);

      const summary: DailyCloseSummary = {
        id: targetDate,
        businessDate: targetDate,
        closedAt: now,
        closingTimeSetting: closingTime,
        orderCount,
        grossSales,
        discountAmount,
        serviceChargeAmount,
        vatAmount,
        netTotal,
        paymentMethods,
        voidedCount: dayVoidedOrders.length,
        topItems,
        carriedOverBills,
      };

      await this.saveDailyClosing(summary);
      newlyClosed.push(summary);
    }

    // Reset daily takeaway queue counter for the new business day
    try {
      await db.settings.update(currentSettings.id, {
        queueNumberResetDate: currentBizDate,
        lastDailyQueue: 0,
        lastDailyClosingDate: unclosedDates[unclosedDates.length - 1],
      });
    } catch (e) {
      console.warn('[DailyCloseRepo] Could not update settings queue/close date:', e);
    }

    const hasOpenShift = shifts.some((s) => s.status === 'open');
    return { newlyClosed, hasOpenShift };
  }
}

export const dailyCloseRepo = new DexieDailyCloseRepo();
