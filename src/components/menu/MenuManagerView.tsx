import React, { useState, useRef } from 'react';
import { MenuCategory, MenuItem } from '../../types';
import { useI18n } from '../../i18n';
import { sound } from '../../utils/sound';
import { menuRepo } from '../../db/repositories';
import {
  GripVertical,
  Plus,
  Edit2,
  Trash2,
  Copy,
  FolderPlus,
  Search,
  Check,
  X,
  ToggleLeft,
  ToggleRight,
  ArrowRightLeft,
  Layers,
  Sparkles,
} from 'lucide-react';

interface MenuManagerViewProps {
  categories: MenuCategory[];
  items: MenuItem[];
  onRefreshData: () => Promise<void>;
  onOpenItemEditor: (item: MenuItem | null, defaultCatId?: string) => void;
}

export const MenuManagerView: React.FC<MenuManagerViewProps> = ({
  categories,
  items,
  onRefreshData,
  onOpenItemEditor,
}) => {
  const { t, language } = useI18n();
  const [selectedCatId, setSelectedCatId] = useState<string>(categories[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');

  // Category management states
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatTh, setNewCatTh] = useState('');
  const [newCatEn, setNewCatEn] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatTh, setEditCatTh] = useState('');
  const [editCatEn, setEditCatEn] = useState('');

  // Move item across category modal
  const [itemToMove, setItemToMove] = useState<MenuItem | null>(null);
  const [targetCategoryForMove, setTargetCategoryForMove] = useState<string>('');

  // Drag states for items
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);

  // Drag states for categories
  const [draggedCatId, setDraggedCatId] = useState<string | null>(null);
  const [dragOverCatId, setDragOverCatId] = useState<string | null>(null);

  const activeCategory = categories.find((c) => c.id === selectedCatId) || categories[0];

  const categoryItems = items
    .filter((i) => i.category_id === (activeCategory?.id || selectedCatId))
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  const filteredItems = categoryItems.filter((i) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      i.name_th.toLowerCase().includes(q) ||
      i.name_en.toLowerCase().includes(q) ||
      i.price.toString().includes(q)
    );
  });

  // Category Actions
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatTh.trim() && !newCatEn.trim()) return;
    sound.playTap();
    await menuRepo.addCategory({
      id: `cat_${Date.now()}`,
      name_th: newCatTh.trim() || newCatEn.trim(),
      name_en: newCatEn.trim() || newCatTh.trim(),
      icon: '🍽️',
      sortOrder: categories.length + 1,
    });
    setNewCatTh('');
    setNewCatEn('');
    setShowAddCategory(false);
    await onRefreshData();
  };

  const handleSaveRenameCategory = async (id: string) => {
    if (!editCatTh.trim() && !editCatEn.trim()) return;
    sound.playTap();
    await menuRepo.updateCategory(id, {
      name_th: editCatTh.trim() || editCatEn.trim(),
      name_en: editCatEn.trim() || editCatTh.trim(),
    });
    setEditingCatId(null);
    await onRefreshData();
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (categories.length <= 1) {
      alert(language === 'th' ? 'ต้องมีอย่างน้อย 1 หมวดหมู่' : 'Must keep at least 1 category');
      return;
    }
    const catItemCount = items.filter((i) => i.category_id === id).length;
    if (
      window.confirm(
        language === 'th'
          ? `ต้องการลบหมวดหมู่ "${name}" ใช่หรือไม่? (มีเมนูอยู่ ${catItemCount} รายการ)`
          : `Delete category "${name}"? (${catItemCount} items)`
      )
    ) {
      sound.playTap();
      await menuRepo.deleteCategory(id);
      if (selectedCatId === id) {
        const remaining = categories.filter((c) => c.id !== id);
        setSelectedCatId(remaining[0]?.id || '');
      }
      await onRefreshData();
    }
  };

  // Drag and drop for Categories
  const handleCategoryDragStart = (id: string) => {
    setDraggedCatId(id);
  };

  const handleCategoryDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedCatId && draggedCatId !== id) {
      setDragOverCatId(id);
    }
  };

  const handleCategoryDrop = async (targetId: string) => {
    if (!draggedCatId || draggedCatId === targetId) {
      setDraggedCatId(null);
      setDragOverCatId(null);
      return;
    }

    const currentOrder = categories.map((c) => c.id);
    const fromIndex = currentOrder.indexOf(draggedCatId);
    const toIndex = currentOrder.indexOf(targetId);

    if (fromIndex !== -1 && toIndex !== -1) {
      const newOrder = [...currentOrder];
      const [removed] = newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, removed);

      sound.playTap();
      await menuRepo.reorderCategories(newOrder);
      await onRefreshData();
    }

    setDraggedCatId(null);
    setDragOverCatId(null);
  };

  // Drag and drop for Items
  const handleItemDragStart = (id: string) => {
    setDraggedItemId(id);
  };

  const handleItemDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedItemId && draggedItemId !== id) {
      setDragOverItemId(id);
    }
  };

  const handleItemDrop = async (targetId: string) => {
    if (!draggedItemId || draggedItemId === targetId) {
      setDraggedItemId(null);
      setDragOverItemId(null);
      return;
    }

    const currentOrder = categoryItems.map((i) => i.id);
    const fromIndex = currentOrder.indexOf(draggedItemId);
    const toIndex = currentOrder.indexOf(targetId);

    if (fromIndex !== -1 && toIndex !== -1) {
      const newOrder = [...currentOrder];
      const [removed] = newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, removed);

      sound.playTap();
      await menuRepo.reorderItems(activeCategory.id, newOrder);
      await onRefreshData();
    }

    setDraggedItemId(null);
    setDragOverItemId(null);
  };

  // Move item across categories
  const handleConfirmMoveCategory = async () => {
    if (!itemToMove || !targetCategoryForMove) return;
    sound.playTap();
    await menuRepo.moveItemToCategory(itemToMove.id, targetCategoryForMove);
    setItemToMove(null);
    await onRefreshData();
  };

  // Duplicate item
  const handleDuplicateItem = async (itemId: string) => {
    sound.playTap();
    await menuRepo.duplicateItem(itemId);
    await onRefreshData();
  };

  // Delete item
  const handleDeleteItem = async (item: MenuItem) => {
    if (
      window.confirm(
        language === 'th'
          ? `ต้องการลบเมนู "${item.name_th}" ใช่หรือไม่?`
          : `Delete "${item.name_th}"?`
      )
    ) {
      sound.playTap();
      await menuRepo.deleteItem(item.id);
      await onRefreshData();
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full bg-slate-50 overflow-hidden select-none">
      {/* Left Column: Categories List with Reorder */}
      <div className="w-full md:w-72 lg:w-80 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col shrink-0 shadow-xs">
        {/* Categories Header */}
        <div className="p-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-orange-600" />
            <span className="font-bold text-sm text-slate-900">
              {language === 'th' ? 'หมวดหมู่อาหาร' : 'Categories'}
            </span>
            <span className="text-xs text-slate-400 font-medium">({categories.length})</span>
          </div>

          <button
            onClick={() => setShowAddCategory(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-600 text-xs font-bold transition cursor-pointer"
            title="Add Category"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{language === 'th' ? 'เพิ่มหมวด' : 'Add'}</span>
          </button>
        </div>

        {/* Add Category Form */}
        {showAddCategory && (
          <form
            onSubmit={handleCreateCategory}
            className="p-3 bg-orange-50/50 border-b border-orange-100 space-y-2 animate-in fade-in"
          >
            <input
              type="text"
              placeholder="ชื่อหมวดหมู่ (ไทย)..."
              value={newCatTh}
              onChange={(e) => setNewCatTh(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
              autoFocus
            />
            <input
              type="text"
              placeholder="Category name (English)..."
              value={newCatEn}
              onChange={(e) => setNewCatEn(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
            />
            <div className="flex justify-end gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setShowAddCategory(false)}
                className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800"
              >
                {language === 'th' ? 'ยกเลิก' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={!newCatTh.trim() && !newCatEn.trim()}
                className="px-3 py-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white rounded-lg text-xs font-bold shadow-xs"
              >
                {language === 'th' ? 'บันทึก' : 'Save'}
              </button>
            </div>
          </form>
        )}

        {/* Categories List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {categories.map((cat) => {
            const isSelected = (activeCategory?.id || selectedCatId) === cat.id;
            const isEditing = editingCatId === cat.id;
            const isOver = dragOverCatId === cat.id;
            const itemCount = items.filter((i) => i.category_id === cat.id).length;

            return (
              <div
                key={cat.id}
                draggable
                onDragStart={() => handleCategoryDragStart(cat.id)}
                onDragOver={(e) => handleCategoryDragOver(e, cat.id)}
                onDrop={() => handleCategoryDrop(cat.id)}
                className={`p-2.5 rounded-xl border transition flex items-center justify-between gap-2 cursor-pointer ${
                  isOver ? 'border-orange-500 border-dashed bg-orange-50' : ''
                } ${
                  isSelected
                    ? 'bg-orange-500 text-white border-orange-500 shadow-xs font-bold'
                    : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
                }`}
                onClick={() => {
                  sound.playTap();
                  setSelectedCatId(cat.id);
                }}
              >
                {isEditing ? (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 flex items-center gap-1.5"
                  >
                    <input
                      type="text"
                      value={editCatTh}
                      onChange={(e) => setEditCatTh(e.target.value)}
                      className="w-full bg-white text-slate-900 border border-orange-500 rounded px-2 py-1 text-xs"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveRenameCategory(cat.id)}
                      className="p-1 rounded bg-orange-600 text-white"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingCatId(null)}
                      className="p-1 rounded bg-slate-200 text-slate-700"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="cursor-grab active:cursor-grabbing p-0.5 text-slate-400 hover:text-slate-600 shrink-0"
                        title="Drag to reorder"
                      >
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm truncate">
                          {language === 'th' ? cat.name_th : cat.name_en}
                        </div>
                        <div
                          className={`text-[10px] truncate ${
                            isSelected ? 'text-orange-100' : 'text-slate-400'
                          }`}
                        >
                          {cat.name_en || cat.name_th}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span
                        className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {itemCount}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCatId(cat.id);
                          setEditCatTh(cat.name_th);
                          setEditCatEn(cat.name_en);
                        }}
                        className={`p-1 rounded transition ${
                          isSelected ? 'hover:bg-white/20 text-white' : 'hover:bg-slate-200 text-slate-500'
                        }`}
                        title="Rename"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>

                      {categories.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCategory(cat.id, cat.name_th);
                          }}
                          className={`p-1 rounded transition ${
                            isSelected
                              ? 'hover:bg-rose-600 text-white'
                              : 'hover:bg-rose-50 text-rose-600'
                          }`}
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Menu Items in Category with Real-time Drag Reorder */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Items Action Bar */}
        <div className="p-3 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 shadow-xs shrink-0">
          <div>
            <h3 className="text-base font-black text-slate-900 leading-tight">
              {activeCategory
                ? language === 'th'
                  ? activeCategory.name_th
                  : activeCategory.name_en
                : ''}
            </h3>
            <p className="text-xs text-slate-500">
              {language === 'th'
                ? `ลากไอคอนจุด 6 จุดเพื่อสลับลำดับเมนู หรือกดปุ่มย้ายหมวดหมู่ (${filteredItems.length} รายการ)`
                : `Drag handle to reorder items, or move across categories (${filteredItems.length} items)`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'th' ? 'ค้นหาในหมวด...' : 'Search items...'}
                className="w-40 sm:w-56 bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
              />
            </div>

            {/* Add Item Button */}
            <button
              onClick={() => onOpenItemEditor(null, activeCategory?.id)}
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition cursor-pointer shadow-xs min-h-[36px]"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'th' ? 'เพิ่มเมนูใหม่' : 'Add Item'}</span>
            </button>
          </div>
        </div>

        {/* Items List / Grid with Drag Handle */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredItems.length === 0 ? (
            <div className="py-20 text-center text-slate-400 space-y-2">
              <Sparkles className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-medium">
                {language === 'th' ? 'ยังไม่มีเมนูในหมวดนี้' : 'No items in this category'}
              </p>
              <button
                onClick={() => onOpenItemEditor(null, activeCategory?.id)}
                className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{language === 'th' ? 'เพิ่มเมนูแรก' : 'Add first item'}</span>
              </button>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isOver = dragOverItemId === item.id;
              const isDragging = draggedItemId === item.id;

              return (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => handleItemDragStart(item.id)}
                  onDragOver={(e) => handleItemDragOver(e, item.id)}
                  onDrop={() => handleItemDrop(item.id)}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 select-none ${
                    isOver ? 'border-orange-500 border-dashed bg-orange-50/60' : ''
                  } ${
                    isDragging ? 'opacity-40 scale-[0.99]' : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
                  }`}
                >
                  {/* Left: Drag Handle + Thumbnail + Names */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-700 shrink-0"
                      title="ลากเพื่อสลับลำดับ (Drag to reorder)"
                    >
                      <GripVertical className="w-5 h-5" />
                    </div>

                    <span className="w-6 text-center text-xs font-mono font-bold text-slate-400">
                      {index + 1}
                    </span>

                    {/* Thumbnail */}
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name_th}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xl">{item.emoji || '🍲'}</span>
                      )}
                    </div>

                    {/* Names */}
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">
                        {item.name_th}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {item.name_en || item.name_th}
                      </div>
                    </div>
                  </div>

                  {/* Right: Price + Availability + Actions */}
                  <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                    <span className="text-sm font-black text-orange-600 min-w-[60px] text-right">
                      ฿{item.price.toLocaleString()}
                    </span>

                    {/* Availability toggle */}
                    <button
                      onClick={async () => {
                        sound.playTap();
                        await menuRepo.toggleItemAvailability(item.id);
                        await onRefreshData();
                      }}
                      className="flex items-center gap-1 text-xs cursor-pointer"
                      title="เปิด/ปิด การขาย"
                    >
                      {item.isAvailable ? (
                        <ToggleRight className="w-6 h-6 text-emerald-600" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-slate-400" />
                      )}
                    </button>

                    {/* Move to category button */}
                    <button
                      onClick={() => {
                        setItemToMove(item);
                        setTargetCategoryForMove(item.category_id);
                      }}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                      title={language === 'th' ? 'ย้ายไปหมวดหมู่อื่น' : 'Move to category'}
                    >
                      <ArrowRightLeft className="w-4 h-4" />
                    </button>

                    {/* Edit button */}
                    <button
                      onClick={() => onOpenItemEditor(item, activeCategory.id)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-orange-600 cursor-pointer"
                      title={language === 'th' ? 'แก้ไขเมนู' : 'Edit item'}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Duplicate button */}
                    <button
                      onClick={() => handleDuplicateItem(item.id)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-600 cursor-pointer"
                      title={language === 'th' ? 'ทำซ้ำเมนู' : 'Duplicate item'}
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteItem(item)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-rose-600 cursor-pointer"
                      title={language === 'th' ? 'ลบเมนู' : 'Delete item'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Move to Category Modal Dialog */}
      {itemToMove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs select-none">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 max-w-sm w-full shadow-2xl text-slate-900 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {language === 'th' ? 'ย้ายหมวดหมู่อาหาร' : 'Move to Category'}
                  </h4>
                  <p className="text-xs text-slate-500 truncate max-w-[200px]">
                    {itemToMove.name_th}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setItemToMove(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {language === 'th' ? 'เลือกหมวดหมู่ปลายทาง:' : 'Target Category:'}
              </label>
              <select
                value={targetCategoryForMove}
                onChange={(e) => setTargetCategoryForMove(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-orange-500"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name_th} ({cat.name_en})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setItemToMove(null)}
                className="px-3 py-1.5 rounded-xl text-xs text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                {language === 'th' ? 'ยกเลิก' : 'Cancel'}
              </button>
              <button
                onClick={handleConfirmMoveCategory}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white cursor-pointer shadow-xs"
              >
                {language === 'th' ? 'บันทึกการย้าย' : 'Move Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
