import React, { useState } from 'react';
import { ChairType, DiningTable, FloorItemType, FloorZone, TableShape } from '../../types';
import { useI18n } from '../../i18n';
import { sound } from '../../utils/sound';
import {
  X,
  Square,
  Circle,
  RectangleHorizontal,
  Armchair,
  Sparkles,
  Layers,
  Plus,
} from 'lucide-react';

interface ShapePaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeZoneName: string;
  zones: FloorZone[];
  onAddItem: (item: Omit<DiningTable, 'id'>) => Promise<void>;
}

export const ShapePaletteModal: React.FC<ShapePaletteModalProps> = ({
  isOpen,
  onClose,
  activeZoneName,
  zones,
  onAddItem,
}) => {
  const { language } = useI18n();
  const [targetZone, setTargetZone] = useState(activeZoneName || zones[0]?.name || 'Indoor / ในร้าน');
  const [name, setName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'table' | 'chair'>('table');
  const [selectedShape, setSelectedShape] = useState<TableShape>('square');
  const [selectedChairType, setSelectedChairType] = useState<ChairType>('standard');
  const [seats, setSeats] = useState(4);
  const [showAutoChairs, setShowAutoChairs] = useState(true);

  if (!isOpen) return null;

  const tableShapes: { id: TableShape; name_th: string; name_en: string; defaultSeats: number; w: number; h: number; icon: any }[] = [
    { id: 'square', name_th: 'โต๊ะสี่เหลี่ยมจัตุรัส', name_en: 'Square Table', defaultSeats: 4, w: 80, h: 80, icon: Square },
    { id: 'round', name_th: 'โต๊ะกลม', name_en: 'Round Table', defaultSeats: 4, w: 80, h: 80, icon: Circle },
    { id: 'rectangle', name_th: 'โต๊ะสี่เหลี่ยมผืนผ้า', name_en: 'Rectangle Table', defaultSeats: 6, w: 120, h: 80, icon: RectangleHorizontal },
    { id: 'long', name_th: 'โต๊ะยาวจัดเลี้ยง', name_en: 'Long Banquet Table', defaultSeats: 8, w: 160, h: 80, icon: RectangleHorizontal },
    { id: 'bar', name_th: 'เคาน์เตอร์บาร์', name_en: 'Bar Counter', defaultSeats: 4, w: 140, h: 60, icon: Layers },
    { id: 'sofa', name_th: 'โซฟา / บูธ', name_en: 'Sofa / Booth', defaultSeats: 4, w: 100, h: 80, icon: Armchair },
  ];

  const chairTypes: { id: ChairType; name_th: string; name_en: string; w: number; h: number }[] = [
    { id: 'standard', name_th: 'เก้าอี้มาตรฐาน', name_en: 'Standard Chair', w: 32, h: 32 },
    { id: 'stool', name_th: 'เก้าอี้สตูล / บาร์', name_en: 'Stool / Bar Chair', w: 28, h: 28 },
    { id: 'bench', name_th: 'ม้านั่งยาว', name_en: 'Bench', w: 70, h: 30 },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playTap();

    if (selectedCategory === 'table') {
      const shapeConfig = tableShapes.find((s) => s.id === selectedShape)!;
      const defaultName = `T${Date.now().toString().slice(-3)}`;
      await onAddItem({
        name: name.trim() || defaultName,
        zone: targetZone,
        seats,
        shape: selectedShape,
        itemType: 'table',
        showAutoChairs,
        x: 60 + Math.floor(Math.random() * 80),
        y: 60 + Math.floor(Math.random() * 80),
        width: shapeConfig.w,
        height: shapeConfig.h,
        rotation: 0,
        status: 'available',
      });
    } else {
      const chairConfig = chairTypes.find((c) => c.id === selectedChairType)!;
      const defaultName = `C${Date.now().toString().slice(-3)}`;
      await onAddItem({
        name: name.trim() || defaultName,
        zone: targetZone,
        seats: selectedChairType === 'bench' ? 2 : 1,
        shape: 'square',
        itemType: 'chair',
        chairType: selectedChairType,
        showAutoChairs: false,
        x: 60 + Math.floor(Math.random() * 80),
        y: 60 + Math.floor(Math.random() * 80),
        width: chairConfig.w,
        height: chairConfig.h,
        rotation: 0,
        status: 'available',
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs select-none">
      <div className="bg-white border border-slate-200 rounded-3xl p-5 max-w-lg w-full shadow-2xl text-slate-900 space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {language === 'th' ? 'เพิ่มโต๊ะหรือเก้าอี้ใหม่' : 'Add Table or Chair'}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'th' ? 'เลือกประเภทและรูปทรงที่ต้องการจัดวาง' : 'Select shape and layout settings'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playTap();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Switcher: Table vs Chair */}
        <div className="flex rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => {
              sound.playTap();
              setSelectedCategory('table');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
              selectedCategory === 'table'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {language === 'th' ? 'โต๊ะอาหาร (Table - สั่งอาหารได้)' : 'Dining Table (Orderable)'}
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playTap();
              setSelectedCategory('chair');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
              selectedCategory === 'chair'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {language === 'th' ? 'เก้าอี้แยกชิ้น (Chair - แสดงผลเท่านั้น)' : 'Standalone Chair (Visual)'}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Target Zone & Item Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {language === 'th' ? 'โซนที่จัดวาง' : 'Floor Zone'}
              </label>
              <select
                value={targetZone}
                onChange={(e) => setTargetZone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.name}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {language === 'th' ? 'ชื่อเรียก / หมายเลข' : 'Name / Label'}
              </label>
              <input
                type="text"
                placeholder={selectedCategory === 'table' ? 'เช่น T1, A1, B2' : 'เช่น C1, Stool 1'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Table Shape Palette */}
          {selectedCategory === 'table' ? (
            <>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">
                  {language === 'th' ? 'เลือกรูปทรงโต๊ะ' : 'Choose Table Shape'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {tableShapes.map((shape) => {
                    const Icon = shape.icon;
                    const isSelected = selectedShape === shape.id;
                    return (
                      <button
                        key={shape.id}
                        type="button"
                        onClick={() => {
                          sound.playTap();
                          setSelectedShape(shape.id);
                          setSeats(shape.defaultSeats);
                        }}
                        className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer min-h-[82px] ${
                          isSelected
                            ? 'bg-orange-50 border-orange-500 text-orange-950 font-bold ring-2 ring-orange-500/20'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-orange-600' : 'text-slate-400'}`} />
                        <div>
                          <div className="text-xs leading-tight">
                            {language === 'th' ? shape.name_th : shape.name_en}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {shape.w}x{shape.h} px
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Seats and Auto-chair toggle */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      {language === 'th' ? 'จำนวนที่นั่ง (Seats)' : 'Chair Count'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {language === 'th' ? 'ใช้สำหรับวาดเก้าอี้ล้อมรอบโต๊ะอัตโนมัติ' : 'Used for auto-drawing chairs'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSeats(Math.max(1, seats - 1))}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-bold text-sm text-slate-900">{seats}</span>
                    <button
                      type="button"
                      onClick={() => setSeats(Math.min(16, seats + 1))}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer pt-2 border-t border-slate-200">
                  <input
                    type="checkbox"
                    checked={showAutoChairs}
                    onChange={(e) => setShowAutoChairs(e.target.checked)}
                    className="accent-orange-500 w-4 h-4 rounded"
                  />
                  <span>
                    {language === 'th'
                      ? 'วาดเก้าอี้รอบโต๊ะอัตโนมัติ (Auto-arranged chairs around table)'
                      : 'Auto-arrange chairs around this table'}
                  </span>
                </label>
              </div>
            </>
          ) : (
            /* Standalone Chair Palette */
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-2">
                {language === 'th' ? 'เลือกประเภทเก้าอี้' : 'Choose Chair Type'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {chairTypes.map((chair) => {
                  const isSelected = selectedChairType === chair.id;
                  return (
                    <button
                      key={chair.id}
                      type="button"
                      onClick={() => {
                        sound.playTap();
                        setSelectedChairType(chair.id);
                      }}
                      className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer min-h-[72px] ${
                        isSelected
                          ? 'bg-orange-50 border-orange-500 text-orange-950 font-bold ring-2 ring-orange-500/20'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <Armchair className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-orange-600' : 'text-slate-400'}`} />
                      <div>
                        <div className="text-xs leading-tight">
                          {language === 'th' ? chair.name_th : chair.name_en}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {chair.w}x{chair.h} px
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-500 mt-2.5">
                {language === 'th'
                  ? '* เก้าอี้และของตกแต่งเป็นองค์ประกอบแสดงผลเท่านั้น จะไม่สามารถคลิกสั่งอาหารในโหมดบริการได้'
                  : '* Standalone chairs are visual layout elements only, and cannot be tapped to order in service mode.'}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                sound.playTap();
                onClose();
              }}
              className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100 cursor-pointer min-h-[40px]"
            >
              {language === 'th' ? 'ยกเลิก' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs min-h-[40px]"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'th' ? 'เพิ่มลงในผัง' : 'Add to Floor Plan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
