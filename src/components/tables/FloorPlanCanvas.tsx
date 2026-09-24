import React, { useState, useRef, useEffect } from 'react';
import { DiningTable, TableShape } from '../../types';
import { useI18n } from '../../i18n';
import { sound } from '../../utils/sound';
import {
  RotateCw,
  Copy,
  Trash2,
  Edit2,
  Check,
  Maximize2,
  Users,
  AlertTriangle,
  Move,
  Clock,
} from 'lucide-react';

interface FloorPlanCanvasProps {
  tables: DiningTable[];
  isEditMode: boolean;
  activeZoneName: string;
  onSelectTable: (table: DiningTable) => void;
  onUpdateTable: (id: string, changes: Partial<DiningTable>) => Promise<void>;
  onDuplicateTable: (id: string) => Promise<void>;
  onDeleteTable: (id: string) => Promise<void>;
}

export const FloorPlanCanvas: React.FC<FloorPlanCanvasProps> = ({
  tables,
  isEditMode,
  activeZoneName,
  onSelectTable,
  onUpdateTable,
  onDuplicateTable,
  onDeleteTable,
}) => {
  const { language } = useI18n();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [editName, setEditName] = useState('');
  const [deleteWarning, setDeleteWarning] = useState<string | null>(null);

  // Dragging state
  const draggingRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    hasMoved: boolean;
  } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);

  const selectedItem = tables.find((t) => t.id === selectedId);

  // Filter tables by active zone (unless 'all')
  const visibleTables = tables.filter((t) => {
    if (activeZoneName === 'all') return true;
    return t.zone === activeZoneName;
  });

  // Snap to 20px grid helper
  const snapToGrid = (val: number, gridSize = 20) => {
    return Math.round(val / gridSize) * gridSize;
  };

  const handlePointerDown = (e: React.PointerEvent, table: DiningTable) => {
    if (!isEditMode) return;
    e.stopPropagation();
    sound.playTap();

    setSelectedId(table.id);
    setIsRenaming(false);
    setDeleteWarning(null);

    // Capture pointer
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    draggingRef.current = {
      id: table.id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: table.x,
      initialY: table.y,
      hasMoved: false,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current || !isEditMode) return;
    const { id, startX, startY, initialX, initialY } = draggingRef.current;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      draggingRef.current.hasMoved = true;
    }

    const newRawX = Math.max(10, initialX + dx);
    const newRawY = Math.max(10, initialY + dy);
    const snappedX = snapToGrid(newRawX);
    const snappedY = snapToGrid(newRawY);

    // Update in memory/DOM immediately
    const el = document.getElementById(`floor-item-${id}`);
    if (el) {
      el.style.left = `${snappedX}px`;
      el.style.top = `${snappedY}px`;
    }
  };

  const handlePointerUp = async (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const { id, startX, startY, initialX, initialY, hasMoved } = draggingRef.current;
    draggingRef.current = null;

    if (hasMoved) {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const newX = snapToGrid(Math.max(10, initialX + dx));
      const newY = snapToGrid(Math.max(10, initialY + dy));
      await onUpdateTable(id, { x: newX, y: newY });
    }
  };

  const handleRotate = async () => {
    if (!selectedItem) return;
    sound.playTap();
    const nextRot = ((selectedItem.rotation || 0) + 45) % 360;
    await onUpdateTable(selectedItem.id, { rotation: nextRot });
  };

  const handleResize = async (dw: number, dh: number) => {
    if (!selectedItem) return;
    sound.playTap();
    const newW = Math.max(40, snapToGrid(selectedItem.width + dw));
    const newH = Math.max(40, snapToGrid(selectedItem.height + dh));
    await onUpdateTable(selectedItem.id, { width: newW, height: newH });
  };

  const handleSeatsChange = async (dSeats: number) => {
    if (!selectedItem) return;
    sound.playTap();
    const newSeats = Math.max(1, Math.min(16, (selectedItem.seats || 4) + dSeats));
    await onUpdateTable(selectedItem.id, { seats: newSeats });
  };

  const handleToggleAutoChairs = async () => {
    if (!selectedItem) return;
    sound.playTap();
    await onUpdateTable(selectedItem.id, { showAutoChairs: !selectedItem.showAutoChairs });
  };

  const handleSaveRename = async () => {
    if (!selectedItem || !editName.trim()) return;
    sound.playTap();
    await onUpdateTable(selectedItem.id, { name: editName.trim() });
    setIsRenaming(false);
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    sound.playTap();

    // Check if table has open order
    if (selectedItem.status === 'occupied' || selectedItem.status === 'billed' || !!selectedItem.currentOrderId) {
      setDeleteWarning(
        language === 'th'
          ? `ไม่สามารถลบ "${selectedItem.name}" ได้ เนื่องจากมีออเดอร์เปิดอยู่หรือยังไม่ได้ชำระเงิน`
          : `Cannot delete "${selectedItem.name}" because it currently has an open or billed order.`
      );
      return;
    }

    await onDeleteTable(selectedItem.id);
    setSelectedId(null);
  };

  // Helper to render auto-arranged chairs around a table
  const renderAutoChairs = (table: DiningTable) => {
    if (table.itemType === 'chair' || !table.showAutoChairs) return null;

    const count = table.seats || 4;
    const chairs = [];
    const chairSize = 14;

    if (table.shape === 'round') {
      const radiusX = table.width / 2 + 10;
      const radiusY = table.height / 2 + 10;
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
      // Rectangular distribution
      // Top and bottom chairs
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
              top: `${-chairSize - 4}px`,
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
                bottom: `${-chairSize - 4}px`,
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
    <div
      ref={canvasRef}
      onClick={() => {
        if (isEditMode) setSelectedId(null);
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={`relative w-full h-full min-h-[500px] overflow-auto select-none ${
        isEditMode
          ? 'bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] bg-[size:20px_20px] bg-slate-50 cursor-crosshair'
          : 'bg-slate-50'
      }`}
    >
      {/* Floating Inspector in Edit Mode */}
      {isEditMode && selectedItem && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur-md border border-slate-300 shadow-2xl rounded-2xl p-3 flex flex-wrap items-center gap-3 animate-in fade-in slide-in-from-bottom-3 text-slate-800"
        >
          {/* Item Name / Rename */}
          <div className="flex items-center gap-2 border-r border-slate-200 pr-3">
            {isRenaming ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-20 px-2 py-1 text-xs border border-orange-500 rounded-lg bg-white"
                  autoFocus
                />
                <button
                  onClick={handleSaveRename}
                  className="p-1 rounded bg-orange-500 text-white cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm text-slate-900">{selectedItem.name}</span>
                <button
                  onClick={() => {
                    setEditName(selectedItem.name);
                    setIsRenaming(true);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                  title="Rename"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Size controls */}
          <div className="flex items-center gap-1 border-r border-slate-200 pr-3">
            <span className="text-[11px] text-slate-500 font-semibold mr-1">ขนาด:</span>
            <button
              onClick={() => handleResize(-20, -20)}
              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-xs font-bold cursor-pointer"
              title="Smaller"
            >
              -
            </button>
            <span className="text-xs font-mono font-bold text-slate-700">
              {selectedItem.width}x{selectedItem.height}
            </span>
            <button
              onClick={() => handleResize(20, 20)}
              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-xs font-bold cursor-pointer"
              title="Larger"
            >
              +
            </button>
          </div>

          {/* Rotate control */}
          <button
            onClick={handleRotate}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold cursor-pointer transition border border-slate-200"
            title="Rotate 45°"
          >
            <RotateCw className="w-3.5 h-3.5 text-orange-600" />
            <span>{selectedItem.rotation || 0}°</span>
          </button>

          {/* Seats & Auto chairs (for tables) */}
          {selectedItem.itemType !== 'chair' && (
            <div className="flex items-center gap-1.5 border-r border-slate-200 pr-3">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <button
                onClick={() => handleSeatsChange(-1)}
                className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-xs font-bold cursor-pointer"
              >
                -
              </button>
              <span className="text-xs font-bold">{selectedItem.seats || 4} ที่</span>
              <button
                onClick={() => handleSeatsChange(1)}
                className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-xs font-bold cursor-pointer"
              >
                +
              </button>

              <button
                onClick={handleToggleAutoChairs}
                className={`ml-1 text-[10px] px-2 py-0.5 rounded-full font-bold cursor-pointer ${
                  selectedItem.showAutoChairs
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {selectedItem.showAutoChairs ? 'เก้าอี้: เปิด' : 'เก้าอี้: ปิด'}
              </button>
            </div>
          )}

          {/* Duplicate */}
          <button
            onClick={() => onDuplicateTable(selectedItem.id)}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer border border-slate-200"
            title="Duplicate"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* Delete */}
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer border border-rose-200"
            title="Delete item"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Delete warning toast/modal */}
      {deleteWarning && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-rose-50 border border-rose-300 rounded-2xl p-4 shadow-xl max-w-md w-full flex items-start gap-3 animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs text-rose-900">
            <div className="font-bold mb-1">
              {language === 'th' ? 'ไม่สามารถลบรายการได้' : 'Cannot delete item'}
            </div>
            <p>{deleteWarning}</p>
          </div>
          <button
            onClick={() => setDeleteWarning(null)}
            className="text-rose-600 hover:text-rose-800 font-bold text-xs cursor-pointer"
          >
            ตกลง
          </button>
        </div>
      )}

      {/* Render All Items on Canvas */}
      {visibleTables.map((table) => {
        const isSelected = selectedId === table.id;
        const isChair = table.itemType === 'chair';
        const isAvailable = table.status === 'available';
        const isOccupied = table.status === 'occupied';
        const isBilled = table.status === 'billed';

        let shapeRadiusClass = 'rounded-2xl';
        if (table.shape === 'round') shapeRadiusClass = 'rounded-full';
        else if (table.shape === 'sofa') shapeRadiusClass = 'rounded-t-3xl rounded-b-xl';
        else if (table.shape === 'bar') shapeRadiusClass = 'rounded-md';

        return (
          <div
            key={table.id}
            id={`floor-item-${table.id}`}
            onPointerDown={(e) => handlePointerDown(e, table)}
            onClick={(e) => {
              e.stopPropagation();
              sound.playTap();
              if (isEditMode) {
                setSelectedId(table.id);
              } else if (!isChair) {
                onSelectTable(table);
              }
            }}
            style={{
              position: 'absolute',
              left: `${table.x}px`,
              top: `${table.y}px`,
              width: `${table.width}px`,
              height: `${table.height}px`,
              transform: `rotate(${table.rotation || 0}deg)`,
              touchAction: 'none',
            }}
            className={`transition-shadow flex flex-col items-center justify-center p-1 select-none ${
              isEditMode
                ? isSelected
                  ? 'ring-3 ring-orange-500 ring-offset-2 shadow-xl cursor-grab active:cursor-grabbing z-20'
                  : 'hover:ring-2 hover:ring-slate-400 cursor-grab z-10'
                : isChair
                ? 'opacity-80 pointer-events-none'
                : 'cursor-pointer hover:shadow-lg active:scale-95 shadow-sm'
            }`}
          >
            {/* Auto Chairs around table */}
            {renderAutoChairs(table)}

            {/* Main Item Body */}
            <div
              className={`w-full h-full ${shapeRadiusClass} flex flex-col items-center justify-center transition-all ${
                isChair
                  ? 'bg-slate-100 border-2 border-slate-300 text-slate-500 shadow-inner'
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
                  {table.chairType === 'stool' ? 'ST' : table.chairType === 'bench' ? 'BN' : 'CH'}
                </span>
              ) : (
                <>
                  <span className="font-black text-xs sm:text-sm tracking-tight leading-none truncate px-1">
                    {table.name}
                  </span>

                  {/* Status Indicator or running total */}
                  {!isEditMode && (isOccupied || isBilled) && (
                    <span className="text-[10px] font-black mt-0.5 px-1 rounded bg-black/20 text-white leading-tight">
                      ฿{(table.runningTotal || 0).toLocaleString()}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
