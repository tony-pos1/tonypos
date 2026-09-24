import React, { useState, useEffect } from 'react';
import { useI18n } from '../../i18n';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { sound } from '../../utils/sound';
import { customerDisplaySync } from '../../utils/customerDisplaySync';
import { bluetoothPrinter, PrinterStatus } from '../../utils/bluetoothPrinter';
import {
  Globe,
  Wifi,
  WifiOff,
  Volume2,
  Settings,
  Inbox,
  Menu,
  Monitor,
  Printer,
  Bluetooth,
} from 'lucide-react';
import { AppSettings } from '../../types';

interface HeaderProps {
  settings: AppSettings | null;
  currentTitle: string;
  onOpenDrawer: () => void;
  onOpenCashDrawer?: () => void;
  onOpenCustomerDisplayModal?: () => void;
  isCustomerDisplayConnected?: boolean;
  onOpenPrinterSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  currentTitle,
  onOpenDrawer,
  onOpenCashDrawer,
  onOpenCustomerDisplayModal,
  isCustomerDisplayConnected,
  onOpenPrinterSettings,
}) => {
  const { t, language, toggleLanguage } = useI18n();
  const isOnline = useOnlineStatus();
  const [printerStatus, setPrinterStatus] = useState<PrinterStatus>(bluetoothPrinter.getStatus());

  useEffect(() => {
    return bluetoothPrinter.subscribe((status) => {
      setPrinterStatus(status);
    });
  }, []);

  const handleTestChime = () => {
    sound.playNotificationChime();
  };

  const displayName = language === 'th' ? settings?.shopName_th : settings?.shopName_en;

  return (
    <header className="h-14 bg-white border-b border-slate-200 text-slate-900 flex items-center justify-between px-3 sm:px-5 select-none z-30 shrink-0 shadow-xs">
      {/* Left: Brand / Shop Name & Current Page Title */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Menu Hamburger Button */}
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

        <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center p-1 shrink-0">
          <img src="icon.svg" alt="POS Logo" className="w-full h-full object-contain" />
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <h1 className="text-xs sm:text-sm font-bold text-slate-800 hidden md:block">
            {displayName || t('appName')}
          </h1>
          <span className="text-slate-300 hidden md:inline">|</span>
          <span className="text-sm sm:text-base font-black text-orange-600 tracking-tight flex items-center gap-1.5">
            {currentTitle}
          </span>
        </div>
      </div>

      {/* Right: Status Badges, Cash Drawer, Language, and Settings Drawer Button */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Cash Drawer button (simple kick / record cash in-out / audit log) */}
        {onOpenCashDrawer && (
          <button
            onClick={() => {
              sound.playTap();
              onOpenCashDrawer();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 hover:text-orange-600 hover:bg-orange-50 border border-slate-200 transition cursor-pointer min-h-[34px]"
            title="เปิดลิ้นชักเงินสด / บันทึกเงินเข้า-ออก (Cash Drawer)"
            aria-label="Cash Drawer"
          >
            <Inbox className="w-4 h-4 text-orange-500" />
            <span className="hidden sm:inline">
              {language === 'th' ? 'ลิ้นชักเงิน' : 'Drawer'}
            </span>
          </button>
        )}

        {/* Customer Facing Display (CFD) / Screen 2 Quick Launcher */}
        <button
          onClick={() => {
            sound.playTap();
            if (!isCustomerDisplayConnected) {
              customerDisplaySync.openCustomerDisplayWindow();
            } else if (onOpenCustomerDisplayModal) {
              onOpenCustomerDisplayModal();
            }
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer min-h-[36px] shadow-2xs border ${
            isCustomerDisplayConnected
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
              : 'bg-orange-50 text-orange-700 border-orange-300 hover:bg-orange-100 animate-pulse'
          }`}
          title={
            isCustomerDisplayConnected
              ? (language === 'th' ? 'จอหลัง: เชื่อมต่อแล้ว (คลิกเพื่อตั้งค่า/ดูสถานะ)' : 'Screen 2: Connected')
              : (language === 'th' ? 'จอหลัง: ยังไม่เปิด (คลิก 1 ครั้งเพื่อเปิดจอหลังทันที)' : 'Screen 2: Click to open')
          }
          aria-label="Customer Display Screen 2"
        >
          <Monitor className="w-4 h-4 text-orange-600" />
          <span className="hidden sm:inline">
            {isCustomerDisplayConnected
              ? (language === 'th' ? 'จอหลัง: เชื่อมต่อแล้ว' : 'Screen 2: On')
              : (language === 'th' ? 'เปิดจอหลัง (จอ 2)' : 'Open Screen 2')}
          </span>
          <span
            className={`w-2 h-2 rounded-full ${
              isCustomerDisplayConnected ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'
            }`}
          />
        </button>

        {/* Bluetooth / POS Thermal Printer Indicator */}
        <button
          onClick={() => {
            sound.playTap();
            if (onOpenPrinterSettings) {
              onOpenPrinterSettings();
            } else {
              onOpenDrawer();
            }
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition cursor-pointer ${
            printerStatus.isConnected
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
          }`}
          title={
            printerStatus.isConnected
              ? `เครื่องพิมพ์เชื่อมต่ออยู่: ${printerStatus.deviceName} (คลิกเพื่อไปที่ตั้งค่า)`
              : 'ยังไม่ได้เชื่อมต่อเครื่องพิมพ์บลูทูธ (คลิกเพื่อไปตั้งค่า)'
          }
        >
          {printerStatus.isConnected ? (
            <Bluetooth className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <Printer className="w-3.5 h-3.5 text-slate-500" />
          )}
          <span className="hidden md:inline">
            {printerStatus.isConnected ? 'เครื่องพิมพ์พร้อม' : 'เครื่องพิมพ์'}
          </span>
          <span
            className={`w-2 h-2 rounded-full ${
              printerStatus.isConnected ? 'bg-emerald-500' : 'bg-slate-400'
            }`}
          />
        </button>

        {/* Online / Offline Status */}
        <div
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
            isOnline
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
          }`}
          title={isOnline ? 'Online mode (IndexedDB active)' : 'Offline mode'}
        >
          {isOnline ? <Wifi className="w-3 h-3 text-emerald-600" /> : <WifiOff className="w-3 h-3 text-amber-600" />}
          <span className="hidden sm:inline">{isOnline ? 'Offline-Ready' : 'Offline'}</span>
        </div>

        {/* Audio chime button */}
        <button
          onClick={handleTestChime}
          className="p-1.5 rounded-lg text-slate-500 hover:text-orange-600 hover:bg-orange-50 transition cursor-pointer"
          title="ทดสอบเสียงกระดิ่ง (Test sound)"
          aria-label="Test sound chime"
        >
          <Volume2 className="w-4 h-4" />
        </button>

        {/* Quick Language Toggle */}
        <button
          onClick={() => {
            sound.playTap();
            toggleLanguage();
          }}
          className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 border border-slate-200 transition cursor-pointer flex items-center gap-1 min-h-[34px]"
          title="สลับภาษา (Toggle Language)"
        >
          <Globe className="w-3.5 h-3.5 text-orange-500" />
          <span>{language === 'th' ? 'TH' : 'EN'}</span>
        </button>

        {/* Gear icon button labelled "ตั้งค่าระบบ / System settings" */}
        <button
          onClick={() => {
            sound.playTap();
            onOpenDrawer();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs sm:text-sm shadow-sm transition cursor-pointer min-h-[38px]"
          aria-label="ตั้งค่าระบบ / System settings"
        >
          <Settings className="w-4 h-4" />
          <span className="font-bold">
            {language === 'th' ? 'ตั้งค่าระบบ' : 'Settings'}
          </span>
        </button>
      </div>
    </header>
  );
};
