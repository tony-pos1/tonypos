import { db } from '../db';
import { Customer } from '../../types';

export interface ICustomerRepo {
  getCustomers(query?: string): Promise<Customer[]>;
  getCustomerByPhone(phone: string): Promise<Customer | undefined>;
  addCustomer(customer: Customer): Promise<string>;
  updateCustomer(id: string, changes: Partial<Customer>): Promise<void>;
  addPointsAndSpend(id: string, spend: number, pointsEarned: number): Promise<void>;
}

export class DexieCustomerRepo implements ICustomerRepo {
  async getCustomers(query?: string): Promise<Customer[]> {
    if (!query) return await db.customers.toArray();
    const clean = query.trim().toLowerCase();
    return await db.customers
      .filter((c) => c.phone.includes(clean) || c.name.toLowerCase().includes(clean))
      .toArray();
  }

  async getCustomerByPhone(phone: string): Promise<Customer | undefined> {
    const cleaned = phone.replace(/[^0-9]/g, '');
    return await db.customers.where('phone').equals(cleaned).first();
  }

  async addCustomer(customer: Customer): Promise<string> {
    await db.customers.put(customer);
    return customer.id;
  }

  async updateCustomer(id: string, changes: Partial<Customer>): Promise<void> {
    await db.customers.update(id, changes);
  }

  async addPointsAndSpend(id: string, spend: number, pointsEarned: number): Promise<void> {
    const customer = await db.customers.get(id);
    if (!customer) return;
    await db.customers.update(id, {
      points: (customer.points || 0) + pointsEarned,
      totalSpend: (customer.totalSpend || 0) + spend,
      visitCount: (customer.visitCount || 0) + 1,
      lastVisitAt: Date.now(),
    });
  }
}

export const customerRepo = new DexieCustomerRepo();
