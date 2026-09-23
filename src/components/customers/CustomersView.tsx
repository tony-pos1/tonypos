import React, { useState } from 'react';
import { Customer } from '../../types';
import { useI18n } from '../../i18n';
import { sound } from '../../utils/sound';
import {
  Users,
  Search,
  Plus,
  Phone,
  Award,
  Calendar,
  X,
  Save,
} from 'lucide-react';

interface CustomersViewProps {
  customers: Customer[];
  onAddCustomer: (customer: Customer) => Promise<void>;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  onAddCustomer,
}) => {
  const { t, language } = useI18n();
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    sound.playTap();
    const newCustomer: Customer = {
      id: `cust_${Date.now()}`,
      name: name.trim(),
      phone: phone.trim().replace(/[^0-9]/g, ''),
      points: 0,
      totalSpend: 0,
      visitCount: 1,
      notes: notes.trim() || undefined,
      createdAt: Date.now(),
    };

    await onAddCustomer(newCustomer);
    setName('');
    setPhone('');
    setNotes('');
    setShowAddModal(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden text-slate-900 select-none">
      {/* Header */}
      <div className="p-3 border-b border-slate-200 bg-white flex items-center justify-between gap-3 shrink-0 shadow-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อ หรือ เบอร์โทรศัพท์..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500"
          />
        </div>

        <button
          onClick={() => {
            sound.playTap();
            setShowAddModal(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition cursor-pointer min-h-[40px] shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>{t('addCustomer')}</span>
        </button>
      </div>

      {/* Customers List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {filtered.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <Users className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium">ไม่พบข้อมูลลูกค้า</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filtered.map((customer) => (
              <div
                key={customer.id}
                className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-orange-300 transition space-y-3 shadow-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">
                      {customer.name}
                    </h4>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                      <Phone className="w-3.5 h-3.5 text-orange-500" />
                      <span>{customer.phone}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 text-xs font-black">
                    <Award className="w-3.5 h-3.5" />
                    <span>{customer.points} แต้ม</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div>
                    ยอดใช้จ่ายสะสม:{' '}
                    <span className="font-bold text-slate-900">
                      ฿{customer.totalSpend.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    มาแล้ว{' '}
                    <span className="font-bold text-slate-900">
                      {customer.visitCount}
                    </span>{' '}
                    ครั้ง
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 max-w-sm w-full shadow-2xl text-slate-900 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
              <h3 className="text-base font-bold text-orange-600">
                {t('addCustomer')}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อลูกค้า *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น คุณกานดา"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เบอร์โทรศัพท์ *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="089xxxxxxx"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  หมายเหตุ / แพ้อาหาร
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="เช่น ไม่ทานเผ็ด, แพ้กุ้ง"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-xs cursor-pointer"
                >
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
