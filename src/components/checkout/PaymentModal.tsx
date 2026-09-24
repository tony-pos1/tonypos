import React, { useState, useEffect } from 'react';
import { AppSettings, Order, PaymentMethod, PaymentRecord } from '../../types';
import { useI18n } from '../../i18n';
import { sound } from '../../utils/sound';
import { customerDisplaySync } from '../../utils/customerDisplaySync';
import { bluetoothPrinter, PrinterStatus } from '../../utils/bluetoothPrinter';
import {
  X,
  Banknote,
  QrCode,
  CreditCard,
  Wallet,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  Monitor,
  Printer,
  Bluetooth,
} from 'lucide-react';

interface PaymentModalProps {
  order: Order;
  settings: AppSettings;
  onClose: () => void;
  onCompletePayment: (paymentRecords: PaymentRecord[]) => Promise<void>;
  onUpdateSettings?: (changes: Partial<AppSettings>) => Promise<void>;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  order,
  settings,
  onClose,
  onCompletePayment,
  onUpdateSettings,
}) => {
  const { t, language } = useI18n();
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [cashTendered, setCashTendered] = useState<number>(order.netTotal);
  const [cardRef, setCardRef] = useState('');
  const [walletRef, setWalletRef] = useState('');
  const [copiedPromptPay, setCopiedPromptPay] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingQr, setIsUploadingQr] = useState(false);
  const [printerStatus, setPrinterStatus] = useState<PrinterStatus>(bluetoothPrinter.getStatus());
  const [isPrintingReceipt, setIsPrintingReceipt] = useState(false);
  const [printSuccessFeedback, setPrintSuccessFeedback] = useState(false);

  useEffect(() => {
    return bluetoothPrinter.subscribe((status) => {
      setPrinterStatus(status);
    });
  }, []);

  const handlePrintReceipt = async () => {
    sound.playTap();
    setIsPrintingReceipt(true);
    try {
      if (printerStatus.isConnected) {
        await bluetoothPrinter.printReceipt(order, settings);
        setPrintSuccessFeedback(true);
        setTimeout(() => setPrintSuccessFeedback(false), 3000);
      } else {
        window.print();
        setPrintSuccessFeedback(true);
        setTimeout(() => setPrintSuccessFeedback(false), 3000);
      }
    } catch (err: any) {
      console.warn('Bluetooth print failed, attempting browser print:', err);
      window.print();
    } finally {
      setIsPrintingReceipt(false);
    }
  };

  const changeDue = Math.max(0, cashTendered - order.netTotal);
  const isCashInsufficient = method === 'cash' && cashTendered < order.netTotal;

  // The QR image is strictly the shop's own uploaded QR image (no dynamic generation)
  const activeQrImage = settings.customPromptPayQrImage;

  // Broadcast state to Customer Screen 2 in real time!
  useEffect(() => {
    customerDisplaySync.sendState({
      order,
      settings,
      isPaymentOpen: true,
      paymentMethod: method,
      qrDataUrl: activeQrImage,
      customQrImageUrl: settings.customPromptPayQrImage,
      cashTendered: method === 'cash' ? cashTendered : undefined,
      changeDue: method === 'cash' ? changeDue : undefined,
      timestamp: Date.now(),
    });

    return () => {
      // Revert payment screen when modal closes
      customerDisplaySync.sendState({
        order,
        settings,
        isPaymentOpen: false,
        paymentMethod: 'cash',
        timestamp: Date.now(),
      });
    };
  }, [method, activeQrImage, cashTendered, changeDue, order, settings]);

  // Quick cash buttons
  const cashDenominations = [20, 50, 100, 500, 1000];

  const handleAddCash = (amount: number) => {
    sound.playTap();
    setCashTendered((prev) => prev + amount);
  };

  const handleSetExact = () => {
    sound.playTap();
    setCashTendered(order.netTotal);
  };

  const handleCopyPromptPay = () => {
    if (!settings.promptPayId) return;
    navigator.clipboard.writeText(settings.promptPayId);
    setCopiedPromptPay(true);
    sound.playTap();
    setTimeout(() => setCopiedPromptPay(false), 2000);
  };

  const handleUploadCustomQr = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น (PNG, JPG)');
      return;
    }

    setIsUploadingQr(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        if (onUpdateSettings) {
          await onUpdateSettings({
            customPromptPayQrImage: base64,
            useCustomPromptPayQr: true,
          });
        }
        sound.playNotificationChime();
      } catch (err) {
        console.error('Failed to save QR image', err);
      } finally {
        setIsUploadingQr(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitPayment = async () => {
    if (isSubmitting) return;
    if (isCashInsufficient) return;

    setIsSubmitting(true);
    sound.playNotificationChime();

    const paymentRecord: PaymentRecord = {
      id: `pay_${Date.now()}`,
      method,
      amount: order.netTotal,
      receivedAmount: method === 'cash' ? cashTendered : order.netTotal,
      changeAmount: method === 'cash' ? changeDue : 0,
      timestamp: Date.now(),
      reference:
        method === 'credit_card'
          ? cardRef
          : method === 'digital_wallet'
          ? walletRef
          : undefined,
    };

    try {
      // Notify customer screen of success!
      customerDisplaySync.sendState({
        order,
        settings,
        isPaymentOpen: false,
        paymentMethod: method,
        isPaidSuccess: true,
        paidOrder: { ...order, netTotal: order.netTotal },
        changeDue: method === 'cash' ? changeDue : 0,
        timestamp: Date.now(),
      });

      // Reset success message on CFD after 6 seconds
      setTimeout(() => {
        customerDisplaySync.sendState({
          order: null,
          settings,
          isPaymentOpen: false,
          paymentMethod: 'cash',
          isPaidSuccess: false,
          timestamp: Date.now(),
        });
      }, 6000);

      await onCompletePayment([paymentRecord]);
    } catch (err) {
      console.error('Failed to complete payment', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-3 sm:p-5 backdrop-blur-xs select-none">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full max-h-[95vh] flex flex-col shadow-2xl text-slate-900 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Banknote className="w-5 h-5 text-orange-600" />
              <span>{t('paymentTitle')}</span>
              {order.queueNumber && (
                <span className="px-2 py-0.5 rounded-lg bg-orange-500 text-white text-xs font-black">
                  Q#{order.queueNumber}
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {order.tableName || order.orderNumber}
            </p>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-500">{t('netTotal')}</div>
            <div className="text-xl font-black text-orange-600">
              ฿{order.netTotal.toLocaleString()}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 ml-3 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Method Selector Tabs */}
        <div className="grid grid-cols-4 p-2 bg-slate-100 border-b border-slate-200 gap-1.5 shrink-0">
          <button
            onClick={() => {
              sound.playTap();
              setMethod('cash');
            }}
            className={`py-2 px-1 text-xs font-bold rounded-xl transition flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
              method === 'cash'
                ? 'bg-white text-orange-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Banknote className="w-4 h-4" />
            <span>{language === 'th' ? 'เงินสด' : 'Cash'}</span>
          </button>

          <button
            onClick={() => {
              sound.playTap();
              setMethod('promptpay');
            }}
            className={`py-2 px-1 text-xs font-bold rounded-xl transition flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
              method === 'promptpay'
                ? 'bg-white text-orange-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>{language === 'th' ? 'พร้อมเพย์' : 'PromptPay'}</span>
          </button>

          <button
            onClick={() => {
              sound.playTap();
              setMethod('credit_card');
            }}
            className={`py-2 px-1 text-xs font-bold rounded-xl transition flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
              method === 'credit_card'
                ? 'bg-white text-orange-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>{language === 'th' ? 'บัตร EDC' : 'Card'}</span>
          </button>

          <button
            onClick={() => {
              sound.playTap();
              setMethod('digital_wallet');
            }}
            className={`py-2 px-1 text-xs font-bold rounded-xl transition flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
              method === 'digital_wallet'
                ? 'bg-white text-orange-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>{language === 'th' ? 'วอลเล็ท' : 'Wallet'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto">
          {/* METHOD 1: CASH */}
          {method === 'cash' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  {t('cashReceived')}:
                </label>
                <button
                  type="button"
                  onClick={handleSetExact}
                  className="text-xs font-bold text-orange-600 hover:underline cursor-pointer"
                >
                  {t('exactAmount')} (฿{order.netTotal.toLocaleString()})
                </button>
              </div>

              {/* Cash Input */}
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
                  ฿
                </span>
                <input
                  type="number"
                  min={0}
                  value={cashTendered || ''}
                  onChange={(e) => setCashTendered(Number(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-2xl font-black text-orange-600 focus:outline-none focus:border-orange-500 shadow-inner"
                />
              </div>

              {/* Quick Cash Denomination Buttons */}
              <div className="space-y-1.5">
                <div className="text-[11px] text-slate-500 font-semibold">
                  กดเพิ่มธนบัตร (Quick Add Cash):
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {cashDenominations.map((denom) => (
                    <button
                      key={denom}
                      type="button"
                      onClick={() => handleAddCash(denom)}
                      className="py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-black text-slate-800 transition cursor-pointer shadow-xs"
                    >
                      +฿{denom}
                    </button>
                  ))}
                </div>
              </div>

              {/* Change calculation display */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500">{t('changeDue')}</div>
                  <div
                    className={`text-2xl font-black ${
                      isCashInsufficient ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    ฿{changeDue.toLocaleString()}
                  </div>
                </div>

                {isCashInsufficient && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{t('insufficientAmount')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* METHOD 2: PROMPTPAY QR (Strictly Shop's Own QR Image) */}
          {method === 'promptpay' && (
            <div className="flex flex-col items-center text-center space-y-3">
              {/* Header and Upload/Change QR Button */}
              <div className="w-full flex items-center justify-between px-2">
                <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-orange-600" />
                  <span>รูปป้าย QR พร้อมเพย์ของร้าน</span>
                </div>

                <label className="text-xs text-orange-600 font-bold hover:underline cursor-pointer flex items-center gap-1 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200 shadow-2xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploadingQr ? 'กำลังบันทึก...' : 'เปลี่ยนรูป QR ร้าน'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadCustomQr}
                    className="hidden"
                  />
                </label>
              </div>

              {/* QR Code Container */}
              <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-md flex items-center justify-center max-w-[280px] w-full">
                {activeQrImage ? (
                  <img
                    src={activeQrImage}
                    alt="Shop PromptPay QR"
                    className="w-56 h-56 object-contain rounded-xl"
                  />
                ) : (
                  <div className="w-56 h-56 flex flex-col items-center justify-center text-slate-400 text-xs p-4">
                    <QrCode className="w-12 h-12 mb-2 text-slate-300" />
                    <span className="font-bold text-slate-700">ยังไม่มีรูป QR ของร้าน</span>
                    <span className="text-[11px] text-slate-500 mt-1">
                      กรุณากดปุ่มด้านบนเพื่ออัปโหลดรูปป้าย QR ของร้าน
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="text-sm font-bold text-slate-900">
                  {settings.promptPayName || settings.shopName_th}
                </div>
                {settings.promptPayId && (
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
                    <span>พร้อมเพย์: {settings.promptPayId}</span>
                    <button
                      type="button"
                      onClick={handleCopyPromptPay}
                      className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer border border-slate-200"
                      title="Copy"
                    >
                      {copiedPromptPay ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                )}
                <div className="text-xs font-black text-orange-600 pt-1">
                  ยอดที่ต้องชำระ: ฿{order.netTotal.toLocaleString()}
                </div>

                {/* Secondary Screen indication */}
                <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-slate-600 font-semibold bg-orange-50/80 py-1.5 px-3 rounded-xl border border-orange-200/60">
                  <Monitor className="w-3.5 h-3.5 text-orange-600" />
                  <span>รูป QR ของร้านแสดงบนจอหลังให้ลูกค้าสแกนได้ทันที</span>
                </div>
              </div>
            </div>
          )}

          {/* METHOD 3: CREDIT / DEBIT CARD */}
          {method === 'credit_card' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-600 leading-relaxed">
                บันทึกการชำระผ่านเครื่องรูดบัตร (EDC / Credit Card Reader):
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('cardRefPlaceholder')}
                </label>
                <input
                  type="text"
                  value={cardRef}
                  onChange={(e) => setCardRef(e.target.value)}
                  placeholder="เช่น รูดบัตร KBank 4251, อนุมัติ 88910"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-600">{t('netTotal')}:</span>
                <span className="text-xl font-black text-slate-900">
                  ฿{order.netTotal.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* METHOD 4: DIGITAL WALLET (TrueMoney / ShopeePay) */}
          {method === 'digital_wallet' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-600 leading-relaxed">
                บันทึกการชำระผ่าน TrueMoney / ShopeePay / Rabbit LINE Pay:
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('walletRefPlaceholder')}
                </label>
                <input
                  type="text"
                  value={walletRef}
                  onChange={(e) => setWalletRef(e.target.value)}
                  placeholder="เช่น รหัสธุรกรรม TrueMoney #TM-99214"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-600">{t('netTotal')}:</span>
                <span className="text-xl font-black text-slate-900">
                  ฿{order.netTotal.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Submit & Print Receipt Buttons */}
        <div className="px-5 py-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition cursor-pointer min-h-[42px]"
          >
            {t('cancel')}
          </button>

          <div className="flex items-center gap-2">
            {/* Print Receipt Button */}
            <button
              type="button"
              disabled={isPrintingReceipt}
              onClick={handlePrintReceipt}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs min-h-[42px] border ${
                printSuccessFeedback
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-white hover:bg-orange-50 border-slate-300 hover:border-orange-300 text-slate-800 hover:text-orange-700'
              }`}
              title="พิมพ์ใบเสร็จให้ลูกค้า (มีรูป Logo, รายการอาหาร, QR Code สำหรับสแกนจ่ายเงิน และคำขอบคุณ)"
            >
              <Printer className="w-4 h-4 text-orange-600" />
              <span>
                {isPrintingReceipt
                  ? (language === 'th' ? 'กำลังพิมพ์...' : 'Printing...')
                  : printSuccessFeedback
                  ? (language === 'th' ? 'พิมพ์สำเร็จ!' : 'Printed!')
                  : (language === 'th' ? 'พิมพ์ใบเสร็จ' : 'Print Receipt')}
              </span>
            </button>

            {/* Confirm Payment Button */}
            <button
              type="button"
              disabled={isSubmitting || isCashInsufficient}
              onClick={handleSubmitPayment}
              className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white text-xs font-black transition flex items-center gap-2 shadow-md cursor-pointer min-h-[42px]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? (language === 'th' ? 'กำลังบันทึก...' : 'Processing...')
                  : `${language === 'th' ? 'ยืนยันรับชำระ' : 'Confirm Payment'} (฿${order.netTotal.toLocaleString()})`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Hidden Thermal Receipt Container for window.print() */}
      <div id="printable-receipt" className="hidden print:block text-black font-mono text-xs p-2 bg-white">
        {/* 1. TOP: SHOP LOGO */}
        {settings.logoUrl && (
          <div className="flex justify-center mb-2">
            <img
              src={settings.logoUrl}
              alt="Shop Logo"
              className="max-h-20 max-w-[180px] object-contain"
            />
          </div>
        )}

        {/* 2. UNDER LOGO: SHOP NAME */}
        <div className="text-center pb-2 border-b border-dashed border-black">
          <div className="text-base font-bold">
            {language === 'th' ? settings.shopName_th : settings.shopName_en}
          </div>
          {settings.shopAddress_th && (
            <div className="text-[11px] text-gray-700">{settings.shopAddress_th}</div>
          )}
          {settings.shopPhone && (
            <div className="text-[11px] text-gray-700">โทร: {settings.shopPhone}</div>
          )}
          {settings.shopTaxId && (
            <div className="text-[11px] text-gray-700">เลขประจำตัวผู้เสียภาษี: {settings.shopTaxId}</div>
          )}
        </div>

        {/* Meta Info */}
        <div className="py-2 border-b border-dashed border-black space-y-0.5 text-[11px]">
          <div className="flex justify-between">
            <span>ใบเสร็จ: {order.orderNumber}</span>
            {order.queueNumber && <span className="font-bold">คิว #{order.queueNumber}</span>}
          </div>
          <div className="flex justify-between">
            <span>{new Date(order.createdAt).toLocaleString('th-TH')}</span>
            <span>{order.tableName ? `โต๊ะ: ${order.tableName}` : (order.orderType === 'takeaway' ? 'สั่งกลับบ้าน' : '')}</span>
          </div>
        </div>

        {/* 3. ITEMIZED FOODS & PRICES */}
        <div className="py-2 border-b border-dashed border-black space-y-1">
          <div className="flex justify-between font-bold text-[11px] pb-1">
            <span>รายการ</span>
            <span>จำนวนเงิน</span>
          </div>
          {order.lines.filter((l) => l.status !== 'voided').map((line) => (
            <div key={line.id} className="space-y-0.5">
              <div className="flex justify-between">
                <span>{line.quantity}x {line.name_th || line.name_en}</span>
                <span>฿{(line.unitPrice * line.quantity).toFixed(2)}</span>
              </div>
              {line.selectedOptions?.map((opt) => (
                <div key={opt.optionId} className="pl-3 text-[10px] text-gray-600 flex justify-between">
                  <span>+ {opt.optionName_th}</span>
                  {opt.priceDelta > 0 && <span>+฿{opt.priceDelta}</span>}
                </div>
              ))}
              {line.modifiers?.map((mod, i) => (
                <div key={i} className="pl-3 text-[10px] text-gray-600">* {mod}</div>
              ))}
            </div>
          ))}
        </div>

        {/* Financials */}
        <div className="py-2 border-b border-dashed border-black space-y-0.5 text-[11px]">
          <div className="flex justify-between">
            <span>รวมรายการ:</span>
            <span>฿{order.subtotal.toFixed(2)}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between">
              <span>ส่วนลด:</span>
              <span>-฿{order.discountAmount.toFixed(2)}</span>
            </div>
          )}
          {order.serviceChargeAmount > 0 && (
            <div className="flex justify-between">
              <span>ค่าบริการ ({order.serviceChargeRate}%):</span>
              <span>+฿{order.serviceChargeAmount.toFixed(2)}</span>
            </div>
          )}
          {order.vatAmount > 0 && (
            <div className="flex justify-between">
              <span>ภาษี ({order.vatRate}%):</span>
              <span>+฿{order.vatAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-black pt-1 border-t border-black">
            <span>ยอดสุทธิ:</span>
            <span>฿{order.netTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* 4. BOTTOM QR: SHOP'S PROMPTPAY QR */}
        {settings.customPromptPayQrImage && (
          <div className="py-3 text-center border-b border-dashed border-black space-y-1">
            <div className="font-bold text-[11px]">สแกน QR เพื่อชำระเงิน (PromptPay)</div>
            <div className="flex justify-center py-1">
              <img
                src={settings.customPromptPayQrImage}
                alt="PromptPay QR"
                className="w-36 h-36 object-contain"
              />
            </div>
            <div className="font-bold text-xs">ยอดชำระ: ฿{order.netTotal.toFixed(2)}</div>
            {settings.promptPayId && (
              <div className="text-[10px] text-gray-600">พร้อมเพย์: {settings.promptPayId}</div>
            )}
          </div>
        )}

        {/* 5. VERY BOTTOM: CUSTOM THANK YOU NOTE */}
        <div className="text-center pt-3 text-[11px] text-gray-700 space-y-1">
          <div>{settings.receiptFooter_th || settings.receiptFooter_en || 'ขอบคุณที่มาอุดหนุนค่ะ'}</div>
          <div className="text-[9px] text-gray-500">POWERED BY THAI RESTAURANT POS</div>
        </div>
      </div>
    </div>
  );
};
