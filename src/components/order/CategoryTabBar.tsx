import React, { useState } from 'react';
import { MenuCategory } from '../../types';
import { useI18n } from '../../i18n';
import { sound } from '../../utils/sound';
import {
  Edit2,
  Check,
  Plus,
  Trash2,
  Star,
  Layers,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface CategoryTabBarProps {
  categories: MenuCategory[];
  selectedCategory: string; // 'categories' | 'all' | 'favorites' | categoryId
  onSelectCategory: (id: string) => void;
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onAddCategory: (nameTh: string, nameEn: string, icon?: string) => Promise<void>;
  onRenameCategory: (id: string, nameTh: string, nameEn: string) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  onReorderCategory: (id: string, direction: 'left' | 'right') => Promise<void>;
}

export const CategoryTabBar: React.FC<CategoryTabBarProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  isEditMode,
  onToggleEditMode,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
  onReorderCategory,
}) => {
  const { t, language } = useI18n();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCatTh, setNewCatTh] = useState('');
  const [newCatEn, setNewCatEn] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🍽️');

  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editNameTh, setEditNameTh] = useState('');
  const [editNameEn, setEditNameEn] = useState('');

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatTh.trim() && !newCatEn.trim()) return;
    await onAddCategory(newCatTh.trim() || newCatEn.trim(), newCatEn.trim() || newCatTh.trim(), newCatIcon);
    setNewCatTh('');
    setNewCatEn('');
    setShowAddModal(false);
    sound.playTap();
  };

  const startEditCategory = (cat: MenuCategory) => {
    setEditingCatId(cat.id);
    setEditNameTh(cat.name_th);
    setEditNameEn(cat.name_en);
  };

  const handleSaveRename = async () => {
    if (!editingCatId) return;
    await onRenameCategory(editingCatId, editNameTh, editNameEn);
    setEditingCatId(null);
    sound.playTap();
  };

  return (
    <div className="bg-white border-t border-slate-200 p-2.5 flex items-center gap-2 select-none shrink-0 z-20 shadow-xs">
      {/* Category Tabs Scrollable Container */}
      <div className="flex-1 overflow-x-auto flex items-center gap-2 scrollbar-none py-1">
        {/* 'Categories Screen' Tab */}
        <button
          onClick={() => {
            sound.playTap();
            onSelectCategory('categories');
          }}
          className={`px-3.5 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 whitespace-nowrap min-h-[44px] transition cursor-pointer ${
            selectedCategory === 'categories'
              ? 'bg-orange-500 text-white shadow-xs font-bold'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
          }`}
          title="หน้าหมวดหมู่หลัก (Category Screen)"
        >
          <LayoutGrid className="w-4 h-4" />
          <span>{language === 'th' ? 'หมวดหมู่' : 'Categories'}</span>
        </button>

        {/* 'All' Tab */}
        <button
          onClick={() => {
            sound.playTap();
            onSelectCategory('all');
          }}
          className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 whitespace-nowrap min-h-[44px] transition cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-orange-500 text-white shadow-xs font-bold'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{t('allCategories')}</span>
        </button>

        {/* 'Favorites' Tab */}
        <button
          onClick={() => {
            sound.playTap();
            onSelectCategory('favorites');
          }}
          className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 whitespace-nowrap min-h-[44px] transition cursor-pointer ${
            selectedCategory === 'favorites'
              ? 'bg-orange-500 text-white shadow-xs font-bold'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
          }`}
        >
          <Star className={`w-4 h-4 ${selectedCategory === 'favorites' ? 'fill-white text-white' : 'text-amber-500 fill-amber-500'}`} />
          <span>{t('favorites')}</span>
        </button>

        {/* Dynamic Categories */}
        {categories.map((cat, idx) => {
          const isSelected = selectedCategory === cat.id;
          const displayName = language === 'th' ? cat.name_th : cat.name_en;

          return (
            <div key={cat.id} className="relative flex items-center shrink-0">
              <button
                onClick={() => {
                  sound.playTap();
                  onSelectCategory(cat.id);
                }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 whitespace-nowrap min-h-[44px] transition cursor-pointer ${
                  isSelected
                    ? 'bg-orange-500 text-white shadow-xs font-bold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {cat.icon && <span className="text-base">{cat.icon}</span>}
                <span>{displayName}</span>
              </button>

              {/* Controls when in Edit Mode */}
              {isEditMode && (
                <div className="flex items-center gap-0.5 ml-1 bg-white p-1 rounded-lg border border-slate-200 shadow-xs">
                  {/* Left reorder */}
                  {idx > 0 && (
                    <button
                      onClick={() => onReorderCategory(cat.id, 'left')}
                      className="p-1 hover:bg-slate-100 rounded text-slate-600 transition cursor-pointer"
                      title="Move left"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {/* Right reorder */}
                  {idx < categories.length - 1 && (
                    <button
                      onClick={() => onReorderCategory(cat.id, 'right')}
                      className="p-1 hover:bg-slate-100 rounded text-slate-600 transition cursor-pointer"
                      title="Move right"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {/* Rename button */}
                  <button
                    onClick={() => startEditCategory(cat)}
                    className="p-1 hover:bg-orange-50 rounded text-orange-600 transition cursor-pointer"
                    title={t('renameCategory')}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {/* Delete category */}
                  <button
                    onClick={() => {
                      if (window.confirm(t('confirmDeleteCategory'))) {
                        onDeleteCategory(cat.id);
                      }
                    }}
                    className="p-1 hover:bg-rose-50 rounded text-rose-600 transition cursor-pointer"
                    title={t('deleteCategory')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Add Category button when in Edit mode */}
        {isEditMode && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 transition cursor-pointer min-h-[44px] whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addCategory')}</span>
          </button>
        )}
      </div>

      {/* Toggle Edit Mode Button */}
      <button
        onClick={() => {
          sound.playTap();
          onToggleEditMode();
        }}
        className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer min-h-[44px] shrink-0 ${
          isEditMode
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
        }`}
        title={isEditMode ? (language === 'th' ? 'เสร็จสิ้น' : 'Done') : t('editCategory')}
      >
        {isEditMode ? (
          <>
            <Check className="w-4 h-4" />
            <span>{language === 'th' ? 'เสร็จสิ้น' : 'Done'}</span>
          </>
        ) : (
          <>
            <Edit2 className="w-4 h-4" />
            <span className="hidden sm:inline">{t('editCategory')}</span>
          </>
        )}
      </button>

      {/* Modal: Add Category */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs select-none">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 max-w-md w-full shadow-2xl text-slate-900 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-orange-600" />
              <span>{t('addCategory')}</span>
            </h3>

            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('categoryNameTh')} *
                </label>
                <input
                  type="text"
                  required
                  value={newCatTh}
                  onChange={(e) => setNewCatTh(e.target.value)}
                  placeholder="เช่น ต้มยำ, ของทานเล่น"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('categoryNameEn')}
                </label>
                <input
                  type="text"
                  value={newCatEn}
                  onChange={(e) => setNewCatEn(e.target.value)}
                  placeholder="e.g. Soups, Appetizers"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'th' ? 'ไอคอน / อิโมจิ' : 'Category Icon'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newCatIcon}
                    onChange={(e) => setNewCatIcon(e.target.value)}
                    className="w-16 text-center text-xl bg-slate-50 border border-slate-300 rounded-xl py-1.5 focus:outline-none focus:border-orange-500"
                  />
                  <div className="flex gap-1 overflow-x-auto py-1">
                    {['🍲', '🥣', '🥗', '🧋', '🍧', '🍢', '🥩', '🍚', '🍺'].map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setNewCatIcon(em)}
                        className="p-1.5 text-lg hover:bg-slate-100 rounded-lg cursor-pointer"
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white cursor-pointer shadow-xs"
                >
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Rename Category */}
      {editingCatId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs select-none">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 max-w-md w-full shadow-2xl text-slate-900 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-orange-600" />
              <span>{t('editCategory')}</span>
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('categoryNameTh')}
                </label>
                <input
                  type="text"
                  value={editNameTh}
                  onChange={(e) => setEditNameTh(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('categoryNameEn')}
                </label>
                <input
                  type="text"
                  value={editNameEn}
                  onChange={(e) => setEditNameEn(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCatId(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleSaveRename}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white cursor-pointer shadow-xs"
                >
                  {t('save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
