import React from 'react';
import { AppSettings, DiningTable, Order } from '../../types';
import { useI18n } from '../../i18n';
import { sound } from '../../utils/sound';
import { getBusinessDate, getCurrentBusinessDate } from '../../utils/businessDay';
import {
  TrendingUp,
  Receipt,
  Users,
  UtensilsCrossed,
  DollarSign,
  ArrowUpRight,
  Clock,
  LayoutGrid,
  Zap,
  BarChart2,
} from 'lucide-react';

interface DashboardViewProps {
  orders: Order[];
  tables: DiningTable[];
  settings?: AppSettings;
  onNavigateToTables: () => void;
  onNavigateToPOS: () => void;
  onNavigateToReports: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  orders,
  tables,
  settings,
  onNavigateToTables,
  onNavigateToPOS,
  onNavigateToReports,
}) => {
  const { language } = useI18n();

  // Calculate metrics for today using business day rule
  const closingTime = settings?.dailyClosingTime || '00:00';
  const currentBizDate = getCurrentBusinessDate(closingTime);

  const todayOrders = orders.filter((o) => getBusinessDate(o.closedAt || o.createdAt, closingTime) === currentBizDate);
  const paidOrders = todayOrders.filter((o) => o.status === 'paid');
  const todayRevenue = paidOrders.reduce((sum, o) => sum + o.netTotal, 0);
  const averageTicket = paidOrders.length > 0 ? todayRevenue / paidOrders.length : 0;

  // Active occupied tables
  const occupiedTables = tables.filter((t) => t.status === 'occupied' || t.status === 'billed');
  const availableTables = tables.filter((t) => t.status === 'available');

  // Top selling items calculation
  const itemMap: { [name: string]: { count: number; total: number } } = {};
  todayOrders.forEach((o) => {
    o.lines.forEach((l) => {
      if (l.status !== 'voided') {
        const name = language === 'th' ? l.name_th : l.name_en;
        if (!itemMap[name]) itemMap[name] = { count: 0, total: 0 };
        itemMap[name].count += l.quantity;
        itemMap[name].total += l.unitPrice * l.quantity;
      }
    });
  });

  const topItems = Object.entries(itemMap)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 overflow-y-auto select-none scrollbar-thin text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-orange-500" />
            <span>{language === 'th' ? 'ภาพรวมร้านวันนี้ (Dashboard)' : 'Today Overview'}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {new Date().toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playTap();
              onNavigateToTables();
            }}
            className="px-3 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <LayoutGrid className="w-4 h-4" />
            <span>{language === 'th' ? 'ผังโต๊ะ' : 'Floor Plan'}</span>
          </button>

          <button
            onClick={() => {
              sound.playTap();
              onNavigateToPOS();
            }}
            className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Zap className="w-4 h-4 text-orange-500" />
            <span>{language === 'th' ? 'สั่งอาหาร' : 'Take Order'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {/* Revenue */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">
              {language === 'th' ? 'ยอดขายวันนี้' : "Today's Sales"}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            ฿{todayRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-0.5">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{paidOrders.length} {language === 'th' ? 'บิลชำระแล้ว' : 'paid bills'}</span>
          </div>
        </div>

        {/* Occupied Tables */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">
              {language === 'th' ? 'โต๊ะที่กำลังใช้งาน' : 'Occupied Tables'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {occupiedTables.length} / {tables.length}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            {language === 'th' ? `ว่าง ${availableTables.length} โต๊ะ` : `${availableTables.length} tables available`}
          </div>
        </div>

        {/* Average Ticket */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">
              {language === 'th' ? 'ยอดเฉลี่ยต่อบิล' : 'Avg. Ticket'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            ฿{averageTicket.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            {language === 'th' ? 'เฉลี่ยทุกช่องทาง' : 'Across all channels'}
          </div>
        </div>

        {/* Open Orders */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">
              {language === 'th' ? 'ออเดอร์เปิดอยู่' : 'Open Orders'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {todayOrders.filter((o) => o.status === 'open' || o.status === 'held').length}
          </div>
          <div className="text-[11px] text-purple-600 font-medium mt-1">
            {language === 'th' ? 'รอการชำระเงิน' : 'Pending payment'}
          </div>
        </div>
      </div>

      {/* Grid: Top Selling Items & Table Occupancy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
        {/* Top Sellers */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-orange-500" />
              <span>{language === 'th' ? 'เมนูขายดีประจำวัน' : 'Top Selling Dishes'}</span>
            </h3>
            <button
              onClick={() => {
                sound.playTap();
                onNavigateToReports();
              }}
              className="text-xs font-bold text-orange-600 hover:underline cursor-pointer"
            >
              {language === 'th' ? 'ดูรายงานเต็ม →' : 'Full Report →'}
            </button>
          </div>

          <div className="flex-1 space-y-2.5">
            {topItems.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                {language === 'th' ? 'ยังไม่มีข้อมูลการขายวันนี้' : 'No sales recorded yet today'}
              </div>
            ) : (
              topItems.map(([name, data], idx) => (
                <div
                  key={name}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400 font-black flex items-center justify-center text-xs">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 dark:text-white">
                      ฿{data.total.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-slate-400 ml-1.5 font-medium">
                      ({data.count} {language === 'th' ? 'จาน' : 'orders'})
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Table Status List */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-orange-500" />
              <span>{language === 'th' ? 'สถานะโต๊ะล่าสุด' : 'Live Table Status'}</span>
            </h3>
            <button
              onClick={() => {
                sound.playTap();
                onNavigateToTables();
              }}
              className="text-xs font-bold text-orange-600 hover:underline cursor-pointer"
            >
              {language === 'th' ? 'เปิดผังโต๊ะ →' : 'Open Floor Plan →'}
            </button>
          </div>

          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2 overflow-y-auto max-h-72">
            {tables.map((t) => (
              <div
                key={t.id}
                onClick={() => {
                  sound.playTap();
                  onNavigateToTables();
                }}
                className={`p-2.5 rounded-2xl border transition cursor-pointer text-xs flex flex-col justify-between ${
                  t.status === 'occupied'
                    ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-300 dark:border-orange-800 text-orange-950 dark:text-orange-200'
                    : t.status === 'billed'
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-200'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between font-black">
                  <span>{t.name}</span>
                  <span className="text-[10px] font-normal opacity-75">{t.seats} ที่นั่ง</span>
                </div>
                <div className="mt-1 font-bold text-[11px]">
                  {t.status === 'occupied'
                    ? `฿${(t.runningTotal || 0).toLocaleString()}`
                    : t.status === 'billed'
                    ? (language === 'th' ? 'รอเช็คบิล' : 'Billed')
                    : (language === 'th' ? 'ว่าง' : 'Available')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
