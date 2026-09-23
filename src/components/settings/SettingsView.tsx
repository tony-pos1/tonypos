import React, { useState } from 'react';
import { AppSettings } from '../../types';
import { useI18n } from '../../i18n';
import {
  exportDatabaseBackup,
  importDatabaseBackup,
  seedDatabaseIfEmpty,
} from '../../db/db';
import { sound } from '../../utils/sound';
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
} from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (updated: Partial<AppSettings>) => Promise<void>;
  onReloadAllData: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onReloadAllData,
}) => {
  const { t, language } = useI18n();

  const [activeTab, setActiveTab] = useState<'shop' | 'tax' | 'promptpay' | 'dualscreen' | 'modifiers' | 'backup' | 'printer'>('shop');
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [newModifier, setNewModifier] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

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
              <h3 className="text-base font-bold text-orange-600 border-b border-slate-200 pb-2 flex items-center gap-2">
                <Printer className="w-5 h-5" />
                <span>{t('printerTab')}</span>
              </h3>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {t('printerBluetooth')} (ESC/POS Thermal)
                    </div>
                    <div className="text-xs text-slate-500">
                      เครื่องพิมพ์ใบเสร็จความร้อน (Bluetooth / USB)
                    </div>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                    Web Bluetooth Ready
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                    >
                      <option value="80mm">80 mm (มาตรฐานร้านอาหาร)</option>
                      <option value="58mm">58 mm (เครื่องพกพา)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
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

                <div className="p-3.5 rounded-xl bg-orange-50 border border-orange-200 text-xs text-slate-700 space-y-1">
                  <div className="font-bold text-orange-700">หมายเหตุการพิมพ์ภาษาไทย (Thai Raster Engine):</div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    ระบบรองรับการพิมพ์ทั้งแบบ Web Print มาตรฐาน (Ctrl+P / AirPrint) และแปลงข้อความภาษาไทยเป็นบิตแมปความละเอียดสูง (Canvas Raster) สำหรับส่งตรงไปยังเครื่องพิมพ์ ESC/POS สระไม่ลอย วรรณยุกต์คมชัดทุกรุ่น
                  </p>
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
    </div>
  );
};
