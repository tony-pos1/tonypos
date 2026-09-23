import React, { useState } from 'react';
import { DiningTable, OrderType } from '../../types';
import { useI18n } from '../../i18n';
import { sound } from '../../utils/sound';
import {
  X,
  BookmarkCheck,
  ShoppingBag,
  Utensils,
  PauseCircle,
  Check,
  MapPin,
  Clock,
} from 'lucide-react';

interface AssignTableModalProps {
  isOpen: boolean;
  tables: DiningTable[];
  currentTableId?: string;
  currentOrderType: OrderType;
  onClose: () => void;
  onAssignTakeaway: () => void;
  onAssignTable: (table: DiningTable) => void;
  onHoldOnly: () => void;
}

export const AssignTableModal: React.FC<AssignTableModalProps> = ({
  isOpen,
  tables,
  currentTableId,
  currentOrderType,
  onClose,
  onAssignTakeaway,
  onAssignTable,
  onHoldOnly,
}) => {
  const { t, language } = useI18n();
  const [selectedZone, setSelectedZone] = useState<string>('all');

  if (!isOpen) return null;

  // Filter only actual tables (not standalone decorative chairs)
  const orderableTables = tables.filter((t) => t.itemType !== 'chair');

  // Zones list
  const zones = Array.from(new Set(orderableTables.map((t) => t.zone).filter(Boolean))) as string[];

  const filteredTables = orderableTables.filter((table) => {
    if (selectedZone === 'all') return true;
    return table.zone === selectedZone;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-3 sm:p-5 backdrop-blur-xs select-none animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl text-slate-900 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
              <BookmarkCheck className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                {language === 'th' ? 'บันทึกออเดอร์ (Save Order)' : 'Save Order'}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'th'
                  ? 'เลือกบันทึกลงโต๊ะอาหาร หรือสั่งกลับบ้าน / พักบิล'
                  : 'Assign order to a table, takeaway queue, or hold'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Assignment Actions (Takeaway & Park) */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 grid grid-cols-2 gap-3 shrink-0">
          {/* Takeaway / Counter Option */}
          <button
            onClick={() => {
              sound.playTap();
              onAssignTakeaway();
            }}
            className="p-3.5 rounded-2xl border-2 border-orange-500/80 bg-orange-50 hover:bg-orange-100/70 text-left transition cursor-pointer shadow-xs active:scale-[0.99] flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-orange-950 flex items-center gap-1.5">
                <span>{language === 'th' ? 'สั่งกลับบ้าน (Takeaway)' : 'Takeaway / To-Go'}</span>
              </div>
              <div className="text-[11px] text-orange-800/80 mt-0.5">
                {language === 'th' ? 'ออกบัตรคิว Q# อัตโนมัติ' : 'Auto queue ticket'}
              </div>
            </div>
          </button>

          {/* Just Hold / Park Order */}
          <button
            onClick={() => {
              sound.playTap();
              onHoldOnly();
            }}
            className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-100 text-left transition cursor-pointer shadow-xs active:scale-[0.99] flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <PauseCircle className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">
                {language === 'th' ? 'พักบิลไว้ก่อน (Park Order)' : 'Park / Hold'}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {language === 'th' ? 'เรียกกลับมาทำต่อได้ตลอด' : 'Resume anytime'}
              </div>
            </div>
          </button>
        </div>

        {/* Section: Assign to Table */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Utensils className="w-4 h-4 text-orange-600" />
              <span>{language === 'th' ? 'ระบุโต๊ะอาหาร (Dine In Table)' : 'Select Table'}</span>
            </div>

            {/* Zone Filter Filter Pills */}
            {zones.length > 0 && (
              <div className="flex items-center gap-1 overflow-x-auto">
                <button
                  onClick={() => setSelectedZone('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    selectedZone === 'all'
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {language === 'th' ? 'ทั้งหมด' : 'All'}
                </button>
                {zones.map((zone) => (
                  <button
                    key={zone}
                    onClick={() => setSelectedZone(zone)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer whitespace-nowrap ${
                      selectedZone === zone
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {zone}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tables Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 pt-1">
            {filteredTables.map((table) => {
              const isCurrent = currentTableId === table.id;
              const isAvailable = table.status === 'available';
              const isOccupied = table.status === 'occupied';

              return (
                <button
                  key={table.id}
                  onClick={() => {
                    sound.playTap();
                    onAssignTable(table);
                  }}
                  className={`p-3 rounded-2xl border-2 text-left transition flex flex-col justify-between min-h-[72px] cursor-pointer shadow-xs active:scale-[0.98] ${
                    isCurrent
                      ? 'bg-orange-500 border-orange-600 text-white shadow-md'
                      : isAvailable
                      ? 'bg-white border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/20 text-slate-800'
                      : isOccupied
                      ? 'bg-orange-50/60 border-orange-300 hover:border-orange-500 text-orange-950'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm">{table.name}</span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isCurrent
                          ? 'bg-white'
                          : isAvailable
                          ? 'bg-emerald-500'
                          : isOccupied
                          ? 'bg-orange-500'
                          : 'bg-sky-500'
                      }`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] mt-2">
                    <span className={isCurrent ? 'text-orange-100' : 'text-slate-400'}>
                      {table.zone || 'Zone'}
                    </span>
                    <span
                      className={`font-semibold ${
                        isCurrent
                          ? 'text-white'
                          : isAvailable
                          ? 'text-emerald-700'
                          : isOccupied
                          ? 'text-orange-700'
                          : 'text-slate-500'
                      }`}
                    >
                      {isCurrent
                        ? 'โต๊ะนี้'
                        : isAvailable
                        ? t('tableAvailable')
                        : t('tableOccupied')}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};
