import Dexie, { Table } from 'dexie';
import {
  AppSettings,
  Customer,
  DailyCloseSummary,
  DiningTable,
  FloorZone,
  MenuCategory,
  MenuItem,
  OptionGroup,
  Order,
  ShiftRecord,
} from '../types';
import {
  defaultCategories,
  defaultMenuItems,
  defaultSettings,
  defaultSharedOptionGroups,
  defaultTables,
  defaultZones,
} from './seedData';

export class RestaurantDatabase extends Dexie {
  categories!: Table<MenuCategory, string>;
  menuItems!: Table<MenuItem, string>;
  orders!: Table<Order, string>;
  diningTables!: Table<DiningTable, string>;
  customers!: Table<Customer, string>;
  shifts!: Table<ShiftRecord, string>;
  settings!: Table<AppSettings, string>;
  zones!: Table<FloorZone, string>;
  dailyClosings!: Table<DailyCloseSummary, string>;
  sharedOptionGroups!: Table<OptionGroup, string>;

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

    this.version(3).stores({
      categories: 'id, sortOrder',
      menuItems: 'id, category_id, isAvailable, sortOrder, isFavorite, type',
      orders: 'id, orderNumber, queueNumber, orderType, status, tableId, createdAt, closedAt, isPaid',
      diningTables: 'id, zone, status, itemType',
      customers: 'id, phone, name, createdAt',
      shifts: 'id, status, openedAt',
      settings: 'id',
      zones: 'id, sortOrder',
      dailyClosings: 'id, businessDate, closedAt',
    }).upgrade(async (tx) => {
      // Version 3: ensure dailyClosingTime setting exists
      const settingsTable = tx.table('settings');
      const settingsList = await settingsTable.toArray();
      if (settingsList.length > 0) {
        const s = settingsList[0];
        if (!s.dailyClosingTime) {
          await settingsTable.update(s.id, { dailyClosingTime: '00:00' });
        }
      }
    });

