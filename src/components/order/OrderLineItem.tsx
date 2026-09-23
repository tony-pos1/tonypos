import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { OrderLine } from '../../types';
import { useI18n } from '../../i18n';
import { sound } from '../../utils/sound';
import {
  GripVertical,
  ChevronUp,
  ChevronDown,
  Plus,
  Minus,
  Trash2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Edit,
} from 'lucide-react';

interface OrderLineItemProps {
  line: OrderLine;
  index: number;
  totalLines: number;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onUpdateQuantity: (lineId: string, delta: number) => void;
  onEditModifiers: (line: OrderLine) => void;
  onDeleteLine: (lineId: string) => void;
  onVoidLine: (lineId: string, reason: string) => void;
}

export const OrderLineItem: React.FC<OrderLineItemProps> = ({
  line,
  index,
  totalLines,
  onMoveUp,
  onMoveDown,
  onUpdateQuantity,
  onEditModifiers,
  onDeleteLine,
  onVoidLine,
}) => {
  const { t, language } = useI18n();
  const [showVoidDialog, setShowVoidDialog] = useState(false);
  const [voidReason, setVoidReason] = useState('');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: line.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 40 : 1,
    opacity: isDragging ? 0.6 : 1,
  };

  const displayName = language === 'th' ? line.name_th : line.name_en;
  const isSent = line.status === 'sent';
  const isVoided = line.status === 'voided';
  const lineTotal = line.unitPrice * line.quantity;

  const handleConfirmVoid = () => {
    if (!voidReason.trim()) return;
    onVoidLine(line.id, voidReason.trim());
    setShowVoidDialog(false);
    setVoidReason('');
  };

  if (isVoided) {
    return (
      <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 opacity-60 text-xs">
        <div className="flex items-center justify-between line-through text-slate-500">
          <span>{displayName} x{line.quantity}</span>
          <span>฿{lineTotal.toLocaleString()}</span>
        </div>
        <div className="text-[10px] text-rose-600 font-semibold mt-0.5">
          {t('voidLine')}: {line.voidReason || 'Cancelled'}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative rounded-2xl border transition select-none ${
        isSent
          ? 'bg-white border-slate-200 shadow-xs'
          : 'bg-orange-50/40 border-orange-200 shadow-xs'
      }`}
    >
      <div className="p-2.5 flex items-start gap-2">
        {/* Drag Handle (@dnd-kit) */}
        <button
          {...attributes}
          {...listeners}
          className="p-1 text-slate-400 hover:text-slate-700 cursor-grab active:cursor-grabbing rounded hover:bg-slate-100 transition touch-none shrink-0"
          title={t('reorderHint')}
          aria-label="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Arrow Buttons for non-drag reordering */}
        <div className="flex flex-col gap-0.5 shrink-0">
          <button
            onClick={() => onMoveUp(index)}
            disabled={index === 0}
            className="p-0.5 rounded text-slate-400 hover:text-slate-700 disabled:opacity-20 hover:bg-slate-100 transition cursor-pointer"
            title={t('moveUp')}
          >
            <ChevronUp className="w-3 h-3" />
          </button>
          <button
            onClick={() => onMoveDown(index)}
            disabled={index === totalLines - 1}
            className="p-0.5 rounded text-slate-400 hover:text-slate-700 disabled:opacity-20 hover:bg-slate-100 transition cursor-pointer"
            title={t('moveDown')}
          >
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        {/* Item Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
              {displayName}
            </span>

            {/* Sent vs Unsent Status Badge */}
            {isSent ? (
              <span className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                <span>{t('sentLines')} (R{line.round})</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.2 rounded bg-orange-100 text-orange-800 border border-orange-200">
                <Clock className="w-2.5 h-2.5 text-orange-600" />
                <span>{t('newLines')}</span>
              </span>
            )}
          </div>

          {/* Selected Options Chips */}
          {line.selectedOptions && line.selectedOptions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {line.selectedOptions.map((opt) => (
                <span
                  key={opt.optionId}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
                >
                  {language === 'th' ? opt.optionName_th : opt.optionName_en}
                  {opt.priceDelta > 0 && ` (+฿${opt.priceDelta})`}
                </span>
              ))}
            </div>
          )}

          {/* Modifiers & Notes */}
          {line.modifiers && line.modifiers.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {line.modifiers.map((mod, idx) => (
                <span
                  key={idx}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200"
                >
                  {mod}
                </span>
              ))}
            </div>
          )}

          {line.notes && (
            <div className="text-[11px] text-orange-800 italic mt-0.5">
              "{line.notes}"
            </div>
          )}

          <div className="text-xs text-slate-500 mt-1">
            ฿{line.unitPrice} / {t('orderLinesCount')}
          </div>
        </div>

        {/* Stepper & Line Price */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <div className="text-xs sm:text-sm font-extrabold text-orange-600">
            ฿{lineTotal.toLocaleString()}
          </div>

          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-0.5 border border-slate-200">
            <button
              onClick={() => {
                sound.playTap();
                if (line.quantity > 1) {
                  onUpdateQuantity(line.id, -1);
                } else if (!isSent) {
                  onDeleteLine(line.id);
                } else {
                  setShowVoidDialog(true);
                }
              }}
              className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center transition cursor-pointer shadow-xs"
              title="Minus"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-6 text-center text-xs font-bold text-slate-900">
              {line.quantity}
            </span>
            <button
              onClick={() => {
                sound.playTap();
                onUpdateQuantity(line.id, 1);
              }}
              className="w-6 h-6 rounded-lg bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition cursor-pointer shadow-xs"
              title="Plus"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Action Button: Edit or Delete / Void */}
          <div className="flex items-center gap-1 mt-0.5">
            {!isSent && (
              <button
                onClick={() => onEditModifiers(line)}
                className="p-1 text-slate-400 hover:text-orange-600 rounded hover:bg-slate-100 cursor-pointer"
                title={t('editItem')}
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
            )}

            {isSent ? (
              <button
                onClick={() => setShowVoidDialog(true)}
                className="p-1 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50 cursor-pointer"
                title={t('voidLine')}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => {
                  sound.playTap();
                  onDeleteLine(line.id);
                }}
                className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 cursor-pointer"
                title={t('deleteLine')}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Void Dialog Modal */}
      {showVoidDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs select-none">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 max-w-sm w-full shadow-2xl text-slate-900 animate-in fade-in zoom-in-95">
            <h4 className="text-sm font-bold text-rose-700 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>{t('voidReasonTitle')}</span>
            </h4>
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              รายการนี้ส่งเข้าครัวแล้ว การยกเลิกต้องระบุเหตุผลเพื่อพิมพ์ใบยกเลิก (VOID Slip)
            </p>
            <input
              type="text"
              autoFocus
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder={t('voidReasonPlaceholder')}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-500 mb-4"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowVoidDialog(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                disabled={!voidReason.trim()}
                onClick={handleConfirmVoid}
                className="px-4 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-xl cursor-pointer shadow-xs"
              >
                {t('confirmVoid')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
