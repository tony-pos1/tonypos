import React from 'react';
import { Order } from '../../types';
import { useI18n } from '../../i18n';
import { sound } from '../../utils/sound';
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
} from 'lucide-react';

interface ReportsViewProps {
  orders: Order[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ orders }) => {
  const { t, language } = useI18n();

  const paidOrders = orders.filter((o) => o.status === 'paid');
  const totalSales = paidOrders.reduce((sum, o) => sum + (o.netTotal || 0), 0);
  const totalDiscount = paidOrders.reduce((sum, o) => sum + (o.discountAmount || 0), 0);
  const totalVAT = paidOrders.reduce((sum, o) => sum + (o.vatAmount || 0), 0);
  const totalSC = paidOrders.reduce((sum, o) => sum + (o.serviceChargeAmount || 0), 0);
  const orderCount = paidOrders.length;
  const avgBill = orderCount > 0 ? Math.round(totalSales / orderCount) : 0;

  // Breakdown by payment method
  let cashSales = 0;
  let promptPaySales = 0;
  let cardSales = 0;
  let walletSales = 0;

  paidOrders.forEach((o) => {
    o.payments.forEach((p) => {
      if (p.method === 'cash') cashSales += p.amount;
      else if (p.method === 'promptpay') promptPaySales += p.amount;
      else if (p.method === 'credit_card') cardSales += p.amount;
      else if (p.method === 'digital_wallet') walletSales += p.amount;
    });
  });

  // Top selling items count
  const itemCounts: { [name: string]: { count: number; sales: number } } = {};
  paidOrders.forEach((o) => {
    o.lines.forEach((l) => {
      if (l.status !== 'voided') {
        if (!itemCounts[l.name_th]) {
          itemCounts[l.name_th] = { count: 0, sales: 0 };
        }
        itemCounts[l.name_th].count += l.quantity;
        itemCounts[l.name_th].sales += l.unitPrice * l.quantity;
      }
    });
  });

  const topItems = Object.entries(itemCounts)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

  // Export CSV
  const handleExportCSV = () => {
    sound.playTap();
    let csv = '\uFEFFOrderNo,Time,Table/Queue,Status,Subtotal,Discount,SC,VAT,NetTotal,PaymentMethod\n';
    orders.forEach((o) => {
      const time = new Date(o.createdAt).toISOString();
      const method = o.payments[0]?.method || '';
      csv += `"${o.orderNumber}","${time}","${o.tableName || o.queueNumber || ''}","${o.status}",${o.subtotal},${o.discountAmount},${o.serviceChargeAmount},${o.vatAmount},${o.netTotal},"${method}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Share summary via Web Share API
  const handleShareSummary = async () => {
    sound.playTap();
    const today = new Date().toLocaleDateString('th-TH');
    const text = `📊 สรุปยอดขายประจำวัน (${today})\n- ยอดขายรวม: ฿${totalSales.toLocaleString()}\n- จำนวนบิล: ${orderCount} บิล\n- ยอดเฉลี่ยต่อบิล: ฿${avgBill.toLocaleString()}\n- เงินสด: ฿${cashSales.toLocaleString()}\n- พร้อมเพย์: ฿${promptPaySales.toLocaleString()}\n- บัตร/อื่นๆ: ฿${(cardSales + walletSales).toLocaleString()}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'ยอดขายวันนี้', text });
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
      {/* Header */}
      <div className="p-3 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-orange-600" />
          <span>{t('navReports')} (รายงานการขายประจำวัน)</span>
        </h3>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShareSummary}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold cursor-pointer transition min-h-[38px]"
          >
            <Share2 className="w-3.5 h-3.5 text-orange-600" />
            <span>แชร์สรุป (LINE)</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs cursor-pointer transition min-h-[38px] shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ส่งออก CSV</span>
          </button>
        </div>
      </div>

      {/* Reports Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1">
            <div className="text-xs text-slate-500 font-medium">ยอดขายรวมสุทธิ (Net Sales)</div>
            <div className="text-2xl sm:text-3xl font-black text-orange-600">
              ฿{totalSales.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500">
              VAT: ฿{totalVAT.toLocaleString()} | ส่วนลด: ฿{totalDiscount.toLocaleString()}
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1">
            <div className="text-xs text-slate-500 font-medium">จำนวนบิลที่ชำระ (Total Orders)</div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {orderCount} <span className="text-sm font-normal text-slate-500">บิล</span>
            </div>
            <div className="text-[11px] text-slate-500">
              บิลเปิดอยู่: {orders.filter((o) => o.status === 'open' || o.status === 'held').length} บิล
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1">
            <div className="text-xs text-slate-500 font-medium">ยอดเฉลี่ยต่อบิล (Avg. Bill)</div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600">
              ฿{avgBill.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500">
              อัตราค่าบริการ (SC): ฿{totalSC.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            ยอดขายแยกตามช่องทางชำระเงิน
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <Banknote className="w-4 h-4 text-emerald-600" />
                <span>เงินสด (Cash)</span>
              </div>
              <div className="text-lg font-black text-slate-900">
                ฿{cashSales.toLocaleString()}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <QrCode className="w-4 h-4 text-sky-600" />
                <span>พร้อมเพย์ QR</span>
              </div>
              <div className="text-lg font-black text-slate-900">
                ฿{promptPaySales.toLocaleString()}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <CreditCard className="w-4 h-4 text-orange-600" />
                <span>บัตรเครดิต (Card)</span>
              </div>
              <div className="text-lg font-black text-slate-900">
                ฿{cardSales.toLocaleString()}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <span>กระเป๋าเงินดิจิทัล</span>
              </div>
              <div className="text-lg font-black text-slate-900">
                ฿{walletSales.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Top 5 Items */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            5 เมนูขายดีที่สุด (Top Selling Items)
          </h4>
          <div className="divide-y divide-slate-100">
            {topItems.length === 0 ? (
              <div className="py-4 text-xs text-slate-400">ยังไม่มีข้อมูลการขาย</div>
            ) : (
              topItems.map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 font-medium">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-orange-600 font-bold flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-slate-800">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-slate-500">{item.count} จาน</span>
                    <span className="font-black text-orange-600 w-20 text-right">
                      ฿{item.sales.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
