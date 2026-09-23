import React, { useState, useEffect } from 'react';
import { AppSettings, Order } from '../../types';
import { CustomerFacingDisplay } from './CustomerFacingDisplay';
import { CustomerDisplayState, customerDisplaySync } from '../../utils/customerDisplaySync';
import {
  Monitor,
  ExternalLink,
  X,
  Upload,
  CheckCircle,
  HelpCircle,
  Image as ImageIcon,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { sound } from '../../utils/sound';

interface CustomerDisplayControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  currentOrder: Order;
  onUpdateSettings: (changes: Partial<AppSettings>) => Promise<void>;
}

export const CustomerDisplayControlModal: React.FC<CustomerDisplayControlModalProps> = ({
  isOpen,
  onClose,
  settings,
  currentOrder,
  onUpdateSettings,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<'control' | 'preview'>('control');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    customerDisplaySync.startHeartbeatCheck();
    const unsub = customerDisplaySync.subscribeConnection((connected) => {
      setIsConnected(connected);
    });
    return () => {
      unsub();
    };
  }, []);

  if (!isOpen) return null;

  const handleOpenCustomerWindow = () => {
    sound.playTap();
    const url = window.location.origin + window.location.pathname + '?display=customer';
    const win = window.open(
      url,
      'POS_Customer_Display',
      'width=1024,height=768,left=1920,top=0,menubar=no,status=no,toolbar=no'
    );
    if (!win) {
      alert('เบราว์เซอร์บล็อกหน้าต่างป๊อปอัป กรุณาอนุญาตป๊อปอัปสำหรับเว็บไซต์นี้');
    }
  };

  const handleQrImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น (PNG, JPG, JPEG)');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      alert('ขนาดไฟล์รูปภาพต้องไม่เกิน 4MB');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        await onUpdateSettings({
          customPromptPayQrImage: base64,
          useCustomPromptPayQr: true,
        });
        sound.playNotificationChime();
      } catch (err) {
        console.error(err);
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveQrImage = async () => {
    sound.playTap();
    await onUpdateSettings({
      customPromptPayQrImage: undefined,
      useCustomPromptPayQr: true,
    });
  };

  const previewState: CustomerDisplayState = {
    order: currentOrder,
    settings,
    isPaymentOpen: false,
    paymentMethod: 'promptpay',
    customQrImageUrl: settings.customPromptPayQrImage,
    timestamp: Date.now(),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 sm:p-5 backdrop-blur-xs select-none">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl text-slate-900 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>จัดการระบบ 2 หน้าจอ (Dual-Screen POS)</span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    isConnected
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                    }`}
                  />
                  {isConnected ? 'จอหลังเชื่อมต่ออยู่' : 'พร้อมเปิดใช้งาน'}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Customer Facing Display (CFD) สำหรับเครื่อง POS ที่มีจอด้านหลัง
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 p-1 shrink-0">
          <button
            onClick={() => setActiveTab('control')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'control'
                ? 'bg-white text-orange-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>ตั้งค่าจอหลัง & อัปโหลด QR ร้าน</span>
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-white text-orange-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>จำลองหน้าจอหลัง (Live Preview)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {activeTab === 'control' ? (
            <div className="space-y-6">
              {/* Step 1: Open Screen 2 Button */}
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-black text-orange-900 flex items-center gap-1.5">
                      <ExternalLink className="w-4 h-4 text-orange-600" />
                      <span>วิธีเปิดแสดงผลบนจอหลังเครื่อง POS</span>
                    </h4>
                    <p className="text-xs text-orange-800/80 mt-1 leading-relaxed">
                      กดปุ่มด้านล่างเพื่อเปิดหน้าต่างจอสำหรับลูกค้า จากนั้นลากหน้าต่างนั้นไปยังจอที่ 2 ด้านหลัง แล้วกดปุ่ม <b>F11</b> (หรือขยายเต็มจอ)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleOpenCustomerWindow}
                    className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>เปิดหน้าต่างจอที่ 2 สำหรับลูกค้า (Open Screen 2)</span>
                  </button>

                  <span className="text-[11px] text-slate-500">
                    *ข้อมูลออเดอร์และ QR Code จะส่งไปจอหลังอัตโนมัติแบบเรียลไทม์
                  </span>
                </div>
              </div>

              {/* Step 2: PromptPay Custom QR Code Image Upload */}
              <div className="space-y-3 border-t border-slate-200 pt-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-orange-600" />
                      <span>รูป QR พร้อมเพย์ของที่ร้าน (Custom Shop PromptPay QR)</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      อัปโหลดรูปป้าย QR Code บัญชีธนาคารของร้าน เพื่อให้ลูกค้าสแกนได้ทันทีผ่านจอหลัง
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  {/* Image Preview Box */}
                  <div className="w-36 h-36 bg-white border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 relative group">
                    {settings.customPromptPayQrImage ? (
                      <>
                        <img
                          src={settings.customPromptPayQrImage}
                          alt="Custom PromptPay QR"
                          className="w-full h-full object-contain p-1"
                        />
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                          <button
                            onClick={handleRemoveQrImage}
                            className="px-2 py-1 rounded bg-rose-600 text-white text-[11px] font-bold"
                          >
                            ลบรูป
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-2 text-slate-400">
                        <ImageIcon className="w-8 h-8 mx-auto mb-1 stroke-1" />
                        <span className="text-[11px] leading-tight block">
                          ยังไม่มีรูป QR
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1 space-y-3 text-center sm:text-left">
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-slate-800">
                        {settings.customPromptPayQrImage
                          ? '✅ บันทึกรูป QR พร้อมเพย์ของร้านเรียบร้อยแล้ว'
                          : 'เลือกไฟล์รูปภาพ QR Code พร้อมเพย์ของร้าน'}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        รองรับไฟล์รูปภาพ PNG, JPG หรือภาพถ่ายป้ายตั้งโต๊ะของธนาคาร
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <label className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold cursor-pointer transition flex items-center gap-1.5 shadow-xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isUploading ? 'กำลังอัปโหลด...' : 'อัปโหลดรูป QR ของร้าน'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleQrImageUpload}
                          className="hidden"
                        />
                      </label>

                      {settings.customPromptPayQrImage && (
                        <button
                          type="button"
                          onClick={handleRemoveQrImage}
                          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-300 text-xs font-semibold cursor-pointer transition"
                        >
                          ลบรูปนี้
                        </button>
                      )}
                    </div>

                    {/* QR Display Info */}
                    <div className="pt-2 text-xs font-semibold text-emerald-700 flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        ระบบจะใช้รูปป้าย QR นี้แสดงผลออกทั้ง 2 ด้าน (จอพนักงาน และ จอหลังเครื่อง POS)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instructions / Tips */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-orange-600" />
                  <span>คำแนะนำสำหรับการใช้งานระบบ 2 หน้าจอ</span>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-[11px] leading-relaxed">
                  <li>
                    เครื่อง POS จะแสดงรายการอาหารที่กดแบบเรียลไทม์ให้ลูกค้าเห็นทันทีที่จอหลัง
                  </li>
                  <li>
                    เมื่อกดปุ่ม <b>คิดเงิน (Checkout)</b> จอหลังจะสลับไปหน้าแสดง QR พร้อมเพย์ขนาดใหญ่ให้ลูกค้าสแกนได้ทันที
                  </li>
                  <li>
                    เมื่อชำระเงินสำเร็จ จอหลังจะขึ้นข้อความขอบคุณและแสดงเงินทอนให้ลูกค้าอย่างชัดเจน
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            /* Live Preview Tab */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>หน้าจอจำลองแบบย่อของจอหลัง (สิ่งที่ลูกค้าเห็นในขณะนี้):</span>
                <span className="font-semibold text-orange-600">สัดส่วน 16:9</span>
              </div>
              <div className="w-full aspect-video border-2 border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
                <div className="w-[1024px] h-[576px] origin-top-left scale-[0.6] sm:scale-[0.58] pointer-events-none">
                  <CustomerFacingDisplay initialState={previewState} isEmbeddedPreview={true} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>

          <button
            onClick={handleOpenCustomerWindow}
            className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>เปิดหน้าต่างจอหลังทันที</span>
          </button>
        </div>
      </div>
    </div>
  );
};
