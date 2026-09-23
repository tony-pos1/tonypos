import React, { useState } from 'react';
import { Order, OrderStatus } from '../../types';
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
} from 'lucide-react';

interface OrdersHistoryViewProps {
  orders: Order[];
  onViewReceipt: (order: Order) => void;
  onVoidOrder?: (orderId: string, reason?: string) => Promise<void>;
}

export const OrdersHistoryView: React.FC<OrdersHistoryViewProps> = ({
  orders,
  onViewReceipt,
  onVoidOrder,
}) => {
  const { t, language } = useI18n();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      (o.tableName && o.tableName.toLowerCase().includes(q)) ||
      (o.queueNumber && o.queueNumber.toString().includes(q))
    );
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden text-slate-900 select-none">
      {/* Search & Filter Header */}
      <div className="p-3 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-xs">
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

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
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

      {/* Orders Table */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {filteredOrders.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <ReceiptText className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium">ไม่พบประวัติการสั่งอาหาร</p>
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
    </div>
  );
};
