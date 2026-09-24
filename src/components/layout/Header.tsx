import React from 'react';
import { useI18n } from '../../i18n';
import { sound } from '../../utils/sound';
import { Menu } from 'lucide-react';
import { AppSettings, AppUser, InAppNotification } from '../../types';

interface HeaderProps {
  settings: AppSettings | null;
  currentUser?: AppUser | null;
  currentTitle: string;
  notifications?: InAppNotification[];
  isDarkMode?: boolean;
  onOpenDrawer: () => void;
  onToggleDarkMode?: () => void;
  onClearNotifications?: () => void;
  onSimulateCallWaiter?: () => void;
  onSimulateRequestBill?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  currentTitle,
  onOpenDrawer,
}) => {
  const { language, setLanguage } = useI18n();

  const displayName = language === 'th' ? settings?.shopName_th : settings?.shopName_en;

  return (
    <header className="h-14 bg-white border-b border-slate-200 text-slate-900 flex items-center justify-between px-3 sm:px-4 select-none z-30 shrink-0 shadow-xs transition-colors">
      {/* Left: Hamburger & App Title */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => {
            sound.playTap();
            onOpenDrawer();
          }}
          className="p-1.5 rounded-xl text-slate-700 hover:text-orange-600 hover:bg-orange-50 border border-slate-200 transition cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
          title={language === 'th' ? 'เมนูระบบ (Menu)' : 'System Menu'}
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-black text-orange-600 tracking-tight">
              KinD POS
            </span>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span className="text-xs sm:text-sm font-bold text-slate-800 truncate max-w-[140px] sm:max-w-[200px]">
              {displayName || (language === 'th' ? 'ระบบจัดการร้าน' : 'Restaurant POS')}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-slate-500">
            {currentTitle}
          </span>
        </div>
      </div>

      {/* Right: Language Switch (Kept as per EXCEPTION in Rule 1) */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={() => {
            sound.playTap();
            setLanguage(language === 'th' ? 'en' : 'th');
          }}
          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold transition cursor-pointer min-h-[38px] flex items-center gap-1"
          title="Switch language"
        >
          <span>{language === 'th' ? '🇺🇸 EN' : '🇹🇭 TH'}</span>
        </button>
      </div>
    </header>
  );
};
