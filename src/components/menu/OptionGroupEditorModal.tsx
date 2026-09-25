import React, { useState } from 'react';
import { OptionGroup, OptionItem } from '../../types';
import { useI18n } from '../../i18n';
import { sound } from '../../utils/sound';
import { useReorder } from '../../utils/reorder';
import {
  X,
  Plus,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Check,
  ToggleLeft,
  ToggleRight,
  Sliders,
  AlertCircle,
} from 'lucide-react';

interface OptionGroupEditorModalProps {
  group?: OptionGroup | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (group: OptionGroup) => Promise<void>;
}

export const OptionGroupEditorModal: React.FC<OptionGroupEditorModalProps> = ({
  group,
  isOpen,
  onClose,
  onSave,
}) => {
  const { t, language } = useI18n();

  const [nameTh, setNameTh] = useState(group?.name_th || '');
  const [nameEn, setNameEn] = useState(group?.name_en || '');
  const [type, setType] = useState<'single' | 'multiple'>(group?.type || 'single');
  const [required, setRequired] = useState(group?.required ?? false);
  const [options, setOptions] = useState<OptionItem[]>(() => {
    if (group?.options && group.options.length > 0) {
      return group.options.map((opt) => ({
        ...opt,
        isAvailable: opt.isAvailable !== false,
      }));
    }
    return [
      {
        id: `opt_${Date.now()}_1`,
        name_th: 'ตัวเลือก 1',
        name_en: 'Option 1',
        priceDelta: 0,
        isAvailable: true,
      },
    ];
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Choices Reordering hook (supports mouse drag, touch drag, and up/down arrows)
  const {
    dragIndex,
    dropTargetIndex,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDrop,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    moveUp,
    moveDown,
  } = useReorder<OptionItem>({
    items: options,
    onReorder: (newOptions) => setOptions(newOptions),
    attributeName: 'data-choice-index',
  });

  if (!isOpen) return null;

  const handleAddChoice = () => {
    sound.playTap();
    const newChoice: OptionItem = {
      id: `opt_${Date.now()}_${options.length + 1}`,
      name_th: '',
      name_en: '',
      priceDelta: 0,
      isAvailable: true,
    };
    setOptions([...options, newChoice]);
  };

  const handleRemoveChoice = (index: number) => {
    if (options.length <= 1) {
      alert(language === 'th' ? 'ต้องมีตัวเลือกอย่างน้อย 1 รายการ' : 'Must have at least 1 option choice');
      return;
    }
    sound.playTap();
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleToggleChoiceAvailability = (index: number) => {
    sound.playTap();
    setOptions(
      options.map((opt, i) =>
        i === index ? { ...opt, isAvailable: opt.isAvailable === false ? true : false } : opt
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nameTh.trim() && !nameEn.trim()) {
      setError(language === 'th' ? 'กรุณาระบุชื่อกลุ่มตัวเลือก' : 'Please specify group name');
      return;
    }

    if (options.length === 0) {
      setError(language === 'th' ? 'ต้องมีตัวเลือกอย่างน้อย 1 รายการ' : 'Must have at least 1 option choice');
      return;
    }

    // Ensure all choices have a name
    const hasEmptyChoice = options.some((opt) => !opt.name_th.trim() && !opt.name_en.trim());
    if (hasEmptyChoice) {
      setError(language === 'th' ? 'กรุณากรอกชื่อตัวเลือกให้ครบถ้วนทุกข้อ' : 'Please name all choices');
      return;
    }

    setIsSaving(true);
    sound.playTap();

    const savedGroup: OptionGroup = {
      id: group?.id || `grp_${Date.now()}`,
      name_th: nameTh.trim() || nameEn.trim(),
      name_en: nameEn.trim() || nameTh.trim(),
      type,
      required,
      isShared: true,
      sortOrder: group?.sortOrder,
      options: options.map((opt) => ({
        ...opt,
        name_th: opt.name_th.trim() || opt.name_en.trim(),
        name_en: opt.name_en.trim() || opt.name_th.trim(),
        priceDelta: Number(opt.priceDelta) || 0,
        isAvailable: opt.isAvailable !== false,
      })),
    };

    try {
      await onSave(savedGroup);
      onClose();
    } catch (err: any) {
      console.error('Failed to save option group', err);
      setError(err?.message || 'Error saving group');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-3 sm:p-5 backdrop-blur-xs select-none">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl text-slate-900 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-xs">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {group
                  ? language === 'th'
                    ? 'แก้ไขกลุ่มตัวเลือกส่วนกลาง'
                    : 'Edit Option Group'
                  : language === 'th'
                  ? 'สร้างกลุ่มตัวเลือกส่วนกลางใหม่'
                  : 'New Option Group'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {language === 'th'
                  ? 'ใช้ร่วมกันในหลายเมนูได้ และอัปเดตทุกเมนูทันทีเมื่อแก้ไข'
                  : 'Reusable across menu items and updates everywhere'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Group Names (Thai and English) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {language === 'th' ? 'ชื่อกลุ่มตัวเลือก (ภาษาไทย)' : 'Group Name (Thai)'} *
              </label>
              <input
                type="text"
                required
                value={nameTh}
                onChange={(e) => setNameTh(e.target.value)}
                placeholder="เช่น ระดับความเผ็ด, ขนาดจาน"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-bold focus:outline-none focus:border-orange-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {language === 'th' ? 'ชื่อกลุ่มตัวเลือก (English)' : 'Group Name (English)'}
              </label>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. Spiciness Level, Size"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Type & Required Selection */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                {language === 'th' ? 'รูปแบบการเลือก (Selection Type)' : 'Selection Type'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    sound.playTap();
                    setType('single');
                  }}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    type === 'single'
                      ? 'bg-orange-50 border-orange-500 text-orange-950 font-bold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-xs">{language === 'th' ? 'เลือกได้ 1 อย่าง (Single)' : 'Single Choice'}</div>
                  <div className="text-[10px] text-slate-500 font-normal">
                    {language === 'th' ? 'เช่น ระดับความเผ็ด, ขนาด' : 'e.g. Spicy level, Size'}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sound.playTap();
                    setType('multiple');
                  }}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    type === 'multiple'
                      ? 'bg-orange-50 border-orange-500 text-orange-950 font-bold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-xs">{language === 'th' ? 'เลือกได้หลายอย่าง (Multiple)' : 'Multiple Choices'}</div>
                  <div className="text-[10px] text-slate-500 font-normal">
                    {language === 'th' ? 'เช่น ท็อปปิ้งไข่, เพิ่มเครื่อง' : 'e.g. Egg add-ons, Toppings'}
                  </div>
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-800">
                  {language === 'th' ? 'บังคับเลือกเสมอ (Required)' : 'Required Selection'}
                </div>
                <div className="text-[11px] text-slate-500">
                  {language === 'th'
                    ? 'ลูกค้าหรือพนักงานต้องเลือกก่อนส่งออเดอร์'
                    : 'Must be selected before saving order'}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  sound.playTap();
                  setRequired(!required);
                }}
                className="text-orange-600 cursor-pointer"
              >
                {required ? (
                  <ToggleRight className="w-8 h-8 text-orange-600" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-slate-400" />
                )}
              </button>
            </div>
          </div>

          {/* Choices / Options List with Reordering */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-800">
                  {language === 'th' ? 'รายการตัวเลือกย่อย (Choices)' : 'Option Choices'} ({options.length})
                </label>
                <div className="text-[10px] text-slate-400">
                  {language === 'th'
                    ? 'ลากสลับตำแหน่ง หรือกดลูกศรขึ้น-ลง เพื่อเรียงลำดับ'
                    : 'Drag handle or use up/down arrows to reorder'}
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddChoice}
                className="px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{language === 'th' ? 'เพิ่มตัวเลือก' : 'Add Choice'}</span>
              </button>
            </div>

            <div className="space-y-2">
              {options.map((opt, idx) => {
                const isDraggingThis = dragIndex === idx;
                const isDropTarget = dropTargetIndex === idx && dragIndex !== null && dragIndex !== idx;

                return (
                  <div key={opt.id} data-choice-index={idx}>
                    {/* Visual drop indicator line */}
                    {isDropTarget && dragIndex !== null && dragIndex > idx && (
                      <div className="h-1 bg-orange-500 rounded-full my-1 shadow-xs animate-pulse" />
                    )}

                    <div
                      className={`p-2.5 rounded-2xl border transition flex items-center gap-2 ${
                        isDraggingThis
                          ? 'opacity-40 bg-orange-50 border-orange-300'
                          : opt.isAvailable === false
                          ? 'bg-slate-100 border-slate-200 opacity-70'
                          : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                      }`}
                      onDragOver={(e) => handleDragOver(idx, e)}
                      onDrop={(e) => handleDrop(idx, e)}
                    >
                      {/* Drag Handle & Up/Down Arrows */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        <div
                          draggable={true}
                          onDragStart={(e) => handleDragStart(idx, e)}
                          onDragEnd={handleDragEnd}
                          onTouchStart={(e) => handleTouchStart(idx, e)}
                          onTouchMove={handleTouchMove}
                          onTouchEnd={handleTouchEnd}
                          className="p-1 text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing touch-none"
                          title={language === 'th' ? 'ลากเพื่อสลับลำดับ' : 'Drag to reorder'}
                        >
                          <GripVertical className="w-4 h-4" />
                        </div>

                        <div className="flex flex-col">
                          <button
                            type="button"
                            onClick={() => moveUp(idx)}
                            disabled={idx === 0}
                            className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                            title="Move up"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveDown(idx)}
                            disabled={idx === options.length - 1}
                            className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                            title="Move down"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Thai Name */}
                      <input
                        type="text"
                        value={opt.name_th}
                        onChange={(e) => {
                          const updated = [...options];
                          updated[idx].name_th = e.target.value;
                          setOptions(updated);
                        }}
                        placeholder="ชื่อตัวเลือก (ไทย)"
                        className="flex-1 min-w-[100px] bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-orange-500 focus:bg-white"
                      />

                      {/* English Name */}
                      <input
                        type="text"
                        value={opt.name_en}
                        onChange={(e) => {
                          const updated = [...options];
                          updated[idx].name_en = e.target.value;
                          setOptions(updated);
                        }}
                        placeholder="Name (EN)"
                        className="flex-1 min-w-[90px] bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                      />

                      {/* Price Adjustment */}
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[11px] font-bold text-slate-400">฿</span>
                        <input
                          type="number"
                          step="1"
                          value={opt.priceDelta}
                          onChange={(e) => {
                            const updated = [...options];
                            updated[idx].priceDelta = Number(e.target.value) || 0;
                            setOptions(updated);
                          }}
                          placeholder="0"
                          className="w-16 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-center font-bold text-orange-600 focus:outline-none focus:border-orange-500 focus:bg-white"
                          title={language === 'th' ? 'ราคาบวกหรือลด (ใส่ 0 หรือติดลบได้)' : 'Price delta (0, positive or negative)'}
                        />
                      </div>

                      {/* Available Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleChoiceAvailability(idx)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold shrink-0 transition cursor-pointer ${
                          opt.isAvailable !== false
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                        }`}
                        title={
                          opt.isAvailable !== false
                            ? language === 'th' ? 'พร้อมให้บริการ (คลิกเพื่อปิดชั่วคราว)' : 'Available'
                            : language === 'th' ? 'หมด/ปิดชั่วคราว (คลิกเพื่อเปิด)' : 'Unavailable'
                        }
                      >
                        {opt.isAvailable !== false
                          ? language === 'th' ? 'มี' : 'In stock'
                          : language === 'th' ? 'หมด' : 'Out'}
                      </button>

                      {/* Delete Choice */}
                      <button
                        type="button"
                        onClick={() => handleRemoveChoice(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer shrink-0"
                        title={language === 'th' ? 'ลบตัวเลือกนี้' : 'Delete choice'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Visual drop indicator line */}
                    {isDropTarget && dragIndex !== null && dragIndex < idx && (
                      <div className="h-1 bg-orange-500 rounded-full my-1 shadow-xs animate-pulse" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer min-h-[38px]"
          >
            {language === 'th' ? 'ยกเลิก' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white shadow-xs flex items-center gap-1.5 transition cursor-pointer min-h-[38px]"
          >
            <Check className="w-4 h-4" />
            <span>{isSaving ? (language === 'th' ? 'กำลังบันทึก...' : 'Saving...') : language === 'th' ? 'บันทึกกลุ่มตัวเลือก' : 'Save Group'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
