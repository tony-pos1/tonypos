import React from 'react';
import { AppUser } from '../../types';
import { demoUsers } from '../../db/seedData';
import { useI18n } from '../../i18n';
import { sound } from '../../utils/sound';
import { Moon, Sun, ShieldCheck, UserCheck, UtensilsCrossed } from 'lucide-react';

interface LoginViewProps {
  onLogin: (user: AppUser) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLogin,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const { language, setLanguage } = useI18n();

  const handleSelectUser = (user: AppUser) => {
    sound.playTap();
    onLogin(user);
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-gradient-to-br from-slate-50 via-orange-50/30 to-amber-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 select-none p-4 sm:p-6">
      {/* Top Header */}
      <header className="w-full flex items-center justify-between max-w-4xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-orange-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-orange-600/30">
            K
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-orange-600 dark:text-orange-500">
              KinD POS
            </h1>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {language === 'th' ? 'ระบบจัดการร้านอาหาร' : 'Restaurant Point of Sale'}
            </p>
          </div>
        </div>

        {/* Theme & Language Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playTap();
              onToggleDarkMode();
            }}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition cursor-pointer shadow-xs"
            title="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={() => {
              sound.playTap();
              setLanguage(language === 'th' ? 'en' : 'th');
            }}
            className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-bold transition cursor-pointer shadow-xs"
          >
            {language === 'th' ? '🇺🇸 EN' : '🇹🇭 TH'}
          </button>
        </div>
      </header>

      {/* Main Content: 1-Click Role Select (No PIN required) */}
      <main className="w-full max-w-md mx-auto my-auto py-6">
        <div className="bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-slate-200/50 dark:shadow-black/50 text-center">
          <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center mx-auto mb-4">
            <UserCheck className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-black mb-1">
            {language === 'th' ? 'เข้าสู่ระบบ KinD POS' : 'Welcome to KinD POS'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            {language === 'th'
              ? 'เลือกตำแหน่งผู้ใช้งานเพื่อเข้าสู่ระบบทันที (ไม่ต้องใส่รหัส PIN)'
              : 'Select your user profile to enter immediately (No PIN required)'}
          </p>

          <div className="space-y-3">
            {demoUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => handleSelectUser(user)}
                className="w-full p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-orange-500 dark:hover:border-orange-500 bg-slate-50 dark:bg-slate-800/60 hover:bg-orange-50/50 dark:hover:bg-orange-950/20 text-left transition flex items-center justify-between group cursor-pointer shadow-xs"
              >
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition">
                    {user.name}
                  </h4>
                  <p className="text-xs text-slate-400 capitalize">
                    {user.role === 'owner'
                      ? language === 'th' ? 'เจ้าของร้าน (สิทธิ์เต็ม)' : 'Owner (Full Access)'
                      : user.role === 'cashier'
                      ? language === 'th' ? 'แคชเชียร์ (รับออเดอร์/คิดเงิน)' : 'Cashier (POS & Billing)'
                      : language === 'th' ? 'พนักงานเสิร์ฟ (รับออเดอร์)' : 'Waiter (Order Taking)'}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 group-hover:text-orange-600 dark:group-hover:text-orange-400 group-hover:border-orange-500 transition">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center text-xs text-slate-400 py-2">
        KinD POS • Thai Restaurant Point of Sale System
      </footer>
    </div>
  );
};
