import React from 'react';
import { useI18n } from '../../i18n';
import { sound } from '../../utils/sound';
import {
  Zap,
  LayoutGrid,
  ReceiptText,
  UtensilsCrossed,
  Users,
  Tag,
  BarChart3,
  Settings,
  X,
  Globe,
  Database,
  ChefHat,
  ChevronRight,
  Monitor,
  Printer,
  Bluetooth,
} from 'lucide-react';
import { AppSettings } from '../../types';

export type NavView =
  | 'order'
  | 'tables'
  | 'orders'
  | 'menu'
  | 'customers'
  | 'promotions'
  | 'reports'
  | 'settings';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  settings: AppSettings | null;
  onOpenCustomerDisplayModal?: () => void;
  onOpenPrinterSettings?: () => void;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  currentView,
  onSelectView,
  settings,
  onOpenCustomerDisplayModal,
  onOpenPrinterSettings,
}) => {
  const { t, language, toggleLanguage } = useI18n();

  if (!isOpen) return null;

  const navItems = [
    {
      id: 'order' as NavView,
      label_th: 'สั่งด่วน (Quick Order)',
      label_en: 'Quick Order',
      desc_th: 'รับออเดอร์หน้าร้าน/กลับบ้าน',
      desc_en: 'Take orders & takeaway',
      icon: Zap,
    },
    {
      id: 'tables' as NavView,
      label_th: 'ผังโต๊ะอาหาร (Floor Plan)',
      label_en: 'Floor Plan & Tables',
      desc_th: 'จัดผังโต๊ะ แยกโซน ดูสถานะโต๊ะ',
      desc_en: 'Layout, zones & live status',
      icon: LayoutGrid,
    },
    {
      id: 'orders' as NavView,
      label_th: 'ประวัติบิล (Orders & Bills)',
      label_en: 'Orders & Bills',
      desc_th: 'บิลเปิดอยู่ ใบเสร็จ ยกเลิกรายการ',
      desc_en: 'Open orders, receipts, voids',
      icon: ReceiptText,
    },
    {
      id: 'menu' as NavView,
      label_th: 'จัดการเมนู (Menu Manager)',
      label_en: 'Menu Manager',
      desc_th: 'ลากจัดลำดับ เพิ่ม/แก้เมนูและหมวดหมู่',
      desc_en: 'Drag reorder, edit items & categories',
      icon: UtensilsCrossed,
    },
    {
      id: 'customers' as NavView,
      label_th: 'ลูกค้าสมาชิก (Customers)',
      label_en: 'Customers & CRM',
      desc_th: 'สะสมแต้ม ประวัติการสั่งซื้อ',
      desc_en: 'Loyalty points & order history',
      icon: Users,
    },
    {
      id: 'promotions' as NavView,
      label_th: 'โปรโมชั่น & ส่วนลด (Promotions)',
      label_en: 'Promotions & Discounts',
      desc_th: 'ส่วนลดเทศกาล โปรโมชั่นพิเศษ',
      desc_en: 'Campaigns & discounts',
      icon: Tag,
    },
    {
      id: 'reports' as NavView,
      label_th: 'รายงานการขาย (Sales Reports)',
      label_en: 'Sales & Audit Reports',
      desc_th: 'ยอดขายประจำวัน รายงานยกเลิก แชร์ LINE',
      desc_en: 'Daily revenue, voids & LINE share',
      icon: BarChart3,
    },
    {
      id: 'settings' as NavView,
      label_th: 'ตั้งค่าระบบ (System Settings)',
      label_en: 'System Settings',
      desc_th: 'ข้อมูลร้าน เครื่องพิมพ์ สำรอง/กู้คืนข้อมูล',
      desc_en: 'Shop profile, printers & backup',
      icon: Settings,
    },
  ];

  const displayName = language === 'th' ? settings?.shopName_th : settings?.shopName_en;

  return (
    <div className="fixed inset-0 z-50 flex select-none animate-in fade-in duration-200">
      {/* Dimmed Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={() => {
          sound.playTap();
          onClose();
        }}
      />

      {/* Drawer Panel */}
      <aside className="relative ml-auto w-full max-w-sm sm:max-w-md bg-white text-slate-900 shadow-2xl flex flex-col h-full border-l border-slate-200 z-10 animate-in slide-in-from-right duration-250">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center p-1.5 shadow-xs">
              <ChefHat className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 leading-tight">
                {displayName || t('appName')}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {language === 'th' ? 'เมนูระบบ POS ร้านอาหาร' : 'Restaurant POS System'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playTap();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  sound.playTap();
                  onSelectView(item.id);
                  onClose();
                }}
                className={`w-full text-left p-3 rounded-2xl flex items-center justify-between transition cursor-pointer min-h-[52px] ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20 font-bold'
                    : 'bg-white hover:bg-slate-100 text-slate-800 border border-transparent hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-white/20 text-white' : 'bg-orange-50 text-orange-600'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm leading-tight">
                      {language === 'th' ? item.label_th : item.label_en}
                    </div>
                    <div
                      className={`text-[11px] leading-tight mt-0.5 ${
                        isActive ? 'text-orange-100' : 'text-slate-400'
                      }`}
                    >
                      {language === 'th' ? item.desc_th : item.desc_en}
                    </div>
                  </div>
                </div>

                <ChevronRight
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    isActive ? 'text-white translate-x-0.5' : 'text-slate-300'
                  }`}
                />
              </button>
            );
          })}
        </nav>

        {/* Dual-Screen Customer Display Shortcut */}
        {onOpenCustomerDisplayModal && (
          <div className="px-3 pb-2">
            <button
              onClick={() => {
                sound.playTap();
                onClose();
                onOpenCustomerDisplayModal();
              }}
              className="w-full p-3 rounded-2xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-left transition flex items-center justify-between cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0">
                  <Monitor className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-orange-950">
                    {language === 'th' ? 'ระบบ 2 หน้าจอ (จอหลัง)' : 'Dual Screen Customer Display'}
                  </div>
                  <div className="text-[11px] text-orange-800/80">
                    {language === 'th' ? 'เปิดจอหลัง & อัปโหลด QR ร้าน' : 'Open screen 2 & shop QR'}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-orange-600 shrink-0" />
            </button>
          </div>
        )}

        {/* Bluetooth Thermal Printer Shortcut */}
        {onOpenPrinterSettings && (
          <div className="px-3 pb-3">
            <button
              onClick={() => {
                sound.playTap();
                onClose();
                onOpenPrinterSettings();
              }}
              className="w-full p-3 rounded-2xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-left transition flex items-center justify-between cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-sky-950">
                    {language === 'th' ? 'เครื่องพิมพ์บลูทูธ (Bluetooth Printer)' : 'Bluetooth Printer'}
                  </div>
                  <div className="text-[11px] text-sky-800/80">
                    {language === 'th' ? 'เชื่อมต่อเครื่องพิมพ์บิล & พิมพ์ทดสอบ' : 'Connect printer & test print'}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-sky-600 shrink-0" />
            </button>
          </div>
        )}

        {/* Language & Local DB Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-orange-500" />
              <span>{t('language')}</span>
            </span>

            <button
              onClick={() => {
                sound.playTap();
                toggleLanguage();
              }}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs min-h-[36px]"
            >
              <span>{language === 'th' ? '🇹🇭 ภาษาไทย' : '🇬🇧 English'}</span>
              <span className="text-[10px] text-orange-600 font-semibold">(สลับ)</span>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>IndexedDB Offline-First</span>
            </div>
            <span className="font-mono text-[10px] text-slate-400">v2.0 (Light)</span>
          </div>
        </div>
      </aside>
    </div>
  );
};
