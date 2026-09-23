import { db } from '../db';
import { ShiftRecord } from '../../types';

export interface IShiftRepo {
  getCurrentShift(): Promise<ShiftRecord | undefined>;
  openShift(openedBy: string, startFloat: number): Promise<ShiftRecord>;
  closeShift(id: string, closedBy: string, countedCash: number, notes?: string): Promise<ShiftRecord>;
  recordCashTransaction(type: 'in' | 'out', amount: number): Promise<void>;
  recordCashSale(amount: number): Promise<void>;
}

export class DexieShiftRepo implements IShiftRepo {
  async getCurrentShift(): Promise<ShiftRecord | undefined> {
    return await db.shifts.where('status').equals('open').first();
  }

  async openShift(openedBy: string, startFloat: number): Promise<ShiftRecord> {
    const existing = await this.getCurrentShift();
    if (existing) return existing;

    const newShift: ShiftRecord = {
      id: `shift_${Date.now()}`,
      openedAt: Date.now(),
      openedBy,
      startCashFloat: startFloat,
      cashSales: 0,
      cashPayouts: 0,
      cashIns: 0,
      expectedCash: startFloat,
      status: 'open',
    };

    await db.shifts.put(newShift);
    return newShift;
  }

  async closeShift(id: string, closedBy: string, countedCash: number, notes?: string): Promise<ShiftRecord> {
    const shift = await db.shifts.get(id);
    if (!shift) throw new Error('Shift not found');

    const expectedCash = shift.startCashFloat + shift.cashSales + shift.cashIns - shift.cashPayouts;
    const variance = countedCash - expectedCash;

    const updated: ShiftRecord = {
      ...shift,
      closedAt: Date.now(),
      closedBy,
      actualCountedCash: countedCash,
      variance,
      notes,
      status: 'closed',
    };

    await db.shifts.put(updated);
    return updated;
  }

  async recordCashTransaction(type: 'in' | 'out', amount: number): Promise<void> {
    const shift = await this.getCurrentShift();
    if (!shift) return;
    if (type === 'in') {
      await db.shifts.update(shift.id, {
        cashIns: shift.cashIns + amount,
        expectedCash: shift.expectedCash + amount,
      });
    } else {
      await db.shifts.update(shift.id, {
        cashPayouts: shift.cashPayouts + amount,
        expectedCash: shift.expectedCash - amount,
      });
    }
  }

  async recordCashSale(amount: number): Promise<void> {
    const shift = await this.getCurrentShift();
    if (!shift) return;
    await db.shifts.update(shift.id, {
      cashSales: shift.cashSales + amount,
      expectedCash: shift.expectedCash + amount,
    });
  }
}

export const shiftRepo = new DexieShiftRepo();
