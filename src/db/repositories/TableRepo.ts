import { db } from '../db';
import { DiningTable, FloorZone } from '../../types';

export interface ITableRepo {
  getTables(zone?: string): Promise<DiningTable[]>;
  getTable(id: string): Promise<DiningTable | undefined>;
  addTable(table: DiningTable): Promise<string>;
  updateTable(id: string, changes: Partial<DiningTable>): Promise<void>;
  deleteTable(id: string): Promise<void>;
  duplicateTable(id: string): Promise<DiningTable>;
  updateTableStatus(id: string, status: DiningTable['status'], orderId?: string): Promise<void>;

  // Zones
  getZones(): Promise<FloorZone[]>;
  addZone(zone: FloorZone): Promise<string>;
  updateZone(id: string, changes: Partial<FloorZone>): Promise<void>;
  deleteZone(zoneName: string, action: 'delete_tables' | 'move_tables', targetZoneName?: string): Promise<void>;
  reorderZones(orderedIds: string[]): Promise<void>;
}

export class DexieTableRepo implements ITableRepo {
  async getTables(zone?: string): Promise<DiningTable[]> {
    if (zone && zone !== 'all') {
      return await db.diningTables.where('zone').equals(zone).toArray();
    }
    return await db.diningTables.toArray();
  }

  async getTable(id: string): Promise<DiningTable | undefined> {
    return await db.diningTables.get(id);
  }

  async addTable(table: DiningTable): Promise<string> {
    await db.diningTables.put(table);
    return table.id;
  }

  async updateTable(id: string, changes: Partial<DiningTable>): Promise<void> {
    await db.diningTables.update(id, changes);
  }

  async deleteTable(id: string): Promise<void> {
    await db.diningTables.delete(id);
  }

  async duplicateTable(id: string): Promise<DiningTable> {
    const orig = await db.diningTables.get(id);
    if (!orig) throw new Error('Table not found');
    const newId = `table_${Date.now()}`;
    const duplicate: DiningTable = {
      ...orig,
      id: newId,
      name: `${orig.name}-2`,
      x: orig.x + 20,
      y: orig.y + 20,
      status: 'available',
      currentOrderId: undefined,
      seatedAt: undefined,
    };
    await db.diningTables.put(duplicate);
    return duplicate;
  }

  async updateTableStatus(id: string, status: DiningTable['status'], orderId?: string): Promise<void> {
    const changes: Partial<DiningTable> = { status };
    if (orderId !== undefined) {
      changes.currentOrderId = orderId;
    }
    if (status === 'occupied' && !orderId) {
      changes.seatedAt = Date.now();
    } else if (status === 'available') {
      changes.currentOrderId = undefined;
      changes.seatedAt = undefined;
    }
    await db.diningTables.update(id, changes);
  }

  // Zones
  async getZones(): Promise<FloorZone[]> {
    return await db.zones.orderBy('sortOrder').toArray();
  }

  async addZone(zone: FloorZone): Promise<string> {
    const count = await db.zones.count();
    const newZone: FloorZone = {
      ...zone,
      sortOrder: zone.sortOrder || count + 1,
    };
    await db.zones.put(newZone);
    return newZone.id;
  }

  async updateZone(id: string, changes: Partial<FloorZone>): Promise<void> {
    const oldZone = await db.zones.get(id);
    await db.zones.update(id, changes);

    // If zone name changed, update all tables in that zone
    if (changes.name && oldZone && oldZone.name !== changes.name) {
      const tablesInZone = await db.diningTables.where('zone').equals(oldZone.name).toArray();
      for (const t of tablesInZone) {
        await db.diningTables.update(t.id, { zone: changes.name });
      }
    }
  }

  async deleteZone(zoneName: string, action: 'delete_tables' | 'move_tables', targetZoneName?: string): Promise<void> {
    await db.transaction('rw', [db.zones, db.diningTables], async () => {
      // Find zone by name
      const zone = await db.zones.filter((z) => z.name === zoneName).first();
      if (zone) {
        await db.zones.delete(zone.id);
      }

      const tablesInZone = await db.diningTables.where('zone').equals(zoneName).toArray();
      if (action === 'delete_tables') {
        for (const t of tablesInZone) {
          await db.diningTables.delete(t.id);
        }
      } else if (action === 'move_tables' && targetZoneName) {
        for (const t of tablesInZone) {
          await db.diningTables.update(t.id, { zone: targetZoneName });
        }
      }
    });
  }

  async reorderZones(orderedIds: string[]): Promise<void> {
    await db.transaction('rw', db.zones, async () => {
      for (let i = 0; i < orderedIds.length; i++) {
        await db.zones.update(orderedIds[i], { sortOrder: i + 1 });
      }
    });
  }
}

export const tableRepo = new DexieTableRepo();
