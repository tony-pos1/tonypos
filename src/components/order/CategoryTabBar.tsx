import React, { useState } from 'react';
import { MenuCategory } from '../../types';
import { useI18n } from '../../i18n';
import { sound } from '../../utils/sound';
import {
  Receipt,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Layers,
} from 'lucide-react';

interface CategoryTabBarProps {
  categories: MenuCategory[];
  selectedCategory: string; // 'categories' | 'all' | 'favorites' | categoryId
  openBillsCount: number;
  activeTableTotal?: number;
  onSelectCategory: (id: string) => void;
  onSelectBill: () => void;
  onAddCategory: (nameTh: string, nameEn: string, icon?: string) => Promise<void>;
  onRenameCategory: (id: string, nameTh: string, nameEn: string) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
}

export const CategoryTabBar: React.FC<CategoryTabBarProps> = ({
  categories,
  selectedCategory,
  openBillsCount,
  activeTableTotal,
  onSelectCategory,
  onSelectBill,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
}) => {
  const { language } = useI18n();

  // Add category modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCatTh, setNewCatTh] = useState('');
  const [newCatEn, setNewCatEn] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🍲');

  // Edit / Rename modal state
  const [editingCat, setEditingCat] = useState<MenuCategory | null>(null);
  const [editNameTh, setEditNameTh] = useState('');
  const [editNameEn, setEditNameEn] = useState('');

  // Delete confirm state
  const [deleteConfirmCat, setDeleteConfirmCat] = useState<MenuCategory | null>(null);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatTh.trim() && !newCatEn.trim()) return;
    await onAddCategory(
      newCatTh.trim() || newCatEn.trim(),
      newCatEn.trim() || newCatTh.trim(),
      newCatIcon
    );
    setNewCatTh('');
    setNewCatEn('');
    setShowAddModal(false);
    sound.playTap();
  };

  const handleStartRename = (cat: MenuCategory, e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playTap();
    setEditingCat(cat);
    setEditNameTh(cat.name_th);
    setEditNameEn(cat.name_en);
  };

  const handleSaveRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat) return;
    await onRenameCategory(
      editingCat.id,
      editNameTh.trim() || editingCat.name_th,
      editNameEn.trim() || editingCat.name_en
    );
    setEditingCat(null);
    sound.playTap();
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmCat) return;
    await onDeleteCategory(deleteConfirmCat.id);
    setDeleteConfirmCat(null);
    sound.playTap();
  };

  return (
    <>
      {/* Permanent Fixed Bottom Bar */}
      <nav
        aria-label="Bottom Category Bar"
        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center gap-2 select-none shrink-0 z-40 shadow-lg pb-safe"
      >
        {/* Scrollable Container for Category Cards */}
        <div className="flex-1 overflow-x-auto flex items-center gap-2 scrollbar-none py-0.5">
          {/* 1. FIRST CARD, FAR LEFT, PERMANENT: "BILL" */}
          <button
            type="button"
            onClick={() => {
              sound.playTap();
              onSelectBill();
            }}
            className={`px-3.5 py-2 rounded-2xl flex items-center gap-2 whitespace-nowrap min-h-[46px] transition cursor-pointer font-bold shrink-0 border shadow-xs ${
              selectedCategory === 'categories'
                ? 'bg-orange-500 border-orange-600 text-white shadow-md'
                : 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400 hover:bg-orange-100'
            }`}
            title="ผังโต๊ะและบิล (Tables & Bills)"
          >
            <div className="relative">
              <Receipt className="w-4 h-4" />
              {openBillsCount > 0 && (
                <span className="absolute -top-1.5 -right-2 px-1 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-black leading-tight">
                  {openBillsCount}
                </span>
              )}
            </div>
            <div className="flex flex-col text-left leading-none">
              <span className="text-xs font-black">
                {language === 'th' ? 'บิล' : 'Bill'}
              </span>
              {activeTableTotal && activeTableTotal > 0 ? (
                <span className="text-[10px] opacity-90 font-medium">
                  ฿{activeTableTotal.toLocaleString()}
                </span>
              ) : (
                <span className="text-[10px] opacity-75 font-normal">
                  {openBillsCount} {language === 'th' ? 'โต๊ะ' : 'open'}
                </span>
              )}
            </div>
          </button>

          {/* 2. USER-CREATED FOOD CATEGORY CARDS */}
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const displayName = language === 'th' ? cat.name_th : cat.name_en;

            return (
              <div
                key={cat.id}
                className="relative group shrink-0 flex items-center"
              >
                <button
                  type="button"
                  onClick={() => {
                    sound.playTap();
                    onSelectCategory(cat.id);
                  }}
                  className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-1.5 whitespace-nowrap min-h-[46px] transition cursor-pointer border ${
                    isSelected
                      ? 'bg-orange-500 border-orange-600 text-white shadow-md scale-102'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat.icon && <span className="text-base">{cat.icon}</span>}
                  <span>{displayName}</span>
                </button>

                {/* Edit / Rename & Delete Buttons on hover/action */}
                <div className="hidden group-hover:flex items-center gap-1 absolute -top-3 right-0 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-0.5 shadow-md z-10">
                  <button
                    type="button"
                    onClick={(e) => handleStartRename(cat, e)}
                    className="p-1 text-slate-600 dark:text-slate-300 hover:text-orange-600 rounded cursor-pointer"
                    title="Rename category"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      sound.playTap();
                      setDeleteConfirmCat(cat);
                    }}
                    className="p-1 text-rose-500 hover:text-rose-700 rounded cursor-pointer"
                    title="Delete category"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* 3. PERMANENT "VIEW ALL" (ดูทั้งหมด) CARD */}
          <button
            type="button"
            onClick={() => {
              sound.playTap();
              onSelectCategory('all');
            }}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-1.5 whitespace-nowrap min-h-[46px] transition cursor-pointer border shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-orange-500 border-orange-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            title="ดูเมนูทั้งหมด (View all menu items)"
          >
            <Layers className="w-4 h-4" />
            <span>{language === 'th' ? 'ดูทั้งหมด' : 'View all'}</span>
          </button>

          {/* 4. "+" CARD AT THE END TO ADD A NEW CATEGORY */}
          <button
            type="button"
            onClick={() => {
              sound.playTap();
              setShowAddModal(true);
            }}
            className="px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap min-h-[46px] bg-slate-50 dark:bg-slate-800/60 hover:bg-orange-50 dark:hover:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-dashed border-orange-300 dark:border-orange-700 transition cursor-pointer shrink-0"
            title="เพิ่มหมวดหมู่อาหารใหม่"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'th' ? 'เพิ่มหมวด' : 'Add Category'}</span>
          </button>
        </div>
      </nav>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs select-none">
          <form
            onSubmit={handleCreateCategory}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 max-w-sm w-full shadow-2xl text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-orange-500" />
                <span>{language === 'th' ? 'เพิ่มหมวดหมู่อาหารใหม่' : 'Add Food Category'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'th' ? 'ชื่อหมวดหมู่ (ภาษาไทย)' : 'Category Name (Thai)'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ข้าวต้ม, สเต็ก, สลัด"
                  value={newCatTh}
                  onChange={(e) => setNewCatTh(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'th' ? 'ชื่อหมวดหมู่ (English)' : 'Category Name (English)'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Porridge, Steaks, Salads"
                  value={newCatEn}
                  onChange={(e) => setNewCatEn(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'th' ? 'ไอคอน / อีโมจิ' : 'Icon / Emoji'}
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {['🍲', '🥣', '🥗', '🍢', '🧋', '🍧', '🥩', '🍣', '🍕', '☕'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewCatIcon(emoji)}
                      className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition cursor-pointer ${
                        newCatIcon === emoji
                          ? 'bg-orange-500 text-white scale-110 shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                {language === 'th' ? 'ยกเลิก' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-xl cursor-pointer shadow-xs"
              >
                {language === 'th' ? 'บันทึก' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rename Category Modal */}
      {editingCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs select-none">
          <form
            onSubmit={handleSaveRename}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 max-w-sm w-full shadow-2xl text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                <Edit2 className="w-4 h-4 text-orange-500" />
                <span>{language === 'th' ? 'แก้ไขชื่อหมวดหมู่' : 'Rename Category'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingCat(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'th' ? 'ชื่อหมวดหมู่ (ไทย)' : 'Name (Thai)'}
                </label>
                <input
                  type="text"
                  required
                  value={editNameTh}
                  onChange={(e) => setEditNameTh(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'th' ? 'ชื่อหมวดหมู่ (English)' : 'Name (English)'}
                </label>
                <input
                  type="text"
                  value={editNameEn}
                  onChange={(e) => setEditNameEn(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingCat(null)}
                className="px-3 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                {language === 'th' ? 'ยกเลิก' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-xl cursor-pointer shadow-xs"
              >
                {language === 'th' ? 'บันทึก' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Category Confirmation Dialog */}
      {deleteConfirmCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs select-none">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 max-w-sm w-full shadow-2xl text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">
              {language === 'th' ? 'ยืนยันลบหมวดหมู่?' : 'Delete Category?'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {language === 'th'
                ? `คุณต้องการลบหมวดหมู่ "${deleteConfirmCat.name_th}" ใช่หรือไม่? รายการอาหารทั้งหมดในหมวดนี้จะไม่หายไปแต่จะถูกย้ายไปที่ "ยังไม่มีหมวดหมู่"`
                : `Are you sure you want to delete "${deleteConfirmCat.name_en}"? Its dishes will not be lost and will move to "Uncategorized".`}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmCat(null)}
                className="px-3 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                {language === 'th' ? 'ยกเลิก' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl cursor-pointer shadow-xs"
              >
                {language === 'th' ? 'ลบหมวดหมู่นี้' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
