import React, { useState } from 'react';
import { DiningTable, FloorZone } from '../../types';
import { useI18n } from '../../i18n';
import { sound } from '../../utils/sound';
import {
  X,
  Plus,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  AlertTriangle,
  FolderPlus,
  Check,
} from 'lucide-react';

interface ZoneManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  zones: FloorZone[];
  tables: DiningTable[];
  onAddZone: (name: string) => Promise<void>;
  onRenameZone: (id: string, newName: string) => Promise<void>;
  onReorderZones: (orderedIds: string[]) => Promise<void>;
  onDeleteZone: (zoneName: string, action: 'delete_tables' | 'move_tables', targetZoneName?: string) => Promise<void>;
}

export const ZoneManagerModal: React.FC<ZoneManagerModalProps> = ({
  isOpen,
  onClose,
  zones,
  tables,
  onAddZone,
  onRenameZone,
  onReorderZones,
  onDeleteZone,
}) => {
  const { language } = useI18n();
  const [newZoneName, setNewZoneName] = useState('');
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Zone deletion confirmation state
  const [zoneToDelete, setZoneToDelete] = useState<FloorZone | null>(null);
  const [deleteAction, setDeleteAction] = useState<'delete_tables' | 'move_tables'>('move_tables');
  const [targetZoneName, setTargetZoneName] = useState<string>('');
  const [blockedReason, setBlockedReason] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newZoneName.trim();
    if (!trimmed) return;
    sound.playTap();
    await onAddZone(trimmed);
    setNewZoneName('');
  };

  const handleStartRename = (zone: FloorZone) => {
    setEditingZoneId(zone.id);
    setEditingName(zone.name);
  };

  const handleSaveRename = async (id: string) => {
    const trimmed = editingName.trim();
    if (!trimmed) return;
    sound.playTap();
    await onRenameZone(id, trimmed);
    setEditingZoneId(null);
  };

  const handleMoveUp = async (index: number) => {
    if (index <= 0) return;
    sound.playTap();
    const newOrder = [...zones];
    const temp = newOrder[index - 1];
    newOrder[index - 1] = newOrder[index];
    newOrder[index] = temp;
    await onReorderZones(newOrder.map((z) => z.id));
  };

  const handleMoveDown = async (index: number) => {
    if (index >= zones.length - 1) return;
    sound.playTap();
    const newOrder = [...zones];
    const temp = newOrder[index + 1];
    newOrder[index + 1] = newOrder[index];
    newOrder[index] = temp;
    await onReorderZones(newOrder.map((z) => z.id));
  };

  const handleInitiateDelete = (zone: FloorZone) => {
    sound.playTap();
    setBlockedReason(null);

    // Check if any table in this zone has an open order
    const tablesInZone = tables.filter((t) => t.zone === zone.name);
    const hasOpenOrder = tablesInZone.some(
      (t) => t.status === 'occupied' || t.status === 'billed' || !!t.currentOrderId
    );

    if (hasOpenOrder) {
      setBlockedReason(
        language === 'th'
          ? `ไม่สามารถลบโซน "${zone.name}" ได้ เนื่องจากมีโต๊ะที่มีออเดอร์เปิดอยู่หรือยังไม่ได้ชำระเงิน กรุณาเคลียร์บิลก่อนลบโซน`
          : `Cannot delete zone "${zone.name}" because it contains tables with open or billed orders. Please complete or void open bills first.`
      );
      setZoneToDelete(null);
      return;
    }

    setZoneToDelete(zone);
    const remainingZones = zones.filter((z) => z.id !== zone.id);
    setTargetZoneName(remainingZones[0]?.name || '');
  };

  const handleConfirmDelete = async () => {
    if (!zoneToDelete) return;
    sound.playTap();
    await onDeleteZone(zoneToDelete.name, deleteAction, targetZoneName);
    setZoneToDelete(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs select-none">
      <div className="bg-white border border-slate-200 rounded-3xl p-5 max-w-md w-full shadow-2xl text-slate-900 space-y-4 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {language === 'th' ? 'จัดการโซนที่นั่ง' : 'Manage Floor Zones'}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'th' ? 'เพิ่ม เปลี่ยนชื่อ สลับลำดับ หรือลบโซน' : 'Add, rename, reorder or delete zones'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playTap();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning if deletion blocked */}
        {blockedReason && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <div className="font-bold mb-0.5">
                {language === 'th' ? 'ไม่อนุญาตให้ลบ' : 'Deletion Blocked'}
              </div>
              <p>{blockedReason}</p>
            </div>
          </div>
        )}

        {/* Add Zone Form */}
        <form onSubmit={handleCreateZone} className="flex gap-2">
          <input
            type="text"
            placeholder={language === 'th' ? 'ชื่อโซนใหม่ เช่น Rooftop, VIP 2' : 'New zone name...'}
            value={newZoneName}
            onChange={(e) => setNewZoneName(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition"
          />
          <button
            type="submit"
            disabled={!newZoneName.trim()}
            className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs min-h-[40px]"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'th' ? 'เพิ่ม' : 'Add'}</span>
          </button>
        </form>

        {/* Zones List */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {zones.map((zone, index) => {
            const tableCount = tables.filter((t) => t.zone === zone.name).length;
            const isEditing = editingZoneId === zone.id;

            return (
              <div
                key={zone.id}
                className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
              >
                {isEditing ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1 bg-white border border-orange-500 rounded-lg px-2.5 py-1 text-sm text-slate-900 focus:outline-none"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveRename(zone.id)}
                      className="p-1.5 rounded-lg bg-orange-500 text-white hover:bg-orange-600 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingZoneId(null)}
                      className="p-1.5 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-500 font-bold text-xs flex items-center justify-center">
                        {index + 1}
                      </span>
                      <div>
                        <span className="font-bold text-sm text-slate-900">{zone.name}</span>
                        <span className="text-xs text-slate-400 ml-2">
                          ({tableCount} {language === 'th' ? 'โต๊ะ' : 'tables'})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Reorder Buttons */}
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 disabled:opacity-20 cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === zones.length - 1}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 disabled:opacity-20 cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Rename Button */}
                      <button
                        onClick={() => handleStartRename(zone)}
                        className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200 cursor-pointer"
                        title="Rename"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleInitiateDelete(zone)}
                        disabled={zones.length <= 1}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 disabled:opacity-20 cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Delete Confirmation Sub-Dialog */}
        {zoneToDelete && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
            <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>
                {language === 'th'
                  ? `ต้องการลบโซน "${zoneToDelete.name}" ใช่หรือไม่?`
                  : `Delete zone "${zoneToDelete.name}"?`}
              </span>
            </h4>

            {tables.filter((t) => t.zone === zoneToDelete.name).length > 0 && (
              <div className="space-y-2 text-xs text-slate-700">
                <p>
                  {language === 'th'
                    ? `โซนนี้มีโต๊ะอยู่ ${tables.filter((t) => t.zone === zoneToDelete.name).length} ตัว กรุณาเลือกดำเนินการ:`
                    : `This zone contains ${tables.filter((t) => t.zone === zoneToDelete.name).length} tables. Choose what to do:`}
                </p>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="delAction"
                    checked={deleteAction === 'move_tables'}
                    onChange={() => setDeleteAction('move_tables')}
                    className="accent-orange-500"
                  />
                  <span>
                    {language === 'th' ? 'ย้ายโต๊ะทั้งหมดไปยังโซนอื่น' : 'Move tables to another zone'}
                  </span>
                </label>

                {deleteAction === 'move_tables' && (
                  <select
                    value={targetZoneName}
                    onChange={(e) => setTargetZoneName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 font-medium focus:outline-none"
                  >
                    {zones
                      .filter((z) => z.id !== zoneToDelete.id)
                      .map((z) => (
                        <option key={z.id} value={z.name}>
                          {z.name}
                        </option>
                      ))}
                  </select>
                )}

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="delAction"
                    checked={deleteAction === 'delete_tables'}
                    onChange={() => setDeleteAction('delete_tables')}
                    className="accent-orange-500"
                  />
                  <span className="text-rose-600 font-semibold">
                    {language === 'th' ? 'ลบโต๊ะทั้งหมดในโซนนี้ไปด้วย' : 'Delete all tables in this zone too'}
                  </span>
                </label>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-amber-200">
              <button
                type="button"
                onClick={() => setZoneToDelete(null)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-200 cursor-pointer"
              >
                {language === 'th' ? 'ยกเลิก' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-xs"
              >
                {language === 'th' ? 'ยืนยันลบโซน' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            onClick={() => {
              sound.playTap();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer min-h-[38px]"
          >
            {language === 'th' ? 'ปิดหน้าต่าง' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
