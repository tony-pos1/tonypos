import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { AppSettings, Order, OrderLine, OrderType } from '../../types';
import { OrderLineItem } from './OrderLineItem';
import { useI18n } from '../../i18n';
import { sound } from '../../utils/sound';
import {
  Utensils,
  ShoppingBag,
  Bike,
  Send,
  CreditCard,
  PauseCircle,
  RotateCcw,
  Percent,
  Tag,
  Hash,
  BookmarkCheck,
  Save,
} from 'lucide-react';

interface OrderPanelProps {
  order: Order;
  settings: AppSettings;
  heldOrdersCount: number;
  onUpdateLines: (lines: OrderLine[]) => void;
  onUpdateOrderType: (type: OrderType) => void;
  onSendToKitchen: () => void;
  onHoldOrder: () => void;
  onSaveOrder?: () => void;
  onOpenHeldOrders: () => void;
  onClearOrder: () => void;
  onEditModifiers: (line: OrderLine) => void;
  onCheckout: () => void;
  onApplyDiscount: (amount: number, reason?: string) => void;
}

export const OrderPanel: React.FC<OrderPanelProps> = ({
  order,
  settings,
  heldOrdersCount,
  onUpdateLines,
  onUpdateOrderType,
  onSendToKitchen,
  onHoldOrder,
  onSaveOrder,
  onOpenHeldOrders,
  onClearOrder,
  onEditModifiers,
  onCheckout,
  onApplyDiscount,
}) => {
  const { t, language } = useI18n();
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountVal, setDiscountVal] = useState<number>(0);
  const [discountMode, setDiscountMode] = useState<'baht' | 'percent'>('baht');
  const [discountReason, setDiscountReason] = useState('');

  // Sensors for @dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px drag before starting to prevent accidental drags on taps
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeLines = order.lines.filter((l) => l.status !== 'voided');
  const hasUnsentLines = order.lines.some((l) => l.status === 'unsent');

  // Drag-and-drop reorder handler
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = order.lines.findIndex((line) => line.id === active.id);
    const newIndex = order.lines.findIndex((line) => line.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      sound.playTap();
      const newLines = arrayMove(order.lines, oldIndex, newIndex);
      onUpdateLines(newLines);
    }
  };

  // Arrow button reorder handlers
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    sound.playTap();
    const newLines = arrayMove(order.lines, index, index - 1);
    onUpdateLines(newLines);
  };

  const handleMoveDown = (index: number) => {
    if (index >= order.lines.length - 1) return;
    sound.playTap();
    const newLines = arrayMove(order.lines, index, index + 1);
    onUpdateLines(newLines);
  };

  // Quantity updates
  const handleUpdateQuantity = (lineId: string, delta: number) => {
    const updated = order.lines.map((line) => {
      if (line.id === lineId) {
        const nextQty = Math.max(1, line.quantity + delta);
        return { ...line, quantity: nextQty };
      }
      return line;
    });
    onUpdateLines(updated);
  };

  // Delete line (unsent)
  const handleDeleteLine = (lineId: string) => {
    const updated = order.lines.filter((l) => l.id !== lineId);
    onUpdateLines(updated);
  };

  // Void line (already sent to kitchen)
  const handleVoidLine = (lineId: string, reason: string) => {
    sound.playNotificationChime();
    const updated = order.lines.map((l) => {
      if (l.id === lineId) {
        return { ...l, status: 'voided' as const, voidReason: reason };
      }
      return l;
    });
    onUpdateLines(updated);
  };

  // Discount modal save
  const handleSaveDiscount = () => {
    sound.playTap();
    let calculatedDiscount = 0;
    if (discountMode === 'percent') {
      calculatedDiscount = (order.subtotal * (discountVal || 0)) / 100;
    } else {
      calculatedDiscount = discountVal || 0;
    }
    onApplyDiscount(calculatedDiscount, discountReason);
    setShowDiscountModal(false);
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200 select-none overflow-hidden">
      {/* Top Header: Order Type and Table / Order Identifier */}
      <div className="p-3 bg-white border-b border-slate-100 flex flex-col gap-2 shrink-0">
        {/* Order Type Tabs: Dine-in / Takeaway / Delivery */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => {
              sound.playTap();
              onUpdateOrderType('dine_in');
            }}
            className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              order.orderType === 'dine_in'
                ? 'bg-white text-orange-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>{language === 'th' ? 'ทานที่ร้าน' : 'Dine In'}</span>
          </button>

          <button
            onClick={() => {
              sound.playTap();
              onUpdateOrderType('takeaway');
            }}
            className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              order.orderType === 'takeaway'
                ? 'bg-white text-orange-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{language === 'th' ? 'กลับบ้าน' : 'Takeaway'}</span>
          </button>

          <button
            onClick={() => {
              sound.playTap();
              onUpdateOrderType('delivery');
            }}
            className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              order.orderType === 'delivery'
                ? 'bg-white text-orange-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            <span>{language === 'th' ? 'เดลิเวอรี' : 'Delivery'}</span>
          </button>
        </div>

        {/* Order info and table / queue identifier */}
        <div className="flex items-center justify-between text-xs pt-0.5">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-900 text-sm">
              {order.orderType === 'dine_in'
                ? order.tableName || `${t('table')} -`
                : order.orderType === 'takeaway'
                ? `${language === 'th' ? 'กลับบ้าน' : 'Takeaway'} ${order.queueNumber ? `Q#${order.queueNumber}` : `#${order.id.slice(-4)}`}`
                : `${language === 'th' ? 'เดลิเวอรี' : 'Delivery'} #${order.id.slice(-4)}`}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {heldOrdersCount > 0 && (
              <button
                onClick={onOpenHeldOrders}
                className="px-2 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold flex items-center gap-1 hover:bg-amber-100 cursor-pointer"
                title={t('heldOrders')}
              >
                <PauseCircle className="w-3 h-3 text-amber-600" />
                <span>{heldOrdersCount}</span>
              </button>
            )}

            <button
              onClick={onClearOrder}
              disabled={activeLines.length === 0}
              className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 disabled:opacity-30 cursor-pointer"
              title={t('clearOrder')}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Center: Scrollable Order Line Items with Drag Reorder */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {activeLines.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <ShoppingBag className="w-10 h-10 text-slate-300 mb-2 stroke-[1.5]" />
            <p className="text-sm font-semibold text-slate-600">
              {language === 'th' ? 'ยังไม่มีรายการอาหาร' : 'No items yet'}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
              {language === 'th'
                ? 'เลือกรายการอาหารจากเมนูทางซ้ายเพื่อเพิ่มลงในออเดอร์'
                : 'Select menu items from the left to add them to this order'}
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={order.lines.map((l) => l.id)}
              strategy={verticalListSortingStrategy}
            >
              {order.lines.map((line, idx) => (
                <OrderLineItem
                  key={line.id}
                  line={line}
                  index={idx}
                  totalLines={order.lines.length}
                  onMoveUp={handleMoveUp}
                  onMoveDown={handleMoveDown}
                  onUpdateQuantity={handleUpdateQuantity}
                  onEditModifiers={onEditModifiers}
                  onDeleteLine={handleDeleteLine}
                  onVoidLine={handleVoidLine}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Bottom Summary & Financial Breakdown */}
      <div className="border-t border-slate-200 bg-slate-50 p-3.5 space-y-3 shrink-0">
        {/* Financial Line Breakdowns */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>{t('subtotal')}</span>
            <span className="font-semibold text-slate-900">
              ฿{order.subtotal.toFixed(2)}
            </span>
          </div>

          {/* Discount Trigger / Display */}
          <div className="flex justify-between items-center text-slate-600">
            <button
              onClick={() => {
                sound.playTap();
                setShowDiscountModal(true);
              }}
              className="text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1 cursor-pointer"
            >
              <Tag className="w-3 h-3" />
              <span>
                {order.discountAmount > 0
                  ? `${t('discount')} (${order.discountReason || 'Promotion'})`
                  : `+ ${t('discount')}`}
              </span>
            </button>
            {order.discountAmount > 0 ? (
              <span className="font-semibold text-rose-600">
                -฿{order.discountAmount.toFixed(2)}
              </span>
            ) : (
              <span>฿0.00</span>
            )}
          </div>

          {/* Service Charge (if enabled) */}
          {settings.serviceChargeEnabled && (
            <div className="flex justify-between text-slate-600">
              <span>
                {t('serviceCharge')} ({order.serviceChargeRate}%)
              </span>
              <span className="font-semibold text-slate-900">
                +฿{order.serviceChargeAmount.toFixed(2)}
              </span>
            </div>
          )}

          {/* VAT breakdown (if enabled) */}
          {settings.vatEnabled && (
            <div className="flex justify-between text-slate-500 text-[11px]">
              <span>
                {t('vat')} ({order.vatRate}%{' '}
                {settings.priceIncludeTax ? t('vatIncluded') : t('vatExcluded')})
              </span>
              <span>฿{order.vatAmount.toFixed(2)}</span>
            </div>
          )}

          {/* Net Total */}
          <div className="flex justify-between text-base font-black text-slate-900 pt-1.5 border-t border-slate-200">
            <span>{t('netTotal')}</span>
            <span className="text-orange-600 text-lg">
              ฿{order.netTotal.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Action Buttons: Save (Hold/Assign to Table), Kitchen, Checkout */}
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          {/* Save / Hold Button */}
          <button
            onClick={() => {
              sound.playTap();
              if (onSaveOrder) {
                onSaveOrder();
              } else {
                onHoldOrder();
              }
            }}
            disabled={activeLines.length === 0}
            className="py-2.5 px-2 rounded-xl bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-300 text-slate-700 font-bold text-xs flex flex-col items-center justify-center gap-1 transition cursor-pointer min-h-[46px] shadow-2xs"
            title={language === 'th' ? 'บันทึกออเดอร์ลงโต๊ะหรือคิว' : 'Save / Hold order'}
          >
            <BookmarkCheck className="w-4 h-4 text-orange-600" />
            <span className="truncate">{t('save')}</span>
          </button>

          {/* Send to Kitchen Button */}
          <button
            onClick={() => {
              sound.playTap();
              onSendToKitchen();
            }}
            disabled={!hasUnsentLines}
            className="py-2.5 px-2 rounded-xl bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-300 text-slate-700 font-bold text-xs flex flex-col items-center justify-center gap-1 transition cursor-pointer min-h-[46px] shadow-2xs"
          >
            <Send className="w-4 h-4 text-orange-600" />
            <span className="truncate">{t('sendToKitchen')}</span>
          </button>

          {/* Pay / Checkout Button */}
          <button
            onClick={() => {
              sound.playTap();
              onCheckout();
            }}
            disabled={activeLines.length === 0}
            className="py-2.5 px-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs flex flex-col items-center justify-center gap-1 shadow-xs transition cursor-pointer min-h-[46px]"
          >
            <CreditCard className="w-4 h-4" />
            <span className="truncate">{t('checkoutButton')}</span>
          </button>
        </div>
      </div>

      {/* Discount Dialog Modal */}
      {showDiscountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs select-none">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 max-w-sm w-full shadow-2xl text-slate-900 animate-in fade-in zoom-in-95">
            <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
              <Percent className="w-4 h-4 text-orange-600" />
              <span>{t('discount')}</span>
            </h4>

            <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 mb-3">
              <button
                type="button"
                onClick={() => setDiscountMode('baht')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  discountMode === 'baht'
                    ? 'bg-white text-orange-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                บาท (THB)
              </button>
              <button
                type="button"
                onClick={() => setDiscountMode('percent')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  discountMode === 'percent'
                    ? 'bg-white text-orange-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                เปอร์เซ็นต์ (%)
              </button>
            </div>

            <div className="space-y-2 mb-4">
              <div>
                <label className="text-xs text-slate-700 font-semibold block mb-1">
                  จำนวนส่วนลด ({discountMode === 'baht' ? '฿' : '%'})
                </label>
                <input
                  type="number"
                  min={0}
                  value={discountVal || ''}
                  onChange={(e) => setDiscountVal(Number(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-700 font-semibold block mb-1">
                  เหตุผล / ชื่อโปรโมชั่น
                </label>
                <input
                  type="text"
                  placeholder="เช่น ลูกค้าประจำ, พนักงาน"
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDiscountModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleSaveDiscount}
                className="px-4 py-1.5 text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-xl cursor-pointer shadow-xs"
              >
                {t('save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
