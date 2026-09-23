import { db } from '../db';
import { MenuCategory, MenuItem } from '../../types';

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
  updateItem(id: string, changes: Partial<MenuItem>): Promise<void>;
  deleteItem(id: string): Promise<void>;
  duplicateItem(id: string): Promise<MenuItem>;
  toggleItemAvailability(id: string): Promise<boolean>;
  toggleItemFavorite(id: string): Promise<boolean>;
  reorderItems(categoryId: string, orderedIds: string[]): Promise<void>;
  moveItemToCategory(itemId: string, newCategoryId: string): Promise<void>;
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
}

export const menuRepo = new DexieMenuRepo();
