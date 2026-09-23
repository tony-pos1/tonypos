import React, { useState } from 'react';
import { Promotion } from '../../types';
import { useI18n } from '../../i18n';
import { sound } from '../../utils/sound';
import { Tag, Plus, CheckCircle2, X } from 'lucide-react';

export const PromotionsView: React.FC = () => {
  const { t, language } = useI18n();

  const [promotions, setPromotions] = useState<Promotion[]>([
    {
      id: 'promo_1',
      name_th: 'ลด 10% เมื่อทานครบ 500 บาท',
      name_en: '10% Off when spend over ฿500',
      type: 'percent',
      value: 10,
      minSpend: 500,
      isActive: true,
    },
    {
      id: 'promo_2',
      name_th: 'ส่วนลดลูกค้าพิเศษ 50 บาท',
      name_en: 'VIP Special ฿50 Discount',
      type: 'amount',
      value: 50,
      minSpend: 300,
      isActive: true,
    },
  ]);

  const [showAdd, setShowAdd] = useState(false);
  const [nameTh, setNameTh] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [type, setType] = useState<'percent' | 'amount'>('percent');
  const [value, setValue] = useState(10);
  const [minSpend, setMinSpend] = useState(0);

  const handleToggleActive = (id: string) => {
    sound.playTap();
    setPromotions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p))
    );
  };

  const handleAddPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameTh.trim()) return;

    sound.playTap();
    const newPromo: Promotion = {
      id: `promo_${Date.now()}`,
      name_th: nameTh.trim(),
      name_en: nameEn.trim() || nameTh.trim(),
      type,
      value,
      minSpend,
      isActive: true,
    };
    setPromotions([...promotions, newPromo]);
    setNameTh('');
    setNameEn('');
    setShowAdd(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden text-slate-900 select-none">
      <div className="p-3 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Tag className="w-4 h-4 text-orange-600" />
          <span>{t('navPromotions')}</span>
        </h3>

        <button
          onClick={() => {
            sound.playTap();
            setShowAdd(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition cursor-pointer min-h-[40px] shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มโปรโมชั่น</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {promotions.map((promo) => (
            <div
              key={promo.id}
              className={`p-5 rounded-3xl border transition space-y-3 bg-white shadow-xs ${
                promo.isActive
                  ? 'border-orange-200 ring-1 ring-orange-200/50'
                  : 'border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    {promo.name_th}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">{promo.name_en}</p>
                </div>
                <button
                  onClick={() => handleToggleActive(promo.id)}
                  className={`text-xs font-bold px-2.5 py-1 rounded-full border cursor-pointer transition ${
                    promo.isActive
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                >
                  {promo.isActive ? 'เปิดใช้งาน' : 'ปิดอยู่'}
                </button>
              </div>

              <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 flex justify-between items-center font-medium">
                <span>
                  ส่วนลด: <span className="font-bold text-orange-600">{promo.value} {promo.type === 'percent' ? '%' : 'บาท'}</span>
                </span>
                {promo.minSpend && promo.minSpend > 0 ? (
                  <span className="text-slate-400">ขั้นต่ำ ฿{promo.minSpend}</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 max-w-sm w-full shadow-2xl text-slate-900 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
              <h3 className="text-base font-bold text-orange-600">เพิ่มโปรโมชั่น</h3>
              <button
                onClick={() => setShowAdd(false)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPromo} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อโปรโมชั่น (ไทย) *
                </label>
                <input
                  type="text"
                  required
                  value={nameTh}
                  onChange={(e) => setNameTh(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อโปรโมชั่น (อังกฤษ)
                </label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ประเภท
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as 'percent' | 'amount')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                  >
                    <option value="percent">เปอร์เซ็นต์ (%)</option>
                    <option value="amount">บาท (THB)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    มูลค่าลด
                  </label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ยอดสั่งขั้นต่ำ (บาท)
                </label>
                <input
                  type="number"
                  value={minSpend}
                  onChange={(e) => setMinSpend(Number(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
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
