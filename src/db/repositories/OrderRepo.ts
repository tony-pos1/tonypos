import { db } from '../db';
import { Order, OrderStatus } from '../../types';
import { defaultSettings } from '../seedData';

export interface IOrderRepo {
  getOrders(limit?: number): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  getHeldOrders(): Promise<Order[]>;
  saveOrder(order: Order): Promise<string>;
  updateOrderStatus(id: string, status: OrderStatus): Promise<void>;
  deleteOrder(id: string): Promise<void>;
  getNextDailyQueueNumber(): Promise<number>;
  generateOrderNumber(): string;
  getTodaySalesSummary(): Promise<{ totalSales: number; orderCount: number; avgBill: number }>;
}

export class DexieOrderRepo implements IOrderRepo {
  async getOrders(limit = 50): Promise<Order[]> {
    return await db.orders.orderBy('createdAt').reverse().limit(limit).toArray();
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return await db.orders.get(id);
  }

  async getHeldOrders(): Promise<Order[]> {
    return await db.orders.where('status').equals('held').sortBy('updatedAt');
  }

  async saveOrder(order: Order): Promise<string> {
    const updated: Order = {
      ...order,
      updatedAt: Date.now(),
    };
    await db.orders.put(updated);
    return updated.id;
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
    await db.orders.update(id, {
      status,
      updatedAt: Date.now(),
      closedAt: status === 'paid' || status === 'voided' ? Date.now() : undefined,
    });
  }

  async deleteOrder(id: string): Promise<void> {
    await db.orders.delete(id);
  }

  async getNextDailyQueueNumber(): Promise<number> {
    const todayStr = new Date().toISOString().split('T')[0];
    const settingsList = await db.settings.toArray();
    const settings = settingsList[0] || defaultSettings;

    let nextQueue = 1;
    if (settings.queueNumberResetDate === todayStr) {
      nextQueue = (settings.lastDailyQueue || 0) + 1;
    } else {
      nextQueue = 1;
    }

    await db.settings.update(settings.id, {
      queueNumberResetDate: todayStr,
      lastDailyQueue: nextQueue,
    });

    return nextQueue;
  }

  generateOrderNumber(): string {
    const d = new Date();
    const datePart = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    const timePart = `${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}`;
    const rand = Math.floor(100 + Math.random() * 900);
    return `ORD-${datePart}-${timePart}-${rand}`;
  }

  async getTodaySalesSummary(): Promise<{ totalSales: number; orderCount: number; avgBill: number }> {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const startOfDay = now.getTime();

    const paidOrders = await db.orders
      .where('createdAt')
      .aboveOrEqual(startOfDay)
      .filter((o) => o.status === 'paid')
      .toArray();

    const totalSales = paidOrders.reduce((acc, curr) => acc + (curr.netTotal || 0), 0);
    const orderCount = paidOrders.length;
    const avgBill = orderCount > 0 ? Math.round(totalSales / orderCount) : 0;

    return { totalSales, orderCount, avgBill };
  }
}

export const orderRepo = new DexieOrderRepo();
