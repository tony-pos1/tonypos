import React, { useState, useEffect } from 'react';
import { useI18n } from '../../i18n';
import { sound } from '../../utils/sound';
import {
  formatBusinessDate,
  getCurrentBusinessDate,
  getPreviousBusinessDate,
  getBizDateDaysAgo,
} from '../../utils/businessDay';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  RotateCcw,
} from 'lucide-react';

interface DateRangePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  onApply: (startDate: string, endDate: string) => void;
  closingTime?: string;
}

export const DateRangePickerModal: React.FC<DateRangePickerModalProps> = ({
  isOpen,
  onClose,
  startDate,
  endDate,
  onApply,
  closingTime = '00:00',
}) => {
  const { t, language } = useI18n();

  const currentBizDate = getCurrentBusinessDate(closingTime);

  // Parse initial view month and year
  const initialDateObj = startDate ? new Date(startDate) : new Date(currentBizDate);
  const [viewYear, setViewYear] = useState<number>(initialDateObj.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDateObj.getMonth()); // 0-indexed

  const [tempStart, setTempStart] = useState<string | null>(startDate || currentBizDate);
  const [tempEnd, setTempEnd] = useState<string | null>(endDate || currentBizDate);
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const base = startDate ? new Date(startDate) : new Date(currentBizDate);
      if (!isNaN(base.getTime())) {
        setViewYear(base.getFullYear());
        setViewMonth(base.getMonth());
      }
      setTempStart(startDate || currentBizDate);
      setTempEnd(endDate || currentBizDate);
    }
  }, [isOpen, startDate, endDate, currentBizDate]);

  if (!isOpen) return null;

  // Month navigation
  const handlePrevMonth = () => {
    sound.playTap();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    sound.playTap();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Month name display
  const monthHeaderDate = new Date(viewYear, viewMonth, 1);
  const monthYearLabel = monthHeaderDate.toLocaleDateString(
    language === 'th' ? 'th-TH' : 'en-US',
    { month: 'long', year: 'numeric' }
  );

  // Days grid calculation
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun, 1 = Mon ...
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const weekDayNames =
    language === 'th'
      ? ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
      : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Handle clicking a day cell
  const handleDateClick = (dateStr: string) => {
    sound.playTap();
    if (!tempStart || (tempStart && tempEnd)) {
      // Start a fresh range
      setTempStart(dateStr);
      setTempEnd(null);
    } else if (tempStart && !tempEnd) {
      // User is picking the end date
      if (dateStr < tempStart) {
        // Clicked date is earlier than start: swap them
        setTempEnd(tempStart);
        setTempStart(dateStr);
      } else {
        setTempEnd(dateStr);
      }
    }
  };

  // Quick Shortcuts
  const handleShortcutToday = () => {
    sound.playTap();
    setTempStart(currentBizDate);
    setTempEnd(currentBizDate);
    const d = new Date(currentBizDate);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const handleShortcutYesterday = () => {
    sound.playTap();
    const yest = getPreviousBusinessDate(currentBizDate);
    setTempStart(yest);
    setTempEnd(yest);
    const d = new Date(yest);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const handleShortcutLast7Days = () => {
    sound.playTap();
    const s7 = getBizDateDaysAgo(currentBizDate, 6);
    setTempStart(s7);
    setTempEnd(currentBizDate);
    const d = new Date(s7);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const handleShortcutThisMonth = () => {
    sound.playTap();
    const mStart = `${currentBizDate.slice(0, 7)}-01`;
    setTempStart(mStart);
    setTempEnd(currentBizDate);
    const d = new Date(currentBizDate);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  // Apply action
  const handleApply = () => {
    sound.playTap();
    const finalStart = tempStart || currentBizDate;
    // If only one date was picked, treat as single day (start = end = that day)
    const finalEnd = tempEnd || finalStart;
    onApply(finalStart, finalEnd);
    onClose();
  };

  // Preview range text
  const getSelectedRangeText = () => {
    if (!tempStart) return language === 'th' ? 'กรุณาเลือกวันที่' : 'Please select a date';
    const effectiveEnd = tempEnd || tempStart;
    if (tempStart === effectiveEnd) {
      return formatBusinessDate(tempStart, language);
    }
    return `${formatBusinessDate(tempStart, language)} - ${formatBusinessDate(effectiveEnd, language)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 select-none animate-in fade-in duration-150">
      {/* Dimmed Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={() => {
          sound.playTap();
          onClose();
        }}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-sm sm:max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-xs">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                {t('selectDateRange')}
              </h3>
              <p className="text-[11px] font-semibold text-orange-600 truncate max-w-[220px]">
                {getSelectedRangeText()}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              sound.playTap();
              onClose();
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
            title={t('cancelFilter')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preset Shortcuts */}
        <div className="px-4 py-2 bg-white border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={handleShortcutToday}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-orange-50 hover:text-orange-600 text-slate-700 transition shrink-0 cursor-pointer"
          >
            {t('filterToday')}
          </button>
          <button
            type="button"
            onClick={handleShortcutYesterday}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-orange-50 hover:text-orange-600 text-slate-700 transition shrink-0 cursor-pointer"
          >
            {t('filterYesterday')}
          </button>
          <button
            type="button"
            onClick={handleShortcutLast7Days}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-orange-50 hover:text-orange-600 text-slate-700 transition shrink-0 cursor-pointer"
          >
            {t('filterLast7Days')}
          </button>
          <button
            type="button"
            onClick={handleShortcutThisMonth}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-orange-50 hover:text-orange-600 text-slate-700 transition shrink-0 cursor-pointer"
          >
            {t('filterThisMonth')}
          </button>
        </div>

        {/* Month Navigation & Grid */}
        <div className="p-4 sm:p-5 space-y-3">
          {/* Month & Year Navigation Header */}
          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              title="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-sm font-bold text-slate-800">
              {monthYearLabel}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              title="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Names Header */}
          <div className="grid grid-cols-7 text-center">
            {weekDayNames.map((wName, idx) => (
              <div
                key={idx}
                className="py-1 text-[11px] font-bold text-slate-400"
              >
                {wName}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-y-1 text-center">
            {/* Blank cells before 1st of month */}
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div key={`blank-${idx}`} className="h-9" />
            ))}

            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;

              const isStart = tempStart === dateStr;
              const isEnd = (tempEnd || tempStart) === dateStr;
              const isSingleSelected = tempStart === dateStr && (!tempEnd || tempEnd === tempStart);

              // Inside selected range
              const effectiveEnd = tempEnd || (hoverDate && hoverDate >= (tempStart || '') ? hoverDate : null);
              const isInRange =
                tempStart &&
                effectiveEnd &&
                dateStr > tempStart &&
                dateStr < effectiveEnd;

              const isToday = dateStr === currentBizDate;

              return (
                <div
                  key={dateStr}
                  className={`h-9 flex items-center justify-center p-0.5 ${
                    isInRange
                      ? 'bg-orange-100/70 dark:bg-orange-950/40 text-orange-900'
                      : isStart && tempEnd && tempEnd !== tempStart
                      ? 'rounded-l-xl bg-orange-100/70'
                      : isEnd && tempStart && tempEnd !== tempStart
                      ? 'rounded-r-xl bg-orange-100/70'
                      : ''
                  }`}
                  onMouseEnter={() => {
                    if (tempStart && !tempEnd) {
                      setHoverDate(dateStr);
                    }
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleDateClick(dateStr)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center relative cursor-pointer ${
                      isStart || isEnd
                        ? 'bg-orange-500 text-white shadow-xs'
                        : isInRange
                        ? 'text-orange-950 font-bold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{dayNum}</span>
                    {isToday && !(isStart || isEnd) && (
                      <span className="w-1 h-1 rounded-full bg-orange-500 absolute bottom-1" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="pt-2 text-center text-[11px] text-slate-400">
            {language === 'th'
              ? 'คลิกวันที่เริ่มต้น แล้วคลิกวันที่สิ้นสุด (หรือเลือกวันเดียว)'
              : 'Click start date then end date (or pick a single day)'}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={() => {
              sound.playTap();
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer min-h-[38px]"
          >
            {t('cancelFilter')}
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-xs flex items-center gap-1.5 transition cursor-pointer min-h-[38px]"
          >
            <Check className="w-4 h-4" />
            <span>{t('applyFilter')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
