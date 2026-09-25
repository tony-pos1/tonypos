import { db } from '../db';
import { MenuCategory, MenuItem, OptionGroup } from '../../types';

export interface IMenuRepo {
  getCategories(): Promise<MenuCategory[]>;
  getCategory(id: string): Promise<MenuCategory | undefined>;
  addCategory(category: MenuCategory): Promise<string>;
  updateCategory(id: string, changes: Partial<MenuCategory>): Promise<void>;
  deleteCategory(id: string): Promise<void>;
  reorderCategories(orderedIds: string[]): Promise<void>;

  getItems(categoryId?: string): Promise<MenuItem[]>;
  getItem(id: string): Promise<MenuItem | undefined>;
  addItem(item: MenuItem): Promise<string>;
  saveItem(item: MenuItem): Promise<string>;
  updateItem(id: string, changes: Partial<MenuItem>): Promise<void>;
  deleteItem(id: string): Promise<void>;
  duplicateItem(id: string): Promise<MenuItem>;
  toggleItemAvailability(id: string): Promise<boolean>;
  toggleItemFavorite(id: string): Promise<boolean>;
  reorderItems(categoryId: string, orderedIds: string[]): Promise<void>;
  moveItemToCategory(itemId: string, newCategoryId: string): Promise<void>;

  // Shared Option Groups Library
  getSharedOptionGroups(): Promise<OptionGroup[]>;
  getSharedOptionGroup(id: string): Promise<OptionGroup | undefined>;
  addSharedOptionGroup(group: OptionGroup): Promise<string>;
  updateSharedOptionGroup(id: string, changes: Partial<OptionGroup>): Promise<void>;
  deleteSharedOptionGroup(id: string): Promise<{ affectedItemsCount: number }>;
  reorderSharedOptionGroups(orderedIds: string[]): Promise<void>;
  duplicateSharedOptionGroup(id: string): Promise<OptionGroup>;
  getItemsUsingSharedGroup(groupId: string): Promise<MenuItem[]>;
  removeSharedGroupFromItems(groupId: string): Promise<void>;
}

export class DexieMenuRepo implements IMenuRepo {
  async getCategories(): Promise<MenuCategory[]> {
    return await db.categories.orderBy('sortOrder').toArray();
  }

  async getCategory(id: string): Promise<MenuCategory | undefined> {
    return await db.categories.get(id);
  }

  async addCategory(category: MenuCategory): Promise<string> {
    const existing = await db.categories.count();
    const newCategory: MenuCategory = {
      ...category,
      sortOrder: category.sortOrder || existing + 1,
    };
    await db.categories.put(newCategory);
    return newCategory.id;
  }

  async updateCategory(id: string, changes: Partial<MenuCategory>): Promise<void> {
    await db.categories.update(id, changes);
  }

  async deleteCategory(id: string): Promise<void> {
    await db.transaction('rw', [db.categories, db.menuItems], async () => {
      await db.categories.delete(id);
      // Delete or unassign items
      await db.menuItems.where('category_id').equals(id).delete();
    });
  }

  async reorderCategories(orderedIds: string[]): Promise<void> {
    await db.transaction('rw', db.categories, async () => {
      for (let i = 0; i < orderedIds.length; i++) {
        await db.categories.update(orderedIds[i], { sortOrder: i + 1 });
      }
    });
  }

  async getItems(categoryId?: string): Promise<MenuItem[]> {
    if (categoryId && categoryId !== 'all') {
      return await db.menuItems.where('category_id').equals(categoryId).sortBy('sortOrder');
    }
    return await db.menuItems.orderBy('sortOrder').toArray();
  }

  async getItem(id: string): Promise<MenuItem | undefined> {
    return await db.menuItems.get(id);
  }

  async addItem(item: MenuItem): Promise<string> {
    const existingCount = await db.menuItems.where('category_id').equals(item.category_id).count();
    const newItem: MenuItem = {
      ...item,
      sortOrder: item.sortOrder || existingCount + 1,
    };
    await db.menuItems.put(newItem);
    return newItem.id;
  }

  async saveItem(item: MenuItem): Promise<string> {
    await db.menuItems.put(item);
    return item.id;
  }

  async updateItem(id: string, changes: Partial<MenuItem>): Promise<void> {
    await db.menuItems.update(id, changes);
  }

  async deleteItem(id: string): Promise<void> {
    await db.menuItems.delete(id);
  }

  async duplicateItem(id: string): Promise<MenuItem> {
    const original = await db.menuItems.get(id);
    if (!original) throw new Error('Original item not found');

    const newId = `item_${Date.now()}`;
    const duplicate: MenuItem = {
      ...original,
      id: newId,
      name_th: `${original.name_th} (สำเนา)`,
      name_en: `${original.name_en} (Copy)`,
      sortOrder: original.sortOrder + 1,
    };
    await db.menuItems.put(duplicate);
    return duplicate;
  }

  async toggleItemAvailability(id: string): Promise<boolean> {
    const item = await db.menuItems.get(id);
    if (!item) return false;
    const nextStatus = !item.isAvailable;
    await db.menuItems.update(id, { isAvailable: nextStatus });
    return nextStatus;
  }

  async toggleItemFavorite(id: string): Promise<boolean> {
    const item = await db.menuItems.get(id);
    if (!item) return false;
    const nextFav = !item.isFavorite;
    await db.menuItems.update(id, { isFavorite: nextFav });
    return nextFav;
  }

