import React, { useState, useEffect } from 'react';
import { MenuCategory, MenuItem, OptionGroup, OptionItem } from '../../types';
import { useI18n } from '../../i18n';
import { compressImageFile } from '../../utils/imageCompressor';
import { sound } from '../../utils/sound';
import { useReorder } from '../../utils/reorder';
import { menuRepo } from '../../db/repositories';
import {
  X,
  Upload,
  Plus,
  Trash2,
  Image as ImageIcon,
  Save,
  Sliders,
  Link as LinkIcon,
  Search,
  Check,
  GripVertical,
  ChevronUp,
  ChevronDown,
  BookmarkPlus,
  Sparkles,
  AlertCircle,
  HelpCircle,
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

  // Attached option groups list (preserves independent order per item)
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>(() => {
    if (!item?.optionGroups) return [];
    return item.optionGroups.map((g) => ({
      ...g,
      options: g.options?.map((opt) => ({
        ...opt,
        isAvailable: opt.isAvailable !== false,
      })) || [],
    }));
  });

  // Shared option groups from library
  const [sharedLibraryGroups, setSharedLibraryGroups] = useState<OptionGroup[]>([]);
  const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
  const [attachSearch, setAttachSearch] = useState('');

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Load shared option groups from DB
  useEffect(() => {
    menuRepo.getSharedOptionGroups().then((groups) => {
      setSharedLibraryGroups(groups);

      // If an existing item has shared groups attached, refresh their choices from the library
      setOptionGroups((prevGroups) => {
        const sharedMap = new Map(groups.map((sg) => [sg.id, sg]));
        return prevGroups.map((g) => {
          const sharedId = g.sharedGroupId || (g.isShared ? g.id : undefined);
          if (sharedId && sharedMap.has(sharedId)) {
            const latest = sharedMap.get(sharedId)!;
            return {
              ...latest,
              id: g.id,
              isShared: true,
              sharedGroupId: latest.id,
              required: g.required !== undefined ? g.required : latest.required,
            };
          }
          return g;
        });
      });
    });
  }, []);

  // Hook for reordering attached groups on this menu item
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
  } = useReorder<OptionGroup>({
    items: optionGroups,
    onReorder: (newGroups) => {
      sound.playTap();
      setOptionGroups(newGroups);
    },
    attributeName: 'data-attached-group-index',
  });

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

  // Add Item-Specific Option Group
  const handleAddCustomOptionGroup = () => {
    sound.playTap();
    const newGroup: OptionGroup = {
      id: `group_${Date.now()}`,
      name_th: 'ตัวเลือกเฉพาะเมนู',
      name_en: 'Item Option',
      type: 'single',
      required: false,
      isShared: false,
      options: [
        {
          id: `opt_${Date.now()}_1`,
          name_th: 'ตัวเลือก 1',
          name_en: 'Option 1',
          priceDelta: 0,
          isAvailable: true,
        },
      ],
    };
    setOptionGroups([...optionGroups, newGroup]);
  };

  const handleRemoveOptionGroup = (index: number) => {
    sound.playTap();
    setOptionGroups(optionGroups.filter((_, i) => i !== index));
  };

  // Toggle attaching a shared group from the library
  const handleToggleAttachSharedGroup = (sharedGroup: OptionGroup) => {
    sound.playTap();
    const alreadyAttachedIndex = optionGroups.findIndex(
      (g) => g.sharedGroupId === sharedGroup.id || (g.isShared && g.id === sharedGroup.id)
    );

    if (alreadyAttachedIndex >= 0) {
      // Detach
      setOptionGroups(optionGroups.filter((_, i) => i !== alreadyAttachedIndex));
    } else {
      // Attach to the end
      const attachedGroup: OptionGroup = {
        ...sharedGroup,
        id: `attached_${Date.now()}_${sharedGroup.id}`,
        isShared: true,
        sharedGroupId: sharedGroup.id,
      };
      setOptionGroups([...optionGroups, attachedGroup]);
    }
  };

  // Promote an item-specific group into the shared library
  const handlePromoteToShared = async (groupIndex: number) => {
    const targetGroup = optionGroups[groupIndex];
    if (!targetGroup || targetGroup.isShared) return;

    sound.playTap();
    try {
      const newSharedGroup: OptionGroup = {
        ...targetGroup,
        id: `grp_${Date.now()}`,
        isShared: true,
        sortOrder: sharedLibraryGroups.length + 1,
      };

      await menuRepo.addSharedOptionGroup(newSharedGroup);
      const updatedLibrary = await menuRepo.getSharedOptionGroups();
      setSharedLibraryGroups(updatedLibrary);

      // Switch this item's group to use the shared group reference
      const updatedGroups = [...optionGroups];
      updatedGroups[groupIndex] = {
        ...newSharedGroup,
        id: targetGroup.id,
        isShared: true,
        sharedGroupId: newSharedGroup.id,
      };
      setOptionGroups(updatedGroups);

      setSuccessBanner(
        language === 'th'
          ? `บันทึกกลุ่ม "${newSharedGroup.name_th}" เป็นกลุ่มตัวเลือกส่วนกลางเรียบร้อยแล้ว`
          : `Saved "${newSharedGroup.name_en || newSharedGroup.name_th}" to shared library`
      );
      setTimeout(() => setSuccessBanner(null), 3500);
    } catch (err) {
      console.error('Failed to promote option group', err);
      alert('Could not save to library');
    }
  };

  // Choices handlers for item-specific groups
  const handleAddChoiceToGroup = (groupIndex: number) => {
    sound.playTap();
    const updated = [...optionGroups];
    updated[groupIndex].options.push({
      id: `opt_${Date.now()}_${updated[groupIndex].options.length + 1}`,
      name_th: 'ตัวเลือกใหม่',
      name_en: 'New Option',
      priceDelta: 0,
      isAvailable: true,
    });
    setOptionGroups(updated);
  };

  const handleRemoveChoiceFromGroup = (groupIndex: number, optionIndex: number) => {
    sound.playTap();
    const updated = [...optionGroups];
    updated[groupIndex].options = updated[groupIndex].options.filter((_, i) => i !== optionIndex);
    setOptionGroups(updated);
  };

  const handleMoveChoice = (groupIndex: number, choiceIndex: number, direction: 'up' | 'down') => {
    sound.playTap();
    const updated = [...optionGroups];
    const opts = [...updated[groupIndex].options];
    const targetIdx = direction === 'up' ? choiceIndex - 1 : choiceIndex + 1;
    if (targetIdx < 0 || targetIdx >= opts.length) return;
    const [moved] = opts.splice(choiceIndex, 1);
    opts.splice(targetIdx, 0, moved);
    updated[groupIndex].options = opts;
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
    if (
      window.confirm(
        language === 'th'
          ? `ต้องการลบเมนู "${item.name_th}" ใช่หรือไม่?`
          : `Delete menu item "${item.name_th}"?`
      )
    ) {
      sound.playTap();
      await onDelete(item.id);
      onClose();
    }
  };

  const filteredLibraryGroups = sharedLibraryGroups.filter((g) => {
    if (!attachSearch.trim()) return true;
    const q = attachSearch.toLowerCase().trim();
    return g.name_th.toLowerCase().includes(q) || g.name_en.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-3 sm:p-5 backdrop-blur-xs select-none">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full max-h-[95vh] flex flex-col shadow-2xl text-slate-900 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <h3 className="text-base font-bold text-slate-900">
            {item ? t('editItem') : t('addNewItem')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {successBanner && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successBanner}</span>
            </div>
          )}

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
                  <span>
                    {isUploading
                      ? 'กำลังอัปโหลด...'
                      : language === 'th'
                      ? 'อัปโหลดรูปภาพ'
                      : 'Upload Image'}
                  </span>
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

          {/* Section: Option Groups & Modifiers */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <label className="text-xs font-bold text-slate-900 block">
                  {language === 'th' ? 'กลุ่มตัวเลือก & ท็อปปิ้ง (Option Groups)' : 'Options & Add-ons'}
                </label>
                <p className="text-[11px] text-slate-400">
                  {language === 'th'
                    ? 'ผูกกลุ่มตัวเลือกจากคลัง หรือสร้างเฉพาะเมนูนี้ ลากสลับลำดับการแสดงผลในหน้า POS ได้'
                    : 'Attach shared groups or create custom ones. Reorder affects POS display.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Button to open Attach from Library modal */}
                <button
                  type="button"
                  onClick={() => setIsAttachModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>{language === 'th' ? 'ผูกกลุ่มตัวเลือกจากคลัง' : 'Attach from Library'}</span>
                  {sharedLibraryGroups.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-sky-200 text-sky-800 text-[10px]">
                      {sharedLibraryGroups.length}
                    </span>
                  )}
                </button>

                {/* Button to add custom item-specific group */}
                <button
                  type="button"
                  onClick={handleAddCustomOptionGroup}
                  className="px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{language === 'th' ? 'เพิ่มเฉพาะเมนูนี้' : 'Add Custom Group'}</span>
                </button>
              </div>
            </div>

            {/* Attached Groups List with Drag & Drop + Up/Down Arrows */}
            {optionGroups.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-slate-400">
                <Sliders className="w-8 h-8 mx-auto text-slate-300 mb-1.5" />
                <p className="text-xs font-semibold text-slate-600">
                  {language === 'th'
                    ? 'เมนูนี้ยังไม่มีตัวเลือกหรือท็อปปิ้ง'
                    : 'No option groups attached to this item'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {language === 'th'
                    ? 'กดปุ่ม "ผูกกลุ่มตัวเลือกจากคลัง" เพื่อเลือกกลุ่มตัวเลือกที่สร้างไว้ หรือกด "เพิ่มเฉพาะเมนูนี้"'
                    : 'Click "Attach from Library" or "Add Custom Group" to configure options'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {optionGroups.map((group, gIdx) => {
                  const isShared = !!group.isShared;
                  const isDraggingThis = dragIndex === gIdx;
                  const isDropTarget = dropTargetIndex === gIdx && dragIndex !== null && dragIndex !== gIdx;

                  return (
                    <div key={group.id} data-attached-group-index={gIdx}>
                      {/* Visual drop indicator bar */}
                      {isDropTarget && dragIndex !== null && dragIndex > gIdx && (
                        <div className="h-1.5 bg-orange-500 rounded-full my-1.5 shadow-xs animate-pulse" />
                      )}

                      <div
                        className={`p-3.5 rounded-2xl border transition space-y-3 ${
                          isDraggingThis
                            ? 'opacity-40 bg-orange-50 border-orange-300'
                            : isShared
                            ? 'bg-sky-50/40 border-sky-200 shadow-2xs'
                            : 'bg-white border-slate-200 shadow-2xs'
                        }`}
                        onDragOver={(e) => handleDragOver(gIdx, e)}
                        onDrop={(e) => handleDrop(gIdx, e)}
                      >
                        {/* Group Header: Drag handle, Arrows, Name, Badges, and Actions */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            {/* Drag handle & Up/Down arrows */}
                            <div className="flex items-center gap-0.5 shrink-0">
                              <div
                                draggable={true}
                                onDragStart={(e) => handleDragStart(gIdx, e)}
                                onDragEnd={handleDragEnd}
                                onTouchStart={(e) => handleTouchStart(gIdx, e)}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                                className="p-1 text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing touch-none rounded"
                                title={language === 'th' ? 'ลากเพื่อจัดลำดับในหน้า POS' : 'Drag to reorder on POS'}
                              >
                                <GripVertical className="w-4 h-4" />
                              </div>

                              <div className="flex flex-col">
                                <button
                                  type="button"
                                  onClick={() => moveUp(gIdx)}
                                  disabled={gIdx === 0}
                                  className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                                  title="Move up"
                                >
                                  <ChevronUp className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveDown(gIdx)}
                                  disabled={gIdx === optionGroups.length - 1}
                                  className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                                  title="Move down"
                                >
                                  <ChevronDown className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* Label & Badges */}
                            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                              {isShared ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-xs text-slate-900 truncate">
                                    {language === 'th' ? group.name_th : group.name_en || group.name_th}
                                  </span>
                                  {group.name_en && language === 'th' && (
                                    <span className="text-[11px] text-slate-400">({group.name_en})</span>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 flex-1">
                                  <input
                                    type="text"
                                    value={group.name_th}
                                    onChange={(e) => {
                                      const updated = [...optionGroups];
                                      updated[gIdx].name_th = e.target.value;
                                      setOptionGroups(updated);
                                    }}
                                    placeholder="ชื่อกลุ่ม (ไทย)"
                                    className="flex-1 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900 font-bold focus:outline-none focus:border-orange-500"
                                  />
                                  <input
                                    type="text"
                                    value={group.name_en}
                                    onChange={(e) => {
                                      const updated = [...optionGroups];
                                      updated[gIdx].name_en = e.target.value;
                                      setOptionGroups(updated);
                                    }}
                                    placeholder="Name (EN)"
                                    className="flex-1 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                                  />
                                </div>
                              )}

                              {/* Distinct Badges */}
                              {isShared ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200 shrink-0">
                                  🔗 {language === 'th' ? 'กลุ่มส่วนกลาง (Shared)' : 'Shared Group'}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200 shrink-0">
                                  {language === 'th' ? 'เฉพาะเมนูนี้' : 'Item Specific'}
                                </span>
                              )}

                              <span className="text-[10px] font-semibold text-slate-500 shrink-0">
                                {group.type === 'single'
                                  ? language === 'th' ? 'เลือก 1 อย่าง' : 'Single'
                                  : language === 'th' ? 'เลือกหลายอย่าง' : 'Multi'}
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons for Group */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Promote button for item-specific groups */}
                            {!isShared && (
                              <button
                                type="button"
                                onClick={() => handlePromoteToShared(gIdx)}
                                className="px-2 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 text-[11px] font-bold border border-orange-200 flex items-center gap-1 transition cursor-pointer"
                                title={language === 'th' ? 'บันทึกเข้าคลังเพื่อใช้ร่วมกับเมนูอื่น' : 'Save to shared library'}
                              >
                                <BookmarkPlus className="w-3 h-3 text-orange-600" />
                                <span>{language === 'th' ? 'บันทึกเป็นกลุ่มส่วนกลาง' : 'Save as reusable'}</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleRemoveOptionGroup(gIdx)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                              title={language === 'th' ? 'ถอดกลุ่มนี้ออก' : 'Remove group'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* If Shared: Display choices summary and note */}
                        {isShared ? (
                          <div className="pl-6 space-y-2">
                            <div className="flex flex-wrap gap-1.5">
                              {group.options.map((opt) => (
                                <span
                                  key={opt.id}
                                  className={`text-[11px] px-2 py-0.5 rounded-md border inline-flex items-center gap-1 ${
                                    opt.isAvailable === false
                                      ? 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                                      : 'bg-white text-slate-700 border-sky-200'
                                  }`}
                                >
                                  <span>{language === 'th' ? opt.name_th : opt.name_en || opt.name_th}</span>
                                  {opt.priceDelta > 0 && (
                                    <span className="text-orange-600 font-bold">+฿{opt.priceDelta}</span>
                                  )}
                                  {opt.priceDelta < 0 && (
                                    <span className="text-emerald-600 font-bold">-฿{Math.abs(opt.priceDelta)}</span>
                                  )}
                                </span>
                              ))}
                            </div>
                            <div className="text-[11px] text-sky-800 flex items-center gap-1">
                              <span>ℹ️</span>
                              <span>
                                {language === 'th'
                                  ? 'กลุ่มส่วนกลางนี้จะอัปเดตอัตโนมัติเมื่อแก้ไขในแท็บ "กลุ่มตัวเลือก"'
                                  : 'Updates automatically when edited in the Option Groups library'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          /* If Item-Specific: Inline editing of choices */
                          <div className="pl-6 space-y-2 border-l-2 border-slate-200">
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
                                <span>{language === 'th' ? 'เลือกได้ 1 อย่าง (Single)' : 'Single choice'}</span>
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
                                <span>{language === 'th' ? 'เลือกได้หลายอย่าง (Multiple)' : 'Multiple choices'}</span>
                              </label>

                              <label className="flex items-center gap-1.5 ml-auto cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={group.required}
                                  onChange={(e) => {
                                    const updated = [...optionGroups];
                                    updated[gIdx].required = e.target.checked;
                                    setOptionGroups(updated);
                                  }}
                                  className="accent-orange-500"
                                />
                                <span className="font-semibold text-rose-600">
                                  {language === 'th' ? 'บังคับเลือก' : 'Required'}
                                </span>
                              </label>
                            </div>

                            {/* Choices list with arrow buttons for item-specific group */}
                            <div className="space-y-1.5">
                              {group.options.map((opt, oIdx) => (
                                <div key={opt.id} className="flex items-center gap-1.5">
                                  {/* Up/Down buttons for choices */}
                                  <div className="flex flex-col shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => handleMoveChoice(gIdx, oIdx, 'up')}
                                      disabled={oIdx === 0}
                                      className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                                    >
                                      <ChevronUp className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleMoveChoice(gIdx, oIdx, 'down')}
                                      disabled={oIdx === group.options.length - 1}
                                      className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                                    >
                                      <ChevronDown className="w-3 h-3" />
                                    </button>
                                  </div>

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
                                    className="w-16 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900 text-center font-bold text-orange-600"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveChoiceFromGroup(gIdx, oIdx)}
                                    className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}

                              <button
                                type="button"
                                onClick={() => handleAddChoiceToGroup(gIdx)}
                                className="text-xs text-orange-600 hover:underline flex items-center gap-1 py-1 cursor-pointer font-semibold"
                              >
                                <Plus className="w-3 h-3" />
                                <span>{language === 'th' ? 'เพิ่มตัวเลือกย่อย' : 'Add choice'}</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Visual drop indicator bar */}
                      {isDropTarget && dragIndex !== null && dragIndex < gIdx && (
                        <div className="h-1.5 bg-orange-500 rounded-full my-1.5 shadow-xs animate-pulse" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Availability and Favorite Toggles */}
          <div className="flex items-center gap-6 pt-3 border-t border-slate-100">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                className="w-4 h-4 rounded accent-orange-500"
              />
              <span>{language === 'th' ? 'เปิดขายเมนูนี้ (พร้อมเสิร์ฟ)' : 'Available for order'}</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isFavorite}
                onChange={(e) => setIsFavorite(e.target.checked)}
                className="w-4 h-4 rounded accent-orange-500"
              />
              <span>{language === 'th' ? 'เมนูแนะนำ / ติดดาว (Favorite)' : 'Mark as Favorite'}</span>
            </label>
          </div>
        </form>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div>
            {item && onDelete && (
              <button
                type="button"
                onClick={handleDeleteItem}
                className="px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                <span>{t('deleteItem')}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
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
              <Save className="w-4 h-4" />
              <span>{isSaving ? (language === 'th' ? 'กำลังบันทึก...' : 'Saving...') : t('saveSettings')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Attach Option Groups from Library Checklist */}
      {isAttachModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs select-none">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95">
            {/* Attach Modal Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-sky-600" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {language === 'th' ? 'ผูกกลุ่มตัวเลือกจากคลัง' : 'Attach Option Groups'}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {language === 'th' ? 'เลือกกลุ่มตัวเลือกที่ต้องการใช้กับเมนูนี้' : 'Select groups to attach to this item'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAttachModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-3 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={attachSearch}
                  onChange={(e) => setAttachSearch(e.target.value)}
                  placeholder={language === 'th' ? 'ค้นหากลุ่มตัวเลือกในคลัง...' : 'Search shared groups...'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Checklist of Shared Groups */}
            <div className="p-3 overflow-y-auto space-y-2 flex-1">
              {filteredLibraryGroups.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  {sharedLibraryGroups.length === 0
                    ? language === 'th'
                      ? 'ยังไม่มีกลุ่มตัวเลือกในคลังส่วนกลาง'
                      : 'No shared groups in library'
                    : language === 'th'
                    ? 'ไม่พบกลุ่มตัวเลือกที่ค้นหา'
                    : 'No groups found'}
                </div>
              ) : (
                filteredLibraryGroups.map((sg) => {
                  const isAttached = optionGroups.some(
                    (g) => g.sharedGroupId === sg.id || (g.isShared && g.id === sg.id)
                  );

                  return (
                    <label
                      key={sg.id}
                      onClick={() => handleToggleAttachSharedGroup(sg)}
                      className={`p-3 rounded-2xl border flex items-start gap-3 transition cursor-pointer ${
                        isAttached
                          ? 'bg-sky-50 border-sky-300 text-sky-950'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isAttached}
                        onChange={() => {}} // handled by label onClick
                        className="mt-0.5 w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                      />

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-xs">
                            {language === 'th' ? sg.name_th : sg.name_en || sg.name_th}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            {sg.type === 'single'
                              ? language === 'th' ? 'เลือก 1 อย่าง' : 'Single'
                              : language === 'th' ? 'เลือกหลายอย่าง' : 'Multi'}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500 truncate">
                          {sg.options.map((o) => (language === 'th' ? o.name_th : o.name_en || o.name_th)).join(', ')}
                        </div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>

            {/* Attach Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsAttachModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                {language === 'th' ? 'เสร็จสิ้น' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
