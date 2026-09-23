import React, { useState } from 'react';
import { MenuCategory, MenuItem, OptionGroup } from '../../types';
import { useI18n } from '../../i18n';
import { compressImageFile } from '../../utils/imageCompressor';
import { sound } from '../../utils/sound';
import {
  X,
  Upload,
  Plus,
  Trash2,
  Image as ImageIcon,
  Save,
} from 'lucide-react';

interface MenuItemEditorModalProps {
  item?: MenuItem | null; // null if adding new item
  categories: MenuCategory[];
  defaultCategoryId?: string;
  onClose: () => void;
  onSave: (itemData: MenuItem) => Promise<void>;
  onDelete?: (itemId: string) => Promise<void>;
}

export const MenuItemEditorModal: React.FC<MenuItemEditorModalProps> = ({
  item,
  categories,
  defaultCategoryId,
  onClose,
  onSave,
  onDelete,
}) => {
  const { t, language } = useI18n();

  const [nameTh, setNameTh] = useState(item?.name_th || '');
  const [nameEn, setNameEn] = useState(item?.name_en || '');
  const [descriptionTh, setDescriptionTh] = useState(item?.description_th || '');
  const [descriptionEn, setDescriptionEn] = useState(item?.description_en || '');
  const [categoryId, setCategoryId] = useState(
    item?.category_id || defaultCategoryId || (categories[0] ? categories[0].id : '')
  );
  const [price, setPrice] = useState<number>(item?.price || 50);
  const [cost, setCost] = useState<number>(item?.cost || 20);
  const [emoji, setEmoji] = useState(item?.emoji || '🍲');
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>(item?.image);
  const [isAvailable, setIsAvailable] = useState(item?.isAvailable !== false);
  const [isFavorite, setIsFavorite] = useState(!!item?.isFavorite);
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>(item?.optionGroups || []);

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // File upload handler with WebP compression
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { dataUrl } = await compressImageFile(file, 400, 0.8);
      setImageDataUrl(dataUrl);
      sound.playTap();
    } catch (err) {
      console.error('Failed to process image', err);
    } finally {
      setIsUploading(false);
    }
  };

  // Option groups handlers
  const handleAddOptionGroup = () => {
    const newGroup: OptionGroup = {
      id: `group_${Date.now()}`,
      name_th: 'ตัวเลือกเพิ่มเติม',
      name_en: 'Option',
      type: 'single',
      required: false,
      options: [
        {
          id: `opt_${Date.now()}_1`,
          name_th: 'ตัวเลือก 1',
          name_en: 'Option 1',
          priceDelta: 0,
        },
      ],
    };
    setOptionGroups([...optionGroups, newGroup]);
    sound.playTap();
  };

  const handleRemoveOptionGroup = (index: number) => {
    setOptionGroups(optionGroups.filter((_, i) => i !== index));
  };

  const handleAddOptionToGroup = (groupIndex: number) => {
    const updated = [...optionGroups];
    updated[groupIndex].options.push({
      id: `opt_${Date.now()}`,
      name_th: 'ตัวเลือกใหม่',
      name_en: 'New Option',
      priceDelta: 0,
    });
    setOptionGroups(updated);
  };

  const handleRemoveOptionFromGroup = (groupIndex: number, optionIndex: number) => {
    const updated = [...optionGroups];
    updated[groupIndex].options = updated[groupIndex].options.filter((_, i) => i !== optionIndex);
    setOptionGroups(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameTh.trim() && !nameEn.trim()) return;

    setIsSaving(true);
    sound.playTap();

    const savedItem: MenuItem = {
      id: item?.id || `item_${Date.now()}`,
      name_th: nameTh.trim() || nameEn.trim(),
      name_en: nameEn.trim() || nameTh.trim(),
      description_th: descriptionTh.trim() || undefined,
      description_en: descriptionEn.trim() || undefined,
      category_id: categoryId,
      type: item?.type || 'food',
      price,
      cost,
      emoji: emoji || '🍲',
      image: imageDataUrl,
      isAvailable,
      isFavorite,
      optionGroups,
      sortOrder: item?.sortOrder || Date.now(),
    };

    try {
      await onSave(savedItem);
      onClose();
    } catch (err) {
      console.error('Failed to save menu item', err);
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!item || !onDelete) return;
    if (window.confirm(language === 'th' ? `ต้องการลบเมนู "${item.name_th}" ใช่หรือไม่?` : `Delete menu item "${item.name_th}"?`)) {
      sound.playTap();
      await onDelete(item.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-3 sm:p-5 backdrop-blur-xs select-none">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full max-h-[95vh] flex flex-col shadow-2xl text-slate-900 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="text-base font-bold text-slate-900">
            {item ? t('editItem') : t('addNewItem')}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Names (Thai and English) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('itemNameTh')} *
              </label>
              <input
                type="text"
                required
                value={nameTh}
                onChange={(e) => setNameTh(e.target.value)}
                placeholder="เช่น ผัดกะเพราหมูกรอบ"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('itemNameEn')}
              </label>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. Crispy Pork Holy Basil"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('itemCategory')} *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {language === 'th' ? cat.name_th : cat.name_en}
                </option>
              ))}
            </select>
          </div>

          {/* Price & Cost */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('price')} (฿) *
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={price}
                onChange={(e) => setPrice(Math.max(0, Number(e.target.value) || 0))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-base font-bold text-orange-600 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('cost')} (฿)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={cost}
                onChange={(e) => setCost(Math.max(0, Number(e.target.value) || 0))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-base text-slate-700 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Image & Emoji */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center p-3 rounded-2xl bg-slate-50 border border-slate-200">
            {/* Visual Preview */}
            <div className="w-24 h-24 rounded-2xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden mx-auto sm:mx-0 shadow-xs">
              {imageDataUrl ? (
                <img
                  src={imageDataUrl}
                  alt="Item preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl">{emoji || '🍲'}</span>
              )}
            </div>

            {/* Emoji and Upload inputs */}
            <div className="sm:col-span-2 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={emoji}
                  maxLength={4}
                  onChange={(e) => setEmoji(e.target.value)}
                  placeholder="🍲"
                  className="w-16 text-center text-xl bg-white border border-slate-300 rounded-xl py-1 focus:outline-none focus:border-orange-500"
                  title="Emoji placeholder"
                />
                <span className="text-xs text-slate-500">
                  {language === 'th' ? 'อิโมจิแทนรูปภาพ' : 'Emoji placeholder'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <label className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 shadow-xs">
                  <Upload className="w-3.5 h-3.5 text-orange-500" />
                  <span>{isUploading ? 'กำลังอัปโหลด...' : (language === 'th' ? 'อัปโหลดรูปภาพ' : 'Upload Image')}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>

                {imageDataUrl && (
                  <button
                    type="button"
                    onClick={() => setImageDataUrl(undefined)}
                    className="text-xs text-rose-600 hover:underline cursor-pointer"
                  >
                    {language === 'th' ? 'ลบรูป' : 'Remove'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Option Groups (Modifiers) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                {language === 'th' ? 'ตัวเลือก & ท็อปปิ้งเพิ่มเติม' : 'Options & Modifiers'}
              </label>
              <button
                type="button"
                onClick={handleAddOptionGroup}
                className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('addOptionGroup')}</span>
              </button>
            </div>

            {optionGroups.map((group, gIdx) => (
              <div
                key={group.id}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={group.name_th}
                    onChange={(e) => {
                      const updated = [...optionGroups];
                      updated[gIdx].name_th = e.target.value;
                      setOptionGroups(updated);
                    }}
                    placeholder="ชื่อกลุ่มตัวเลือก (ไทย)"
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900 font-bold"
                  />
                  <input
                    type="text"
                    value={group.name_en}
                    onChange={(e) => {
                      const updated = [...optionGroups];
                      updated[gIdx].name_en = e.target.value;
                      setOptionGroups(updated);
                    }}
                    placeholder="Group name (EN)"
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveOptionGroup(gIdx)}
                    className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-4 text-[11px] text-slate-600">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name={`type_${group.id}`}
                      checked={group.type === 'single'}
                      onChange={() => {
                        const updated = [...optionGroups];
                        updated[gIdx].type = 'single';
                        setOptionGroups(updated);
                      }}
                      className="accent-orange-500"
                    />
                    <span>เลือกได้ 1 อย่าง (Single)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name={`type_${group.id}`}
                      checked={group.type === 'multiple'}
                      onChange={() => {
                        const updated = [...optionGroups];
                        updated[gIdx].type = 'multiple';
                        setOptionGroups(updated);
                      }}
                      className="accent-orange-500"
                    />
                    <span>เลือกได้หลายอย่าง (Multi)</span>
                  </label>
                </div>

                {/* Sub-options list */}
                <div className="space-y-1.5 pl-2 border-l-2 border-slate-200">
                  {group.options.map((opt, oIdx) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt.name_th}
                        onChange={(e) => {
                          const updated = [...optionGroups];
                          updated[gIdx].options[oIdx].name_th = e.target.value;
                          setOptionGroups(updated);
                        }}
                        placeholder="ชื่อตัวเลือก (ไทย)"
                        className="flex-1 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900"
                      />
                      <input
                        type="number"
                        value={opt.priceDelta}
                        onChange={(e) => {
                          const updated = [...optionGroups];
                          updated[gIdx].options[oIdx].priceDelta = Number(e.target.value) || 0;
                          setOptionGroups(updated);
                        }}
                        placeholder="+฿"
                        className="w-16 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900 text-center font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveOptionFromGroup(gIdx, oIdx)}
                        className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => handleAddOptionToGroup(gIdx)}
                    className="text-xs text-orange-600 hover:underline flex items-center gap-1 py-1 cursor-pointer font-semibold"
                  >
                    <Plus className="w-3 h-3" />
                    <span>เพิ่มตัวเลือกย่อย</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Availability and Favorite Toggles */}
          <div className="flex items-center gap-6 pt-1">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                className="w-4 h-4 rounded accent-orange-500"
              />
              <span>{t('available')}</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isFavorite}
                onChange={(e) => setIsFavorite(e.target.checked)}
                className="w-4 h-4 rounded accent-orange-500"
              />
              <span>{t('favorites')}</span>
            </label>
          </div>

          {/* Footer Save & Delete Button */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {item && onDelete ? (
              <button
                type="button"
                onClick={handleDeleteItem}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 cursor-pointer transition min-h-[40px]"
              >
                <Trash2 className="w-4 h-4" />
                <span>{language === 'th' ? 'ลบเมนูนี้' : 'Delete'}</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer min-h-[40px]"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-xs transition cursor-pointer min-h-[40px]"
              >
                <Save className="w-4 h-4" />
                <span>{t('save')}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