  async reorderItems(categoryId: string, orderedIds: string[]): Promise<void> {
    await db.transaction('rw', db.menuItems, async () => {
      for (let i = 0; i < orderedIds.length; i++) {
        await db.menuItems.update(orderedIds[i], { sortOrder: i + 1 });
      }
    });
  }

  async moveItemToCategory(itemId: string, newCategoryId: string): Promise<void> {
    const existingCount = await db.menuItems.where('category_id').equals(newCategoryId).count();
    await db.menuItems.update(itemId, {
      category_id: newCategoryId,
      sortOrder: existingCount + 1,
    });
  }

  async getSharedOptionGroups(): Promise<OptionGroup[]> {
    return await db.sharedOptionGroups.orderBy('sortOrder').toArray();
  }

  async getSharedOptionGroup(id: string): Promise<OptionGroup | undefined> {
    return await db.sharedOptionGroups.get(id);
  }

  async addSharedOptionGroup(group: OptionGroup): Promise<string> {
    const existing = await db.sharedOptionGroups.count();
    const newGroup: OptionGroup = {
      ...group,
      id: group.id || `grp_${Date.now()}`,
      isShared: true,
      sortOrder: group.sortOrder || existing + 1,
    };
    await db.sharedOptionGroups.put(newGroup);
    return newGroup.id;
  }

  async updateSharedOptionGroup(id: string, changes: Partial<OptionGroup>): Promise<void> {
    await db.sharedOptionGroups.update(id, changes);
  }

  async getItemsUsingSharedGroup(groupId: string): Promise<MenuItem[]> {
    const allItems = await db.menuItems.toArray();
    return allItems.filter((item) =>
      item.optionGroups?.some(
        (g) => g.sharedGroupId === groupId || (g.isShared && g.id === groupId)
      )
    );
  }

  async removeSharedGroupFromItems(groupId: string): Promise<void> {
    const items = await this.getItemsUsingSharedGroup(groupId);
    await db.transaction('rw', db.menuItems, async () => {
      for (const item of items) {
        const remaining = (item.optionGroups || []).filter(
          (g) => g.sharedGroupId !== groupId && (!g.isShared || g.id !== groupId)
        );
        await db.menuItems.update(item.id, { optionGroups: remaining });
      }
    });
  }

  async deleteSharedOptionGroup(id: string): Promise<{ affectedItemsCount: number }> {
    const usingItems = await this.getItemsUsingSharedGroup(id);
    const affectedItemsCount = usingItems.length;
    await db.transaction('rw', [db.sharedOptionGroups, db.menuItems], async () => {
      await db.sharedOptionGroups.delete(id);
      for (const item of usingItems) {
        const remaining = (item.optionGroups || []).filter(
          (g) => g.sharedGroupId !== id && (!g.isShared || g.id !== id)
        );
        await db.menuItems.update(item.id, { optionGroups: remaining });
      }
    });
    return { affectedItemsCount };
  }

  async reorderSharedOptionGroups(orderedIds: string[]): Promise<void> {
    await db.transaction('rw', db.sharedOptionGroups, async () => {
      for (let i = 0; i < orderedIds.length; i++) {
        await db.sharedOptionGroups.update(orderedIds[i], { sortOrder: i + 1 });
      }
    });
  }

  async duplicateSharedOptionGroup(id: string): Promise<OptionGroup> {
    const original = await db.sharedOptionGroups.get(id);
    if (!original) throw new Error('Original option group not found');
    const existingCount = await db.sharedOptionGroups.count();
    const duplicated: OptionGroup = {
      ...original,
      id: `grp_${Date.now()}`,
      name_th: `${original.name_th} (คัดลอก)`,
      name_en: `${original.name_en || original.name_th} (Copy)`,
      sortOrder: existingCount + 1,
      isShared: true,
      options: original.options.map((opt, idx) => ({
        ...opt,
        id: `opt_${Date.now()}_${idx + 1}`,
      })),
    };
    await db.sharedOptionGroups.put(duplicated);
    return duplicated;
  }
}

export const menuRepo = new DexieMenuRepo();

/**
 * Resolves attached shared option groups for a menu item with their latest definitions
 * from the shared option groups library, while preserving item-specific groups and the
 * exact item-level configured ordering.
 */
export function resolveItemOptionGroups(
  itemOptionGroups?: OptionGroup[],
  sharedOptionGroups?: OptionGroup[]
): OptionGroup[] {
  if (!itemOptionGroups || itemOptionGroups.length === 0) return [];
  if (!sharedOptionGroups || sharedOptionGroups.length === 0) return itemOptionGroups;

  const sharedMap = new Map<string, OptionGroup>();
  for (const s of sharedOptionGroups) {
    sharedMap.set(s.id, s);
  }

  return itemOptionGroups
    .map((g) => {
      const sharedId = g.sharedGroupId || (g.isShared ? g.id : undefined);
      if (sharedId) {
        const shared = sharedMap.get(sharedId);
        if (shared) {
          return {
            ...shared,
            id: g.id,
            isShared: true,
            sharedGroupId: shared.id,
            required: g.required !== undefined ? g.required : shared.required,
          };
        }
      }
      return g;
    })
    .filter(Boolean);
}
