import React, { useState, useEffect, useMemo } from 'react';
import { DiningTable, FloorZone, Order } from '../../types';
import { useI18n } from '../../i18n';
import { sound } from '../../utils/sound';
import { tableRepo } from '../../db/repositories';
import { CompactTableCard } from './CompactTableCard';
import { FloorPlanCanvas } from './FloorPlanCanvas';
import { ZoneManagerModal } from './ZoneManagerModal';
import { ShapePaletteModal } from './ShapePaletteModal';
import {
  Layers,
  Plus,
  Settings2,
  LayoutGrid,
} from 'lucide-react';

interface TablesViewProps {
  tables: DiningTable[];
  orders?: Order[];
  onSelectTable: (table: DiningTable) => void;
  onRefreshTables: () => Promise<void>;
}

export const TablesView: React.FC<TablesViewProps> = ({
  tables,
  orders = [],
  onSelectTable,
  onRefreshTables,
}) => {
  const { t, language } = useI18n();
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [zones, setZones] = useState<FloorZone[]>([]);
  const [showZoneManager, setShowZoneManager] = useState(false);
  const [showShapePalette, setShowShapePalette] = useState(false);

  // Load zones
  const loadZones = async () => {
    const list = await tableRepo.getZones();
    setZones(list);
    if (selectedZone !== 'all' && list.length > 0 && !list.some((z) => z.name === selectedZone)) {
      setSelectedZone('all');
      setIsEditMode(false);
    }
  };

  useEffect(() => {
    loadZones();
  }, []);

  // Fallback to "All zones" (card view) without errors if the selected zone no longer exists
  useEffect(() => {
    if (selectedZone !== 'all' && zones.length > 0 && !zones.some((z) => z.name === selectedZone)) {
      setSelectedZone('all');
      setIsEditMode(false);
    }
  }, [zones, selectedZone]);

  // Compute live running totals for occupied tables
  const tableRunningTotals = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach((o) => {
      if (o.tableId && (o.status === 'open' || o.status === 'held' || o.status === 'billed')) {
        map[o.tableId] = (map[o.tableId] || 0) + (o.netTotal || 0);
      }
    });
    return map;
  }, [orders]);

  // Filter only orderable tables in cards view
  const orderableTables = useMemo(() => {
    return tables.filter((t) => t.itemType !== 'chair');
  }, [tables]);

  // Determine if a table currently has a saved order (active bill with confirmed items: occupied or billed)
  const hasSavedOrder = (table: DiningTable): boolean => {
    // Available tables have no saved order
    if (table.status === 'available') return false;

    // Occupied or Waiting-for-payment (billed) statuses have saved orders
    if (table.status === 'occupied' || table.status === 'billed') {
      return true;
    }

    // Check if table has an active order with confirmed/saved items in orders
    if (orders && orders.length > 0) {
      const activeOrder = orders.find(
        (o) =>
          o.tableId === table.id &&
          (o.status === 'open' || o.status === 'billed' || o.status === 'held') &&
          !o.isPaid
      );
      if (activeOrder && activeOrder.lines.some((l) => l.status === 'sent')) {
        return true;
      }
    }

    return false;
  };

  // When selectedZone is "All zones", show ONLY tables with a saved order
  const filteredTables = useMemo(() => {
    if (selectedZone === 'all') {
      return orderableTables.filter(hasSavedOrder);
    }
    return orderableTables.filter((table) => table.zone === selectedZone);
  }, [orderableTables, selectedZone, orders]);

  // Table operations
  const handleUpdateTable = async (id: string, changes: Partial<DiningTable>) => {
    await tableRepo.updateTable(id, changes);
    await onRefreshTables();
  };

  const handleDuplicateTable = async (id: string) => {
    sound.playTap();
    await tableRepo.duplicateTable(id);
    await onRefreshTables();
  };

  const handleDeleteTable = async (id: string) => {
    sound.playTap();
    await tableRepo.deleteTable(id);
    await onRefreshTables();
  };

  const handleAddItem = async (item: Omit<DiningTable, 'id'>) => {
    const newId = `${item.itemType || 'table'}_${Date.now()}`;
    await tableRepo.addTable({
      ...item,
      id: newId,
    });
    await onRefreshTables();
  };

  // Zone operations
  const handleAddZone = async (name: string) => {
    await tableRepo.addZone({
      id: `zone_${Date.now()}`,
      name,
      sortOrder: zones.length + 1,
    });
    await loadZones();
  };

  const handleRenameZone = async (id: string, newName: string) => {
    await tableRepo.updateZone(id, { name: newName });
    await loadZones();
    await onRefreshTables();
  };

  const handleReorderZones = async (orderedIds: string[]) => {
    await tableRepo.reorderZones(orderedIds);
    await loadZones();
  };

  const handleDeleteZone = async (
    zoneName: string,
    action: 'delete_tables' | 'move_tables',
    targetZoneName?: string
  ) => {
    await tableRepo.deleteZone(zoneName, action, targetZoneName);
    const updatedZones = await tableRepo.getZones();
    setZones(updatedZones);
    if (selectedZone === zoneName) {
      setSelectedZone('all');
      setIsEditMode(false);
    }
    await onRefreshTables();
  };

  // Automatic view derived directly from selected zone:
  // - "All zones" => ALWAYS Cards view
  // - Any specific zone => ALWAYS Floor Plan canvas
  const isCardsView =
    selectedZone === 'all' ||
    (zones.length > 0 && !zones.some((z) => z.name === selectedZone));

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden text-slate-900 select-none">
      {/* Top Header: Zone Tabs & Mode Switchers */}
      <div className="p-3 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-xs">
        {/* Zone Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 max-w-full">
          <button
            onClick={() => {
              sound.playTap();
              if (isEditMode) {
                setIsEditMode(false);
              }
              setSelectedZone('all');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer min-h-[36px] ${
              selectedZone === 'all'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {language === 'th' ? 'ทุกโซน' : 'All Zones'} ({orderableTables.length})
          </button>

          {zones.map((zone) => {
            const isSel = selectedZone === zone.name;
            const count = orderableTables.filter((t) => t.zone === zone.name).length;
            return (
              <button
                key={zone.id}
                onClick={() => {
                  sound.playTap();
                  setSelectedZone(zone.name);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer min-h-[36px] ${
                  isSel
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {zone.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Action Controls: Edit Layout & Palette */}
        <div className="flex items-center gap-2">
          {/* Edit Layout Mode Toggle */}
          <button
            onClick={() => {
              sound.playTap();
              if (!isEditMode) {
                // If currently on "All zones", automatically select the first available zone so canvas appears
                if (selectedZone === 'all' && zones.length > 0) {
                  setSelectedZone(zones[0].name);
                }
                setIsEditMode(true);
              } else {
                setIsEditMode(false);
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer min-h-[36px] border ${
              isEditMode
                ? 'bg-orange-500 border-orange-600 text-white shadow-xs'
                : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>
              {isEditMode
                ? language === 'th'
                  ? 'เสร็จสิ้นการจัดผัง (Done)'
                  : 'Done Editing'
                : language === 'th'
                ? 'แก้ไขผังร้าน (Edit Layout)'
                : 'Edit Layout'}
            </span>
          </button>

          {/* If in Edit Mode: Add item and Manage zones */}
          {isEditMode && (
            <>
              <button
                onClick={() => {
                  sound.playTap();
                  setShowShapePalette(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition cursor-pointer shadow-xs min-h-[36px]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{language === 'th' ? 'เพิ่มโต๊ะ/เก้าอี้' : 'Add Item'}</span>
              </button>

              <button
                onClick={() => {
                  sound.playTap();
                  setShowZoneManager(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer border border-slate-300 min-h-[36px]"
              >
                <Layers className="w-3.5 h-3.5 text-orange-600" />
                <span>{language === 'th' ? 'จัดการโซน' : 'Zones'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {isCardsView && !isEditMode ? (
          /* Service Mode for "All zones": Compact Table Cards Grid (Only tables with saved order) */
          <div className="h-full overflow-y-auto p-4 sm:p-5">
            {filteredTables.length === 0 ? (
              <div className="py-20 text-center text-slate-400">
                <LayoutGrid className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-bold text-slate-600">
                  {selectedZone === 'all'
                    ? (t('noTablesWithSavedOrders') || (language === 'th' ? 'ยังไม่มีโต๊ะที่บันทึกออเดอร์' : 'No tables with saved orders yet'))
                    : (t('noTablesInZone') || (language === 'th' ? 'ไม่พบโต๊ะในโซนนี้' : 'No tables in this zone'))}
                </p>
                {selectedZone === 'all' && (
                  <p className="text-xs text-slate-400 mt-1">
                    {language === 'th'
                      ? 'เลือกโซนเพื่อดูผังร้านและเปิดโต๊ะใหม่'
                      : 'Select a zone to view floor plan and open a table'}
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2.5 sm:gap-3">
                {filteredTables.map((table) => (
                  <CompactTableCard
                    key={table.id}
                    table={table}
                    runningTotal={tableRunningTotals[table.id]}
                    onSelect={onSelectTable}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Specific Zone View & Edit Mode: Floor Plan Canvas (Shows ALL tables in the zone) */
          <FloorPlanCanvas
            tables={tables}
            isEditMode={isEditMode}
            activeZoneName={selectedZone}
            onSelectTable={onSelectTable}
            onUpdateTable={handleUpdateTable}
            onDuplicateTable={handleDuplicateTable}
            onDeleteTable={handleDeleteTable}
          />
        )}
      </div>

      {/* Zone Manager Modal */}
      <ZoneManagerModal
        isOpen={showZoneManager}
        onClose={() => setShowZoneManager(false)}
        zones={zones}
        tables={tables}
        onAddZone={handleAddZone}
        onRenameZone={handleRenameZone}
        onReorderZones={handleReorderZones}
        onDeleteZone={handleDeleteZone}
      />

      {/* Shape & Item Palette Modal */}
      <ShapePaletteModal
        isOpen={showShapePalette}
        onClose={() => setShowShapePalette(false)}
        activeZoneName={selectedZone === 'all' ? zones[0]?.name || 'Indoor / ในร้าน' : selectedZone}
        zones={zones}
        onAddItem={handleAddItem}
      />
    </div>
  );
};
