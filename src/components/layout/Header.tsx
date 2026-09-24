import React, { useState } from 'react';
import { useI18n } from '../../i18n';
import { sound } from '../../utils/sound';
import {
  Menu,
  Bell,
  Sun,
  Moon,
  UserCheck,
  HandMetal,
  Receipt,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { AppSettings, AppUser, InAppNotification } from '../../types';

interface HeaderProps {
  settings: AppSettings | null;
  currentUser: AppUser | null;
  currentTitle: string;
  notifications: InAppNotification[];
  isDarkMode: boolean;
  onOpenDrawer: () => void;
  onToggleDarkMode: () => void;
  onClearNotifications: () => void;
  onSimulateCallWaiter: () => void;
  onSimulateRequestBill: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  currentUser,
  currentTitle,
  notifications,
  isDarkMode,
  onOpenDrawer,
  onToggleDarkMode,
  onClearNotifications,
  onSimulateCallWaiter,
  onSimulateRequestBill,
}) => {
  const { language, setLanguage } = useI18n();
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const displayName = language === 'th' ? settings?.shopName_th : settings?.shopName_en;

  const roleLabel =
    currentUser?.role === 'owner'
      ? (language === 'th' ? 'เจ้าของร้าน' : 'Owner')
      : currentUser?.role === 'cashier'
      ? (language === 'th' ? 'แคชเชียร์' : 'Cashier')
      : (language === 'th' ? 'พนักงานเสิร์ฟ' : 'Waiter');

  const roleBg =
    currentUser?.role === 'owner'
      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300'
      : currentUser?.role === 'cashier'
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';

  return (
    <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 flex items-center justify-between px-3 sm:px-4 select-none z-30 shrink-0 shadow-xs transition-colors">
      {/* Left: Hamburger & App Title */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => {
            sound.playTap();
            onOpenDrawer();
          }}
          className="p-1.5 rounded-xl text-slate-700 dark:text-slate-300 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
          title={language === 'th' ? 'เมนูระบบ (Menu)' : 'System Menu'}
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-black text-orange-600 dark:text-orange-500 tracking-tight">
              KinD POS
            </span>
            <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">•</span>
            <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate max-w-[140px] sm:max-w-[200px]">
              {displayName || (language === 'th' ? 'ระบบจัดการร้าน' : 'Restaurant POS')}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {currentTitle}
          </span>
        </div>
      </div>

      {/* Center / Right: Simulated Actions, Notifications, Theme, Lang, User */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Simulate "Call Waiter" */}
        <button
          onClick={() => {
            sound.playTap();
            onSimulateCallWaiter();
          }}
          className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 text-xs font-bold transition cursor-pointer"
          title="จำลองลูกค้าร้านเรียกพนักงาน (Call waiter)"
        >
          <HandMetal className="w-3.5 h-3.5" />
          <span>{language === 'th' ? 'เรียกพนักงาน' : 'Call Waiter'}</span>
        </button>

        {/* Simulate "Request Bill" */}
        <button
          onClick={() => {
            sound.playTap();
            onSimulateRequestBill();
          }}
          className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 text-xs font-bold transition cursor-pointer"
          title="จำลองลูกค้าขอบิล (Request bill)"
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>{language === 'th' ? 'เรียกเช็คบิล' : 'Request Bill'}</span>
        </button>

        {/* In-app Notification Bell */}
        <div className="relative">
          <button
            onClick={() => {
              sound.playTap();
              setShowNotifications(!showNotifications);
            }}
            className="relative p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:text-orange-600 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition cursor-pointer flex items-center justify-center min-h-[38px] min-w-[38px]"
            title={language === 'th' ? 'การแจ้งเตือน' : 'Notifications'}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-3 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                <div className="flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-orange-600" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {language === 'th' ? 'การแจ้งเตือนในร้าน' : 'In-store Notifications'}
                  </span>
                </div>
                {notifications.length > 0 && (
                  <button
                    onClick={() => {
                      sound.playTap();
                      onClearNotifications();
                    }}
                    className="text-[11px] text-slate-400 hover:text-rose-500 flex items-center gap-1 cursor-pointer transition"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>{language === 'th' ? 'ล้างทั้งหมด' : 'Clear all'}</span>
                  </button>
                )}
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1.5 scrollbar-thin">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-slate-300 dark:text-slate-700" />
                    {language === 'th' ? 'ไม่มีการแจ้งเตือนใหม่' : 'No new notifications'}
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700 text-xs flex items-start gap-2"
                    >
                      <div className="mt-0.5 shrink-0">
                        {n.type === 'call_waiter' ? (
                          <HandMetal className="w-3.5 h-3.5 text-amber-500" />
                        ) : n.type === 'request_bill' ? (
                          <Receipt className="w-3.5 h-3.5 text-sky-500" />
                        ) : (
                          <Bell className="w-3.5 h-3.5 text-orange-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {language === 'th' ? n.message_th : n.message_en}
                        </p>
                        <span className="text-[10px] text-slate-400">
                          {new Date(n.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={() => {
            sound.playTap();
            onToggleDarkMode();
          }}
          className="p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:text-orange-600 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition cursor-pointer flex items-center justify-center min-h-[38px] min-w-[38px]"
          title={isDarkMode ? 'Light mode' : 'Dark mode'}
          aria-label="Toggle dark mode"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Language Switch */}
        <button
          onClick={() => {
            sound.playTap();
            setLanguage(language === 'th' ? 'en' : 'th');
          }}
          className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold transition cursor-pointer min-h-[38px] flex items-center gap-1"
          title="Switch language"
        >
          <span>{language === 'th' ? '🇺🇸 EN' : '🇹🇭 TH'}</span>
        </button>

        {/* Simple User Info Display (No dropdown, No logout button) */}
        {currentUser && (
          <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-200 dark:border-slate-800">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                {currentUser.name}
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${roleBg}`}>
                {roleLabel}
              </span>
            </div>
            <div
              className="p-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/40 flex items-center justify-center"
              title={`${currentUser.name} (${roleLabel})`}
            >
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
