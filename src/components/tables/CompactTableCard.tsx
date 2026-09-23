import React from 'react';
import { DiningTable } from '../../types';
import { useI18n } from '../../i18n';
import { sound } from '../../utils/sound';
import { Clock } from 'lucide-react';

interface CompactTableCardProps {
  table: DiningTable;
  runningTotal?: number;
  onSelect: (table: DiningTable) => void;
}

export const CompactTableCard: React.FC<CompactTableCardProps> = ({
  table,
  runningTotal,
  onSelect,
}) => {
  const { language } = useI18n();

  const isAvailable = table.status === 'available';
  const isOccupied = table.status === 'occupied';
  const isBilled = table.status === 'billed';

  // Calculate elapsed seated time
  let elapsedMinutes = 0;
  if (isOccupied && table.seatedAt) {
    elapsedMinutes = Math.max(0, Math.floor((Date.now() - table.seatedAt) / 60000));
  }

  // Format running total
  const displayTotal = runningTotal || table.runningTotal || 0;

  return (
    <div
      onClick={() => {
        sound.playTap();
        onSelect(table);
      }}
      className={`p-2.5 sm:p-3 rounded-2xl border-2 transition-all flex flex-col justify-between min-h-[76px] cursor-pointer select-none shadow-xs hover:shadow-md active:scale-[0.98] ${
        isAvailable
          ? 'bg-white border-slate-200 hover:border-emerald-500 text-slate-800'
          : isOccupied
          ? 'bg-orange-50/50 border-orange-500 hover:border-orange-600 text-orange-950 ring-1 ring-orange-500/20'
          : isBilled
          ? 'bg-sky-50/50 border-sky-500 hover:border-sky-600 text-sky-950 ring-1 ring-sky-500/20'
          : 'bg-slate-50 border-slate-200 text-slate-500'
      }`}
    >
      {/* Top row: Table name & Status indicator */}
      <div className="flex items-center justify-between gap-1.5">
        <span className="text-sm sm:text-base font-black tracking-tight leading-none text-slate-900 truncate">
          {table.name}
        </span>

        <div className="flex items-center gap-1 shrink-0">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isAvailable
                ? 'bg-emerald-500'
                : isOccupied
                ? 'bg-orange-500 animate-pulse'
                : isBilled
                ? 'bg-sky-500'
                : 'bg-slate-400'
            }`}
          />
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
              isAvailable
                ? 'bg-emerald-50 text-emerald-700'
                : isOccupied
                ? 'bg-orange-100 text-orange-800'
                : isBilled
                ? 'bg-sky-100 text-sky-800'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {isAvailable
              ? language === 'th'
                ? 'ว่าง'
                : 'Free'
              : isOccupied
              ? language === 'th'
                ? 'ไม่ว่าง'
                : 'Busy'
              : isBilled
              ? language === 'th'
                ? 'รอเช็คบิล'
                : 'Billed'
              : table.status}
          </span>
        </div>
      </div>

      {/* Bottom row: Running total and/or seated time */}
      <div className="flex items-end justify-between gap-1 text-xs pt-1">
        {isOccupied || isBilled ? (
          <>
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              {isOccupied && table.seatedAt && (
                <>
                  <Clock className="w-3 h-3 text-orange-500" />
                  <span>
                    {elapsedMinutes} {language === 'th' ? 'น.' : 'm'}
                  </span>
                </>
              )}
            </div>

            <div className="text-right">
              <span className="text-xs sm:text-sm font-black text-orange-600">
                ฿{displayTotal.toLocaleString()}
              </span>
            </div>
          </>
        ) : (
          <div className="text-[11px] text-slate-400 font-medium">
            {table.zone}
          </div>
        )}
      </div>
    </div>
  );
};
