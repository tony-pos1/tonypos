import React, { useState, useEffect } from 'react';
import { useI18n } from '../../i18n';
import { sound } from '../../utils/sound';
import {
  Inbox,
  X,
  PlusCircle,
  MinusCircle,
  History,
  Sparkles,
  CheckCircle2,
  DollarSign,
  FileSpreadsheet,
} from 'lucide-react';

interface CashTransaction {
  id: string;
  type: 'in' | 'out' | 'kick';
  amount: number;
  reason: string;
  timestamp: number;
}

interface CashDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CashDrawerModal: React.FC<CashDrawerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t, language } = useI18n();
  const [logs, setLogs] = useState<CashTransaction[]>([]);
  const [activeTab, setActiveTab] = useState<'action' | 'logs'>('action');

  // Form states for cash in / out
  const [txType, setTxType] = useState<'in' | 'out'>('in');
  const [amount, setAmount] = useState<number>(500);
  const [reason, setReason] = useState('');
  const [lastKicked, setLastKicked] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('pos_cash_drawer_logs');
      if (saved) {
        setLogs(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load cash logs', e);
    }
  }, [isOpen]);

  const saveLogs = (newLogs: CashTransaction[]) => {
    setLogs(newLogs);
    try {
      localStorage.setItem('pos_cash_drawer_logs', JSON.stringify(newLogs));
    } catch (e) {
      console.error('Failed to save cash logs', e);
    }
  };

  const handleTestKick = () => {
    sound.playCashRegister();
    setLastKicked(true);
    setTimeout(() => setLastKicked(false), 2500);

    const kickRecord: CashTransaction = {
      id: `kick_${Date.now()}`,
      type: 'kick',
      amount: 0,
      reason: language === 'th' ? 'เปิดทดสอบลิ้นชัก (Manual Kick)' : 'Manual Kick Test',
      timestamp: Date.now(),
    };
    saveLogs([kickRecord, ...logs].slice(0, 50));
  };

  const handleSubmitCashInOut = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    sound.playTap();
    const newRecord: CashTransaction = {
      id: `tx_${Date.now()}`,
      type: txType,
      amount: amount,
      reason: reason.trim() || (txType === 'in' ? 'นำเงินเข้าลิ้นชัก' : 'ถอนเงินออกจากลิ้นชัก'),
      timestamp: Date.now(),
    };

    saveLogs([newRecord, ...logs].slice(0, 50));
    setReason('');
    setAmount(100);
    setActiveTab('logs');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs select-none">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full shadow-2xl text-slate-900 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
              <Inbox className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {language === 'th' ? 'ลิ้นชักเก็บเงิน (Cash Drawer)' : 'Cash Drawer'}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'th' ? 'เตะลิ้นชักทดสอบ • บันทึกเงินเข้า-ออก • ประวัติบันทึก' : 'Test kick • Cash in/out • Audit log'}
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

        {/* Tab switch: Action vs Audit Log */}
        <div className="flex border-b border-slate-100 px-5 pt-2 bg-slate-50 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('action')}
            className={`pb-2 px-3 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'action'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {language === 'th' ? 'สั่งเปิด / บันทึกเงิน' : 'Controls & Cash In/Out'}
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-2 px-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'logs'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>{language === 'th' ? `ประวัติบันทึก (${logs.length})` : `Audit Log (${logs.length})`}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'action' ? (
            <>
              {/* Kick Drawer Button */}
              <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-200 flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {language === 'th' ? 'ทดสอบเตะเปิดลิ้นชัก' : 'Test Kick Cash Drawer'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {language === 'th'
                      ? 'ส่งสัญญาณเสียงเปิดลิ้นชักแคชเชียร์และบันทึกประวัติการเปิด'
                      : 'Trigger drawer kick signal and record audit entry'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleTestKick}
                  className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer shrink-0"
                >
                  <Inbox className="w-4 h-4" />
                  <span>{lastKicked ? 'เปิดแล้ว! (Opened)' : 'เตะลิ้นชัก (Kick)'}</span>
                </button>
              </div>

              {/* Record Cash In / Cash Out Form */}
              <form onSubmit={handleSubmitCashInOut} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {language === 'th' ? 'บันทึกเงินสดเข้า-ออก (Pay In / Pay Out)' : 'Record Cash Movement'}
                </h4>

                {/* Type Selection */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTxType('in')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      txType === 'in'
                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>{language === 'th' ? 'นำเงินเข้า (+)' : 'Pay In (+)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTxType('out')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      txType === 'out'
                        ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <MinusCircle className="w-4 h-4" />
                    <span>{language === 'th' ? 'ถอนเงินออก (-)' : 'Pay Out (-)'}</span>
                  </button>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'th' ? 'จำนวนเงิน (฿) *' : 'Amount (THB) *'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Math.max(1, Number(e.target.value) || 0))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-base font-black text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* Quick preset amount chips */}
                <div className="flex flex-wrap gap-1.5">
                  {[100, 500, 1000, 2000, 5000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmount(val)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-orange-400 text-xs font-semibold text-slate-700 cursor-pointer"
                    >
                      +฿{val.toLocaleString()}
                    </button>
                  ))}
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'th' ? 'เหตุผล / หมายเหตุ' : 'Reason / Note'}
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={
                      txType === 'in'
                        ? 'เช่น เงินทอนเริ่มต้นเช้า, เติมเหรียญ'
                        : 'เช่น ซื้อน้ำแข็งด่วน, ค่าส่งเอกสาร'
                    }
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                  >
                    {language === 'th' ? 'บันทึกรายการ' : 'Save Record'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            /* Audit Log View */
            <div className="space-y-2">
              {logs.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  {language === 'th' ? 'ยังไม่มีประวัติการบันทึก' : 'No audit records yet'}
                </div>
              ) : (
                logs.map((log) => {
                  const dateStr = new Date(log.timestamp).toLocaleTimeString('th-TH', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  return (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold shrink-0 ${
                            log.type === 'in'
                              ? 'bg-emerald-100 text-emerald-700'
                              : log.type === 'out'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}
                        >
                          {log.type === 'in' ? '+' : log.type === 'out' ? '-' : '⚡'}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900">
                            {log.reason}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {dateStr}
                          </div>
                        </div>
                      </div>

                      {log.amount > 0 && (
                        <div
                          className={`font-mono font-bold text-sm ${
                            log.type === 'in' ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {log.type === 'in' ? '+' : '-'}฿{log.amount.toLocaleString()}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
