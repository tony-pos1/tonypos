import React, { useState, useEffect } from 'react';
import { CustomerDisplayState, customerDisplaySync } from '../../utils/customerDisplaySync';
import { AppSettings } from '../../types';
import { defaultSettings } from '../../db/seedData';
import {
  Store,
  CheckCircle2,
  QrCode,
  Banknote,
  CreditCard,
  Maximize2,
  Minimize2,
  Clock,
  UtensilsCrossed,
  Receipt,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';

interface CustomerFacingDisplayProps {
  initialState?: CustomerDisplayState | null;
  isEmbeddedPreview?: boolean;
}

export const CustomerFacingDisplay: React.FC<CustomerFacingDisplayProps> = ({
  initialState,
  isEmbeddedPreview = false,
}) => {
  const [displayState, setDisplayState] = useState<CustomerDisplayState>(() => {
    return (
      initialState ||
      customerDisplaySync.getState() || {
        order: null,
        settings: defaultSettings,
        isPaymentOpen: false,
        paymentMethod: 'promptpay',
        timestamp: Date.now(),
      }
    );
  });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Notify main screen on mount that secondary customer display is active
  useEffect(() => {
    customerDisplaySync.notifyCustomerScreenReady();
    const interval = setInterval(() => {
      customerDisplaySync.notifyCustomerScreenReady();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen to cross-window or local updates
  useEffect(() => {
    if (initialState) {
      setDisplayState(initialState);
      return;
    }

    const unsubscribe = customerDisplaySync.subscribe((newState) => {
      setDisplayState(newState);
    });

    return () => {
      unsubscribe();
    };
  }, [initialState]);

  // Fullscreen toggle for secondary monitor
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const order = displayState.order;
  const settings: AppSettings = displayState.settings || defaultSettings;
  const isPaidSuccess = displayState.isPaidSuccess;
  const isPaymentOpen = displayState.isPaymentOpen;
  const paymentMethod = displayState.paymentMethod || 'promptpay';

  const activeLines = order?.lines?.filter((l) => l.status !== 'voided') || [];
  const hasItems = activeLines.length > 0;
  const totalItemCount = activeLines.reduce((sum, l) => sum + l.quantity, 0);

  // STRICT REQUIREMENT: The QR code is EXCLUSIVELY the shop's own uploaded QR image.
  // No dynamically generated QR codes are ever created or used.
  const shopQrImage =
    settings.customPromptPayQrImage ||
    displayState.customQrImageUrl ||
    displayState.qrDataUrl ||
    defaultSettings.customPromptPayQrImage;

  const timeFormatted = currentTime.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const dateFormatted = currentTime.toLocaleDateString('th-TH', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="h-screen w-screen bg-slate-100 text-slate-800 flex flex-col overflow-hidden font-sans select-none relative">
      {/* ============================================================ */}
      {/* TOP HEADER BAR (Hardware Dual-Screen Retail POS Layout)      */}
      {/* ============================================================ */}
      <header className="h-20 bg-white border-b border-slate-200 px-6 sm:px-8 flex items-center justify-between shrink-0 shadow-xs z-20">
        {/* Left: Shop Logo, Name & Active Table/Queue */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center p-2 shrink-0 shadow-2xs">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <Store className="w-7 h-7 text-orange-600" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-tight">
                {settings.shopName_th || 'ร้านครัวไทยอารีย์'}
              </h1>
              {order && (
                <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 text-xs font-black">
                  {order.orderType === 'takeaway'
                    ? 'สั่งกลับบ้าน (Takeaway)'
                    : `โต๊ะ ${order.tableName || 'T1'}`}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {settings.shopName_en || 'Thai Restaurant POS'}
              {order?.queueNumber ? ` • คิวที่ #${order.queueNumber}` : ''}
            </p>
          </div>
        </div>

        {/* Right: Live Digital Clock & GIANT ORANGE TOTAL BADGE (from POS photo) */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-slate-700 tracking-wider flex items-center gap-1.5 justify-end">
              <Clock className="w-3.5 h-3.5 text-orange-600" />
              <span>{timeFormatted}</span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">{dateFormatted}</div>
          </div>

          {/* DUAL SCREEN SIGNATURE: Solid Orange Banner with Giant Total Amount */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-2 rounded-2xl shadow-md text-white flex flex-col items-end min-w-[170px] sm:min-w-[210px]">
            <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-orange-100">
              ยอดรวมสุทธิ (TOTAL)
            </span>
            <div className="text-2xl sm:text-3xl font-black tracking-tight leading-none mt-0.5">
              ฿{order ? order.netTotal.toLocaleString() : '0.00'}
            </div>
          </div>

          {!isEmbeddedPreview && (
            <button
              onClick={toggleFullscreen}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer border border-slate-200 shadow-2xs"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </header>

      {/* ============================================================ */}
      {/* MAIN VIEWPORT: DUAL SCREEN PRESENTATION                      */}
      {/* ============================================================ */}
      <main className="flex-1 flex overflow-hidden p-4 sm:p-6 gap-5 sm:gap-6">
        {/* ============================================================ */}
        {/* CASE 1: PAYMENT SUCCESS CELEBRATION                          */}
        {/* ============================================================ */}
        {isPaidSuccess ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center bg-white border border-emerald-300 rounded-3xl p-8 shadow-xl animate-in zoom-in-95 duration-200">
            <div className="w-24 h-24 rounded-full bg-emerald-50 border-4 border-emerald-400 flex items-center justify-center text-emerald-500 mb-5 shadow-lg shadow-emerald-500/10 animate-bounce">
              <CheckCircle2 className="w-14 h-14" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2">
              ชำระเงินเรียบร้อยแล้ว
            </h2>
            <p className="text-base sm:text-lg text-emerald-600 font-bold mb-6">
              Payment Successful • ขอบคุณที่มาอุดหนุนค่ะ
            </p>

            {displayState.paidOrder && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 max-w-md w-full space-y-3 mb-6 shadow-xs">
                <div className="flex justify-between text-slate-600 text-sm">
                  <span>ยอดชำระสุทธิ (Net Total):</span>
                  <span className="font-bold text-slate-900">
                    ฿{displayState.paidOrder.netTotal.toLocaleString()}
                  </span>
                </div>

                {displayState.changeDue !== undefined && displayState.changeDue > 0 && (
                  <div className="flex justify-between items-center text-base pt-3 border-t border-slate-200">
                    <span className="text-emerald-700 font-bold">เงินทอน (Change Due):</span>
                    <span className="text-3xl font-black text-emerald-600">
                      ฿{displayState.changeDue.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )}

            <p className="text-sm text-slate-500 max-w-sm">
              {settings.receiptFooter_th || 'ขอให้มีความสุขกับมื้ออาหาร ยินดีให้บริการค่ะ'}
            </p>
          </div>
        ) : isPaymentOpen ? (
          /* ============================================================ */
          /* CASE 2: CHECKOUT IN PROGRESS (SPOTLIGHT SCAN QR IMMEDIATELY) */
          /* When cashier taps "คิดเงิน / ชำระเงิน"                         */
          /* ============================================================ */
          <div className="flex-1 flex flex-col lg:flex-row gap-5 sm:gap-6 overflow-hidden animate-in fade-in-50 duration-200">
            {/* LEFT / CENTER: GIANT PROMPTPAY QR SPOTLIGHT (or Cash / Card) */}
            <div className="flex-1 bg-white border-2 border-orange-500 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-between text-center shadow-lg ring-4 ring-orange-500/10 overflow-y-auto">
              {/* Header Badge */}
              <div className="w-full">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#002D5A] text-white text-xs sm:text-sm font-bold tracking-wider shadow-sm">
                  <QrCode className="w-4 h-4 text-[#38bdf8]" />
                  <span>THAI QR PAYMENT • พร้อมเพย์</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-3">
                  {paymentMethod === 'promptpay'
                    ? 'กรุณาสแกน QR Code เพื่อชำระเงิน'
                    : paymentMethod === 'cash'
                    ? 'ชำระด้วยเงินสด (Cash Payment)'
                    : 'ชำระผ่านเครื่องรูดบัตร (Card EDC)'}
                </h2>

                <div className="mt-2 inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-orange-50 border border-orange-200">
                  <span className="text-xs font-bold text-slate-600">ยอดที่ต้องชำระ:</span>
                  <span className="text-2xl sm:text-3xl font-black text-orange-600">
                    ฿{order ? order.netTotal.toLocaleString() : '0.00'}
                  </span>
                </div>
              </div>

              {/* Main Content Area based on Method */}
              {paymentMethod === 'promptpay' ? (
                /* QR Image Card */
                <div className="my-4 flex flex-col items-center">
                  <div className="p-3.5 bg-white border-2 border-slate-300 rounded-3xl shadow-md flex items-center justify-center">
                    {shopQrImage ? (
                      <img
                        src={shopQrImage}
                        alt="Shop PromptPay QR"
                        className="w-64 h-64 sm:w-80 sm:h-80 object-contain rounded-2xl"
                      />
                    ) : (
                      <div className="w-64 h-64 sm:w-80 sm:h-80 flex flex-col items-center justify-center text-slate-400 p-4">
                        <QrCode className="w-16 h-16 mb-2 text-slate-300" />
                        <span className="font-bold text-slate-700 text-sm">
                          ยังไม่มีรูป QR ของร้าน
                        </span>
                        <span className="text-xs text-slate-400 mt-1">
                          กรุณาอัปโหลดรูปป้าย QR ของร้านที่จอพนักงาน
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                    <Smartphone className="w-4 h-4 text-orange-600" />
                    <span>เปิดแอปธนาคารบนมือถือ แล้วสแกนรูปป้าย QR ได้ทันที</span>
                  </div>
                </div>
              ) : paymentMethod === 'cash' ? (
                <div className="my-6 max-w-md w-full space-y-4">
                  <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5">
                    <div className="text-xs text-slate-500">รับเงินสดมา</div>
                    <div className="text-3xl font-black text-slate-900 mt-1">
                      ฿{displayState.cashTendered ? displayState.cashTendered.toLocaleString() : '-'}
                    </div>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-5">
                    <div className="text-xs text-emerald-700 font-bold">เงินทอน</div>
                    <div className="text-4xl font-black text-emerald-600 mt-1">
                      ฿{displayState.changeDue ? displayState.changeDue.toLocaleString() : '0.00'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="my-8 max-w-md w-full bg-sky-50 border border-sky-300 rounded-2xl p-6">
                  <CreditCard className="w-12 h-12 text-sky-600 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-800">
                    กรุณาแตะหรือเสียบบัตรที่เครื่องรูดบัตร (EDC)
                  </p>
                </div>
              )}

              {/* Merchant Details Footer */}
              <div className="w-full max-w-md bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1">
                <div className="text-xs text-slate-500 font-medium">ชื่อบัญชีร้านค้า:</div>
                <div className="text-sm font-black text-slate-900 truncate">
                  {settings.promptPayName || settings.shopName_th}
                </div>
                {settings.promptPayId && (
                  <div className="text-xs text-slate-600 font-mono font-bold">
                    พร้อมเพย์: {settings.promptPayId}
                  </div>
                )}
                <div className="pt-1 flex items-center justify-center gap-1 text-[10px] text-emerald-700 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>รูปป้าย QR ของร้านโดยตรง • ปลอดภัย 100%</span>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE: COMPACT ORDER SUMMARY (Allows customer to verify items) */}
            <div className="w-full lg:w-[360px] bg-white border border-slate-200 rounded-3xl flex flex-col overflow-hidden shadow-sm shrink-0">
              <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-orange-600" />
                  <span className="text-xs font-black text-slate-800">
                    รายการที่สั่ง ({totalItemCount} รายการ)
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-bold">สรุปยอด</span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-100">
                {activeLines.map((line, idx) => (
                  <div key={line.id || idx} className="pt-2 first:pt-0 flex justify-between gap-3 text-xs">
                    <div className="flex-1">
                      <span className="font-bold text-slate-800">
                        {line.quantity}x {line.name_th}
                      </span>
                      {line.modifiers && line.modifiers.length > 0 && (
                        <p className="text-[10px] text-amber-700">({line.modifiers.join(', ')})</p>
                      )}
                    </div>
                    <span className="font-bold text-slate-900 whitespace-nowrap">
                      ฿{(line.unitPrice * line.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-slate-50/80 border-t border-slate-200 space-y-1.5 text-xs text-slate-600 shrink-0">
                <div className="flex justify-between">
                  <span>ยอดรวม (Subtotal):</span>
                  <span className="font-semibold text-slate-800">
                    ฿{order ? order.subtotal.toLocaleString() : '0'}
                  </span>
                </div>
                {order && order.discountAmount > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>ส่วนลด (Discount):</span>
                    <span>-฿{order.discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="text-xs font-black text-slate-900">ยอดสุทธิ:</span>
                  <span className="text-xl font-black text-orange-600">
                    ฿{order ? order.netTotal.toLocaleString() : '0'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ============================================================ */
          /* CASE 3: NORMAL LIVE ORDERING MODE (MIRROR TOUCHSCREEN)        */
          /* As staff presses menu items, items & total show up live!     */
          /* ============================================================ */
          <>
            {/* COLUMN 1 (LEFT 55-60%): LIVE ORDER ITEMS & BREAKDOWN */}
            <div className="flex-1 bg-white border border-slate-200 rounded-3xl flex flex-col overflow-hidden shadow-sm">
              {/* Card Header */}
              <div className="p-4 px-6 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <Receipt className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-black text-slate-800">
                    รายการอาหาร (Order Items)
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold">
                    {totalItemCount} รายการ
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-500">ราคา (Price)</span>
              </div>

              {/* Items List or Welcome State */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5">
                {hasItems ? (
                  <div className="space-y-3 divide-y divide-slate-100">
                    {activeLines.map((line, idx) => (
                      <div
                        key={line.id || idx}
                        className="pt-3 first:pt-0 flex items-start justify-between gap-4"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2.5">
                            <span className="w-7 h-7 rounded-xl bg-orange-50 text-orange-600 border border-orange-200 text-xs font-black flex items-center justify-center shrink-0">
                              {line.quantity}
                            </span>
                            <span className="text-sm font-bold text-slate-900 leading-snug">
                              {line.name_th}
                            </span>
                          </div>
                          {line.name_en && (
                            <p className="text-xs text-slate-400 pl-9 font-medium">
                              {line.name_en}
                            </p>
                          )}

                          {/* Modifiers & Options */}
                          {line.selectedOptions && line.selectedOptions.length > 0 && (
                            <div className="pl-9 flex flex-wrap gap-1 mt-1">
                              {line.selectedOptions.map((opt) => (
                                <span
                                  key={opt.optionId}
                                  className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium"
                                >
                                  + {opt.optionName_th}
                                </span>
                              ))}
                            </div>
                          )}

                          {line.modifiers && line.modifiers.length > 0 && (
                            <div className="pl-9 flex flex-wrap gap-1 mt-0.5">
                              {line.modifiers.map((m, mIdx) => (
                                <span
                                  key={mIdx}
                                  className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-medium"
                                >
                                  {m}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="text-sm font-black text-slate-900 whitespace-nowrap text-right pt-0.5">
                          ฿{(line.unitPrice * line.quantity).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Idle Welcome Screen on Left Side */
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                    <div className="w-20 h-20 rounded-3xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-500 mb-4 shadow-xs">
                      <UtensilsCrossed className="w-10 h-10" />
                    </div>
                    <h3 className="text-lg font-black text-slate-800 mb-1">
                      {settings.shopName_th || 'ยินดีต้อนรับสู่ร้านอาหาร'}
                    </h3>
                    <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                      {settings.customerScreenWelcome_th ||
                        'กำลังเลือกรายการอาหาร พนักงานกำลังพร้อมรับออเดอร์ของท่านค่ะ'}
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom Bill Summary in Left Card */}
              {hasItems && order && (
                <div className="p-4 px-6 bg-slate-50/80 border-t border-slate-200 space-y-1.5 text-xs text-slate-600 shrink-0">
                  <div className="flex justify-between">
                    <span>ยอดรวม (Subtotal):</span>
                    <span className="font-semibold text-slate-800">
                      ฿{order.subtotal.toLocaleString()}
                    </span>
                  </div>

                  {order.discountAmount > 0 && (
                    <div className="flex justify-between text-rose-600 font-bold">
                      <span>ส่วนลด (Discount):</span>
                      <span>-฿{order.discountAmount.toLocaleString()}</span>
                    </div>
                  )}

                  {settings.vatEnabled && (
                    <div className="flex justify-between text-slate-500">
                      <span>ภาษีมูลค่าเพิ่ม (VAT {settings.vatRate}%):</span>
                      <span>฿{order.vatAmount.toLocaleString()}</span>
                    </div>
                  )}

                  {settings.serviceChargeEnabled && (
                    <div className="flex justify-between text-slate-500">
                      <span>ค่าบริการ (Service {settings.serviceChargeRate}%):</span>
                      <span>฿{order.serviceChargeAmount.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200 flex items-baseline justify-between text-slate-900">
                    <span className="text-sm font-black">ยอดสุทธิ (Net Total):</span>
                    <span className="text-2xl font-black text-orange-600">
                      ฿{order.netTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* COLUMN 2 (RIGHT 40-45%): SHOP'S PROMPTPAY QR STAND */}
            <div className="w-full lg:w-[420px] flex flex-col gap-4 shrink-0">
              <div className="flex-1 bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 flex flex-col items-center justify-between text-center shadow-sm">
                {/* Thai QR Payment Banner Header */}
                <div className="w-full">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#002D5A] text-white text-xs font-bold tracking-wider shadow-xs">
                    <QrCode className="w-4 h-4 text-[#38bdf8]" />
                    <span>THAI QR PAYMENT • พร้อมเพย์</span>
                  </div>

                  <h3 className="text-base font-black text-slate-900 mt-2">
                    ป้าย QR Code พร้อมเพย์ของร้าน
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    สแกนจ่ายได้ทุกธนาคาร (K PLUS, SCB, Krungthai ฯลฯ)
                  </p>
                </div>

                {/* THE QR CODE IMAGE DISPLAY (Shop's Own Image Only) */}
                <div className="my-3 p-3 bg-white border-2 border-slate-200 rounded-3xl shadow-md max-w-[280px] w-full flex items-center justify-center">
                  {shopQrImage ? (
                    <img
                      src={shopQrImage}
                      alt="Shop PromptPay QR"
                      className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-2xl"
                    />
                  ) : (
                    <div className="w-56 h-56 sm:w-64 sm:h-64 flex flex-col items-center justify-center text-slate-400 p-4">
                      <QrCode className="w-16 h-16 mb-2 text-slate-300" />
                      <span className="font-bold text-slate-700 text-xs">
                        ยังไม่มีรูป QR ของร้าน
                      </span>
                      <span className="text-[11px] text-slate-400 mt-1">
                        กรุณาอัปโหลดรูปป้าย QR ของร้านที่จอพนักงาน
                      </span>
                    </div>
                  )}
                </div>

                {/* Merchant Account Details Footer */}
                <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-1">
                  <div className="text-xs text-slate-500 font-medium">ชื่อบัญชีร้านค้า:</div>
                  <div className="text-sm font-black text-slate-900 truncate">
                    {settings.promptPayName || settings.shopName_th}
                  </div>
                  {settings.promptPayId && (
                    <div className="text-xs text-slate-600 font-mono font-bold">
                      พร้อมเพย์: {settings.promptPayId}
                    </div>
                  )}
                  <div className="pt-1 flex items-center justify-center gap-1 text-[10px] text-emerald-700 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>รูปป้าย QR ของทางร้านโดยตรง • ปลอดภัย 100%</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};
