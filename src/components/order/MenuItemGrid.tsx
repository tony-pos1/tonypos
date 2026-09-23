import React, { useState, useRef } from 'react';
import { MenuItem } from '../../types';
import { useI18n } from '../../i18n';
import { sound } from '../../utils/sound';
import {
  Search,
  Star,
  Plus,
  Edit2,
  Trash2,
  Copy,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Utensils,
  ChevronLeft,
} from 'lucide-react';

interface MenuItemGridProps {
  items: MenuItem[];
  isEditMode: boolean;
  categoryName?: string;
  onBackToCategories?: () => void;
  onSelectItem: (item: MenuItem) => void;
  onToggleFavorite: (itemId: string) => Promise<void>;
  onToggleAvailability: (itemId: string) => Promise<void>;
  onAddItem: () => void;
  onEditItem: (item: MenuItem) => void;
  onDuplicateItem: (itemId: string) => Promise<void>;
  onDeleteItem: (itemId: string) => Promise<void>;
}

export const MenuItemGrid: React.FC<MenuItemGridProps> = ({
  items,
  isEditMode,
  categoryName,
  onBackToCategories,
  onSelectItem,
  onToggleFavorite,
  onToggleAvailability,
  onAddItem,
  onEditItem,
  onDuplicateItem,
  onDeleteItem,
}) => {
  const { t, language } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');

  // Long press tracking
  const longPressTimerRef = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const isLongPressActiveRef = useRef<{ [key: string]: boolean }>({});
  const startPosRef = useRef<{ [key: string]: { x: number; y: number } }>({});

  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      item.name_th.toLowerCase().includes(q) ||
      item.name_en.toLowerCase().includes(q) ||
      item.price.toString().includes(q)
    );
  });

  const handlePointerDown = (e: React.PointerEvent, item: MenuItem) => {
    // Left click or touch only
    if (e.button && e.button !== 0) return;

    isLongPressActiveRef.current[item.id] = false;
    startPosRef.current[item.id] = { x: e.clientX, y: e.clientY };

    longPressTimerRef.current[item.id] = setTimeout(() => {
      isLongPressActiveRef.current[item.id] = true;
      sound.playNotificationChime();
      onEditItem(item);
    }, 500);
  };

  const handlePointerMove = (e: React.PointerEvent, itemId: string) => {
    const start = startPosRef.current[itemId];
    if (start) {
      const dx = Math.abs(e.clientX - start.x);
      const dy = Math.abs(e.clientY - start.y);
      if (dx > 8 || dy > 8) {
        // Pointer moved significantly, cancel long press
        if (longPressTimerRef.current[itemId]) {
          clearTimeout(longPressTimerRef.current[itemId]);
          delete longPressTimerRef.current[itemId];
        }
      }
    }
  };

  const handlePointerUp = (itemId: string) => {
    if (longPressTimerRef.current[itemId]) {
      clearTimeout(longPressTimerRef.current[itemId]);
      delete longPressTimerRef.current[itemId];
    }
  };

  const handleCardClick = (item: MenuItem) => {
    if (isLongPressActiveRef.current[item.id]) {
      // Long press already triggered, ignore tap
      isLongPressActiveRef.current[item.id] = false;
      return;
    }
    if (!item.isAvailable && !isEditMode) return;
    sound.playTap();
    onSelectItem(item);
  };

  const handleContextMenu = (e: React.MouseEvent, item: MenuItem) => {
    e.preventDefault();
    sound.playTap();
    onEditItem(item);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden select-none">
      {/* Search Header Bar */}
      <div className="p-2.5 sm:p-3 border-b border-slate-200 bg-white flex items-center justify-between gap-2.5 shrink-0 shadow-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          {onBackToCategories && (
            <button
              onClick={() => {
                sound.playTap();
                onBackToCategories();
              }}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs font-bold transition cursor-pointer shrink-0 min-h-[38px] shadow-2xs"
              title="กลับไปหน้าหมวดหมู่ (Back to Categories)"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{language === 'th' ? 'หมวดหมู่' : 'Categories'}</span>
            </button>
          )}

          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                categoryName
                  ? `${categoryName} (${filteredItems.length})...`
                  : language === 'th'
                  ? 'ค้นหาเมนู (ชื่อไทย, อังกฤษ, ราคา)...'
                  : 'Search menu by name or price...'
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 px-1.5 py-0.5 rounded cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="text-xs text-slate-500 hidden sm:flex items-center gap-1 font-medium">
          <span className="font-bold text-slate-800">{filteredItems.length}</span>
          <span>{language === 'th' ? 'รายการ' : 'items'}</span>
          <span className="text-[10px] text-slate-400 ml-2 hidden md:inline">
            (กดค้าง 0.5 วินาทีเพื่อแก้ไข / Long-press to edit)
          </span>
        </div>
      </div>

      {/* Grid of Menu Items */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5 sm:gap-3">
          {/* In Edit mode: Add "+" card first */}
          {isEditMode && (
            <button
              onClick={() => {
                sound.playTap();
                onAddItem();
              }}
              className="min-h-[140px] rounded-2xl border-2 border-dashed border-orange-300 hover:border-orange-500 bg-orange-50/50 hover:bg-orange-50 flex flex-col items-center justify-center gap-2 text-orange-600 p-4 transition cursor-pointer group shadow-xs"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-xs font-bold">{t('addNewItem')}</span>
            </button>
          )}

          {filteredItems.map((item) => {
            const isOutOfStock = !item.isAvailable;

            return (
              <div
                key={item.id}
                onPointerDown={(e) => handlePointerDown(e, item)}
                onPointerMove={(e) => handlePointerMove(e, item.id)}
                onPointerUp={() => handlePointerUp(item.id)}
                onPointerCancel={() => handlePointerUp(item.id)}
                onContextMenu={(e) => handleContextMenu(e, item)}
                onClick={() => handleCardClick(item)}
                className={`group relative rounded-2xl border-2 transition-all flex flex-col justify-between overflow-hidden shadow-xs select-none cursor-pointer active:scale-[0.98] ${
                  isOutOfStock
                    ? 'bg-slate-100 border-slate-200 opacity-60'
                    : 'bg-white border-slate-200 hover:border-orange-400 hover:shadow-md'
                }`}
              >
                {/* Out-of-stock badge */}
                {isOutOfStock && (
                  <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold">
                    {language === 'th' ? 'หมด' : 'Out of stock'}
                  </div>
                )}

                {/* Favorite Star Button (top right) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    sound.playTap();
                    onToggleFavorite(item.id);
                  }}
                  className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-400 hover:text-amber-500 shadow-xs transition cursor-pointer border border-slate-100"
                  title="Favorite"
                >
                  <Star
                    className={`w-3.5 h-3.5 ${
                      item.isFavorite ? 'fill-amber-400 text-amber-500' : 'text-slate-400'
                    }`}
                  />
                </button>

                {/* Photo or Emoji Visual */}
                <div className="p-3 pb-0">
                  <div className="w-full h-24 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden mb-2">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name_th}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-4xl filter drop-shadow-xs group-hover:scale-110 transition-transform">
                        {item.emoji || '🍲'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Title (Both Thai and English) & Price */}
                <div className="p-3 pt-0 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1 leading-snug">
                      {item.name_th}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1">
                      {item.name_en || item.name_th}
                    </p>
                  </div>

                  <div className="mt-2 pt-1 border-t border-slate-100 flex items-baseline justify-between">
                    <span className="text-orange-600 font-black text-sm sm:text-base">
                      ฿{item.price.toLocaleString()}
                    </span>
                    {item.optionGroups && item.optionGroups.length > 0 && (
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        +{item.optionGroups.length} {language === 'th' ? 'ตัวเลือก' : 'opts'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Edit Mode Toolbar on Card */}
                {isEditMode && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs"
                  >
                    <button
                      onClick={() => onToggleAvailability(item.id)}
                      className="flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-900 cursor-pointer"
                      title="Toggle availability"
                    >
                      {item.isAvailable ? (
                        <ToggleRight className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <ToggleLeft className="w-4 h-4 text-rose-500" />
                      )}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditItem(item)}
                        className="p-1 text-slate-600 hover:text-orange-600 rounded hover:bg-slate-200 cursor-pointer"
                        title={t('editItem')}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDuplicateItem(item.id)}
                        className="p-1 text-slate-600 hover:text-sky-600 rounded hover:bg-slate-200 cursor-pointer"
                        title={t('duplicateItem')}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(t('confirmDeleteItem'))) {
                            onDeleteItem(item.id);
                          }
                        }}
                        className="p-1 text-rose-600 hover:text-rose-700 rounded hover:bg-rose-50 cursor-pointer"
                        title={t('deleteItem')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
