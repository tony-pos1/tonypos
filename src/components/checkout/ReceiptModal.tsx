import React from 'react';
import { AppSettings, Order } from '../../types';
import { useI18n } from '../../i18n';
import { sound } from '../../utils/sound';
import { Printer, Check, PlusCircle, X } from 'lucide-react';

interface ReceiptModalProps {
  order: Order;
  settings: AppSettings;
  onClose: () => void;
  onNewOrder: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  order,
  settings,
  onClose,
  onNewOrder,
}) => {
  const { t, language } = useI18n();

  const handlePrint = () => {
    sound.playTap();
    window.print();
  };

  const shopName = language === 'th' ? settings.shopName_th : settings.shopName_en;
  const shopAddress = language === 'th' ? settings.shopAddress_th : settings.shopAddress_en;
  const footerNote = language === 'th' ? settings.receiptFooter_th : settings.receiptFooter_en;

  const dateStr = new Date(order.createdAt).toLocaleDateString(
    language === 'th' ? 'th-TH' : 'en-US',
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }
  );

  const timeStr = new Date(order.createdAt).toLocaleTimeString(
    language === 'th' ? 'th-TH' : 'en-US',
    {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }
  );

  const activeLines = order.lines.filter((l) => l.status !== 'voided');
  const mainPayment = order.payments[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-3 backdrop-blur-xs select-none">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full max-h-[96vh] flex flex-col shadow-2xl text-slate-900 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header Action Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 print:hidden">
          <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{t('completePayment')}</span>
          </h3>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold border border-orange-200 cursor-pointer transition min-h-[38px] shadow-xs"
            >
              <Printer className="w-4 h-4 text-orange-600" />
              <span>{t('receiptPrint')}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="p-4 overflow-y-auto flex-1 bg-slate-100 flex justify-center">
          {/* Printable Ticket Card */}
          <div
            id="printable-receipt"
            className="w-full bg-white text-slate-900 p-6 rounded-2xl shadow-xs border border-slate-200 font-mono text-xs space-y-4 print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print:text-black"
          >
            {/* Header: Shop Info */}
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
              <h2 className="text-base font-black text-slate-900 leading-tight">
                {shopName}
              </h2>
              <p className="text-[11px] text-slate-600 leading-tight">
                {shopAddress}
              </p>
              {settings.shopPhone && (
                <p className="text-[11px] text-slate-600">
                  Tel: {settings.shopPhone}
                </p>
              )}
              {settings.shopTaxId && (
                <p className="text-[11px] text-slate-500">
                  TAX ID: {settings.shopTaxId}
                </p>
              )}
            </div>

            {/* Order Meta Info */}
            <div className="space-y-1 text-[11px] text-slate-600 pb-3 border-b border-dashed border-slate-300">
              <div className="flex justify-between">
                <span>{language === 'th' ? 'เลขออเดอร์' : 'Order #'}: {order.orderNumber}</span>
                {order.queueNumber && (
                  <span className="font-bold text-slate-900">Q#{order.queueNumber}</span>
                )}
              </div>
              <div className="flex justify-between">
                <span>{dateStr} {timeStr}</span>
                <span className="font-semibold text-slate-800">
                  {order.tableName || (order.orderType === 'takeaway' ? 'Takeaway' : 'Table')}
                </span>
              </div>
            </div>

            {/* Itemized Lines */}
            <div className="space-y-2 py-1 border-b border-dashed border-slate-300">
              {activeLines.map((line) => {
                const lineName = language === 'th' ? line.name_th : line.name_en;
                const lineTotal = line.unitPrice * line.quantity;
                return (
                  <div key={line.id} className="space-y-0.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-900">
                      <span>
                        {line.quantity}x {lineName}
                      </span>
                      <span>฿{lineTotal.toLocaleString()}</span>
                    </div>

                    {line.selectedOptions && line.selectedOptions.length > 0 && (
                      <div className="pl-4 text-[10px] text-slate-500">
                        {line.selectedOptions.map((opt) => (
                          <div key={opt.optionId} className="flex justify-between">
                            <span>- {language === 'th' ? opt.optionName_th : opt.optionName_en}</span>
                            {opt.priceDelta > 0 && <span>+฿{opt.priceDelta}</span>}
                          </div>
                        ))}
                      </div>
                    )}

                    {line.modifiers && line.modifiers.length > 0 && (
                      <div className="pl-4 text-[10px] text-slate-500">
                        * {line.modifiers.join(', ')}
                      </div>
                    )}

                    {line.notes && (
                      <div className="pl-4 text-[10px] text-slate-500 italic">
                        Note: {line.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Subtotal, Discount, Tax, Total */}
            <div className="space-y-1.5 text-xs text-slate-700 pb-3 border-b border-dashed border-slate-300">
              <div className="flex justify-between">
                <span>{t('subtotal')}:</span>
                <span>฿{order.subtotal.toLocaleString()}</span>
              </div>

              {order.discountAmount > 0 && (
                <div className="flex justify-between text-rose-600 font-semibold">
                  <span>{t('discount')}:</span>
                  <span>-฿{order.discountAmount.toLocaleString()}</span>
                </div>
              )}

              {order.serviceChargeAmount > 0 && (
                <div className="flex justify-between">
                  <span>Service ({order.serviceChargeRate}%):</span>
                  <span>฿{order.serviceChargeAmount.toLocaleString()}</span>
                </div>
              )}

              {order.vatAmount > 0 && (
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>VAT ({order.vatRate}%):</span>
                  <span>฿{order.vatAmount.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-200">
                <span>{t('netTotal')}:</span>
                <span>฿{order.netTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment Details */}
            {mainPayment && (
              <div className="space-y-1 text-xs text-slate-600 pb-3">
                <div className="flex justify-between">
                  <span>{language === 'th' ? 'วิธีชำระเงิน' : 'Payment Method'}:</span>
                  <span className="font-semibold text-slate-800 uppercase">
                    {mainPayment.method}
                  </span>
                </div>

                {mainPayment.method === 'cash' && (
                  <div className="flex justify-between">
                    <span>{t('cashReceived')}:</span>
                    <span>฿{(mainPayment.receivedAmount || order.netTotal).toFixed(2)}</span>
                  </div>
                )}

                {mainPayment.method === 'cash' && (
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>{t('changeDue')}:</span>
                    <span>฿{(mainPayment.changeAmount || 0).toFixed(2)}</span>
                  </div>
                )}

                {mainPayment.reference && (
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Ref:</span>
                    <span>{mainPayment.reference}</span>
                  </div>
                )}
              </div>
            )}

            {/* Footer Text */}
            <div className="text-center pt-3 border-t border-dashed border-slate-300 text-[10px] text-slate-500 space-y-1 font-sans">
              <p>{footerNote}</p>
              <p className="font-semibold text-slate-700">{t('thankYou')}</p>
            </div>
          </div>
        </div>

        {/* Footer: New Order Button */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer min-h-[44px]"
          >
            {t('close')}
          </button>
          <button
            onClick={() => {
              sound.playTap();
              onNewOrder();
            }}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-xs transition cursor-pointer min-h-[44px]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('newOrder')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
