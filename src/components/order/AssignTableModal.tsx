import React, { useState, useMemo, useRef, useEffect } from 'react';
import { DiningTable, OrderType } from '../../types';
import { useI18n } from '../../i18n';
import { sound } from '../../utils/sound';
import {
  X,
  BookmarkCheck,
  ShoppingBag,
  Utensils,
  PauseCircle,
  MapPin,
  Layers,
} from 'lucide-react';

interface AssignTableModalProps {
  isOpen: boolean;
  tables: DiningTable[];
  currentTableId?: string;
  currentOrderType: OrderType;
  onClose: () => void;
  onAssignTakeaway: () => void;
  onAssignTable: (table: DiningTable) => void;
  onHoldOnly: () => void;
}

export const AssignTableModal: React.FC<AssignTableModalProps> = ({
  isOpen,
  tables,
  currentTableId,
  currentOrderType,
  onClose,
  onAssignTakeaway,
  onAssignTable,
  onHoldOnly,
}) => {
  const { t, language } = useI18n();
  const [selectedZone, setSelectedZone] = useState<string>('all');

  // Measure container for responsive floor plan scaling
  const planContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(620);

  // Extract all distinct zone names from tables
  const zones = useMemo(() => {
    const set = new Set<string>();
    tables.forEach((item) => {
      if (item.zone && item.zone.trim()) {
        set.add(item.zone.trim());
      }
    });
    return Array.from(set);
  }, [tables]);

  // Compute view mode directly on every render:
  // If selectedZone is not 'all' and does not exist in zones, fall back to 'all'
  const effectiveZone =
    selectedZone === 'all' || !zones.includes(selectedZone) ? 'all' : selectedZone;

  // Rule: 'all' => cards view; specific zone => automatic floor plan view
  const isCardsView = effectiveZone === 'all';

  // Filter items in the effective zone
  const zoneItems = useMemo(() => {
    if (effectiveZone === 'all') return [];
    return tables.filter((item) => item.zone === effectiveZone);
  }, [tables, effectiveZone]);

  // Filter only orderable tables for cards view
  const orderableTables = useMemo(() => {
    return tables.filter((item) => item.itemType !== 'chair');
  }, [tables]);

  // Track container width for floor plan scaling
  useEffect(() => {
    if (!isOpen || isCardsView || !planContainerRef.current) return;

    const measure = () => {
      if (planContainerRef.current) {
        setContainerWidth(planContainerRef.current.clientWidth);
      }
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(planContainerRef.current);
    return () => observer.disconnect();
  }, [isOpen, isCardsView, effectiveZone]);

  // Compute bounding box dimensions of items in the selected zone to scale layout
  const { contentWidth, contentHeight } = useMemo(() => {
    if (zoneItems.length === 0) {
      return { contentWidth: 520, contentHeight: 380 };
    }
    const rights = zoneItems.map((item) => item.x + item.width + 30);
    const bottoms = zoneItems.map((item) => item.y + item.height + 30);
    const maxRight = Math.max(...rights);
    const maxBottom = Math.max(...bottoms);

    return {
      contentWidth: Math.max(520, maxRight + 20),
      contentHeight: Math.max(380, maxBottom + 20),
    };
  }, [zoneItems]);

  if (!isOpen) return null;

  // Scale factor to fit inside the modal's dialog width while preserving proportions
  const scale =
    containerWidth > 0 ? Math.min(1, Math.max(0.4, (containerWidth - 24) / contentWidth)) : 1;

  // Helper to render chairs around a table on the floor plan
  const renderAutoChairs = (table: DiningTable) => {
    if (table.itemType === 'chair' || !table.showAutoChairs) return null;

    const count = table.seats || 4;
    const chairs = [];
    const chairSize = 13;

    if (table.shape === 'round') {
      const radiusX = table.width / 2 + 8;
      const radiusY = table.height / 2 + 8;
      const centerX = table.width / 2;
      const centerY = table.height / 2;

      for (let i = 0; i < count; i++) {
        const angle = (i * 2 * Math.PI) / count - Math.PI / 2;
        const cx = centerX + radiusX * Math.cos(angle) - chairSize / 2;
        const cy = centerY + radiusY * Math.sin(angle) - chairSize / 2;

        chairs.push(
          <div
            key={i}
            className="absolute rounded-full bg-slate-300 border border-slate-400 pointer-events-none"
            style={{
              left: `${cx}px`,
              top: `${cy}px`,
              width: `${chairSize}px`,
              height: `${chairSize}px`,
            }}
          />
        );
      }
    } else {
      const sideChairs = Math.max(1, Math.floor(count / 2));
      const spacingX = table.width / (sideChairs + 1);

      for (let i = 0; i < sideChairs; i++) {
        const cx = spacingX * (i + 1) - chairSize / 2;

        // Top chair
        chairs.push(
          <div
            key={`top-${i}`}
            className="absolute rounded-md bg-slate-300 border border-slate-400 pointer-events-none"
            style={{
              left: `${cx}px`,
              top: `${-chairSize - 3}px`,
              width: `${chairSize}px`,
              height: `${chairSize}px`,
            }}
          />
        );

        // Bottom chair
        if (i + sideChairs < count) {
          chairs.push(
            <div
              key={`bot-${i}`}
              className="absolute rounded-md bg-slate-300 border border-slate-400 pointer-events-none"
              style={{
                left: `${cx}px`,
                bottom: `${-chairSize - 3}px`,
                width: `${chairSize}px`,
                height: `${chairSize}px`,
              }}
            />
          );
        }
      }
    }

    return chairs;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-2.5 sm:p-5 backdrop-blur-xs select-none animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl sm:max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl text-slate-900 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
              <BookmarkCheck className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                {language === 'th' ? 'บันทึกออเดอร์ (Save Order)' : 'Save Order'}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'th'
                  ? 'เลือกบันทึกลงโต๊ะอาหาร หรือสั่งกลับบ้าน / พักบิล'
                  : 'Assign order to a table, takeaway queue, or hold'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Assignment Actions (Takeaway & Park) */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 bg-slate-50/50 grid grid-cols-2 gap-3 shrink-0">
          {/* Takeaway / Counter Option */}
          <button
            onClick={() => {
              sound.playTap();
              onAssignTakeaway();
            }}
            className="p-3.5 rounded-2xl border-2 border-orange-500/80 bg-orange-50 hover:bg-orange-100/70 text-left transition cursor-pointer shadow-xs active:scale-[0.99] flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-orange-950 flex items-center gap-1.5">
                <span>{language === 'th' ? 'สั่งกลับบ้าน (Takeaway)' : 'Takeaway / To-Go'}</span>
              </div>
              <div className="text-[11px] text-orange-800/80 mt-0.5">
                {language === 'th' ? 'ออกบัตรคิว Q# อัตโนมัติ' : 'Auto queue ticket'}
              </div>
            </div>
          </button>

          {/* Just Hold / Park Order */}
          <button
            onClick={() => {
              sound.playTap();
              onHoldOnly();
            }}
            className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-100 text-left transition cursor-pointer shadow-xs active:scale-[0.99] flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <PauseCircle className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">
                {language === 'th' ? 'พักบิลไว้ก่อน (Park Order)' : 'Park / Hold'}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {language === 'th' ? 'เรียกกลับมาทำต่อได้ตลอด' : 'Resume anytime'}
              </div>
            </div>
          </button>
        </div>

        {/* Section: Assign to Table with Zone Chips */}
        <div className="p-3.5 sm:p-4 flex-1 overflow-y-auto space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Utensils className="w-4 h-4 text-orange-600" />
              <span>{language === 'th' ? 'ระบุโต๊ะอาหาร (Dine In Table)' : 'Select Table'}</span>
            </div>

            {/* Zone Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 max-w-full">
              {/* All Zones Chip */}
              <button
                onClick={() => {
                  sound.playTap();
                  setSelectedZone('all');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer min-h-[34px] ${
                  effectiveZone === 'all'
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {t('allZones')} ({orderableTables.length})
              </button>

              {/* Specific Zone Chips */}
              {zones.map((zone) => {
                const isSel = effectiveZone === zone;
                const count = orderableTables.filter((t) => t.zone === zone).length;
                return (
                  <button
                    key={zone}
                    onClick={() => {
                      sound.playTap();
                      setSelectedZone(zone);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer min-h-[34px] ${
                      isSel
                        ? 'bg-orange-500 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {zone} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* VIEW 1: Zone Chip = "All" -> Tables as Cards (Current card design unchanged) */}
          {isCardsView ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 pt-1">
              {orderableTables.map((table) => {
                const isCurrent = currentTableId === table.id;
                const isAvailable = table.status === 'available';
                const isOccupied = table.status === 'occupied';

                return (
                  <button
                    key={table.id}
                    onClick={() => {
                      sound.playTap();
                      onAssignTable(table);
                    }}
                    className={`p-3 rounded-2xl border-2 text-left transition flex flex-col justify-between min-h-[76px] cursor-pointer shadow-xs active:scale-[0.98] ${
                      isCurrent
                        ? 'bg-orange-500 border-orange-600 text-white shadow-md ring-2 ring-orange-300'
                        : isAvailable
                        ? 'bg-white border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/20 text-slate-800'
                        : isOccupied
                        ? 'bg-orange-50/70 border-orange-300 hover:border-orange-500 text-orange-950'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm">{table.name}</span>
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          isCurrent
                            ? 'bg-white'
                            : isAvailable
                            ? 'bg-emerald-500'
                            : isOccupied
                            ? 'bg-orange-500'
                            : 'bg-sky-500'
                        }`}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] mt-2">
                      <span className={isCurrent ? 'text-orange-100' : 'text-slate-400'}>
                        {table.zone || 'Zone'}
                      </span>
                      <span
                        className={`font-semibold ${
                          isCurrent
                            ? 'text-white'
                            : isAvailable
                            ? 'text-emerald-700'
                            : isOccupied
                            ? 'text-orange-700'
                            : 'text-slate-500'
                        }`}
                      >
                        {isCurrent
                          ? t('currentTable')
                          : isAvailable
                          ? t('tableAvailable')
                          : isOccupied
                          ? t('tableOccupied')
                          : t('tableReserved')}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            /* VIEW 2: Zone Chip = Specific Zone -> Automatic Floor Plan Layout View */
            <div className="space-y-2 pt-1">
              {/* Floor Plan Header / Helper Legend */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
                <span className="text-slate-500 font-medium">
                  {t('floorPlanViewNote')}
                </span>
                <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600">
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>{t('tableAvailable')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                    <span>{t('tableOccupied')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    <span>{t('tableReserved')}</span>
                  </div>
                </div>
              </div>

              {/* Floor Plan Canvas Container (compact read-only selection view) */}
              <div
                ref={planContainerRef}
                className="w-full overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-2 min-h-[300px] max-h-[460px] flex items-center justify-center relative scrollbar-thin shadow-inner"
              >
                {zoneItems.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    <Layers className="w-7 h-7 mx-auto mb-2 text-slate-300" />
                    <p>{t('noTablesInZone')}</p>
                    <button
                      onClick={() => setSelectedZone('all')}
                      className="mt-2 px-3 py-1 bg-orange-500 text-white rounded-lg font-bold text-xs cursor-pointer"
                    >
                      {t('allZones')}
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      width: `${contentWidth}px`,
                      height: `${contentHeight}px`,
                      transform: `scale(${scale})`,
                      transformOrigin: 'top center',
                      marginBottom:
                        scale < 1
                          ? `-${Math.round(contentHeight * (1 - scale))}px`
                          : undefined,
                    }}
                    className="relative shrink-0 select-none bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] bg-[size:20px_20px] rounded-xl"
                  >
                    {zoneItems.map((table) => {
                      const isCurrent = currentTableId === table.id;
                      const isChair = table.itemType === 'chair';
                      const isAvailable = table.status === 'available';
                      const isOccupied = table.status === 'occupied';
                      const isBilled = table.status === 'billed';

                      let shapeRadiusClass = 'rounded-2xl';
                      if (table.shape === 'round') shapeRadiusClass = 'rounded-full';
                      else if (table.shape === 'sofa')
                        shapeRadiusClass = 'rounded-t-3xl rounded-b-xl';
                      else if (table.shape === 'bar') shapeRadiusClass = 'rounded-md';

                      return (
                        <div
                          key={table.id}
                          onClick={() => {
                            if (isChair) return;
                            sound.playTap();
                            onAssignTable(table);
                          }}
                          style={{
                            position: 'absolute',
                            left: `${table.x}px`,
                            top: `${table.y}px`,
                            width: `${table.width}px`,
                            height: `${table.height}px`,
                            transform: `rotate(${table.rotation || 0}deg)`,
                          }}
                          className={`transition-all flex flex-col items-center justify-center p-1 select-none ${
                            isChair
                              ? 'opacity-80 pointer-events-none'
                              : 'cursor-pointer hover:scale-105 active:scale-95 z-10'
                          }`}
                        >
                          {/* Auto Chairs around table */}
                          {renderAutoChairs(table)}

                          {/* Table Body with Exact Same Status Border Colors and Shapes */}
                          <div
                            className={`w-full h-full ${shapeRadiusClass} flex flex-col items-center justify-center transition-all ${
                              isChair
                                ? 'bg-slate-100 border-2 border-slate-300 text-slate-500 shadow-inner'
                                : isCurrent
                                ? 'bg-orange-500 border-[3px] border-orange-600 text-white shadow-lg ring-4 ring-orange-400/80'
                                : isAvailable
                                ? 'bg-emerald-50 border-[3px] border-[#047857] text-slate-800 hover:shadow-md'
                                : isOccupied
                                ? 'bg-orange-100 border-[3px] border-[#dc2626] text-slate-900 shadow-md'
                                : isBilled
                                ? 'bg-rose-100 border-[3px] border-[#dc2626] text-slate-900 shadow-md'
                                : 'bg-blue-50 border-[3px] border-[#2563eb] text-slate-900'
                            }`}
                          >
                            {isChair ? (
                              <span className="text-[10px] font-bold tracking-tighter opacity-70">
                                {table.chairType === 'stool'
                                  ? 'ST'
                                  : table.chairType === 'bench'
                                  ? 'BN'
                                  : 'CH'}
                              </span>
                            ) : (
                              <>
                                <span
                                  className={`font-black text-xs sm:text-sm tracking-tight leading-none truncate px-1 ${
                                    isCurrent ? 'text-white' : ''
                                  }`}
                                >
                                  {table.name}
                                </span>

                                {isCurrent ? (
                                  <span className="text-[10px] font-bold mt-1 px-1.5 py-0.2 rounded-full bg-white/30 text-white leading-tight">
                                    {t('currentTable')}
                                  </span>
                                ) : (
                                  (isOccupied || isBilled) && (
                                    <span className="text-[10px] font-black mt-0.5 px-1 rounded bg-black/20 text-white leading-tight">
                                      ฿{(table.runningTotal || 0).toLocaleString()}
                                    </span>
                                  )
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};
