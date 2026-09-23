import Dexie, { Table } from 'dexie';
import {
  AppSettings,
  Customer,
  DiningTable,
  FloorZone,
  MenuCategory,
  MenuItem,
  Order,
  ShiftRecord,
} from '../types';
import { defaultCategories, defaultMenuItems, defaultSettings } from './seedData';

export const defaultZones: FloorZone[] = [
  { id: 'zone_1', name: 'Indoor / ในร้าน', sortOrder: 1 },
  { id: 'zone_2', name: 'Terrace / หน้าร้าน', sortOrder: 2 },
  { id: 'zone_3', name: 'VIP Room / ห้องส่วนตัว', sortOrder: 3 },
];

export class RestaurantDatabase extends Dexie {
  categories!: Table<MenuCategory, string>;
  menuItems!: Table<MenuItem, string>;
  orders!: Table<Order, string>;
  diningTables!: Table<DiningTable, string>;
  customers!: Table<Customer, string>;
  shifts!: Table<ShiftRecord, string>;
  settings!: Table<AppSettings, string>;
  zones!: Table<FloorZone, string>;

  constructor() {
    super('ThaiRestaurantPOS_DB');

    this.version(1).stores({
      categories: 'id, sortOrder',
      menuItems: 'id, category_id, isAvailable, sortOrder, isFavorite, type',
      orders: 'id, orderNumber, queueNumber, orderType, status, tableId, createdAt, closedAt, isPaid',
      diningTables: 'id, zone, status',
      customers: 'id, phone, name, createdAt',
      shifts: 'id, status, openedAt',
      settings: 'id',
    });

    this.version(2).stores({
      categories: 'id, sortOrder',
      menuItems: 'id, category_id, isAvailable, sortOrder, isFavorite, type',
      orders: 'id, orderNumber, queueNumber, orderType, status, tableId, createdAt, closedAt, isPaid',
      diningTables: 'id, zone, status, itemType',
      customers: 'id, phone, name, createdAt',
      shifts: 'id, status, openedAt',
      settings: 'id',
      zones: 'id, sortOrder',
    }).upgrade(async (tx) => {
      // Non-destructive data migration
      const existingTables = await tx.table('diningTables').toArray();
      const zoneNames = Array.from(new Set(existingTables.map((t: any) => t.zone).filter(Boolean)));
      if (zoneNames.length === 0) {
        zoneNames.push('Indoor / ในร้าน', 'Terrace / หน้าร้าน');
      }
      const initialZones = zoneNames.map((name, i) => ({
        id: `zone_${i + 1}`,
        name: String(name),
        sortOrder: i + 1,
      }));
      await tx.table('zones').bulkPut(initialZones);

      for (const t of existingTables) {
        await tx.table('diningTables').update(t.id, {
          itemType: t.itemType || 'table',
          shape: t.shape || 'square',
          showAutoChairs: t.showAutoChairs ?? true,
        });
      }
    });
  }
}

export const db = new RestaurantDatabase();

// Request persistent storage so browser does not evict cache under disk pressure
export async function initStoragePersistence(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persist();
      console.log(`[Storage] Persistent storage granted: ${isPersisted}`);
      return isPersisted;
    } catch (e) {
      console.warn('[Storage] Could not request persistence', e);
    }
  }
  return false;
}

// Initial bootstrap if database is fresh
export async function bootstrapDatabase(): Promise<void> {
  await initStoragePersistence();

  const settingsCount = await db.settings.count();
  if (settingsCount === 0) {
    console.log('[DB] Seeding initial settings, zones & Thai demo menu...');
    await db.settings.put(defaultSettings);
    await db.categories.bulkPut(defaultCategories);
    await db.menuItems.bulkPut(defaultMenuItems);
    await db.zones.bulkPut(defaultZones);

    // Seed initial 10 tables
    const initialTables: DiningTable[] = Array.from({ length: 10 }, (_, i) => ({
      id: `table_${i + 1}`,
      name: `T${i + 1}`,
      zone: i < 5 ? 'Indoor / ในร้าน' : 'Terrace / หน้าร้าน',
      seats: i === 0 || i === 5 ? 2 : i < 4 ? 4 : 6,
      shape: i === 0 ? 'round' : i === 3 ? 'rectangle' : 'square',
      itemType: 'table',
      showAutoChairs: true,
      x: (i % 5) * 130 + 40,
      y: Math.floor(i / 5) * 140 + 60,
      width: i === 3 ? 120 : 80,
      height: 80,
      rotation: 0,
      status: 'available',
    }));
    await db.diningTables.bulkPut(initialTables);
  } else {
    // Ensure zones exist
    const zoneCount = await db.zones.count();
    if (zoneCount === 0) {
      const existingTables = await db.diningTables.toArray();
      const zoneNames = Array.from(new Set(existingTables.map((t) => t.zone).filter(Boolean)));
      if (zoneNames.length === 0) {
        await db.zones.bulkPut(defaultZones);
      } else {
        await db.zones.bulkPut(
          zoneNames.map((name, i) => ({
            id: `zone_${i + 1}`,
            name,
            sortOrder: i + 1,
          }))
        );
      }
    }
  }
}

