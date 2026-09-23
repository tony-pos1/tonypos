import React from 'react';
import { Order } from '../../types';
import { useI18n } from '../../i18n';
import { sound } from '../../utils/sound';
import { X, PauseCircle, Play, Trash2, Clock, Hash } from 'lucide-react';

interface HeldOrdersModalProps {
  heldOrders: Order[];
  onClose: () => void;
  onResumeOrder: (order: Order) => void;
  onDeleteHeldOrder: (orderId: string) => Promise<void>;
}

export const HeldOrdersModal: React.FC<HeldOrdersModalProps> = ({
  heldOrders,
  onClose,
  onResumeOrder,
  onDeleteHeldOrder,
}) => {
  const { t, language } = useI18n();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs select-none">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl text-slate-900 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <PauseCircle className="w-5 h-5 text-orange-600" />
            <h3 className="text-base font-black text-slate-900">
              {t('heldOrders')} ({heldOrders.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {heldOrders.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <PauseCircle className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium">{t('noHeldOrders')}</p>
            </div>
          ) : (
            heldOrders.map((order) => {
              const activeCount = order.lines.filter((l) => l.status !== 'voided').length;
              const dateStr = new Date(order.updatedAt || order.createdAt).toLocaleTimeString(
                language === 'th' ? 'th-TH' : 'en-US',
                { hour: '2-digit', minute: '2-digit' }
              );

              return (
                <div
                  key={order.id}
                  className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-orange-400 transition flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                      {order.queueNumber && (
                        <span className="px-2 py-0.5 rounded-md bg-orange-500 text-white text-xs font-black">
                          Q#{order.queueNumber}
                        </span>
                      )}
                      <span>{order.tableName || order.orderNumber}</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {dateStr}
                      </span>
                      <span className="flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        {activeCount} {t('orderLinesCount')}
                      </span>
                    </div>

                    <div className="text-orange-600 font-black text-sm">
                      ฿{order.netTotal.toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        sound.playTap();
                        onResumeOrder(order);
                        onClose();
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition cursor-pointer shadow-xs min-h-[40px]"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>{t('resumeOrder')}</span>
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('ลบออเดอร์ที่พักไว้? (Delete held order?)')) {
                          sound.playTap();
                          onDeleteHeldOrder(order.id);
                        }
                      }}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
