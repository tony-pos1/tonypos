import React, { useState, useEffect, useMemo } from 'react';
import { AppSettings, DailyCloseSummary, MenuCategory, Order } from '../../types';
import { useI18n } from '../../i18n';
import { sound } from '../../utils/sound';
import { dailyCloseRepo } from '../../db/repositories';
import {
  getBusinessDate,
  getPreviousBusinessDate,
  getNextBusinessDate,
  getPreviousMonth,
  getNextMonth,
  formatBusinessDate,
  formatMonthYear,
  getCurrentBusinessDate,
} from '../../utils/businessDay';
import {
  BarChart3,
  TrendingUp,
  Receipt,
  Download,
  Share2,
  Calendar,
  Banknote,
  QrCode,
  CreditCard,
  Utensils,
  Percent,
  ChevronLeft,
  ChevronRight,
  Archive,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Award,
  AlertCircle,
  Clock,
  CheckCircle2,
  X,
  FileSpreadsheet,
} from 'lucide-react';

interface ReportsViewProps {
  orders: Order[];
  settings?: AppSettings;
  categories?: MenuCategory[];
}

type ReportPeriod = 'day' | 'month' | 'year';

export const ReportsView: React.FC<ReportsViewProps> = ({
  orders,
  settings,
  categories = [],
}) => {
  const { t, language } = useI18n();
  const closingTime = settings?.dailyClosingTime || '00:00';

  // Active Main Tab: 'sales' | 'closed_days'
  const [activeTab, setActiveTab] = useState<'sales' | 'closed_days'>('sales');

  // Period Selector State
  const [periodType, setPeriodType] = useState<ReportPeriod>('day');

  // Selected date strings
  const todayBiz = useMemo(() => getCurrentBusinessDate(closingTime), [closingTime]);
  const currentMonthBiz = useMemo(() => todayBiz.slice(0, 7), [todayBiz]);
  const currentYearBiz = useMemo(() => todayBiz.slice(0, 4), [todayBiz]);

  const [selectedDay, setSelectedDay] = useState<string>(todayBiz);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthBiz);
  const [selectedYear, setSelectedYear] = useState<string>(currentYearBiz);

  // Closed Days state
  const [closedDays, setClosedDays] = useState<DailyCloseSummary[]>([]);
  const [selectedClosedDay, setSelectedClosedDay] = useState<DailyCloseSummary | null>(null);

  // Hover state for interactive chart tooltip
  const [hoveredBar, setHoveredBar] = useState<{ label: string; value: number; count: number } | null>(null);

  useEffect(() => {
    dailyCloseRepo.getDailyClosings().then(setClosedDays);
  }, [activeTab]);

  // Navigate Previous Period
  const handlePrevPeriod = () => {
    sound.playTap();
    if (periodType === 'day') {
      setSelectedDay((prev) => getPreviousBusinessDate(prev));
    } else if (periodType === 'month') {
      setSelectedMonth((prev) => getPreviousMonth(prev));
    } else {
      setSelectedYear((prev) => String(parseInt(prev, 10) - 1));
    }
  };

  // Navigate Next Period
  const handleNextPeriod = () => {
    sound.playTap();
    if (periodType === 'day') {
      setSelectedDay((prev) => getNextBusinessDate(prev));
    } else if (periodType === 'month') {
      setSelectedMonth((prev) => getNextMonth(prev));
    } else {
      setSelectedYear((prev) => String(parseInt(prev, 10) + 1));
    }
  };

  // Reset to Current Period
  const handleCurrentPeriod = () => {
    sound.playTap();
    if (periodType === 'day') setSelectedDay(todayBiz);
    else if (periodType === 'month') setSelectedMonth(currentMonthBiz);
    else setSelectedYear(currentYearBiz);
  };

  // Filter orders for the selected period
  const { currentPaidOrders, previousPaidOrders, previousPeriodLabel } = useMemo(() => {
    const paidOrders = orders.filter((o) => o.status === 'paid');

    let current: Order[] = [];
    let previous: Order[] = [];
    let prevLabel = '';

    if (periodType === 'day') {
      current = paidOrders.filter(
        (o) => getBusinessDate(o.closedAt || o.createdAt, closingTime) === selectedDay
      );
      const prevDay = getPreviousBusinessDate(selectedDay);
      previous = paidOrders.filter(
        (o) => getBusinessDate(o.closedAt || o.createdAt, closingTime) === prevDay
      );
      prevLabel = language === 'th' ? 'วันก่อนหน้า' : 'previous day';
    } else if (periodType === 'month') {
      current = paidOrders.filter(
        (o) => getBusinessDate(o.closedAt || o.createdAt, closingTime).startsWith(selectedMonth)
      );
      const prevMonth = getPreviousMonth(selectedMonth);
      previous = paidOrders.filter(
        (o) => getBusinessDate(o.closedAt || o.createdAt, closingTime).startsWith(prevMonth)
      );
      prevLabel = language === 'th' ? 'เดือนก่อนหน้า' : 'previous month';
    } else {
      current = paidOrders.filter(
        (o) => getBusinessDate(o.closedAt || o.createdAt, closingTime).startsWith(selectedYear)
      );
      const prevYear = String(parseInt(selectedYear, 10) - 1);
      previous = paidOrders.filter(
        (o) => getBusinessDate(o.closedAt || o.createdAt, closingTime).startsWith(prevYear)
      );
      prevLabel = language === 'th' ? 'ปีก่อนหน้า' : 'previous year';
    }

    return {
      currentPaidOrders: current,
      previousPaidOrders: previous,
      previousPeriodLabel: prevLabel,
    };
  }, [orders, periodType, selectedDay, selectedMonth, selectedYear, closingTime, language]);

  // Aggregate Metrics for Current Period
  const metrics = useMemo(() => {
    const totalSales = currentPaidOrders.reduce((sum, o) => sum + (o.netTotal || 0), 0);
    const totalGross = currentPaidOrders.reduce((sum, o) => sum + (o.subtotal || 0), 0);
    const totalDiscount = currentPaidOrders.reduce((sum, o) => sum + (o.discountAmount || 0), 0);
    const totalVAT = currentPaidOrders.reduce((sum, o) => sum + (o.vatAmount || 0), 0);
    const totalSC = currentPaidOrders.reduce((sum, o) => sum + (o.serviceChargeAmount || 0), 0);
    const orderCount = currentPaidOrders.length;
    const avgBill = orderCount > 0 ? Math.round(totalSales / orderCount) : 0;

    // Previous Period Sales for Comparison
    const prevSales = previousPaidOrders.reduce((sum, o) => sum + (o.netTotal || 0), 0);
    let salesGrowth: number | null = null;
    if (prevSales > 0) {
      salesGrowth = +(((totalSales - prevSales) / prevSales) * 100).toFixed(1);
    } else if (totalSales > 0 && prevSales === 0) {
      salesGrowth = 100;
    }

    // Payment Methods Breakdown
    let cashSales = 0;
    let promptPaySales = 0;
    let cardSales = 0;
    let walletSales = 0;

    currentPaidOrders.forEach((o) => {
      (o.payments || []).forEach((p) => {
        if (p.method === 'cash') cashSales += p.amount;
        else if (p.method === 'promptpay') promptPaySales += p.amount;
        else if (p.method === 'credit_card') cardSales += p.amount;
        else if (p.method === 'digital_wallet') walletSales += p.amount;
      });
    });

    // Items Sales (Best & Worst)
    const itemStats: Record<string, { count: number; sales: number; cost: number }> = {};
    let totalFoodCost = 0;

    currentPaidOrders.forEach((o) => {
      (o.lines || []).forEach((l) => {
        if (l.status !== 'voided') {
          const name = language === 'th' ? l.name_th : l.name_en || l.name_th;
          if (!itemStats[name]) {
            itemStats[name] = { count: 0, sales: 0, cost: 0 };
          }
          const lineCost = (l.cost || 0) * l.quantity;
          itemStats[name].count += l.quantity;
          itemStats[name].sales += l.unitPrice * l.quantity;
          itemStats[name].cost += lineCost;
          totalFoodCost += lineCost;
        }
      });
    });

    const itemsArray = Object.entries(itemStats).map(([name, data]) => ({
      name,
      ...data,
    }));

    const bestSellers = [...itemsArray].sort((a, b) => b.sales - a.sales).slice(0, 5);
    const worstSellers = [...itemsArray].sort((a, b) => a.sales - b.sales).slice(0, 5);

    // Sales by Category
    const categoryStats: Record<string, { count: number; sales: number }> = {};
    currentPaidOrders.forEach((o) => {
      (o.lines || []).forEach((l) => {
        if (l.status !== 'voided') {
          const cat = categories.find((c) => c.id === (l as any).categoryId || c.id === (l as any).category_id);
          const catName = cat
            ? (language === 'th' ? cat.name_th : cat.name_en)
            : (language === 'th' ? 'เมนูทั่วไป' : 'General');
          if (!categoryStats[catName]) {
            categoryStats[catName] = { count: 0, sales: 0 };
          }
          categoryStats[catName].count += l.quantity;
          categoryStats[catName].sales += l.unitPrice * l.quantity;
        }
      });
    });

    const categoryArray = Object.entries(categoryStats)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.sales - a.sales);

    // Sales per Staff Member
    const staffStats: Record<string, { count: number; sales: number }> = {};
    currentPaidOrders.forEach((o) => {
      const staffName = o.waiterName || (language === 'th' ? 'พนักงานประจำแคชเชียร์' : 'Cashier Staff');
      if (!staffStats[staffName]) {
        staffStats[staffName] = { count: 0, sales: 0 };
      }
      staffStats[staffName].count += 1;
      staffStats[staffName].sales += o.netTotal || 0;
    });

    const staffArray = Object.entries(staffStats)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.sales - a.sales);

    // Gross Profit
    const grossProfit = totalFoodCost > 0 ? totalSales - totalFoodCost : Math.round(totalSales * 0.65);
    const profitMargin = totalSales > 0 ? +((grossProfit / totalSales) * 100).toFixed(1) : 0;

    return {
      totalSales,
      totalGross,
      totalDiscount,
      totalVAT,
      totalSC,
      orderCount,
      avgBill,
      prevSales,
      salesGrowth,
      cashSales,
      promptPaySales,
      cardSales,
      walletSales,
      bestSellers,
      worstSellers,
      categoryArray,
      staffArray,
      grossProfit,
      profitMargin,
    };
  }, [currentPaidOrders, previousPaidOrders, categories, language]);

  // Chart Data Generator
  const chartData = useMemo(() => {
    if (periodType === 'day') {
      // 24 Hours (0..23)
      const hours = Array.from({ length: 24 }, (_, h) => ({
        label: `${String(h).padStart(2, '0')}:00`,
        value: 0,
        count: 0,
      }));

      currentPaidOrders.forEach((o) => {
        const time = new Date(o.closedAt || o.createdAt);
        const hour = time.getHours();
        if (hours[hour]) {
          hours[hour].value += o.netTotal || 0;
          hours[hour].count += 1;
        }
      });
      return hours;
    } else if (periodType === 'month') {
      // Days in the selected month
      const [y, m] = selectedMonth.split('-').map((v) => parseInt(v, 10));
      const daysCount = new Date(y, m, 0).getDate();
      const days = Array.from({ length: daysCount }, (_, i) => ({
        label: `${i + 1}`,
        value: 0,
        count: 0,
      }));

      currentPaidOrders.forEach((o) => {
        const bDate = getBusinessDate(o.closedAt || o.createdAt, closingTime);
        const dayNum = parseInt(bDate.split('-')[2], 10);
        if (days[dayNum - 1]) {
          days[dayNum - 1].value += o.netTotal || 0;
          days[dayNum - 1].count += 1;
        }
      });
      return days;
    } else {
      // 12 Months (Jan..Dec)
      const monthNames =
        language === 'th'
          ? ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
          : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      const months = monthNames.map((name) => ({
        label: name,
        value: 0,
        count: 0,
      }));

      currentPaidOrders.forEach((o) => {
        const bDate = getBusinessDate(o.closedAt || o.createdAt, closingTime);
        const monthNum = parseInt(bDate.split('-')[1], 10);
        if (months[monthNum - 1]) {
          months[monthNum - 1].value += o.netTotal || 0;
          months[monthNum - 1].count += 1;
        }
      });
      return months;
    }
  }, [periodType, currentPaidOrders, selectedMonth, closingTime, language]);

  const maxChartValue = useMemo(() => {
    const max = Math.max(...chartData.map((d) => d.value), 0);
    return max > 0 ? max : 1000;
  }, [chartData]);

  // Export CSV for Currently Selected Period
  const handleExportCSV = () => {
    sound.playTap();
    if (currentPaidOrders.length === 0) {
      alert(language === 'th' ? 'ไม่มีรายการขายในรอบเวลานี้' : 'No sales records in this period');
      return;
    }

    // UTF-8 BOM for Microsoft Excel Thai compatibility
    let csv = '\uFEFF';
    csv += 'เลขที่บิล,วันที่รอบบัญชี,เวลาที่บันทึก,โต๊ะ/คิว,พนักงาน,ยอดรวมก่อนลด,ส่วนลด,ค่าบริการ,ภาษีมูลค่าเพิ่ม,ยอดสุทธิ,วิธีชำระเงิน,รายการอาหาร\n';

    currentPaidOrders.forEach((o) => {
      const bDate = getBusinessDate(o.closedAt || o.createdAt, closingTime);
      const timeStr = new Date(o.closedAt || o.createdAt).toLocaleTimeString('th-TH');
      const tableQ = o.tableName || (o.queueNumber ? `คิว #${o.queueNumber}` : '');
      const staff = o.waiterName || '';
      const method = o.payments?.[0]?.method || '';
      const itemsSummary = (o.lines || [])
        .filter((l) => l.status !== 'voided')
        .map((l) => `${l.quantity}x ${l.name_th || l.name_en}`)
        .join('; ');

      csv += `"${o.orderNumber}","${bDate}","${timeStr}","${tableQ}","${staff}",${o.subtotal},${o.discountAmount},${o.serviceChargeAmount},${o.vatAmount},${o.netTotal},"${method}","${itemsSummary}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const periodLabel = periodType === 'day' ? selectedDay : periodType === 'month' ? selectedMonth : selectedYear;
    a.download = `sales-report-${periodType}-${periodLabel}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Share Summary via Web Share API
  const handleShareSummary = async () => {
    sound.playTap();
    const periodLabel =
      periodType === 'day'
        ? formatBusinessDate(selectedDay, language)
        : periodType === 'month'
        ? formatMonthYear(selectedMonth, language)
        : `ปี ${selectedYear}`;

    const text = `📊 สรุปยอดขาย (${periodLabel})\n- ยอดขายสุทธิ: ฿${metrics.totalSales.toLocaleString()}\n- จำนวนบิล: ${metrics.orderCount} บิล\n- ยอดเฉลี่ยต่อบิล: ฿${metrics.avgBill.toLocaleString()}\n- กำไรขั้นต้น: ~฿${metrics.grossProfit.toLocaleString()} (${metrics.profitMargin}%)\n- เงินสด: ฿${metrics.cashSales.toLocaleString()}\n- พร้อมเพย์: ฿${metrics.promptPaySales.toLocaleString()}\n- บัตร/อื่นๆ: ฿${(metrics.cardSales + metrics.walletSales).toLocaleString()}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: `สรุปยอดขาย ${periodLabel}`, text });
      } catch (err) {
        // cancelled
      }
    } else {
      navigator.clipboard.writeText(text);
      alert('คัดลอกสรุปยอดขายลงคลิปบอร์ดแล้ว พร้อมแชร์ทาง LINE!');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden text-slate-900 select-none">
      {/* Top Header */}
      <div className="p-3 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={() => {
                sound.playTap();
                setActiveTab('sales');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'sales'
                  ? 'bg-white text-orange-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>{language === 'th' ? 'รายงานยอดขาย' : 'Sales Reports'}</span>
            </button>

            <button
              onClick={() => {
                sound.playTap();
                setActiveTab('closed_days');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'closed_days'
                  ? 'bg-white text-orange-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Archive className="w-4 h-4" />
              <span>
                {language === 'th' ? 'ประวัติวันปิดยอด' : 'Closed Days'} ({closedDays.length})
              </span>
            </button>
          </div>
        </div>

        {activeTab === 'sales' && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleShareSummary}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold cursor-pointer transition min-h-[38px]"
            >
              <Share2 className="w-3.5 h-3.5 text-orange-600" />
              <span>{language === 'th' ? 'แชร์สรุป' : 'Share'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs cursor-pointer transition min-h-[38px] shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{language === 'th' ? 'ส่งออก CSV (Excel)' : 'Export CSV'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {activeTab === 'sales' ? (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Period Selector Bar */}
          <div className="p-3 sm:p-4 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            {/* Period Type Switcher */}
            <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  sound.playTap();
                  setPeriodType('day');
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  periodType === 'day'
                    ? 'bg-white text-orange-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {language === 'th' ? 'รายวัน' : 'Daily'}
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playTap();
                  setPeriodType('month');
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  periodType === 'month'
                    ? 'bg-white text-orange-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {language === 'th' ? 'รายเดือน' : 'Monthly'}
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playTap();
                  setPeriodType('year');
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  periodType === 'year'
                    ? 'bg-white text-orange-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {language === 'th' ? 'รายปี' : 'Yearly'}
              </button>
            </div>

            {/* Date / Month / Year Picker with Arrow Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevPeriod}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition cursor-pointer"
                title="ย้อนกลับ (Previous)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {periodType === 'day' && (
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                  <Calendar className="w-4 h-4 text-orange-600 shrink-0" />
                  <input
                    type="date"
                    value={selectedDay}
                    onChange={(e) => {
                      if (e.target.value) setSelectedDay(e.target.value);
                    }}
                    className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                  />
                  <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                    ({formatBusinessDate(selectedDay, language)})
                  </span>
                </div>
              )}

              {periodType === 'month' && (
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                  <Calendar className="w-4 h-4 text-orange-600 shrink-0" />
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => {
                      if (e.target.value) setSelectedMonth(e.target.value);
                    }}
                    className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                  />
                  <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                    ({formatMonthYear(selectedMonth, language)})
                  </span>
                </div>
              )}

              {periodType === 'year' && (
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                  <Calendar className="w-4 h-4 text-orange-600 shrink-0" />
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                  >
                    {Array.from({ length: 7 }, (_, i) => {
                      const y = parseInt(currentYearBiz, 10) - 3 + i;
                      return (
                        <option key={y} value={String(y)}>
                          {language === 'th' ? `ปี ${y + 543} (${y})` : `Year ${y}`}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              <button
                type="button"
                onClick={handleNextPeriod}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition cursor-pointer"
                title="ถัดไป (Next)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleCurrentPeriod}
                className="px-2.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold border border-orange-200 transition cursor-pointer"
              >
                {periodType === 'day'
                  ? (language === 'th' ? 'วันนี้' : 'Today')
                  : periodType === 'month'
                  ? (language === 'th' ? 'เดือนนี้' : 'This Month')
                  : (language === 'th' ? 'ปีนี้' : 'This Year')}
              </button>
            </div>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Net Sales Card */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1 relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>{language === 'th' ? 'ยอดขายสุทธิ (Net Sales)' : 'Net Sales'}</span>
                {metrics.salesGrowth !== null && (
                  <span
                    className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      metrics.salesGrowth >= 0
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {metrics.salesGrowth >= 0 ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    <span>{Math.abs(metrics.salesGrowth)}%</span>
                  </span>
                )}
              </div>
              <div className="text-2xl sm:text-3xl font-black text-orange-600">
                ฿{metrics.totalSales.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400">
                {language === 'th' ? 'ยอดก่อนลด' : 'Gross'}: ฿{metrics.totalGross.toLocaleString()} | {language === 'th' ? 'ส่วนลด' : 'Discount'}: ฿{metrics.totalDiscount.toLocaleString()}
              </div>
            </div>

            {/* 2. Total Bills Card */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1">
              <div className="text-xs text-slate-500 font-medium">
                {language === 'th' ? 'จำนวนบิลที่ชำระ (Total Orders)' : 'Total Orders'}
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {metrics.orderCount} <span className="text-sm font-normal text-slate-500">{language === 'th' ? 'บิล' : 'bills'}</span>
              </div>
              <div className="text-[11px] text-slate-400">
                {previousPaidOrders.length > 0
                  ? `${language === 'th' ? 'เทียบกับ' : 'vs'} ${previousPeriodLabel}: ${previousPaidOrders.length} ${language === 'th' ? 'บิล' : 'bills'}`
                  : (language === 'th' ? 'ไม่มีข้อมูลรอบก่อน' : 'No previous period')}
              </div>
            </div>

            {/* 3. Average Bill Card */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1">
              <div className="text-xs text-slate-500 font-medium">
                {language === 'th' ? 'ยอดเฉลี่ยต่อบิล (Avg. Bill)' : 'Avg. Bill'}
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600">
                ฿{metrics.avgBill.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400">
                VAT: ฿{metrics.totalVAT.toLocaleString()} | SC: ฿{metrics.totalSC.toLocaleString()}
              </div>
            </div>

            {/* 4. Gross Profit Card */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1">
              <div className="text-xs text-slate-500 font-medium">
                {language === 'th' ? 'กำไรขั้นต้น (Gross Profit)' : 'Gross Profit'}
              </div>
              <div className="text-2xl sm:text-3xl font-black text-sky-600">
                ฿{metrics.grossProfit.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400">
                {language === 'th' ? 'อัตรากำไร (Margin)' : 'Margin'}: ~{metrics.profitMargin}%
              </div>
            </div>
          </div>

          {/* Interactive Chart Section */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-orange-600" />
                  <span>
                    {periodType === 'day'
                      ? (language === 'th' ? 'กราฟยอดขายรายชั่วโมง (Hourly Sales)' : 'Hourly Sales')
                      : periodType === 'month'
                      ? (language === 'th' ? 'กราฟยอดขายรายวันของเดือน (Daily Sales of Month)' : 'Daily Sales of Month')
                      : (language === 'th' ? 'กราฟยอดขายรายเดือน (Monthly Sales of Year)' : 'Monthly Sales')}
                  </span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === 'th'
                    ? 'เวลาตัดรอบบัญชี: ' + closingTime + ' น.'
                    : 'Business cut-off time: ' + closingTime}
                </p>
              </div>

              {hoveredBar && (
                <div className="px-3 py-1 rounded-xl bg-orange-50 border border-orange-200 text-xs font-bold text-orange-950 flex items-center gap-2">
                  <span>{hoveredBar.label}:</span>
                  <span className="text-orange-600">฿{hoveredBar.value.toLocaleString()}</span>
                  <span className="text-slate-500 font-normal">({hoveredBar.count} {language === 'th' ? 'บิล' : 'bills'})</span>
                </div>
              )}
            </div>

            {/* SVG Interactive Bar Chart */}
            <div className="h-56 w-full pt-4 pb-2 flex items-end gap-1 sm:gap-2 border-b border-slate-200 relative select-none">
              {chartData.map((item, idx) => {
                const heightPercent = maxChartValue > 0 ? (item.value / maxChartValue) * 100 : 0;
                const isHovered = hoveredBar?.label === item.label;
                const isZero = item.value === 0;

                return (
                  <div
                    key={idx}
                    className="flex-1 h-full flex flex-col justify-end items-center group relative cursor-pointer"
                    onMouseEnter={() => setHoveredBar(item)}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    {/* Tooltip Popup on Hover */}
                    {isHovered && (
                      <div className="absolute -top-10 z-20 px-2 py-1 bg-slate-900 text-white text-[10px] rounded-lg shadow-lg whitespace-nowrap pointer-events-none animate-in fade-in">
                        {item.label}: ฿{item.value.toLocaleString()} ({item.count} บิล)
                      </div>
                    )}

                    {/* Bar */}
                    <div
                      style={{ height: `${Math.max(isZero ? 2 : 4, heightPercent)}%` }}
                      className={`w-full max-w-[28px] rounded-t-md transition-all duration-200 ${
                        isZero
                          ? 'bg-slate-200'
                          : isHovered
                          ? 'bg-orange-600 shadow-md'
                          : 'bg-orange-400 hover:bg-orange-500'
                      }`}
                    />

                    {/* Label */}
                    <span className="text-[9px] sm:text-[10px] text-slate-400 mt-1 truncate max-w-full font-mono">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Methods Breakdown */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {language === 'th' ? 'ยอดขายแยกตามช่องทางชำระเงิน' : 'Payment Methods Breakdown'}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'th' ? 'เงินสด (Cash)' : 'Cash'}</span>
                </div>
                <div className="text-lg font-black text-slate-900">
                  ฿{metrics.cashSales.toLocaleString()}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                  <QrCode className="w-4 h-4 text-sky-600" />
                  <span>{language === 'th' ? 'พร้อมเพย์ QR' : 'PromptPay QR'}</span>
                </div>
                <div className="text-lg font-black text-slate-900">
                  ฿{metrics.promptPaySales.toLocaleString()}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                  <CreditCard className="w-4 h-4 text-orange-600" />
                  <span>{language === 'th' ? 'บัตรเครดิต (Card)' : 'Credit Card'}</span>
                </div>
                <div className="text-lg font-black text-slate-900">
                  ฿{metrics.cardSales.toLocaleString()}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <span>{language === 'th' ? 'กระเป๋าเงินดิจิทัล' : 'Digital Wallet'}</span>
                </div>
                <div className="text-lg font-black text-slate-900">
                  ฿{metrics.walletSales.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Best & Worst Sellers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top 5 Best Sellers */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                <span>{language === 'th' ? '5 เมนูขายดีที่สุด (Best Sellers)' : 'Top 5 Best Sellers'}</span>
              </h4>
              <div className="divide-y divide-slate-100">
                {metrics.bestSellers.length === 0 ? (
                  <div className="py-4 text-xs text-slate-400">
                    {language === 'th' ? 'ยังไม่มีข้อมูลการขายในรอบนี้' : 'No sales records in this period'}
                  </div>
                ) : (
                  metrics.bestSellers.map((item, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5 font-medium truncate pr-2">
                        <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-[10px] shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-slate-800 truncate">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-slate-500">{item.count} {language === 'th' ? 'จาน' : 'orders'}</span>
                        <span className="font-black text-orange-600 w-20 text-right">
                          ฿{item.sales.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 5 Lowest / Worst Sellers */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-slate-400" />
                <span>{language === 'th' ? 'เมนูที่ขายได้น้อยที่สุด (Lowest Sellers)' : 'Lowest Selling Items'}</span>
              </h4>
              <div className="divide-y divide-slate-100">
                {metrics.worstSellers.length === 0 ? (
                  <div className="py-4 text-xs text-slate-400">
                    {language === 'th' ? 'ยังไม่มีข้อมูลการขายในรอบนี้' : 'No sales records in this period'}
                  </div>
                ) : (
                  metrics.worstSellers.map((item, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5 font-medium truncate pr-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-[10px] shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-slate-700 truncate">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-slate-400">{item.count} {language === 'th' ? 'จาน' : 'orders'}</span>
                        <span className="font-bold text-slate-700 w-20 text-right">
                          ฿{item.sales.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sales by Category & Sales per Staff */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sales by Category */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Utensils className="w-4 h-4 text-orange-600" />
                <span>{language === 'th' ? 'ยอดขายตามหมวดหมู่อาหาร' : 'Sales by Category'}</span>
              </h4>
              <div className="space-y-2.5">
                {metrics.categoryArray.length === 0 ? (
                  <div className="py-4 text-xs text-slate-400">
                    {language === 'th' ? 'ไม่มีข้อมูลยอดขาย' : 'No sales data'}
                  </div>
                ) : (
                  metrics.categoryArray.map((cat, idx) => {
                    const pct = metrics.totalSales > 0 ? (cat.sales / metrics.totalSales) * 100 : 0;
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-800">{cat.name} ({cat.count} {language === 'th' ? 'รายการ' : 'items'})</span>
                          <span className="font-black text-slate-900">
                            ฿{cat.sales.toLocaleString()} ({pct.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            style={{ width: `${pct}%` }}
                            className="h-full bg-orange-500 rounded-full"
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Sales per Staff */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-sky-600" />
                <span>{language === 'th' ? 'ยอดขายตามพนักงาน (Sales per Staff)' : 'Sales per Staff'}</span>
              </h4>
              <div className="divide-y divide-slate-100">
                {metrics.staffArray.length === 0 ? (
                  <div className="py-4 text-xs text-slate-400">
                    {language === 'th' ? 'ไม่มีข้อมูลพนักงาน' : 'No staff sales recorded'}
                  </div>
                ) : (
                  metrics.staffArray.map((staff, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-slate-800">{staff.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-slate-500">{staff.count} {language === 'th' ? 'บิล' : 'bills'}</span>
                        <span className="font-black text-sky-600 w-24 text-right">
                          ฿{staff.sales.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* CLOSED DAYS LIST VIEW */
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Archive className="w-4 h-4 text-orange-600" />
                <span>{language === 'th' ? 'ประวัติรอบปิดยอดประจำวัน (Closed Days List)' : 'Closed Days History'}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'th'
                  ? 'ระบบบันทึกสรุปยอดอัตโนมัติทุกวันเมื่อถึงเวลาปิดยอด (' + closingTime + ' น.)'
                  : 'Daily close automatically performed at ' + closingTime}
              </p>
            </div>
          </div>

          {closedDays.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
              <Archive className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="text-sm font-bold text-slate-700">
                {language === 'th' ? 'ยังไม่มีประวัติวันปิดยอดที่บันทึกไว้' : 'No closed days records yet'}
              </div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {language === 'th'
                  ? 'เมื่อระบบถึงเวลาปิดยอด (' + closingTime + ' น.) จะสร้างบันทึกสรุปยอดประจำวันและแสดงที่นี่อัตโนมัติ'
                  : 'Daily summaries will automatically appear here once closing time is reached.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {closedDays.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-orange-300 transition shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-900">
                        {formatBusinessDate(c.businessDate, language)}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 text-[10px] font-bold">
                        {c.businessDate}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                      <span>
                        {language === 'th' ? 'ปิดเมื่อ: ' : 'Closed: '}
                        {new Date(c.closedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span>•</span>
                      <span>
                        {c.orderCount} {language === 'th' ? 'บิลที่ชำระ' : 'paid bills'}
                      </span>
                      {c.voidedCount > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-rose-600">
                            {c.voidedCount} {language === 'th' ? 'บิลยกเลิก' : 'voided'}
                          </span>
                        </>
                      )}
                      {c.carriedOverBills && c.carriedOverBills.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-amber-600">
                            {c.carriedOverBills.length} {language === 'th' ? 'บิลยกยอดไป' : 'carried over'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-slate-400 font-medium">
                        {language === 'th' ? 'ยอดขายสุทธิ' : 'Net Total'}
                      </div>
                      <div className="text-lg font-black text-orange-600">
                        ฿{c.netTotal.toLocaleString()}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        sound.playTap();
                        setSelectedClosedDay(c);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs border border-orange-200 transition cursor-pointer"
                    >
                      {language === 'th' ? 'ดูสรุปยอด' : 'View Details'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CLOSED DAY DETAIL MODAL */}
      {selectedClosedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs select-none">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl text-slate-900 overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Archive className="w-5 h-5 text-orange-600" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {language === 'th' ? 'สรุปยอดประจำวัน: ' : 'Daily Close Summary: '}
                    {formatBusinessDate(selectedClosedDay.businessDate, language)}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {language === 'th' ? 'ปิดรอบเมื่อ ' : 'Closed at '}
                    {new Date(selectedClosedDay.closedAt).toLocaleString('th-TH')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedClosedDay(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Financials Box */}
              <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>{language === 'th' ? 'ยอดรวมก่อนลด (Gross Sales)' : 'Gross Sales'}:</span>
                  <span className="font-semibold text-slate-900">฿{selectedClosedDay.grossSales.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>{language === 'th' ? 'ส่วนลด (Discount)' : 'Discounts'}:</span>
                  <span className="font-semibold">-฿{selectedClosedDay.discountAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>{language === 'th' ? 'ค่าบริการ (Service Charge)' : 'Service Charge'}:</span>
                  <span className="font-semibold">+฿{selectedClosedDay.serviceChargeAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>{language === 'th' ? 'ภาษีมูลค่าเพิ่ม (VAT)' : 'VAT'}:</span>
                  <span className="font-semibold">+฿{selectedClosedDay.vatAmount.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-orange-200 flex justify-between items-baseline font-black text-base text-orange-950">
                  <span>{language === 'th' ? 'ยอดขายสุทธิ (NET TOTAL)' : 'NET TOTAL'}:</span>
                  <span className="text-xl text-orange-600">฿{selectedClosedDay.netTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-1.5">
                <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  {language === 'th' ? 'ช่องทางชำระเงิน' : 'Payment Methods'}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">เงินสด (Cash)</span>
                    <span className="font-bold text-slate-900">฿{selectedClosedDay.paymentMethods?.cash?.toLocaleString() || 0}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">พร้อมเพย์ QR</span>
                    <span className="font-bold text-slate-900">฿{selectedClosedDay.paymentMethods?.promptpay?.toLocaleString() || 0}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">บัตรเครดิต</span>
                    <span className="font-bold text-slate-900">฿{selectedClosedDay.paymentMethods?.credit_card?.toLocaleString() || 0}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">วอลเล็ตดิจิทัล</span>
                    <span className="font-bold text-slate-900">฿{selectedClosedDay.paymentMethods?.digital_wallet?.toLocaleString() || 0}</span>
                  </div>
                </div>
              </div>

              {/* Top Selling Items */}
              {selectedClosedDay.topItems && selectedClosedDay.topItems.length > 0 && (
                <div className="space-y-1.5">
                  <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    {language === 'th' ? 'เมนูขายดีประจำวัน' : 'Top Items'}
                  </div>
                  <div className="divide-y divide-slate-100 bg-slate-50 rounded-xl p-2.5 border border-slate-200">
                    {selectedClosedDay.topItems.map((item, idx) => (
                      <div key={idx} className="py-1 flex justify-between text-xs">
                        <span className="text-slate-700">{idx + 1}. {item.name}</span>
                        <span className="font-bold text-slate-900">{item.quantity} จาน (฿{item.sales.toLocaleString()})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Carried Over Bills */}
              {selectedClosedDay.carriedOverBills && selectedClosedDay.carriedOverBills.length > 0 && (
                <div className="space-y-1.5">
                  <div className="font-bold text-amber-700 uppercase tracking-wider text-[11px]">
                    {language === 'th' ? 'บิลที่ยังเปิดอยู่ (ยกยอดไปวันถัดไป)' : 'Carried Over Bills'}
                  </div>
                  <div className="space-y-1 bg-amber-50/60 rounded-xl p-2.5 border border-amber-200">
                    {selectedClosedDay.carriedOverBills.map((b) => (
                      <div key={b.id} className="flex justify-between text-xs">
                        <span className="text-slate-700">{b.orderNumber} ({b.tableName || 'โต๊ะ'})</span>
                        <span className="font-bold text-amber-900">฿{b.netTotal.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedClosedDay(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs cursor-pointer transition"
              >
                {language === 'th' ? 'ปิดหน้านี้' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