    this.version(4).stores({
      categories: 'id, sortOrder',
      menuItems: 'id, category_id, isAvailable, sortOrder, isFavorite, type',
      orders: 'id, orderNumber, queueNumber, orderType, status, tableId, createdAt, closedAt, isPaid',
      diningTables: 'id, zone, status, itemType',
      customers: 'id, phone, name, createdAt',
      shifts: 'id, status, openedAt',
      settings: 'id',
      zones: 'id, sortOrder',
      dailyClosings: 'id, businessDate, closedAt',
      sharedOptionGroups: 'id, sortOrder',
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

export interface StorageInfo {
  usageBytes: number;
  quotaBytes: number;
  usageMB: number;
  quotaGB: number;
  percentUsed: number;
  isPersisted: boolean;
}

export async function getStorageEstimateInfo(): Promise<StorageInfo> {
  let usageBytes = 0;
  let quotaBytes = 0;
  let isPersisted = false;

  if (typeof navigator !== 'undefined' && navigator.storage) {
    if (navigator.storage.estimate) {
      try {
        const est = await navigator.storage.estimate();
        usageBytes = est.usage || 0;
        quotaBytes = est.quota || 0;
      } catch (e) {
        console.warn('[Storage] estimate error:', e);
      }
    }
    if (navigator.storage.persisted) {
      try {
        isPersisted = await navigator.storage.persisted();
      } catch (e) {
        console.warn('[Storage] persisted check error:', e);
      }
    }
  }

  const usageMB = +(usageBytes / (1024 * 1024)).toFixed(2);
  const quotaGB = +(quotaBytes / (1024 * 1024 * 1024)).toFixed(2);
  const percentUsed = quotaBytes > 0 ? +((usageBytes / quotaBytes) * 100).toFixed(2) : 0;

  return {
    usageBytes,
    quotaBytes,
    usageMB,
    quotaGB,
    percentUsed,
    isPersisted,
  };
}

/**
 * One-time automatic migration from older localStorage data into IndexedDB.
 * If old localStorage data exists and IndexedDB is empty, copy everything into
 * IndexedDB, verify it, and only then mark the migration as done.
 * Do not delete the old localStorage copy until the migration is verified.
 */
export async function migrateFromLocalStorageIfPresent(): Promise<boolean> {
  if (typeof localStorage === 'undefined') return false;

  const MIGRATION_KEY = 'kind_pos_idb_migrated_v2';
  if (localStorage.getItem(MIGRATION_KEY)) {
    return false; // Already verified and migrated
  }

  try {
    const rawOrders = localStorage.getItem('kind_pos_orders') || localStorage.getItem('pos_orders');
    const rawTables = localStorage.getItem('kind_pos_tables') || localStorage.getItem('pos_tables');
    const rawCategories = localStorage.getItem('kind_pos_categories') || localStorage.getItem('pos_categories');
    const rawItems = localStorage.getItem('kind_pos_menu_items') || localStorage.getItem('pos_menu_items');
    const rawSettings = localStorage.getItem('kind_pos_settings') || localStorage.getItem('pos_settings');
    const rawShifts = localStorage.getItem('kind_pos_shifts') || localStorage.getItem('pos_shifts');
    const rawBackup = localStorage.getItem('thai_pos_backup');

    let hasDataToMigrate = false;
    let backupPayload: any = null;

    if (rawBackup) {
      try {
        backupPayload = JSON.parse(rawBackup);
        hasDataToMigrate = true;
      } catch (e) {
        // invalid
      }
    }

    if (rawOrders || rawTables || rawCategories || rawItems || rawSettings || rawShifts) {
      hasDataToMigrate = true;
    }

    if (!hasDataToMigrate) {
      localStorage.setItem(MIGRATION_KEY, 'true');
      return false;
    }

    console.log('[Storage Migration] Old localStorage data detected. Migrating to IndexedDB...');

    await db.transaction('rw', [db.categories, db.menuItems, db.orders, db.diningTables, db.customers, db.shifts, db.settings, db.zones], async () => {
      if (backupPayload) {
        if (backupPayload.categories?.length) await db.categories.bulkPut(backupPayload.categories);
        if (backupPayload.menuItems?.length) await db.menuItems.bulkPut(backupPayload.menuItems);
        if (backupPayload.orders?.length) await db.orders.bulkPut(backupPayload.orders);
        if (backupPayload.tables?.length) await db.diningTables.bulkPut(backupPayload.tables);
        if (backupPayload.customers?.length) await db.customers.bulkPut(backupPayload.customers);
        if (backupPayload.shifts?.length) await db.shifts.bulkPut(backupPayload.shifts);
        if (backupPayload.zones?.length) await db.zones.bulkPut(backupPayload.zones);
        if (backupPayload.settings?.length) await db.settings.bulkPut(backupPayload.settings);
      }

      if (rawCategories) {
        const parsed = JSON.parse(rawCategories);
        if (Array.isArray(parsed) && parsed.length) await db.categories.bulkPut(parsed);
      }
      if (rawItems) {
        const parsed = JSON.parse(rawItems);
        if (Array.isArray(parsed) && parsed.length) await db.menuItems.bulkPut(parsed);
      }
      if (rawOrders) {
        const parsed = JSON.parse(rawOrders);
        if (Array.isArray(parsed) && parsed.length) await db.orders.bulkPut(parsed);
      }
      if (rawTables) {
        const parsed = JSON.parse(rawTables);
        if (Array.isArray(parsed) && parsed.length) await db.diningTables.bulkPut(parsed);
      }
      if (rawSettings) {
        const parsed = JSON.parse(rawSettings);
        if (parsed && typeof parsed === 'object') await db.settings.put(parsed);
      }
      if (rawShifts) {
        const parsed = JSON.parse(rawShifts);
        if (Array.isArray(parsed) && parsed.length) await db.shifts.bulkPut(parsed);
      }
    });

    // Verification check: confirm data was written to IndexedDB
    const checkCount = await db.categories.count();
    if (checkCount > 0) {
      console.log('[Storage Migration] Migration verified successfully.');
      localStorage.setItem(MIGRATION_KEY, 'true');
      return true;
    }
  } catch (err) {
    console.error('[Storage Migration] Migration failed:', err);
  }
  return false;
}

// Initial bootstrap if database is fresh
export async function bootstrapDatabase(): Promise<void> {
  await initStoragePersistence();
  await migrateFromLocalStorageIfPresent();

  const settingsCount = await db.settings.count();
  if (settingsCount === 0) {
    console.log('[DB] Seeding initial settings, zones & Thai demo menu...');
    await db.settings.put(defaultSettings);
    await db.categories.bulkPut(defaultCategories);
    await db.menuItems.bulkPut(defaultMenuItems);
    await db.zones.bulkPut(defaultZones);
    await db.diningTables.bulkPut(defaultTables);
    await db.sharedOptionGroups.bulkPut(defaultSharedOptionGroups);
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

    // Ensure dailyClosingTime is set
    const currentSettings = await db.settings.toArray();
    if (currentSettings.length > 0 && !currentSettings[0].dailyClosingTime) {
      await db.settings.update(currentSettings[0].id, { dailyClosingTime: '00:00' });
    }

    // Ensure sharedOptionGroups exist
    const optionGroupCount = await db.sharedOptionGroups.count();
    if (optionGroupCount === 0) {
      await db.sharedOptionGroups.bulkPut(defaultSharedOptionGroups);
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
  dailyClosings?: DailyCloseSummary[];
  sharedOptionGroups?: OptionGroup[];
  staffList?: any[];
  cashDrawerLogs?: any[];
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
  const dailyClosings = await db.dailyClosings.toArray();
  const sharedOptionGroups = await db.sharedOptionGroups.toArray();

  let staffList: any[] = [];
  let cashDrawerLogs: any[] = [];

  if (typeof localStorage !== 'undefined') {
    try {
      const storedStaff = localStorage.getItem('kind_pos_staff_list');
      if (storedStaff) staffList = JSON.parse(storedStaff);
    } catch {
      // ignore
    }
    try {
      const storedLogs = localStorage.getItem('pos_cash_drawer_logs');
      if (storedLogs) cashDrawerLogs = JSON.parse(storedLogs);
    } catch {
      // ignore
    }
  }

  const payload: DatabaseBackupPayload = {
    version: 3,
    exportedAt: new Date().toISOString(),
    settings,
    categories,
    menuItems,
    orders,
    tables,
    customers,
    shifts,
    zones,
    dailyClosings,
    sharedOptionGroups,
    staffList,
    cashDrawerLogs,
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

    await db.transaction(
      'rw',
      [
        db.categories,
        db.menuItems,
        db.orders,
        db.diningTables,
        db.customers,
        db.shifts,
        db.settings,
        db.zones,
        db.dailyClosings,
        db.sharedOptionGroups,
      ],
      async () => {
        await db.categories.clear();
        await db.menuItems.clear();
        await db.orders.clear();
        await db.diningTables.clear();
        await db.customers.clear();
        await db.shifts.clear();
        await db.settings.clear();
        await db.zones.clear();
        await db.dailyClosings.clear();
        await db.sharedOptionGroups.clear();

        if (payload.categories?.length) await db.categories.bulkPut(payload.categories);
        if (payload.menuItems?.length) await db.menuItems.bulkPut(payload.menuItems);
        if (payload.orders?.length) await db.orders.bulkPut(payload.orders);
        if (payload.tables?.length) await db.diningTables.bulkPut(payload.tables);
        if (payload.customers?.length) await db.customers.bulkPut(payload.customers);
        if (payload.shifts?.length) await db.shifts.bulkPut(payload.shifts);
        if (payload.dailyClosings?.length) await db.dailyClosings.bulkPut(payload.dailyClosings);
        if (payload.sharedOptionGroups?.length) {
          await db.sharedOptionGroups.bulkPut(payload.sharedOptionGroups);
        } else {
          await db.sharedOptionGroups.bulkPut(defaultSharedOptionGroups);
        }

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
      }
    );

    if (payload.staffList && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('kind_pos_staff_list', JSON.stringify(payload.staffList));
      } catch {
        // ignore
      }
    }

    if (payload.cashDrawerLogs && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('pos_cash_drawer_logs', JSON.stringify(payload.cashDrawerLogs));
      } catch {
        // ignore
      }
    }

    return true;
  } catch (err) {
    console.error('[DB] Import error:', err);
    throw err;
  }
}

// Reset Database / Re-seed Demo Data
export async function resetDatabaseToDemo(): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.categories,
      db.menuItems,
      db.orders,
      db.diningTables,
      db.customers,
      db.shifts,
      db.settings,
      db.zones,
      db.dailyClosings,
      db.sharedOptionGroups,
    ],
    async () => {
      await db.categories.clear();
      await db.menuItems.clear();
      await db.orders.clear();
      await db.diningTables.clear();
      await db.customers.clear();
      await db.shifts.clear();
      await db.settings.clear();
      await db.zones.clear();
      await db.dailyClosings.clear();
      await db.sharedOptionGroups.clear();

      await db.settings.put(defaultSettings);
      await db.categories.bulkPut(defaultCategories);
      await db.menuItems.bulkPut(defaultMenuItems);
      await db.zones.bulkPut(defaultZones);
      await db.sharedOptionGroups.bulkPut(defaultSharedOptionGroups);

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
    }
  );
}

// Clear all database tables
export async function clearAllDatabaseData(): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.categories,
      db.menuItems,
      db.orders,
      db.diningTables,
      db.customers,
      db.shifts,
      db.settings,
      db.zones,
      db.dailyClosings,
      db.sharedOptionGroups,
    ],
    async () => {
      await db.categories.clear();
      await db.menuItems.clear();
      await db.orders.clear();
      await db.diningTables.clear();
      await db.customers.clear();
      await db.shifts.clear();
      await db.settings.clear();
      await db.zones.clear();
      await db.dailyClosings.clear();
      await db.sharedOptionGroups.clear();
      await db.settings.put(defaultSettings);
      await db.zones.bulkPut(defaultZones);
      await db.sharedOptionGroups.bulkPut(defaultSharedOptionGroups);
    }
  );
}
