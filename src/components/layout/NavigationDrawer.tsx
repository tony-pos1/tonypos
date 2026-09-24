import React from 'react';
import { useI18n } from '../../i18n';
import { sound } from '../../utils/sound';
import {
  LayoutGrid,
  Zap,
  ReceiptText,
  UtensilsCrossed,
  Users,
  Tag,
  BarChart3,
  Settings,
  X,
  Star,
  Layers,
  Grid,
  ChevronRight,
  TrendingUp,
  Shield,
} from 'lucide-react';
import { AppSettings, AppUser } from '../../types';

export type NavView =
  | 'order'
  | 'tables'
  | 'orders'
  | 'dashboard'
  | 'menu'
  | 'customers'
  | 'promotions'
  | 'reports'
  | 'settings';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: NavView;
  currentUser: AppUser | null;
  onSelectView: (view: NavView) => void;
  onSelectCategoryShortcut?: (catId: string) => void;
  settings: AppSettings | null;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  currentView,
  currentUser,
  onSelectView,
  onSelectCategoryShortcut,
  settings,
}) => {
  const { language } = useI18n();

  if (!isOpen) return null;

  const role = currentUser?.role || 'owner';

  // Base navigation pages
  const allNavItems = [
    {
      id: 'tables' as NavView,
      label_th: 'ผังโต๊ะอาหาร (Floor Plan)',
      label_en: 'Tables & Floor Plan',
      desc_th: 'ดูสถานะโต๊ะ โซน และเวลาที่ลูกค้านั่ง',
      desc_en: 'Table layouts, zones & status',
      icon: LayoutGrid,
      roles: ['owner', 'cashier', 'waiter'],
    },
    {
      id: 'order' as NavView,
      label_th: 'สั่งอาหาร / POS (Order Taking)',
      label_en: 'POS & Order Taking',
      desc_th: 'เลือกเมนู บันทึกออเดอร์ลงโต๊ะ',
      desc_en: 'Menu selection & cart',
      icon: Zap,
      roles: ['owner', 'cashier', 'waiter'],
    },
    {
      id: 'orders' as NavView,
      label_th: 'บิลและประวัติการขาย (Bills / Orders)',
      label_en: 'Bills & Order History',
      desc_th: 'บิลที่เปิดอยู่ ชำระเงิน ใบเสร็จ',
      desc_en: 'Open bills, payment & receipts',
      icon: ReceiptText,
      roles: ['owner', 'cashier'],
    },
    {
      id: 'dashboard' as NavView,
      label_th: 'ภาพรวมร้าน (Dashboard)',
      label_en: 'Store Dashboard',
      desc_th: 'ยอดขายวันนี้ สถิติโต๊ะ เมนูขายดี',
      desc_en: 'Today sales, table stats & best sellers',
      icon: TrendingUp,
      roles: ['owner'],
    },
    {
      id: 'menu' as NavView,
      label_th: 'จัดการเมนูอาหาร (Menu Management)',
      label_en: 'Menu Management',
      desc_th: 'เพิ่ม/แก้ไข/ลบเมนู จัดการหมวดหมู่',
      desc_en: 'Add, edit, reorder foods & categories',
      icon: UtensilsCrossed,
      roles: ['owner'],
    },
    {
      id: 'customers' as NavView,
      label_th: 'ลูกค้าสมาชิก (Customers)',
      label_en: 'Customers & CRM',
      desc_th: 'ระบบสะสมแต้ม ประวัติการใช้บริการ',
      desc_en: 'Loyalty points & customer info',
      icon: Users,
      roles: ['owner'],
    },
    {
      id: 'promotions' as NavView,
      label_th: 'โปรโมชั่น (Promotions)',
      label_en: 'Promotions & Discounts',
      desc_th: 'ส่วนลดพิเศษ แคมเปญหน้าร้าน',
      desc_en: 'Promotions and special discounts',
      icon: Tag,
      roles: ['owner'],
    },
    {
      id: 'reports' as NavView,
      label_th: 'รายงานการขาย (Reports)',
      label_en: 'Sales Reports',
      desc_th: 'สรุปยอดขาย การยกเลิก การชำระเงิน',
      desc_en: 'Daily revenue, voids and payment report',
      icon: BarChart3,
      roles: ['owner'],
    },
    {
      id: 'settings' as NavView,
      label_th: 'ตั้งค่าระบบ (Settings)',
      label_en: 'System Settings',
      desc_th: 'ข้อมูลร้าน บิลใบเสร็จ พรอมต์เพย์ สำรองข้อมูล',
      desc_en: 'Shop details, receipt, PromptPay, backup',
      icon: Settings,
      roles: ['owner'],
    },
  ];

  // Filter items visible to user role
  const visibleNavItems = allNavItems.filter((item) => item.roles.includes(role));

  const handleSelectPage = (viewId: NavView) => {
    sound.playTap();
    onSelectView(viewId);
    onClose();
  };

  const handleShortcut = (shortcutKey: string) => {
    sound.playTap();
    onSelectView('order');
    if (onSelectCategoryShortcut) {
      onSelectCategoryShortcut(shortcutKey);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex select-none animate-in fade-in duration-200">
      {/* Dimmed Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={() => {
          sound.playTap();
          onClose();
        }}
      />

      {/* Drawer Panel */}
      <aside className="relative ml-auto w-full max-w-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl flex flex-col h-full border-l border-slate-200 dark:border-slate-800 z-10 animate-in slide-in-from-right duration-250">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black text-sm">
              K
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900 dark:text-slate-100 tracking-tight">
                KinD POS
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {language === 'th' ? 'เมนูระบบหลัก' : 'Main Navigation'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playTap();
              onClose();
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        {currentUser && (
          <div className="px-4 py-2.5 bg-orange-50/60 dark:bg-orange-950/30 border-b border-orange-100 dark:border-orange-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-orange-700 dark:text-orange-400 ml-1.5 font-semibold">
                  ({currentUser.role.toUpperCase()})
                </span>
              </div>
            </div>
            <span className="text-[10px] text-slate-400">Online</span>
          </div>
        )}

        {/* Drawer Body Scrollable */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin">
          {/* Main Pages */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              {language === 'th' ? 'หน้าหลักระบบ' : 'Pages'}
            </p>
            {visibleNavItems.map((item) => {
              const isSelected = currentView === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectPage(item.id)}
                  className={`w-full p-2.5 rounded-2xl flex items-center gap-3 transition text-left cursor-pointer ${
                    isSelected
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-orange-600 dark:text-orange-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs truncate">
                      {language === 'th' ? item.label_th : item.label_en}
                    </div>
                    <div
                      className={`text-[10px] truncate ${
                        isSelected ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {language === 'th' ? item.desc_th : item.desc_en}
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-300'}`}
                  />
                </button>
              );
            })}
          </div>

          {/* Section: Shortcuts for Food Menu (Requested by User) */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              {language === 'th' ? 'เมนูอาหาร (Food Menu)' : 'Food Menu'}
            </p>

            {/* Categories Screen Shortcut */}
            <button
              onClick={() => handleShortcut('categories')}
              className="w-full p-2.5 rounded-2xl flex items-center gap-3 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                <Grid className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-xs truncate">
                  {language === 'th' ? 'หมวดหมู่ (Categories)' : 'Categories'}
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                  {language === 'th' ? 'เปิดดูหมวดหมู่ทั้งหมด' : 'Browse by categories'}
                </div>
              </div>
            </button>

            {/* All Menu Shortcut */}
            <button
              onClick={() => handleShortcut('all')}
              className="w-full p-2.5 rounded-2xl flex items-center gap-3 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-xs truncate">
                  {language === 'th' ? 'เมนูทั้งหมด (All Menu)' : 'All Menu'}
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                  {language === 'th' ? 'แสดงรายการอาหารทุกหมวด' : 'Show all menu items'}
                </div>
              </div>
            </button>

            {/* Favorites Shortcut */}
            <button
              onClick={() => handleShortcut('favorites')}
              className="w-full p-2.5 rounded-2xl flex items-center gap-3 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-500 flex items-center justify-center shrink-0">
                <Star className="w-4 h-4 fill-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-xs truncate">
                  {language === 'th' ? 'รายการโปรด (Favorites)' : 'Favorites'}
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                  {language === 'th' ? 'เมนูขายดีที่ติดดาว' : 'Starred favorite dishes'}
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 text-center text-[10px] text-slate-400">
          KinD POS v2.5 • Thai Restaurant System
        </div>
      </aside>
    </div>
  );
};
