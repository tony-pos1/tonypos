import React, { useState, useMemo } from 'react';
import { Order, OrderStatus, AppSettings } from '../../types';
import { useI18n } from '../../i18n';
import { sound } from '../../utils/sound';
import {
  ReceiptText,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Printer,
  Eye,
  Hash,
  Calendar,
  CalendarRange,
} from 'lucide-react';
import {
  getBusinessDate,
  getCurrentBusinessDate,
  getPreviousBusinessDate,
  getBizDateDaysAgo,
  formatBusinessDate,
  formatMonthYear,
} from '../../utils/businessDay';
import { DateRangePickerModal } from './DateRangePickerModal';

export type DateFilterPreset = 'today' | 'yesterday' | 'last7days' | 'thisMonth' | 'all' | 'custom';

interface OrdersHistoryViewProps {
  orders: Order[];
  onViewReceipt: (order: Order) => void;
  onVoidOrder?: (orderId: string, reason?: string) => Promise<void>;
  settings?: AppSettings | null;
}

export const OrdersHistoryView: React.FC<OrdersHistoryViewProps> = ({
  orders,
  onViewReceipt,
  onVoidOrder,
  settings,
}) => {
  const { t, language } = useI18n();

  const closingTime = settings?.dailyClosingTime || '00:00';
  const currentBizDate = getCurrentBusinessDate(closingTime);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [datePreset, setDatePreset] = useState<DateFilterPreset>('all');
  const [customStartDate, setCustomStartDate] = useState<string>(currentBizDate);
  const [customEndDate, setCustomEndDate] = useState<string>(currentBizDate);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Filter orders by status AND date range AND search query
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // 1. Status filter
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;

      // 2. Date filter using business day logic
      const orderBizDate = getBusinessDate(o.closedAt || o.createdAt, closingTime);
      if (datePreset === 'today') {
        if (orderBizDate !== currentBizDate) return false;
      } else if (datePreset === 'yesterday') {
        const yesterdayBizDate = getPreviousBusinessDate(currentBizDate);
        if (orderBizDate !== yesterdayBizDate) return false;
      } else if (datePreset === 'last7days') {
        const start7 = getBizDateDaysAgo(currentBizDate, 6);
        if (orderBizDate < start7 || orderBizDate > currentBizDate) return false;
      } else if (datePreset === 'thisMonth') {
        const monthPrefix = currentBizDate.slice(0, 7);
        if (!orderBizDate.startsWith(monthPrefix)) return false;
      } else if (datePreset === 'custom') {
        if (customStartDate && orderBizDate < customStartDate) return false;
        if (customEndDate && orderBizDate > customEndDate) return false;
      }

      // 3. Search query
      if (!search.trim()) return true;
      const q = search.toLowerCase().trim();
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        (o.tableName && o.tableName.toLowerCase().includes(q)) ||
        (o.queueNumber && o.queueNumber.toString().includes(q))
      );
    });
  }, [
    orders,
    statusFilter,
    datePreset,
    customStartDate,
    customEndDate,
    search,
    closingTime,
    currentBizDate,
  ]);

  // Total amount of filtered orders
  const totalAmount = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + (o.netTotal || 0), 0);
  }, [filteredOrders]);

  // Formatted date range text to show near the filter chips
  const dateRangeDescription = useMemo(() => {
    if (datePreset === 'all') {
      return language === 'th' ? 'ประวัติทั้งหมด' : 'All time';
    }
    if (datePreset === 'today') {
      return `${language === 'th' ? 'วันนี้' : 'Today'} • ${formatBusinessDate(currentBizDate, language)}`;
    }
    if (datePreset === 'yesterday') {
      const yesterdayBizDate = getPreviousBusinessDate(currentBizDate);
      return `${language === 'th' ? 'เมื่อวาน' : 'Yesterday'} • ${formatBusinessDate(yesterdayBizDate, language)}`;
    }
    if (datePreset === 'last7days') {
      const start7 = getBizDateDaysAgo(currentBizDate, 6);
      return `${formatBusinessDate(start7, language)} - ${formatBusinessDate(currentBizDate, language)}`;
    }
    if (datePreset === 'thisMonth') {
      const monthStr = currentBizDate.slice(0, 7);
      return formatMonthYear(monthStr, language);
    }
    if (datePreset === 'custom') {
      if (customStartDate === customEndDate) {
        return formatBusinessDate(customStartDate, language);
      }
      return `${formatBusinessDate(customStartDate, language)} - ${formatBusinessDate(customEndDate, language)}`;
    }
    return '';
  }, [datePreset, currentBizDate, customStartDate, customEndDate, language]);

  const handleSelectDatePreset = (preset: DateFilterPreset) => {
    sound.playTap();
    if (preset === 'custom') {
      setIsDatePickerOpen(true);
    } else {
      setDatePreset(preset);
    }
  };

  const handleApplyCustomDateRange = (start: string, end: string) => {
    setCustomStartDate(start);
    setCustomEndDate(end);
    setDatePreset('custom');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden text-slate-900 select-none">
      {/* Search & Filters Section */}
      <div className="border-b border-slate-200 bg-white p-3 space-y-2.5 shrink-0 shadow-xs">
        {/* Row 1: Search & Status Filter Chips */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาเลขบิล, โต๊ะ, หรือคิว..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Status Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {(['all', 'paid', 'held', 'open', 'voided'] as const).map((st) => (
              <button
                key={st}
                onClick={() => {
                  sound.playTap();
                  setStatusFilter(st);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition cursor-pointer min-h-[38px] ${
                  statusFilter === st
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {st === 'all'
                  ? t('allCategories')
                  : st === 'paid'
                  ? t('orderStatusPaid')
                  : st === 'held'
                  ? t('orderStatusHeld')
                  : st === 'open'
                  ? t('orderStatusOpen')
                  : t('orderStatusVoided')}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Date Filter Row with Quick Preset Chips & Summary */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-slate-100">
          {/* Date Preset Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {(
              [
                { id: 'today', label: t('filterToday') },
                { id: 'yesterday', label: t('filterYesterday') },
                { id: 'last7days', label: t('filterLast7Days') },
                { id: 'thisMonth', label: t('filterThisMonth') },
                { id: 'all', label: t('filterAllTime') },
                { id: 'custom', label: t('filterCustom'), isCustom: true },
              ] as const
            ).map((item) => {
              const isSelected = datePreset === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectDatePreset(item.id as DateFilterPreset)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer min-h-[36px] shrink-0 ${
                    isSelected
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {'isCustom' in item && <Calendar className="w-3.5 h-3.5" />}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Date Range Description & Filtered Orders Count / Total */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 ml-auto">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700 border border-slate-200">
              <CalendarRange className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              <span className="truncate max-w-[200px]">{dateRangeDescription}</span>
            </div>

            <div className="flex items-center gap-1 px-2.5 py-1 bg-orange-50 rounded-lg text-orange-800 border border-orange-200 font-bold whitespace-nowrap">
              <span>{filteredOrders.length}</span>
              <span className="text-[11px] font-normal text-orange-700">{t('billsCount')}</span>
              <span className="text-orange-300">•</span>
              <span className="text-orange-600">฿{totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {filteredOrders.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <ReceiptText className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-600">
              {datePreset !== 'all'
                ? t('noBillsInPeriod')
                : language === 'th'
                ? 'ไม่พบประวัติการสั่งอาหาร'
                : 'No orders found'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {language === 'th'
                ? 'ลองเปลี่ยนสถานะบิลหรือเลือกช่วงเวลาอื่น'
                : 'Try changing the status or choosing a different date range'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const isPaid = order.status === 'paid';
              const isHeld = order.status === 'held';
              const isVoided = order.status === 'voided';
              const timeStr = new Date(order.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={order.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-orange-200 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {order.queueNumber && (
                        <span className="px-2 py-0.5 rounded-md bg-orange-500 text-white font-black text-xs">
                          Q#{order.queueNumber}
                        </span>
                      )}
                      <span className="font-bold text-sm text-slate-900">
                        {order.tableName || order.orderNumber}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isPaid
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : isHeld
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : isVoided
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-sky-50 text-sky-700 border-sky-200'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{order.orderNumber}</span>
                      <span>•</span>
                      <span>{timeStr}</span>
                      <span>•</span>
                      <span>
                        {order.lines.filter((l) => l.status !== 'voided').length} รายการ
                      </span>
                    </div>
                  </div>

                  {/* Financial Total & Receipt Action */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                    <div className="text-right">
                      <div className="text-xs text-slate-400">{t('netTotal')}</div>
                      <div className="text-base font-black text-orange-600">
                        ฿{order.netTotal.toLocaleString()}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        sound.playTap();
                        onViewReceipt(order);
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200 transition cursor-pointer min-h-[40px]"
                    >
                      <Eye className="w-3.5 h-3.5 text-orange-500" />
                      <span>{t('viewReceipt')}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Custom Date Range Picker Modal */}
      <DateRangePickerModal
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        startDate={customStartDate}
        endDate={customEndDate}
        onApply={handleApplyCustomDateRange}
        closingTime={closingTime}
      />
    </div>
  );
};