export const seedDatabaseIfEmpty = bootstrapDatabase;

// Full JSON Backup Export
export interface DatabaseBackupPayload {
  version: number;
  exportedAt: string;
  settings: AppSettings[];
  categories: MenuCategory[];
  menuItems: MenuItem[];
  orders: Order[];
  tables: DiningTable[];
  customers: Customer[];
  shifts: ShiftRecord[];
  zones?: FloorZone[];
}

export async function exportDatabaseBackup(): Promise<string> {
  const settings = await db.settings.toArray();
  const categories = await db.categories.toArray();
  const menuItems = await db.menuItems.toArray();
  const orders = await db.orders.toArray();
  const tables = await db.diningTables.toArray();
  const customers = await db.customers.toArray();
  const shifts = await db.shifts.toArray();
  const zones = await db.zones.toArray();

  const payload: DatabaseBackupPayload = {
    version: 2,
    exportedAt: new Date().toISOString(),
    settings,
    categories,
    menuItems,
    orders,
    tables,
    customers,
    shifts,
    zones,
  };

  // Update lastBackupDate in settings
  const currentSettings = settings[0] || defaultSettings;
  const todayStr = new Date().toISOString();
  await db.settings.update(currentSettings.id, { lastBackupDate: todayStr });

  return JSON.stringify(payload, null, 2);
}

// Full JSON Backup Import
export async function importDatabaseBackup(jsonString: string): Promise<boolean> {
  try {
    const payload: DatabaseBackupPayload = JSON.parse(jsonString);
    if (!payload.categories || !payload.menuItems) {
      throw new Error('Invalid backup file format');
    }

    await db.transaction('rw', [db.categories, db.menuItems, db.orders, db.diningTables, db.customers, db.shifts, db.settings, db.zones], async () => {
      await db.categories.clear();
      await db.menuItems.clear();
      await db.orders.clear();
      await db.diningTables.clear();
      await db.customers.clear();
      await db.shifts.clear();
      await db.settings.clear();
      await db.zones.clear();

      if (payload.categories?.length) await db.categories.bulkPut(payload.categories);
      if (payload.menuItems?.length) await db.menuItems.bulkPut(payload.menuItems);
      if (payload.orders?.length) await db.orders.bulkPut(payload.orders);
      if (payload.tables?.length) await db.diningTables.bulkPut(payload.tables);
      if (payload.customers?.length) await db.customers.bulkPut(payload.customers);
      if (payload.shifts?.length) await db.shifts.bulkPut(payload.shifts);
      if (payload.zones?.length) {
        await db.zones.bulkPut(payload.zones);
      } else {
        await db.zones.bulkPut(defaultZones);
      }
      if (payload.settings?.length) {
        await db.settings.bulkPut(payload.settings);
      } else {
        await db.settings.put(defaultSettings);
      }
    });

    return true;
  } catch (err) {
    console.error('[DB] Import error:', err);
    throw err;
  }
}

// Reset Database / Re-seed Demo Data
export async function resetDatabaseToDemo(): Promise<void> {
  await db.transaction('rw', [db.categories, db.menuItems, db.orders, db.diningTables, db.customers, db.shifts, db.settings, db.zones], async () => {
    await db.categories.clear();
    await db.menuItems.clear();
    await db.orders.clear();
    await db.diningTables.clear();
    await db.customers.clear();
    await db.shifts.clear();
    await db.settings.clear();
    await db.zones.clear();

    await db.settings.put(defaultSettings);
    await db.categories.bulkPut(defaultCategories);
    await db.menuItems.bulkPut(defaultMenuItems);
    await db.zones.bulkPut(defaultZones);

    const initialTables: DiningTable[] = Array.from({ length: 10 }, (_, i) => ({
      id: `table_${i + 1}`,
      name: `T${i + 1}`,
      zone: i < 5 ? 'Indoor / ในร้าน' : 'Terrace / หน้าร้าน',
      seats: i === 0 || i === 5 ? 2 : i < 4 ? 4 : 6,
      shape: i === 0 ? 'round' : i === 3 ? 'rectangle' : 'square',
      itemType: 'table',
      showAutoChairs: true,
      x: (i % 5) * 130 + 40,
      y: Math.floor(i / 5) * 140 + 60,
      width: i === 3 ? 120 : 80,
      height: 80,
      rotation: 0,
      status: 'available',
    }));
    await db.diningTables.bulkPut(initialTables);
  });
}

// Clear all database tables
export async function clearAllDatabaseData(): Promise<void> {
  await db.transaction('rw', [db.categories, db.menuItems, db.orders, db.diningTables, db.customers, db.shifts, db.settings, db.zones], async () => {
    await db.categories.clear();
    await db.menuItems.clear();
    await db.orders.clear();
    await db.diningTables.clear();
    await db.customers.clear();
    await db.shifts.clear();
    await db.settings.clear();
    await db.zones.clear();
    await db.settings.put(defaultSettings);
    await db.zones.bulkPut(defaultZones);
  });
}
