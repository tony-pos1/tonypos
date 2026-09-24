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
  CheckCircle,
  CreditCard,
  PauseCircle,
  RotateCcw,
  Percent,
  AlertTriangle,
  Send,
} from 'lucide-react';

interface OrderPanelProps {
  order: Order;
  settings: AppSettings;
  heldOrdersCount: number;
  onUpdateLines: (lines: OrderLine[]) => void;
  onUpdateOrderType: (type: OrderType) => void;
  onConfirmOrder: () => void;
  onSaveOrderAndNavigateToTables: () => void;
  onHoldOrder: () => void;
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
  onConfirmOrder,
  onSaveOrderAndNavigateToTables,
  onHoldOrder,
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
  const [showSaveBeforePayModal, setShowSaveBeforePayModal] = useState(false);

  // Sensors for @dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
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

  const handleDeleteLine = (lineId: string) => {
    const updated = order.lines.filter((l) => l.id !== lineId);
    onUpdateLines(updated);
  };

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

  // SAVE-BEFORE-PAY RULE HELPER
  const handlePayClick = () => {
    if (activeLines.length === 0) {
      sound.playWarningBeep();
      return;
    }
    if (hasUnsentLines) {
      sound.playWarningBeep();
      setShowSaveBeforePayModal(true);
      return;
    }
    sound.playTap();
    onCheckout();
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 select-none overflow-hidden">
      {/* Top Header: Order Type and Table / Order Identifier */}
      <div className="p-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-2 shrink-0">
        {/* Order Type Tabs: Dine-in / Takeaway / Delivery */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => {
              sound.playTap();
              onUpdateOrderType('dine_in');
            }}
            className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              order.orderType === 'dine_in'
                ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>{language === 'th' ? 'ทานที่ร้าน' : 'Dine In'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playTap();
              onUpdateOrderType('takeaway');
            }}
            className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              order.orderType === 'takeaway'
                ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{language === 'th' ? 'กลับบ้าน' : 'Takeaway'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playTap();
              onUpdateOrderType('delivery');
            }}
            className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              order.orderType === 'delivery'
                ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            <span>{language === 'th' ? 'เดลิเวอรี' : 'Delivery'}</span>
          </button>
        </div>

        {/* Order info and table / queue identifier */}
        <div className="flex items-center justify-between text-xs pt-0.5">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              {order.orderType === 'dine_in'
                ? order.tableName || `${t('table')} -`
                : order.orderType === 'takeaway'
                ? `${language === 'th' ? 'กลับบ้าน' : 'Takeaway'} ${order.queueNumber ? `Q#${order.queueNumber}` : `#${order.id.slice(-4)}`}`
                : `${language === 'th' ? 'เดลิเวอรี' : 'Delivery'} #${order.id.slice(-4)}`}
            </span>
            {order.guestCount && order.guestCount > 0 ? (
              <span className="text-[10px] text-slate-400">
                ({order.guestCount} {language === 'th' ? 'ท่าน' : 'guests'})
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <span>{activeLines.length} {t('orderLinesCount')}</span>
          </div>
        </div>
      </div>

      {/* Lines List (DndContext Scrollable) */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2 scrollbar-thin">
        {order.lines.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400">
            <Utensils className="w-8 h-8 mb-2 opacity-30 text-orange-500" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
              {t('emptyOrderTitle')}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
              {t('emptyOrderDesc')}
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
              {order.lines.map((line, index) => (
                <OrderLineItem
                  key={line.id}
                  line={line}
                  index={index}
                  totalLines={order.lines.length}
                  onUpdateQuantity={handleUpdateQuantity}
                  onDeleteLine={handleDeleteLine}
                  onVoidLine={handleVoidLine}
                  onEditModifiers={onEditModifiers}
                  onMoveUp={handleMoveUp}
                  onMoveDown={handleMoveDown}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Bill Financial Summary */}
      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 text-xs space-y-1.5 shrink-0">
        <div className="flex justify-between text-slate-500 dark:text-slate-400">
          <span>{t('subtotal')}</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            ฿{order.subtotal.toFixed(2)}
          </span>
        </div>

        {/* Discount Row */}
        <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1">
            <span>{t('discount')}</span>
            <button
              type="button"
              onClick={() => {
                sound.playTap();
                setShowDiscountModal(true);
              }}
              className="text-[10px] text-orange-600 hover:underline font-bold cursor-pointer"
            >
              [{order.discountAmount > 0 ? (language === 'th' ? 'แก้ไข' : 'Edit') : (language === 'th' ? '+เพิ่ม' : '+Add')}]
            </button>
          </div>
          <span className="font-semibold text-rose-600">
            {order.discountAmount > 0 ? `-฿${order.discountAmount.toFixed(2)}` : '฿0.00'}
          </span>
        </div>

        {/* Net Total Display */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-baseline">
          <div>
            <span className="font-black text-sm text-slate-900 dark:text-slate-100">
              {t('netTotal')}
            </span>
          </div>
          <div className="text-xl font-black text-orange-600 dark:text-orange-500">
            ฿{order.netTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Action Buttons Toolbar */}
      <div className="p-2.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-2 shrink-0">
        <div className="grid grid-cols-2 gap-2">
          {/* Confirm Order Button (Saves draft lines to table / open bills) */}
          <button
            type="button"
            onClick={() => {
              sound.playTap();
              onConfirmOrder();
            }}
            disabled={!hasUnsentLines}
            className="py-2.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer min-h-[46px]"
          >
            <CheckCircle className="w-4 h-4" />
            <span className="truncate">
              {language === 'th' ? 'ยืนยันออเดอร์' : 'Confirm Order'}
            </span>
          </button>

          {/* Pay / Checkout Button (Enforces Save-Before-Pay Rule) */}
          <button
            type="button"
            onClick={handlePayClick}
            disabled={activeLines.length === 0}
            className="py-2.5 px-2 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer min-h-[46px]"
          >
            <CreditCard className="w-4 h-4" />
            <span className="truncate">{t('checkoutButton')}</span>
          </button>
        </div>

        {/* Secondary Action Row: Hold Order & Clear Order */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => {
              sound.playTap();
              if (heldOrdersCount > 0) onOpenHeldOrders();
              else onHoldOrder();
            }}
            disabled={activeLines.length === 0 && heldOrdersCount === 0}
            className="py-1.5 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition cursor-pointer flex items-center justify-center gap-1"
          >
            <PauseCircle className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[11px] truncate">
              {heldOrdersCount > 0
                ? `${language === 'th' ? 'บิลพักไว้' : 'Held'} (${heldOrdersCount})`
                : (language === 'th' ? 'พักบิล' : 'Hold')}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playTap();
              if (window.confirm(t('confirmClearOrder'))) {
                onClearOrder();
              }
            }}
            disabled={order.lines.length === 0}
            className="py-1.5 px-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-semibold transition cursor-pointer flex items-center justify-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="text-[11px] truncate">{t('clearOrder')}</span>
          </button>
        </div>
      </div>

      {/* SAVE-BEFORE-PAY RULE MODAL */}
      {showSaveBeforePayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs select-none">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 max-w-sm w-full shadow-2xl text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold">
                  {language === 'th' ? 'มีรายการที่ยังไม่ได้บันทึก' : 'Unsaved Items'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {language === 'th'
                    ? 'คุณมีรายการที่ยังไม่ได้บันทึก กรุณาบันทึกออเดอร์ลงโต๊ะก่อน'
                    : 'You have items that are not saved yet. Please save the order to the table first.'}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  sound.playTap();
                  setShowSaveBeforePayModal(false);
                  onSaveOrderAndNavigateToTables();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
              >
                {language === 'th'
                  ? 'บันทึกออเดอร์และไปที่ผังโต๊ะ'
                  : 'Save order and go to floor plan'}
              </button>

              <button
                type="button"
                onClick={() => setShowSaveBeforePayModal(false)}
                className="w-full py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                {language === 'th' ? 'ยกเลิก' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discount Dialog Modal */}
      {showDiscountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs select-none">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 max-w-sm w-full shadow-2xl text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-1.5">
              <Percent className="w-4 h-4 text-orange-600" />
              <span>{t('discount')}</span>
            </h4>

            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 mb-3">
              <button
                type="button"
                onClick={() => setDiscountMode('baht')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  discountMode === 'baht'
                    ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                บาท (THB)
              </button>
              <button
                type="button"
                onClick={() => setDiscountMode('percent')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  discountMode === 'percent'
                    ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                เปอร์เซ็นต์ (%)
              </button>
            </div>

            <div className="space-y-2 mb-4">
              <div>
                <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                  จำนวนส่วนลด ({discountMode === 'baht' ? '฿' : '%'})
                </label>
                <input
                  type="number"
                  min={0}
                  value={discountVal || ''}
                  onChange={(e) => setDiscountVal(Number(e.target.value) || 0)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                  เหตุผล / ชื่อโปรโมชั่น
                </label>
                <input
                  type="text"
                  placeholder="เช่น ลูกค้าประจำ, พนักงาน"
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDiscountModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleSaveDiscount}
                className="px-4 py-1.5 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-xl cursor-pointer shadow-xs"
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
