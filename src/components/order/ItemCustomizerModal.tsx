import React, { useState } from 'react';
import { MenuItem, OrderLine, SelectedOption } from '../../types';
import { useI18n } from '../../i18n';
import { sound } from '../../utils/sound';
import { X, Plus, Minus, Check, MessageSquare, AlertCircle } from 'lucide-react';

interface ItemCustomizerModalProps {
  item: MenuItem;
  existingLine?: OrderLine; // when editing an existing line
  quickModifiers: string[];
  currency: string;
  onClose: () => void;
  onConfirm: (
    quantity: number,
    selectedOptions: SelectedOption[],
    modifiers: string[],
    notes: string
  ) => void;
}

export const ItemCustomizerModal: React.FC<ItemCustomizerModalProps> = ({
  item,
  existingLine,
  quickModifiers,
  currency,
  onClose,
  onConfirm,
}) => {
  const { t, language } = useI18n();

  const [quantity, setQuantity] = useState(existingLine?.quantity || 1);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>(
    existingLine?.selectedOptions || []
  );
  const [modifiers, setModifiers] = useState<string[]>(
    existingLine?.modifiers || []
  );
  const [notes, setNotes] = useState(existingLine?.notes || '');
  const [validationError, setValidationError] = useState<string | null>(null);

  const displayName = language === 'th' ? item.name_th : item.name_en;
  const displayDesc = language === 'th' ? item.description_th : item.description_en;

  // Single select option click
  const handleSingleSelect = (
    groupId: string,
    groupNameTh: string,
    groupNameEn: string,
    optionId: string,
    optionNameTh: string,
    optionNameEn: string,
    priceDelta: number
  ) => {
    sound.playTap();
    setValidationError(null);
    setSelectedOptions((prev) => {
      // Remove any existing selection in this group
      const filtered = prev.filter((o) => o.groupId !== groupId);
      return [
        ...filtered,
        {
          groupId,
          groupName_th: groupNameTh,
          groupName_en: groupNameEn,
          optionId,
          optionName_th: optionNameTh,
          optionName_en: optionNameEn,
          priceDelta,
        },
      ];
    });
  };

  // Multi select option click
  const handleMultiSelect = (
    groupId: string,
    groupNameTh: string,
    groupNameEn: string,
    optionId: string,
    optionNameTh: string,
    optionNameEn: string,
    priceDelta: number,
    maxSelections?: number
  ) => {
    sound.playTap();
    setValidationError(null);
    setSelectedOptions((prev) => {
      const isAlreadySelected = prev.some(
        (o) => o.groupId === groupId && o.optionId === optionId
      );
      if (isAlreadySelected) {
        return prev.filter(
          (o) => !(o.groupId === groupId && o.optionId === optionId)
        );
      } else {
        const groupCount = prev.filter((o) => o.groupId === groupId).length;
        if (maxSelections && groupCount >= maxSelections) {
          return prev; // capped
        }
        return [
          ...prev,
          {
            groupId,
            groupName_th: groupNameTh,
            groupName_en: groupNameEn,
            optionId,
            optionName_th: optionNameTh,
            optionName_en: optionNameEn,
            priceDelta,
          },
        ];
      }
    });
  };

  // Quick modifier chip toggle
  const toggleModifier = (mod: string) => {
    sound.playTap();
    setModifiers((prev) =>
      prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]
    );
  };

  // Calculate live item price
  const optionsDelta = selectedOptions.reduce(
    (sum, opt) => sum + opt.priceDelta,
    0
  );
  const unitPrice = item.price + optionsDelta;
  const lineTotal = unitPrice * quantity;

  // Validation: check required option groups
  const validate = (): boolean => {
    if (!item.optionGroups) return true;
    for (const group of item.optionGroups) {
      if (group.required) {
        const hasSelection = selectedOptions.some(
          (o) => o.groupId === group.id
        );
        if (!hasSelection) {
          const groupName = language === 'th' ? group.name_th : group.name_en;
          setValidationError(`กรุณาเลือก ${groupName} (Please select ${groupName})`);
          return false;
        }
      }
    }
    return true;
  };

  const handleConfirm = () => {
    if (!validate()) {
      sound.playNotificationChime();
      return;
    }
    sound.playTap();
    onConfirm(quantity, selectedOptions, modifiers, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs select-none">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full shadow-2xl text-slate-900 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div>
            <h3 className="text-base font-black text-slate-900">{displayName}</h3>
            {displayDesc && (
              <p className="text-xs text-slate-500 mt-0.5">{displayDesc}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 divide-y divide-slate-100">
          {/* Quantity Selector */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                {t('quantity')}
              </label>
              <div className="text-xs text-slate-500">
                ราคาต่อหน่วย: ฿{unitPrice.toLocaleString()}
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  if (quantity > 1) {
                    setQuantity(quantity - 1);
                    sound.playTap();
                  }
                }}
                className="w-10 h-10 rounded-xl bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center transition cursor-pointer disabled:opacity-30 shadow-xs"
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-10 text-center font-black text-base text-slate-900">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => {
                  setQuantity(quantity + 1);
                  sound.playTap();
                }}
                className="w-10 h-10 rounded-xl bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Option Groups */}
          {item.optionGroups && item.optionGroups.length > 0 && (
            <div className="pt-4 space-y-4">
              {item.optionGroups.map((group) => {
                const groupName =
                  language === 'th' ? group.name_th : group.name_en;

                return (
                  <div key={group.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <span>{groupName}</span>
                        {group.required && (
                          <span className="text-rose-600 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 border border-rose-200">
                            {t('requiredOption')}
                          </span>
                        )}
                      </label>
                      <span className="text-[11px] text-slate-500">
                        {group.type === 'single'
                          ? 'เลือกได้ 1 รายการ'
                          : t('optionalOption')}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {group.options.map((opt) => {
                        const optName =
                          language === 'th' ? opt.name_th : opt.name_en;
                        const isSelected = selectedOptions.some(
                          (o) =>
                            o.groupId === group.id && o.optionId === opt.id
                        );

                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              if (group.type === 'single') {
                                handleSingleSelect(
                                  group.id,
                                  group.name_th,
                                  group.name_en,
                                  opt.id,
                                  opt.name_th,
                                  opt.name_en,
                                  opt.priceDelta
                                );
                              } else {
                                handleMultiSelect(
                                  group.id,
                                  group.name_th,
                                  group.name_en,
                                  opt.id,
                                  opt.name_th,
                                  opt.name_en,
                                  opt.priceDelta,
                                  group.maxSelections
                                );
                              }
                            }}
                            className={`min-h-[44px] px-3 py-2 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                              isSelected
                                ? 'bg-orange-50 border-orange-500 text-orange-800 shadow-xs'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center gap-2 text-xs font-medium">
                              <div
                                className={`w-4 h-4 rounded-${
                                  group.type === 'single' ? 'full' : 'md'
                                } border flex items-center justify-center ${
                                  isSelected
                                    ? 'border-orange-500 bg-orange-500 text-white'
                                    : 'border-slate-400 bg-white'
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                              <span>{optName}</span>
                            </div>

                            {opt.priceDelta > 0 && (
                              <span className="text-xs font-bold text-orange-600">
                                +฿{opt.priceDelta}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Modifier Chips */}
          <div className="pt-4 space-y-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              {t('quickModifiers')}
            </label>
            <div className="flex flex-wrap gap-2">
              {quickModifiers.map((mod) => {
                const isSelected = modifiers.includes(mod);
                return (
                  <button
                    key={mod}
                    type="button"
                    onClick={() => toggleModifier(mod)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer min-h-[38px] ${
                      isSelected
                        ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {mod}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Free-text Kitchen Notes */}
          <div className="pt-4 space-y-1.5">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-orange-500" />
              <span>{t('addCustomNote')}</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="เช่น ไม่ใส่กระเทียม, ขอพริกน้ำปลาเพิ่ม 1 ถ้วย"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 resize-none"
            />
          </div>
        </div>

        {/* Validation Warning if required field missing */}
        {validationError && (
          <div className="px-5 py-2 bg-rose-50 border-t border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Modal Footer / Add to Order Button */}
        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500">{t('netTotal')}</div>
            <div className="text-lg font-black text-orange-600">
              ฿{lineTotal.toLocaleString()}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 transition cursor-pointer min-h-[44px]"
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-xs transition cursor-pointer min-h-[44px]"
            >
              {existingLine ? t('updateOrderLine') : t('addToOrder')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
