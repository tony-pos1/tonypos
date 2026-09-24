import React, { useState } from 'react';
import { AppUser } from '../../types';
import { demoUsers } from '../../db/seedData';
import { useI18n } from '../../i18n';
import { sound } from '../../utils/sound';
import { Moon, Sun, Lock, ShieldCheck, UserCheck, UtensilsCrossed, AlertCircle } from 'lucide-react';

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
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleDigit = (digit: string) => {
    sound.playTap();
    if (errorMsg) setErrorMsg('');
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    sound.playTap();
    if (errorMsg) setErrorMsg('');
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    sound.playTap();
    setPin('');
    setErrorMsg('');
  };

  const verifyPin = (inputPin: string) => {
    const matchedUser = demoUsers.find((u) => u.pin === inputPin);
    if (matchedUser) {
      sound.playNotificationChime();
      onLogin(matchedUser);
    } else {
      sound.playWarningBeep();
      setErrorMsg(
        language === 'th'
          ? 'รหัส PIN ไม่ถูกต้อง กรุณาลองใหม่'
          : 'Invalid PIN. Please try again.'
      );
      setTimeout(() => {
        setPin('');
      }, 500);
    }
  };

  const handleQuickLogin = (user: AppUser) => {
    sound.playNotificationChime();
    setPin(user.pin);
    onLogin(user);
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-800 to-orange-950 text-white p-4 select-none">
      {/* Top Bar: Language & Dark Mode */}
      <div className="flex items-center justify-between max-w-md w-full mx-auto pt-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-white">KinD POS</h1>
            <p className="text-[10px] text-slate-400 font-medium">Smart Restaurant System</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <button
            onClick={() => {
              sound.playTap();
              setLanguage(language === 'th' ? 'en' : 'th');
            }}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-slate-200 border border-white/10 transition cursor-pointer backdrop-blur-sm"
          >
            {language === 'th' ? '🇺🇸 EN' : '🇹🇭 TH'}
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => {
              sound.playTap();
              onToggleDarkMode();
            }}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 transition cursor-pointer backdrop-blur-sm"
            title="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
          </button>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="max-w-xs w-full mx-auto my-auto flex flex-col items-center">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-3xl bg-orange-500 text-white mx-auto flex items-center justify-center shadow-lg shadow-orange-500/30 mb-3">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-white">
            {language === 'th' ? 'กรุณากรอกรหัส PIN 4 หลัก' : 'Enter 4-digit PIN'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'th'
              ? 'เข้าสู่ระบบเพื่อเริ่มใช้งานเครื่องขายหน้าร้าน'
              : 'Sign in to access your point of sale terminal'}
          </p>
        </div>

        {/* PIN Indicators */}
        <div className="flex items-center justify-center gap-4 mb-4">
          {[0, 1, 2, 3].map((index) => {
            const hasDigit = pin.length > index;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  hasDigit
                    ? 'bg-orange-500 scale-125 shadow-md shadow-orange-500/50'
                    : 'bg-white/20 border border-white/30'
                }`}
              />
            );
          })}
        </div>

        {/* Error Message */}
        <div className="h-6 mb-2 text-center">
          {errorMsg && (
            <p className="text-xs text-rose-400 font-bold flex items-center justify-center gap-1 animate-shake">
              <AlertCircle className="w-3.5 h-3.5" />
              {errorMsg}
            </p>
          )}
        </div>

        {/* Keypad Grid */}
        <div className="grid grid-cols-3 gap-3 w-full mb-6">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-14 rounded-2xl bg-white/10 hover:bg-white/20 active:bg-orange-500 active:text-white border border-white/10 text-xl font-bold text-white transition cursor-pointer flex items-center justify-center shadow-sm"
            >
              {digit}
            </button>
          ))}

          <button
            type="button"
            onClick={handleClear}
            className="h-14 rounded-2xl bg-white/5 hover:bg-white/15 text-xs font-bold text-slate-300 border border-white/5 transition cursor-pointer flex items-center justify-center"
          >
            {language === 'th' ? 'ล้าง' : 'Clear'}
          </button>

          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-white/10 hover:bg-white/20 active:bg-orange-500 active:text-white border border-white/10 text-xl font-bold text-white transition cursor-pointer flex items-center justify-center shadow-sm"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleBackspace}
            className="h-14 rounded-2xl bg-white/5 hover:bg-white/15 text-base font-bold text-slate-300 border border-white/5 transition cursor-pointer flex items-center justify-center"
          >
            ⌫
          </button>
        </div>

        {/* Demo Fast Login Buttons */}
        <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-3">
          <p className="text-[10px] text-slate-400 font-semibold mb-2 text-center uppercase tracking-wider">
            {language === 'th' ? 'เลือกบัญชีทดสอบด่วน (Quick Demo)' : 'Quick Demo Logins'}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {demoUsers.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => handleQuickLogin(user)}
                className="py-2 px-1 rounded-xl bg-white/10 hover:bg-orange-500 hover:text-white text-slate-200 border border-white/10 text-[11px] font-bold transition cursor-pointer flex flex-col items-center justify-center gap-0.5 text-center"
              >
                <span className="truncate w-full font-bold">
                  {user.role === 'owner'
                    ? (language === 'th' ? 'เจ้าของ' : 'Owner')
                    : user.role === 'cashier'
                    ? (language === 'th' ? 'แคชเชียร์' : 'Cashier')
                    : (language === 'th' ? 'เสิร์ฟ' : 'Waiter')}
                </span>
                <span className="text-[10px] opacity-75 font-mono">PIN {user.pin}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] text-slate-500 pb-2">
        KinD POS • Thai Restaurant Point of Sale • Dual Language
      </div>
    </div>
  );
};
