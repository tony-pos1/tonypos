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
  Clock,
  Settings,
} from 'lucide-react';

export type NavView =
  | 'tables'
  | 'order'
  | 'orders'
  | 'menu'
  | 'customers'
  | 'promotions'
  | 'reports'
  | 'shift'
  | 'settings';

interface SidebarProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  serviceMode?: 'fine_dining' | 'quick_service';
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  serviceMode = 'quick_service',
}) => {
  const { t } = useI18n();

  const navItems = [
    {
      id: 'order' as NavView,
      label: t('navQuickOrder'),
      icon: Zap,
      highlight: true,
    },
    {
      id: 'tables' as NavView,
      label: t('navTables'),
      icon: LayoutGrid,
    },
    {
      id: 'orders' as NavView,
      label: t('navOrders'),
      icon: ReceiptText,
    },
    {
      id: 'menu' as NavView,
      label: t('navMenuManager'),
      icon: UtensilsCrossed,
    },
    {
      id: 'customers' as NavView,
      label: t('navCustomers'),
      icon: Users,
    },
    {
      id: 'promotions' as NavView,
      label: t('navPromotions'),
      icon: Tag,
    },
    {
      id: 'reports' as NavView,
      label: t('navReports'),
      icon: BarChart3,
    },
    {
      id: 'shift' as NavView,
      label: t('navShift'),
      icon: Clock,
    },
    {
      id: 'settings' as NavView,
      label: t('navSettings'),
      icon: Settings,
    },
  ];

  return (
    <aside className="w-20 md:w-56 bg-slate-900 border-r border-slate-800 flex flex-col justify-between select-none shrink-0 h-full">
      {/* Navigation Buttons List */}
      <nav className="p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                sound.playTap();
                onSelectView(item.id);
              }}
              className={`w-full min-h-[46px] rounded-xl flex items-center gap-3 px-3 py-2.5 transition cursor-pointer text-left ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80 font-medium'
              }`}
              title={item.label}
              aria-label={item.label}
            >
              <Icon
                className={`w-5 h-5 shrink-0 transition-transform ${
                  isActive ? 'scale-110' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />
              <span className="hidden md:inline text-sm truncate tracking-tight">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="p-3 border-t border-slate-800 text-slate-400 text-xs hidden md:block">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Thai POS v1.0</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500" title="Local DB Active" />
        </div>
        <p className="text-[10px] text-slate-400 mt-0.5">Dexie IndexedDB (Local)</p>
      </div>
    </aside>
  );
};
