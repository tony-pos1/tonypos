import React from 'react';
import { MenuCategory, MenuItem } from '../../types';
import { useI18n } from '../../i18n';
import { sound } from '../../utils/sound';
import { Layers, Star, Utensils, ChevronRight } from 'lucide-react';

interface CategoryTileGridProps {
  categories: MenuCategory[];
  items: MenuItem[];
  onSelectCategory: (categoryId: string) => void;
  onViewAllItems: () => void;
  onViewFavorites: () => void;
}

export const CategoryTileGrid: React.FC<CategoryTileGridProps> = ({
  categories,
  items,
  onSelectCategory,
  onViewAllItems,
  onViewFavorites,
}) => {
  const { language } = useI18n();

  const favoriteCount = items.filter((i) => i.isFavorite).length;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-5 select-none bg-slate-50">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Top Header / Quick Filters */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <Utensils className="w-5 h-5 text-orange-600" />
              <span>{language === 'th' ? 'เลือกหมวดหมู่อาหาร' : 'Menu Categories'}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'th'
                ? 'แตะหมวดหมู่เพื่อดูรายการอาหาร'
                : 'Select a category to view dishes'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.playTap();
                onViewFavorites();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition cursor-pointer min-h-[40px] shadow-xs"
            >
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span>{language === 'th' ? 'เมนูโปรด' : 'Favorites'}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px]">
                {favoriteCount}
              </span>
            </button>

            <button
              onClick={() => {
                sound.playTap();
                onViewAllItems();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition cursor-pointer min-h-[40px] shadow-xs"
            >
              <Layers className="w-4 h-4" />
              <span>{language === 'th' ? 'ดูเมนูทั้งหมด' : 'All Dishes'}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-white/25 text-white text-[10px]">
                {items.length}
              </span>
            </button>
          </div>
        </div>

        {/* Category Big Touch Tiles Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 pt-1">
          {categories.map((cat) => {
            const count = items.filter((i) => i.category_id === cat.id || (i as any).categoryId === cat.id).length;
            const catName = language === 'th' ? cat.name_th : cat.name_en;

            return (
              <button
                key={cat.id}
                onClick={() => {
                  sound.playTap();
                  onSelectCategory(cat.id);
                }}
                className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 hover:border-orange-500 hover:shadow-md transition-all text-left flex flex-col justify-between min-h-[120px] sm:min-h-[135px] cursor-pointer group active:scale-[0.98] shadow-xs"
              >
                <div className="flex items-start justify-between">
                  <span className="text-3xl sm:text-4xl filter drop-shadow-xs group-hover:scale-110 transition-transform">
                    {cat.icon || '🍽️'}
                  </span>
                  <span className="w-7 h-7 rounded-full bg-slate-100 group-hover:bg-orange-500 group-hover:text-white flex items-center justify-center text-slate-400 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>

                <div className="space-y-0.5 mt-2">
                  <h3 className="font-black text-sm sm:text-base text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                    {catName}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {count} {language === 'th' ? 'รายการ' : 'items'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
