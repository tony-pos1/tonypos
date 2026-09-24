import React, { useState, useEffect } from 'react';
import { AppSettings, AppUser, UserRole } from '../../types';
import { demoUsers } from '../../db/seedData';
import { useI18n } from '../../i18n';
import {
  exportDatabaseBackup,
  importDatabaseBackup,
  seedDatabaseIfEmpty,
} from '../../db/db';
import { sound } from '../../utils/sound';
import { bluetoothPrinter, PrinterStatus } from '../../utils/bluetoothPrinter';
import {
  Store,
  Receipt,
  QrCode,
  Sliders,
  Database,
  Printer,
  Download,
  Upload,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertTriangle,
  Monitor,
  ExternalLink,
  Image as ImageIcon,
  Eye,
  Bluetooth,
  Usb,
  Unlink,
  RefreshCw,
  Zap,
  Users,
  Plus,
  Trash2,
  Edit2,
} from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (updated: Partial<AppSettings>) => Promise<void>;
  onReloadAllData: () => Promise<void>;
  initialTab?: 'shop' | 'tax' | 'promptpay' | 'dualscreen' | 'modifiers' | 'backup' | 'printer' | 'staff';
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onReloadAllData,
  initialTab = 'shop',
}) => {
  const { t, language } = useI18n();

  const [activeTab, setActiveTab] = useState<'shop' | 'tax' | 'promptpay' | 'dualscreen' | 'modifiers' | 'backup' | 'printer' | 'staff'>(initialTab);
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [newModifier, setNewModifier] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Staff management state (NO PIN fields, NO PIN validation)
  const [staffList, setStaffList] = useState<AppUser[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('kind_pos_staff_list');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {
        // Ignore
      }
    }
    return demoUsers;
  });

  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState<UserRole>('cashier');

  const saveStaffToStorage = (list: AppUser[]) => {
    setStaffList(list);
    try {
      localStorage.setItem('kind_pos_staff_list', JSON.stringify(list));
    } catch {
      // Ignore
    }
  };

  const handleOpenAddStaff = () => {
    sound.playTap();
    setEditingStaffId(null);
    setStaffName('');
    setStaffRole('cashier');
    setStaffModalOpen(true);
  };

  const handleOpenEditStaff = (staff: AppUser) => {
    sound.playTap();
    setEditingStaffId(staff.id);
    setStaffName(staff.name);
    setStaffRole(staff.role);
    setStaffModalOpen(true);
  };

  const handleDeleteStaff = (id: string) => {
    if (staffList.length <= 1) {
      alert(language === 'th' ? 'ต้องมีพนักงานอย่างน้อย 1 คนในระบบ' : 'Must keep at least 1 staff member');
      return;
    }
    if (window.confirm(language === 'th' ? 'ต้องการลบพนักงานคนนี้ใช่หรือไม่?' : 'Delete this staff member?')) {
      sound.playTap();
      const updated = staffList.filter((s) => s.id !== id);
      saveStaffToStorage(updated);
    }
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim()) return;
    sound.playTap();
    if (editingStaffId) {
      const updated = staffList.map((s) =>
        s.id === editingStaffId ? { ...s, name: staffName.trim(), role: staffRole } : s
      );
      saveStaffToStorage(updated);
    } else {
      const newStaff: AppUser = {
        id: `user_${Date.now()}`,
        name: staffName.trim(),
        role: staffRole,
      };
      saveStaffToStorage([...staffList, newStaff]);
    }
    setStaffModalOpen(false);
  };

  // Bluetooth & Thermal Printer states
  const [printerStatus, setPrinterStatus] = useState<PrinterStatus>(bluetoothPrinter.getStatus());
  const [isPrinterConnecting, setIsPrinterConnecting] = useState(false);
  const [isTestPrinting, setIsTestPrinting] = useState(false);
  const [printerSuccessMsg, setPrinterSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    return bluetoothPrinter.subscribe((status) => {
      setPrinterStatus(status);
      if (status.isConnected && status.deviceName) {
        setFormData((prev) => ({
          ...prev,
          printerDeviceName: status.deviceName || undefined,
          printerType: status.connectionType === 'none' ? undefined : status.connectionType,
        }));
      }
    });
  }, []);

  const handleConnectBluetooth = async () => {
    sound.playTap();
    setIsPrinterConnecting(true);
    setPrinterSuccessMsg(null);
    try {
      await bluetoothPrinter.connectBluetooth();
      setPrinterSuccessMsg('เชื่อมต่อเครื่องพิมพ์บลูทูธสำเร็จแล้ว!');
      setTimeout(() => setPrinterSuccessMsg(null), 3500);
    } catch (err: any) {
      // Handled in printerStatus.error
    } finally {
      setIsPrinterConnecting(false);
    }
  };

  const handleConnectSerial = async () => {
    sound.playTap();
    setIsPrinterConnecting(true);
    setPrinterSuccessMsg(null);
    try {
      await bluetoothPrinter.connectSerial();
      setPrinterSuccessMsg('เชื่อมต่อพอร์ตเครื่องพิมพ์ POS สำเร็จแล้ว!');
      setTimeout(() => setPrinterSuccessMsg(null), 3500);
    } catch (err: any) {
      // Handled in printerStatus.error
    } finally {
      setIsPrinterConnecting(false);
    }
  };

  const handleDisconnectPrinter = async () => {
    sound.playTap();
    await bluetoothPrinter.disconnect();
    setPrinterSuccessMsg('ตัดการเชื่อมต่อเครื่องพิมพ์แล้ว');
    setTimeout(() => setPrinterSuccessMsg(null), 2500);
  };

  const handleTestPrint = async () => {
    sound.playTap();
    setIsTestPrinting(true);
    try {
      if (!bluetoothPrinter.getStatus().isConnected) {
        // If not connected, prompt to connect Bluetooth first
        const ok = await bluetoothPrinter.connectBluetooth();
        if (!ok) {
          setIsTestPrinting(false);
          return;
        }
      }
      await bluetoothPrinter.printTestReceipt(formData);
      setPrinterSuccessMsg('พิมพ์ใบเสร็จทดสอบเรียบร้อยแล้ว กรุณาตรวจสอบกระดาษที่เครื่องพิมพ์');
      setTimeout(() => setPrinterSuccessMsg(null), 4000);
    } catch (err: any) {
      console.warn('Printer test print error:', err);
      if (window.confirm('ไม่สามารถพิมพ์ตรงไปยังบลูทูธได้ (' + (err.message || 'ยังไม่ได้เชื่อมต่อ') + ')\nต้องการเปิดหน้าต่างพิมพ์ของระบบ (Browser Print) เพื่อทดสอบแทนหรือไม่?')) {
        window.print();
      }
    } finally {
      setIsTestPrinting(false);
    }
  };

  const handleSystemTestPrint = () => {
    sound.playTap();
    window.print();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playTap();
    await onUpdateSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleAddModifier = () => {
    if (!newModifier.trim()) return;
    sound.playTap();
    setFormData({
      ...formData,
      quickModifiers: [...formData.quickModifiers, newModifier.trim()],
    });
    setNewModifier('');
  };

  const handleRemoveModifier = (index: number) => {
    sound.playTap();
    setFormData({
      ...formData,
      quickModifiers: formData.quickModifiers.filter((_, i) => i !== index),
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น (PNG, JPG, SVG)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({
        ...prev,
        logoUrl: reader.result as string,
      }));
      sound.playNotificationChime();
    };
    reader.readAsDataURL(file);
  };

  const handleCustomQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น (PNG, JPG)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({
        ...prev,
        customPromptPayQrImage: reader.result as string,
        useCustomPromptPayQr: true,
      }));
      sound.playNotificationChime();
    };
    reader.readAsDataURL(file);
  };

  // Export JSON backup
  const handleExportBackup = async () => {
    try {
      sound.playCashRegister();
      const json = await exportDatabaseBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const today = new Date().toISOString().split('T')[0];
      a.download = `thai-pos-backup-${today}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export backup', err);
      alert('Backup export failed');
    }
  };

  // Import JSON backup
  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm(t('confirmRestore'))) {
      e.target.value = '';
      return;
    }

    setIsImporting(true);
    try {
      const text = await file.text();
      await importDatabaseBackup(text);
      sound.playCashRegister();
      alert('Data restored successfully!');
      await onReloadAllData();
    } catch (err) {
      console.error('Failed to import backup', err);
      alert('Invalid backup JSON file');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  // Reset sample demo data
  const handleResetDemoData = async () => {
    if (window.confirm(t('confirmResetData'))) {
      sound.playTap();
      localStorage.clear();
      await seedDatabaseIfEmpty();
      alert('Reset complete! Reloading...');
      window.location.reload();
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full bg-slate-50 overflow-hidden text-slate-900 select-none">
      {/* Settings Navigation Tabs */}
      <div className="w-full md:w-60 bg-white border-r border-slate-200 p-2.5 flex md:flex-col gap-1 overflow-x-auto md:overflow-y-auto shrink-0 shadow-xs">
        <button
          onClick={() => setActiveTab('shop')}
          className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 whitespace-nowrap transition cursor-pointer min-h-[44px] ${
            activeTab === 'shop'
              ? 'bg-orange-500 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>{t('shopInfoTab')}</span>
        </button>

        <button
          onClick={() => setActiveTab('tax')}
          className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 whitespace-nowrap transition cursor-pointer min-h-[44px] ${
            activeTab === 'tax'
              ? 'bg-orange-500 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>{t('taxTab')}</span>
        </button>

        <button
          onClick={() => setActiveTab('promptpay')}
          className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 whitespace-nowrap transition cursor-pointer min-h-[44px] ${
            activeTab === 'promptpay'
              ? 'bg-orange-500 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>{t('promptPayTab')}</span>
        </button>

        <button
          onClick={() => setActiveTab('dualscreen')}
          className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 whitespace-nowrap transition cursor-pointer min-h-[44px] ${
            activeTab === 'dualscreen'
              ? 'bg-orange-500 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Monitor className="w-4 h-4" />
          <span>{language === 'th' ? 'ระบบ 2 หน้าจอ' : 'Dual Screen (CFD)'}</span>
        </button>

        <button
          onClick={() => setActiveTab('modifiers')}
          className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 whitespace-nowrap transition cursor-pointer min-h-[44px] ${
            activeTab === 'modifiers'
              ? 'bg-orange-500 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>{t('modifiersTab')}</span>
        </button>

        <button
          onClick={() => setActiveTab('printer')}
          className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 whitespace-nowrap transition cursor-pointer min-h-[44px] ${
            activeTab === 'printer'
              ? 'bg-orange-500 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Printer className="w-4 h-4" />
          <span>{t('printerTab')}</span>
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 whitespace-nowrap transition cursor-pointer min-h-[44px] ${
            activeTab === 'staff'
              ? 'bg-orange-500 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{language === 'th' ? 'จัดการพนักงาน' : 'Staff Management'}</span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 whitespace-nowrap transition cursor-pointer min-h-[44px] ${
            activeTab === 'backup'
              ? 'bg-orange-500 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>{t('backupTab')}</span>
        </button>
      </div>

      {/* Main Settings Panel */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <form onSubmit={handleSave} className="max-w-2xl space-y-6">
          {/* TAB 1: SHOP INFO */}
          {activeTab === 'shop' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-orange-600 border-b border-slate-200 pb-2 flex items-center gap-2">
                <Store className="w-5 h-5" />
                <span>{t('shopInfoTab')}</span>
              </h3>

              {/* Service Mode Selector */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  {t('serviceMode')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, serviceMode: 'quick_service' })}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      formData.serviceMode === 'quick_service'
                        ? 'bg-orange-50 border-orange-500 text-orange-700 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold text-xs sm:text-sm">{t('modeQuickService')}</div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      {t('modeQuickServiceDesc')}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, serviceMode: 'fine_dining' })}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      formData.serviceMode === 'fine_dining'
                        ? 'bg-orange-50 border-orange-500 text-orange-700 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold text-xs sm:text-sm">{t('modeFineDining')}</div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      {t('modeFineDiningDesc')}
                    </div>
                  </button>
                </div>
              </div>

              {/* Shop Logo Uploader (Top of Receipt) */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    รูปภาพ Logo ของร้าน (Shop Logo for Receipt Header)
                  </label>
                  <p className="text-xs text-slate-500 mt-0.5">
                    รูปนี้จะแสดงที่ด้านบนสุดของบิลใบเสร็จทุกใบที่พิมพ์ออกมา (โหลดรูปใส่เองได้)
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-orange-300 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                    {formData.logoUrl ? (
                      <img
                        src={formData.logoUrl}
                        alt="Shop Logo"
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-300" />
                    )}
                  </div>

                  <div className="space-y-2 text-center sm:text-left">
                    <label className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs w-fit">
                      <Upload className="w-4 h-4" />
                      <span>อัปโหลด / เปลี่ยนรูป Logo ร้าน</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>

                    {formData.logoUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, logoUrl: undefined })}
                        className="block text-xs text-rose-600 hover:underline cursor-pointer font-semibold"
                      >
                        ลบรูป Logo นี้
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('shopNameTh')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.shopName_th}
                    onChange={(e) => setFormData({ ...formData, shopName_th: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('shopNameEn')}
                  </label>
                  <input
                    type="text"
                    value={formData.shopName_en}
                    onChange={(e) => setFormData({ ...formData, shopName_en: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('shopPhone')}
                  </label>
                  <input
                    type="text"
                    value={formData.shopPhone}
                    onChange={(e) => setFormData({ ...formData, shopPhone: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('shopTaxId')}
                  </label>
                  <input
                    type="text"
                    value={formData.shopTaxId || ''}
                    onChange={(e) => setFormData({ ...formData, shopTaxId: e.target.value })}
                    placeholder="เช่น 0105558012345"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('shopAddressTh')}
                </label>
                <input
                  type="text"
                  value={formData.shopAddress_th}
                  onChange={(e) => setFormData({ ...formData, shopAddress_th: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('shopAddressEn')}
                </label>
                <input
                  type="text"
                  value={formData.shopAddress_en}
                  onChange={(e) => setFormData({ ...formData, shopAddress_en: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('receiptFooterTh')}
                </label>
                <input
                  type="text"
                  value={formData.receiptFooter_th}
                  onChange={(e) => setFormData({ ...formData, receiptFooter_th: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          )}

          {/* TAB 2: TAX & SERVICE CHARGE */}
          {activeTab === 'tax' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-orange-600 border-b border-slate-200 pb-2 flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                <span>{t('taxTab')}</span>
              </h3>

              {/* Service Charge Setting */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {t('serviceChargeEnabled')}
                    </div>
                    <div className="text-xs text-slate-500">
                      คิดค่าบริการเพิ่มเติม เช่น 10%
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.serviceChargeEnabled}
                    onChange={(e) =>
                      setFormData({ ...formData, serviceChargeEnabled: e.target.checked })
                    }
                    className="w-5 h-5 rounded text-orange-500 accent-orange-500"
                  />
                </div>

                {formData.serviceChargeEnabled && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t('serviceChargeRate')} (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={formData.serviceChargeRate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          serviceChargeRate: Number(e.target.value) || 0,
                        })
                      }
                      className="w-32 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 font-bold focus:outline-none focus:border-orange-500"
                    />
                  </div>
                )}
              </div>

              {/* VAT Setting */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-slate-900">{t('vatEnabled')}</div>
                    <div className="text-xs text-slate-500">
                      ภาษีมูลค่าเพิ่ม (ปกติ 7%)
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.vatEnabled}
                    onChange={(e) =>
                      setFormData({ ...formData, vatEnabled: e.target.checked })
                    }
                    className="w-5 h-5 rounded text-orange-500 accent-orange-500"
                  />
                </div>

                {formData.vatEnabled && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {t('vatRate')} (%)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={formData.vatRate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            vatRate: Number(e.target.value) || 0,
                          })
                        }
                        className="w-32 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 font-bold focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {t('priceMode')}
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, priceIncludeTax: true })}
                          className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                            formData.priceIncludeTax
                              ? 'bg-orange-50 border-orange-500 text-orange-700 shadow-xs'
                              : 'bg-slate-50 border-slate-200 text-slate-600'
                          }`}
                        >
                          {t('vatIncluded')} (Include VAT)
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, priceIncludeTax: false })}
                          className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                            !formData.priceIncludeTax
                              ? 'bg-orange-50 border-orange-500 text-orange-700 shadow-xs'
                              : 'bg-slate-50 border-slate-200 text-slate-600'
                          }`}
                        >
                          {t('vatExcluded')} (Exclude VAT +7%)
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PROMPTPAY */}
          {activeTab === 'promptpay' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-orange-600 border-b border-slate-200 pb-2 flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                <span>{t('promptPayTab')}</span>
              </h3>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {t('promptPayEnabled')}
                    </div>
                    <div className="text-xs text-slate-500">
                      เปิดใช้งานการรับชำระผ่านพร้อมเพย์ QR ของร้าน (แสดงผลหน้าจอรับเงินและจอหลัง)
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.promptPayEnabled}
                    onChange={(e) =>
                      setFormData({ ...formData, promptPayEnabled: e.target.checked })
                    }
                    className="w-5 h-5 rounded text-orange-500 accent-orange-500"
                  />
                </div>

                {formData.promptPayEnabled && (
                  <div className="space-y-3 pt-2">
                    {/* Custom PromptPay QR Image Upload */}
                    <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-200 space-y-3">
                      <div>
                        <label className="block text-sm font-black text-slate-900">
                          รูปภาพป้าย QR Code พร้อมเพย์ของที่ร้าน (Shop PromptPay QR)
                        </label>
                        <p className="text-xs text-slate-600 mt-0.5">
                          อัปโหลดรูปป้าย QR จากธนาคารหรือป้ายตั้งโต๊ะของร้าน เพื่อแสดงบนหน้าจอชำระเงินและจอหลังให้ลูกค้าสแกนได้ทันที (ระบบจะใช้รูปนี้เท่านั้น ไม่มีการสร้าง QR ใหม่)
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                        <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-orange-300 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                          {formData.customPromptPayQrImage ? (
                            <img
                              src={formData.customPromptPayQrImage}
                              alt="Shop PromptPay QR"
                              className="w-full h-full object-contain p-1.5"
                            />
                          ) : (
                            <ImageIcon className="w-10 h-10 text-slate-300 stroke-1" />
                          )}
                        </div>

                        <div className="space-y-2 text-center sm:text-left">
                          <label className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs w-fit">
                            <Upload className="w-4 h-4" />
                            <span>อัปโหลด / เปลี่ยนรูป QR ของร้าน</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleCustomQrUpload}
                              className="hidden"
                            />
                          </label>

                          {formData.customPromptPayQrImage && (
                            <button
                              type="button"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  customPromptPayQrImage: undefined,
                                  useCustomPromptPayQr: true,
                                })
                              }
                              className="block text-xs text-rose-600 hover:underline cursor-pointer font-semibold"
                            >
                              ลบรูปนี้
                            </button>
                          )}
                        </div>
                      </div>

                      {formData.customPromptPayQrImage && (
                        <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>
                            รูปภาพ QR Code ของร้านนี้จะแสดงออกทั้ง 2 ด้าน (จอพนักงาน และ จอหลังเครื่อง POS)
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {t('promptPayId')} (เบอร์โทร หรือ เลขประจำตัวผู้เสียภาษี)
                        </label>
                        <input
                          type="text"
                          value={formData.promptPayId}
                          onChange={(e) =>
                            setFormData({ ...formData, promptPayId: e.target.value })
                          }
                          placeholder="เช่น 0891234567"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {t('promptPayName')} (ชื่อบัญชีร้าน)
                        </label>
                        <input
                          type="text"
                          value={formData.promptPayName}
                          onChange={(e) =>
                            setFormData({ ...formData, promptPayName: e.target.value })
                          }
                          placeholder="เช่น ร้านครัวไทยอารีย์"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: DUAL SCREEN (CFD - Customer Facing Display) */}
          {activeTab === 'dualscreen' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-orange-600 border-b border-slate-200 pb-2 flex items-center gap-2">
                <Monitor className="w-5 h-5" />
                <span>ระบบ 2 หน้าจอ POS (Customer Facing Display)</span>
              </h3>

              <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-orange-950 uppercase tracking-wider flex items-center gap-1.5">
                    <ExternalLink className="w-4 h-4 text-orange-600" />
                    <span>วิธีเปิดหน้าต่างจอที่ 2 ด้านหลังเครื่อง POS</span>
                  </h4>
                  <p className="text-xs text-orange-900/80 mt-1 leading-relaxed">
                    สำหรับเครื่อง POS ที่มี 2 หน้าจอ: จอสัมผัสหลักด้านหน้าให้พนักงานกดรายการอาหาร และจอหลังให้ลูกค้าเห็นรายการและ QR Code พร้อมเพย์
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playTap();
                      const url =
                        window.location.origin +
                        window.location.pathname +
                        '?display=customer';
                      window.open(
                        url,
                        'POS_Customer_Display',
                        'width=1024,height=768,left=1920,top=0'
                      );
                    }}
                    className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>เปิดหน้าต่างจอหลัง (Open Customer Display)</span>
                  </button>

                  <span className="text-xs text-slate-600">
                    * เมื่อเปิดแล้ว ให้ลากหน้าต่างไปที่จอด้านหลัง แล้วกด <b>F11</b>
                  </span>
                </div>
              </div>

              {/* Welcome text on screen 2 */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  ข้อความต้อนรับบนจอหลัง (Welcome Greeting)
                </h4>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ข้อความต้อนรับภาษาไทย
                  </label>
                  <input
                    type="text"
                    value={formData.customerScreenWelcome_th || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        customerScreenWelcome_th: e.target.value,
                      })
                    }
                    placeholder="เช่น ยินดีต้อนรับสู่ร้านครัวไทยอารีย์ ขอบคุณที่มาอุดหนุนค่ะ"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ข้อความต้อนรับภาษาอังกฤษ
                  </label>
                  <input
                    type="text"
                    value={formData.customerScreenWelcome_en || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        customerScreenWelcome_en: e.target.value,
                      })
                    }
                    placeholder="e.g. Welcome to our restaurant!"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: QUICK MODIFIERS */}
          {activeTab === 'modifiers' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-orange-600 border-b border-slate-200 pb-2 flex items-center gap-2">
                <Sliders className="w-5 h-5" />
                <span>{t('modifiersTab')}</span>
              </h3>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <p className="text-xs text-slate-500 leading-relaxed">
                  รายการข้อความตัวเลือกด่วนสำหรับครัว (Quick kitchen modifiers) ที่แคชเชียร์สามารถกดเลือกได้ทันที
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newModifier}
                    onChange={(e) => setNewModifier(e.target.value)}
                    placeholder="เช่น ไม่ใส่ชูรส, แยกน้ำแข็ง"
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddModifier}
                    className="px-4 py-2 bg-orange-500 text-white font-bold text-xs rounded-xl hover:bg-orange-600 transition cursor-pointer shadow-xs"
                  >
                    เพิ่ม
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {formData.quickModifiers.map((mod, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-800"
                    >
                      <span>{mod}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveModifier(idx)}
                        className="text-slate-400 hover:text-rose-500 cursor-pointer ml-1 font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PRINTER */}
          {activeTab === 'printer' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-orange-600 border-b border-slate-200 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Printer className="w-5 h-5" />
                  <span>{t('printerTab')} (Bluetooth / ESC/POS)</span>
                </div>
                {printerStatus.isConnected ? (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    เชื่อมต่อแล้ว
                  </span>
                ) : (
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                    ยังไม่ได้เชื่อมต่อ
                  </span>
                )}
              </h3>

              {printerSuccessMsg && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{printerSuccessMsg}</span>
                </div>
              )}

              {printerStatus.error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-start gap-2 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{printerStatus.error}</span>
                </div>
              )}

              {/* CARD 1: BLUETOOTH & PORT CONNECTION */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                {/* Header status row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <Bluetooth className="w-5 h-5 text-sky-600" />
                      <span>เครื่องพิมพ์บลูทูธของเครื่อง POS (Bluetooth Thermal Printer)</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      รองรับเครื่องพิมพ์ใบเสร็จความร้อนบลูทูธ (ESC/POS 58mm/80mm) ทุกรุ่น
                    </div>
                  </div>

                  {/* Live Status Pill */}
                  <div className="flex items-center gap-2">
                    {printerStatus.isConnected ? (
                      <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold shadow-xs">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>เชื่อมต่อแล้ว: {printerStatus.deviceName || 'Thermal Printer'}</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold">
                        <span className="w-2 h-2 rounded-full bg-slate-400" />
                        <span>สถานะ: ยังไม่ได้เชื่อมต่อ</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* MAIN ACTION BUTTONS: ALWAYS PROMINENTLY VISIBLE */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Button 1: Scan Bluetooth */}
                  <button
                    type="button"
                    onClick={handleConnectBluetooth}
                    disabled={isPrinterConnecting}
                    className="p-4 rounded-2xl bg-orange-600 hover:bg-orange-500 active:bg-orange-700 disabled:bg-orange-300 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-3 cursor-pointer min-h-[56px] text-center"
                  >
                    <Bluetooth className={`w-5 h-5 shrink-0 ${isPrinterConnecting ? 'animate-spin' : ''}`} />
                    <div className="text-left">
                      <div className="font-black leading-tight">
                        {isPrinterConnecting ? 'กำลังค้นหาบลูทูธ...' : 'ค้นหาและเลือกเครื่องพิมพ์บลูทูธ'}
                      </div>
                      <div className="text-[11px] text-orange-100 font-normal leading-tight">
                        กดเพื่อเปิดหน้าต่างเลือกเครื่องพิมพ์บลูทูธของ POS
                      </div>
                    </div>
                  </button>

                  {/* Button 2: Test Print Receipt (ALWAYS VISIBLE 100%) */}
                  <button
                    type="button"
                    onClick={handleTestPrint}
                    disabled={isTestPrinting}
                    className="p-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-3 cursor-pointer min-h-[56px] text-center"
                  >
                    <Printer className={`w-5 h-5 shrink-0 ${isTestPrinting ? 'animate-pulse' : ''}`} />
                    <div className="text-left">
                      <div className="font-black leading-tight">
                        {isTestPrinting ? 'กำลังส่งข้อมูลพิมพ์...' : 'พิมพ์ใบเสร็จทดสอบ (Test Print)'}
                      </div>
                      <div className="text-[11px] text-emerald-100 font-normal leading-tight">
                        ทดสอบสั่งพิมพ์และตัดกระดาษจริง
                      </div>
                    </div>
                  </button>
                </div>

                {/* Secondary Actions & Info */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Serial/USB Port Button */}
                    {bluetoothPrinter.isSerialSupported() && (
                      <button
                        type="button"
                        onClick={handleConnectSerial}
                        disabled={isPrinterConnecting}
                        className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition border border-slate-200 flex items-center gap-1.5 cursor-pointer"
                        title="สำหรับเครื่อง POS all-in-one ที่มีเครื่องพิมพ์ฝังในตัวต่อผ่าน Serial/USB"
                      >
                        <Usb className="w-3.5 h-3.5 text-slate-600" />
                        <span>เลือกพอร์ต Serial/USB</span>
                      </button>
                    )}

                    {/* Browser Print Fallback */}
                    <button
                      type="button"
                      onClick={handleSystemTestPrint}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium transition border border-slate-200 flex items-center gap-1.5 cursor-pointer"
                      title="ทดสอบพิมพ์ผ่านหน้าต่างพิมพ์มาตรฐานของระบบ/เบราว์เซอร์"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-500" />
                      <span>ทดสอบพิมพ์ผ่านระบบ (Browser Print)</span>
                    </button>
                  </div>

                  {/* Disconnect Button (if connected) */}
                  {printerStatus.isConnected && (
                    <button
                      type="button"
                      onClick={handleDisconnectPrinter}
                      className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 transition flex items-center gap-1.5 cursor-pointer ml-auto"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                      <span>ตัดการเชื่อมต่อ</span>
                    </button>
                  )}
                </div>
              </div>

              {/* CARD 2: PRINTER CONFIGURATION */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  การตั้งค่าเครื่องพิมพ์ (Printer Preferences)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {t('printerPaperSize')}
                    </label>
                    <select
                      value={formData.printerPaperSize || '80mm'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          printerPaperSize: e.target.value as '80mm' | '58mm',
                        })
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-orange-500"
                    >
                      <option value="80mm">80 mm (ความกว้าง 576 จุด - มาตรฐานเครื่อง POS หน้าร้าน)</option>
                      <option value="58mm">58 mm (ความกว้าง 384 จุด - เครื่องพกพาขนาดเล็ก)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {t('printerCopies')}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={formData.printerCopies || 1}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          printerCopies: Number(e.target.value) || 1,
                        })
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-3">
                  {/* Auto-print toggle */}
                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition cursor-pointer">
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        พิมพ์ใบเสร็จอัตโนมัติเมื่อชำระเงินสำเร็จ (Auto-print on checkout)
                      </div>
                      <div className="text-[11px] text-slate-500">
                        เมื่อพนักงานกดยืนยันชำระเงิน ระบบจะสั่งพิมพ์ใบเสร็จออกเครื่องพิมพ์ทันที
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.printerAutoPrintReceipt ?? true}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          printerAutoPrintReceipt: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-orange-600 rounded-sm focus:ring-orange-500 cursor-pointer"
                    />
                  </label>

                  {/* Cash drawer kick toggle */}
                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition cursor-pointer">
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        เตะเปิดลิ้นชักเก็บเงินอัตโนมัติ (Kick Cash Drawer)
                      </div>
                      <div className="text-[11px] text-slate-500">
                        ส่งสัญญาณเปิดลิ้นชักที่ต่อพ่วงกับเครื่องพิมพ์ (พอร์ต RJ11) ทุกครั้งที่พิมพ์ใบเสร็จ
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.printerOpenCashDrawer ?? false}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          printerOpenCashDrawer: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-orange-600 rounded-sm focus:ring-orange-500 cursor-pointer"
                    />
                  </label>
                </div>

                <div className="p-3.5 rounded-xl bg-orange-50 border border-orange-200 text-xs text-slate-700 space-y-1.5">
                  <div className="font-bold text-orange-800 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-orange-600" />
                    <span>ระบบพิมพ์ภาษาไทยคมชัด 100% (High-Definition Thai Raster Engine):</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    ระบบจะแปลงข้อความภาษาไทยและใบเสร็จเป็นภาพบิตแมปความละเอียดสูงก่อนส่งให้เครื่องพิมพ์ ทำให้**สระ วรรณยุกต์ และตัวอักษรภาษาไทยไม่ลอย ไม่เพี้ยน และไม่เป็นภาษาต่างดาว** พิมพ์ได้คมชัดกับเครื่องพิมพ์ความร้อนทุกรุ่น
                  </p>
                </div>
              </div>

              {/* CARD 3: RECEIPT FORMAT SPECIFICATION & PREVIEW */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-orange-600" />
                    <span>รูปแบบการจัดวางบิลใบเสร็จ (Receipt Layout)</span>
                  </h4>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    ตามมาตรฐานที่กำหนด
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono">
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-white border border-slate-200">
                    <span className="font-bold text-orange-600">1. ด้านบนสุด:</span>
                    <div>
                      <div className="font-bold text-slate-900">รูปภาพ Logo ร้าน (อัปโหลดใส่เอง)</div>
                      <div className="text-[11px] text-slate-500">
                        {formData.logoUrl ? '✅ มีรูป Logo แล้ว พร้อมพิมพ์' : '⚠️ ยังไม่ได้อัปโหลด (ไปที่แท็บ "ข้อมูลร้าน" เพื่อเลือกรูป)'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-2 rounded-lg bg-white border border-slate-200">
                    <span className="font-bold text-orange-600">2. ใต้รูป Logo:</span>
                    <div>
                      <div className="font-bold text-slate-900">ชื่อร้าน & ข้อมูลติดต่อ</div>
                      <div className="text-[11px] text-slate-500 font-sans">
                        "{formData.shopName_th || 'Thai Restaurant'}" | โทร: {formData.shopPhone || '-'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-2 rounded-lg bg-white border border-slate-200">
                    <span className="font-bold text-orange-600">3. ต่อลงมา:</span>
                    <div>
                      <div className="font-bold text-slate-900">รายการอาหารและราคาทั้งหมด</div>
                      <div className="text-[11px] text-slate-500 font-sans">
                        เลขที่บิล, โต๊ะ/สั่งกลับบ้าน, รายการอาหาร, ท็อปปิ้ง, ส่วนลด, VAT, ยอดสุทธิ
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-2 rounded-lg bg-white border border-slate-200">
                    <span className="font-bold text-orange-600">4. ตอนท้าย:</span>
                    <div>
                      <div className="font-bold text-slate-900">รูป QR เพื่อให้ลูกค้าสแกนจ่ายเงินได้ (อัปโหลดใส่เอง)</div>
                      <div className="text-[11px] text-slate-500">
                        {formData.customPromptPayQrImage ? '✅ มีรูป QR พร้อมเพย์ของร้านแล้ว พร้อมพิมพ์' : '⚠️ ยังไม่ได้อัปโหลด (ไปที่แท็บ "พร้อมเพย์" เพื่อเลือกรูป)'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-2 rounded-lg bg-white border border-slate-200">
                    <span className="font-bold text-orange-600">5. ท้ายสุด:</span>
                    <div>
                      <div className="font-bold text-slate-900">คำขอบคุณ (ใส่ข้อความเองได้)</div>
                      <div className="text-[11px] text-slate-500 font-sans">
                        "{formData.receiptFooter_th || 'ขอบคุณที่มาอุดหนุนค่ะ'}"
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: BACKUP & RESTORE */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-orange-600 border-b border-slate-200 pb-2 flex items-center gap-2">
                <Database className="w-5 h-5" />
                <span>{t('backupTab')}</span>
              </h3>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    สำรองและกู้คืนข้อมูล (Full JSON Backup)
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    เนื่องจากระบบทำงานบนอุปกรณ์ของคุณ 100% (Offline-First / Localhost) เพื่อความปลอดภัยสูงสุด กรุณากดส่งออกไฟล์สำรองข้อมูลสัปดาห์ละ 1 ครั้ง หรือเมื่อแก้ไขเมนูครั้งใหญ่
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-xs transition cursor-pointer min-h-[44px]"
                  >
                    <Download className="w-4 h-4" />
                    <span>{t('exportBackup')}</span>
                  </button>

                  <label className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs border border-slate-200 cursor-pointer transition min-h-[44px]">
                    <Upload className="w-4 h-4 text-orange-500" />
                    <span>{isImporting ? 'กำลังกู้คืน...' : t('importBackup')}</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportBackup}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <div className="text-xs font-bold text-rose-600 mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>รีเซ็ตข้อมูลระบบ</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetDemoData}
                    className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition cursor-pointer min-h-[40px]"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{t('resetSampleData')}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: STAFF MANAGEMENT (NO PIN, NO PIN GENERATOR, NO PIN VALIDATION) */}
          {activeTab === 'staff' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="text-base font-bold text-orange-600 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span>{language === 'th' ? 'จัดการข้อมูลพนักงาน' : 'Staff Management'}</span>
                </h3>
                <button
                  type="button"
                  onClick={handleOpenAddStaff}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>{language === 'th' ? 'เพิ่มพนักงาน' : 'Add Staff'}</span>
                </button>
              </div>

              <p className="text-xs text-slate-500">
                {language === 'th'
                  ? 'รายชื่อพนักงานสำหรับบันทึกลงในบิล ใบเสร็จ และประวัติการขาย (ไม่ต้องใช้รหัส PIN)'
                  : 'Staff list used on receipts, shift records, and order history (No PIN required)'}
              </p>

              <div className="space-y-2">
                {staffList.map((member) => (
                  <div
                    key={member.id}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">
                        {member.name.slice(0, 1)}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{member.name}</h4>
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md mt-0.5 ${
                            member.role === 'owner'
                              ? 'bg-purple-100 text-purple-800'
                              : member.role === 'cashier'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {member.role === 'owner'
                            ? language === 'th' ? 'เจ้าของร้าน' : 'Owner'
                            : member.role === 'cashier'
                            ? language === 'th' ? 'แคชเชียร์' : 'Cashier'
                            : language === 'th' ? 'พนักงานเสิร์ฟ' : 'Waiter'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditStaff(member)}
                        className="p-2 rounded-xl text-slate-500 hover:text-orange-600 hover:bg-orange-50 transition cursor-pointer"
                        title={language === 'th' ? 'แก้ไข' : 'Edit'}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteStaff(member.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title={language === 'th' ? 'ลบ' : 'Delete'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form Submit & Feedback */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            {savedSuccess ? (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>บันทึกการตั้งค่าเรียบร้อยแล้ว</span>
              </div>
            ) : (
              <div />
            )}

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-xs transition cursor-pointer min-h-[44px]"
            >
              <Save className="w-4 h-4" />
              <span>{t('saveSettings')}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Add / Edit Staff Modal (No PIN fields, No PIN generator, No PIN validation) */}
      {staffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-black text-base text-slate-900">
              {editingStaffId
                ? language === 'th' ? 'แก้ไขข้อมูลพนักงาน' : 'Edit Staff'
                : language === 'th' ? 'เพิ่มพนักงานใหม่' : 'Add New Staff'}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'th' ? 'ชื่อพนักงาน' : 'Staff Name'}
                </label>
                <input
                  type="text"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder={language === 'th' ? 'เช่น น้องฟ้า' : 'e.g. Fah'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'th' ? 'ตำแหน่ง / บทบาท' : 'Role'}
                </label>
                <select
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-500 bg-white"
                >
                  <option value="owner">{language === 'th' ? 'เจ้าของร้าน (Owner)' : 'Owner'}</option>
                  <option value="cashier">{language === 'th' ? 'แคชเชียร์ (Cashier)' : 'Cashier'}</option>
                  <option value="waiter">{language === 'th' ? 'พนักงานเสิร์ฟ (Waiter)' : 'Waiter'}</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStaffModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
              >
                {language === 'th' ? 'ยกเลิก' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveStaff}
                disabled={!staffName.trim()}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition cursor-pointer shadow-xs disabled:opacity-50"
              >
                {language === 'th' ? 'บันทึก' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
