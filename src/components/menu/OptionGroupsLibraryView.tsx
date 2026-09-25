import React, { useState } from 'react';
import { MenuItem, OptionGroup } from '../../types';
import { useI18n } from '../../i18n';
import { sound } from '../../utils/sound';
import { useReorder } from '../../utils/reorder';
import { menuRepo } from '../../db/repositories';
import { OptionGroupEditorModal } from './OptionGroupEditorModal';
import {
  Sliders,
  Plus,
  Edit2,
  Trash2,
  Copy,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Search,
  CheckCircle2,
  AlertTriangle,
  Link as LinkIcon,
  Tag,
} from 'lucide-react';

interface OptionGroupsLibraryViewProps {
  groups: OptionGroup[];
  items: MenuItem[];
  onRefreshData: () => Promise<void>;
}

export const OptionGroupsLibraryView: React.FC<OptionGroupsLibraryViewProps> = ({
  groups,
  items,
  onRefreshData,
}) => {
  const { language } = useI18n();

  const [search, setSearch] = useState('');
  const [editingGroup, setEditingGroup] = useState<OptionGroup | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Group reordering hook
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
    items: groups,
    onReorder: async (newGroups) => {
      sound.playTap();
      const orderedIds = newGroups.map((g) => g.id);
      await menuRepo.reorderSharedOptionGroups(orderedIds);
      await onRefreshData();
    },
    attributeName: 'data-group-index',
  });

  // Calculate which items use each group
  const getItemsCountUsingGroup = (groupId: string): number => {
    return items.filter((item) =>
      item.optionGroups?.some(
        (g) => g.sharedGroupId === groupId || (g.isShared && g.id === groupId)
      )
    ).length;
  };

  const handleOpenCreate = () => {
    sound.playTap();
    setEditingGroup(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (group: OptionGroup) => {
    sound.playTap();
    setEditingGroup(group);
    setIsModalOpen(true);
  };

  const handleDuplicateGroup = async (group: OptionGroup) => {
    sound.playTap();
    await menuRepo.duplicateSharedOptionGroup(group.id);
    await onRefreshData();
  };

  const handleDeleteGroup = async (group: OptionGroup) => {
    sound.playTap();
    const usingCount = getItemsCountUsingGroup(group.id);

    if (usingCount > 0) {
      const confirmMessage =
        language === 'th'
          ? `⚠️ คำเตือน: กลุ่มตัวเลือก "${group.name_th}" กำลังถูกผูกใช้งานในเมนูอาหารจำนวน ${usingCount} รายการ!\n\nหากคุณยืนยันการลบ ระบบจะถอดกลุ่มตัวเลือกนี้ออกจากเมนูอาหารทั้งหมดโดยอัตโนมัติ (ประวัติบิลและยอดขายเดิมจะไม่ได้รับผลกระทบ)\n\nคุณต้องการลบกลุ่มตัวเลือกนี้ใช่หรือไม่?`
          : `⚠️ WARNING: The option group "${group.name_en || group.name_th}" is currently attached to ${usingCount} menu items!\n\nIf you delete it, it will be automatically removed from all those menu items (past orders/bills are unaffected).\n\nDo you want to proceed with deleting this group?`;

      if (!window.confirm(confirmMessage)) {
        return;
      }
    } else {
      const confirmMessage =
        language === 'th'
          ? `คุณต้องการลบกลุ่มตัวเลือก "${group.name_th}" ใช่หรือไม่?`
          : `Delete option group "${group.name_en || group.name_th}"?`;

      if (!window.confirm(confirmMessage)) {
        return;
      }
    }

    await menuRepo.deleteSharedOptionGroup(group.id);
    await onRefreshData();
  };

  const handleSaveGroup = async (savedGroup: OptionGroup) => {
    if (editingGroup) {
      await menuRepo.updateSharedOptionGroup(savedGroup.id, savedGroup);
    } else {
      await menuRepo.addSharedOptionGroup(savedGroup);
    }
    await onRefreshData();
  };

  const filteredGroups = groups.filter((g) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      g.name_th.toLowerCase().includes(q) ||
      g.name_en.toLowerCase().includes(q) ||
      g.options.some((o) => o.name_th.toLowerCase().includes(q) || o.name_en.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden select-none">
      {/* Top Bar */}
      <div className="p-4 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-orange-600" />
            <h2 className="text-base font-bold text-slate-900">
              {language === 'th' ? 'คลังกลุ่มตัวเลือกส่วนกลาง (Option Groups Library)' : 'Option Groups Library'}
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
              {groups.length} {language === 'th' ? 'กลุ่ม' : 'groups'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'th'
              ? 'สร้างกลุ่มตัวเลือกส่วนกลางครั้งเดียว แล้วผูกใช้กับหลายเมนูอาหารได้ทันที แก้ไขที่นี่จะอัปเดตทุกเมนูพร้อมกัน'
              : 'Create once, attach across multiple menu items, and update everywhere instantly'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search box */}
          <div className="relative w-48 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={language === 'th' ? 'ค้นหากลุ่มตัวเลือก...' : 'Search option groups...'}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
            />
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-xs transition cursor-pointer min-h-[38px]"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'th' ? 'สร้างกลุ่มตัวเลือกใหม่' : 'New Option Group'}</span>
          </button>
        </div>
      </div>

      {/* Main List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
        {filteredGroups.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <Sliders className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-600">
              {groups.length === 0
                ? language === 'th'
                  ? 'ยังไม่มีกลุ่มตัวเลือกส่วนกลาง'
                  : 'No option groups yet'
                : language === 'th'
                ? 'ไม่พบกลุ่มตัวเลือกที่ค้นหา'
                : 'No option groups matched your search'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {language === 'th'
                ? 'กดปุ่ม "+ สร้างกลุ่มตัวเลือกใหม่" ด้านบนเพื่อเพิ่ม'
                : 'Click "+ New Option Group" above to add one'}
            </p>
          </div>
        ) : (
          filteredGroups.map((group, idx) => {
            const usingCount = getItemsCountUsingGroup(group.id);
            const isDraggingThis = dragIndex === idx;
            const isDropTarget = dropTargetIndex === idx && dragIndex !== null && dragIndex !== idx;

            return (
              <div key={group.id} data-group-index={idx}>
                {/* Visual drop indicator bar */}
                {isDropTarget && dragIndex !== null && dragIndex > idx && (
                  <div className="h-1.5 bg-orange-500 rounded-full my-1.5 shadow-xs animate-pulse" />
                )}

                <div
                  className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
                    isDraggingThis
                      ? 'opacity-40 bg-orange-50 border-orange-300'
                      : 'bg-white border-slate-200 hover:border-orange-200'
                  }`}
                  onDragOver={(e) => handleDragOver(idx, e)}
                  onDrop={(e) => handleDrop(idx, e)}
                >
                  {/* Left: Drag handle, Arrows, and Title */}
                  <div className="flex items-start sm:items-center gap-3">
                    {/* Drag Handle & Arrow buttons */}
                    <div className="flex items-center gap-1 shrink-0 pt-0.5 sm:pt-0">
                      <div
                        draggable={true}
                        onDragStart={(e) => handleDragStart(idx, e)}
                        onDragEnd={handleDragEnd}
                        onTouchStart={(e) => handleTouchStart(idx, e)}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        className="p-1.5 text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing touch-none rounded-lg hover:bg-slate-100"
                        title={language === 'th' ? 'กดค้างแล้วลากเพื่อเรียงลำดับ' : 'Hold and drag to reorder'}
                      >
                        <GripVertical className="w-4 h-4" />
                      </div>

                      <div className="flex flex-col">
                        <button
                          type="button"
                          onClick={() => moveUp(idx)}
                          disabled={idx === 0}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed hover:bg-slate-100 rounded"
                          title="Move up"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveDown(idx)}
                          disabled={idx === groups.length - 1}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed hover:bg-slate-100 rounded"
                          title="Move down"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Group Info */}
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {language === 'th' ? group.name_th : group.name_en || group.name_th}
                        </span>
                        {group.name_en && language === 'th' && (
                          <span className="text-xs text-slate-400">({group.name_en})</span>
                        )}

                        {/* Type Badge */}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            group.type === 'single'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-purple-50 text-purple-700 border-purple-200'
                          }`}
                        >
                          {group.type === 'single'
                            ? language === 'th' ? 'เลือกได้ 1 อย่าง (Single)' : 'Single Choice'
                            : language === 'th' ? 'เลือกได้หลายอย่าง (Multiple)' : 'Multiple Choices'}
                        </span>

                        {group.required && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                            {language === 'th' ? 'จำเป็นต้องเลือก' : 'Required'}
                          </span>
                        )}

                        {/* Items usage badge */}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                            usingCount > 0
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          <LinkIcon className="w-3 h-3" />
                          <span>
                            {usingCount > 0
                              ? language === 'th' ? `ใช้ใน ${usingCount} เมนู` : `Used in ${usingCount} items`
                              : language === 'th' ? 'ยังไม่ได้ผูกใช้' : 'Not attached'}
                          </span>
                        </span>
                      </div>

                      {/* Choices summary */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {group.options.map((opt) => (
                          <span
                            key={opt.id}
                            className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg border ${
                              opt.isAvailable === false
                                ? 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                                : 'bg-slate-50 text-slate-700 border-slate-200'
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
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-1 ml-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(group)}
                      className="p-2 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition cursor-pointer"
                      title={language === 'th' ? 'แก้ไขกลุ่มตัวเลือก' : 'Edit group'}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDuplicateGroup(group)}
                      className="p-2 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition cursor-pointer"
                      title={language === 'th' ? 'คัดลอกกลุ่มตัวเลือก' : 'Duplicate group'}
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteGroup(group)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                      title={language === 'th' ? 'ลบกลุ่มตัวเลือก' : 'Delete group'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Visual drop indicator bar */}
                {isDropTarget && dragIndex !== null && dragIndex < idx && (
                  <div className="h-1.5 bg-orange-500 rounded-full my-1.5 shadow-xs animate-pulse" />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Editor Modal */}
      <OptionGroupEditorModal
        group={editingGroup}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveGroup}
      />
    </div>
  );
};
