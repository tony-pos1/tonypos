import React, { useState } from 'react';
import { MenuItem } from '../../types';
import { useI18n } from '../../i18n';
import { sound } from '../../utils/sound';
import { Search, Star, Utensils } from 'lucide-react';

interface MenuItemGridProps {
  items: MenuItem[];
  categoryName?: string;
  onSelectItem: (item: MenuItem) => void;
  onToggleFavorite?: (itemId: string) => Promise<void>;
}

export const MenuItemGrid: React.FC<MenuItemGridProps> = ({
  items,
  onSelectItem,
  onToggleFavorite,
}) => {
  const { language } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      item.name_th.toLowerCase().includes(q) ||
      item.name_en.toLowerCase().includes(q)
    );
  });

  const handleCardClick = (item: MenuItem) => {
    if (!item.isAvailable) {
      sound.playWarningBeep();
      return;
    }
    sound.playTap();
    onSelectItem(item);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/70 select-none">
      {/* Search Header Bar - Full Width without Category Chip */}
      <div className="p-3 bg-white border-b border-slate-200 flex items-center shrink-0">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={
              language === 'th'
                ? 'ค้นหาอาหาร / เครื่องดื่ม...'
                : 'Search dishes, drinks...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-100 text-slate-900 placeholder-slate-400 rounded-2xl text-xs sm:text-sm border border-transparent focus:border-orange-500 focus:bg-white focus:outline-none transition"
          />
        </div>
      </div>

      {/* Grid Container */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 scrollbar-thin">
        {filteredItems.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-center p-4">
            <Utensils className="w-10 h-10 mb-2 opacity-30 text-orange-500" />
            <p className="text-sm font-bold text-slate-600">
              {language === 'th' ? 'ไม่พบรายการอาหาร' : 'No menu items found'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {language === 'th'
                ? 'ลองค้นหาด้วยคำอื่น หรือเลือกหมวดหมู่อื่น'
                : 'Try searching with another keyword or select another category'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filteredItems.map((item) => {
              const isOutOfStock = !item.isAvailable;

              return (
                <div
                  key={item.id}
                  onClick={() => handleCardClick(item)}
                  className={`group relative rounded-3xl border-2 transition-all flex flex-col overflow-hidden select-none cursor-pointer shadow-xs active:scale-[0.98] ${
                    isOutOfStock
                      ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                      : 'bg-white border-slate-200 hover:border-orange-500 hover:shadow-lg hover:-translate-y-0.5'
                  }`}
                >
                  {/* Out-of-Stock Sold Out Overlay */}
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-slate-900/60 z-20 flex flex-col items-center justify-center p-2 text-center backdrop-blur-2xs">
                      <span className="px-2.5 py-1 rounded-xl bg-rose-600 text-white font-black text-xs shadow-md">
                        {language === 'th' ? 'หมด' : 'Sold out'}
                      </span>
                    </div>
                  )}

                  {/* Star Favorite Button */}
                  {onToggleFavorite && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        sound.playTap();
                        onToggleFavorite(item.id);
                      }}
                      className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-xl bg-white/90 hover:bg-white text-slate-400 hover:text-amber-500 shadow-xs transition cursor-pointer border border-slate-100"
                      title="Favorite"
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          item.isFavorite
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  )}

                  {/* 1. FOOD PHOTO OR EMOJI */}
                  <div className="p-3 pb-0">
                    <div className="w-full h-28 sm:h-32 rounded-2xl bg-orange-50/50 border border-slate-100 flex items-center justify-center overflow-hidden">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name_th}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-5xl filter drop-shadow-sm group-hover:scale-110 transition-transform">
                          {item.emoji || '🍲'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 2. FOOD NAME ONLY UNDER PHOTO (NO PRICE, NO DESCRIPTION) */}
                  <div className="p-3 text-center flex-1 flex flex-col justify-center">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1 leading-snug">
                      {item.name_th}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 font-medium">
                      {item.name_en || item.name_th}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
