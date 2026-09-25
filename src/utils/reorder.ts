import React, { useState, useRef, useCallback } from 'react';

/**
 * Pure function to move an element from startIndex to endIndex in an array
 */
export function reorderArray<T>(list: T[], startIndex: number, endIndex: number): T[] {
  if (startIndex === endIndex || startIndex < 0 || endIndex < 0 || startIndex >= list.length || endIndex >= list.length) {
    return list;
  }
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
}

export interface UseReorderProps<T> {
  items: T[];
  onReorder: (newItems: T[]) => void | Promise<void>;
  attributeName?: string;
}

export function useReorder<T>({ items, onReorder, attributeName = 'data-reorder-index' }: UseReorderProps<T>) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Mouse / HTML5 Drag Handlers
  const handleDragStart = useCallback((index: number, e: React.DragEvent) => {
    setDragIndex(index);
    setDropTargetIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', String(index));
    } catch {
      // Ignore
    }
  }, []);

  const handleDragOver = useCallback(
    (index: number, e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (dropTargetIndex !== index) {
        setDropTargetIndex(index);
      }
    },
    [dropTargetIndex]
  );

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setDropTargetIndex(null);
  }, []);

  const handleDrop = useCallback(
    (index: number, e: React.DragEvent) => {
      e.preventDefault();
      if (dragIndex !== null && dragIndex !== index) {
        const reordered = reorderArray(items, dragIndex, index);
        onReorder(reordered);
      }
      setDragIndex(null);
      setDropTargetIndex(null);
    },
    [dragIndex, items, onReorder]
  );

  // Touch Handlers for Mobile & Tablet
  const handleTouchStart = useCallback((index: number, e: React.TouchEvent) => {
    setDragIndex(index);
    setDropTargetIndex(index);
    if (e.touches.length > 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 0) return;
    const touch = e.touches[0];
    const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
    if (targetEl) {
      const rowEl = targetEl.closest(`[${attributeName}]`);
      if (rowEl) {
        const idxStr = rowEl.getAttribute(attributeName);
        if (idxStr !== null) {
          const idx = parseInt(idxStr, 10);
          if (!isNaN(idx)) {
            setDropTargetIndex(idx);
          }
        }
      }
    }
  }, [attributeName]);

  const handleTouchEnd = useCallback(() => {
    if (dragIndex !== null && dropTargetIndex !== null && dragIndex !== dropTargetIndex) {
      const reordered = reorderArray(items, dragIndex, dropTargetIndex);
      onReorder(reordered);
    }
    setDragIndex(null);
    setDropTargetIndex(null);
    touchStartY.current = null;
  }, [dragIndex, dropTargetIndex, items, onReorder]);

  // Up & Down Arrow Buttons
  const moveUp = useCallback(
    (index: number) => {
      if (index > 0) {
        const reordered = reorderArray(items, index, index - 1);
        onReorder(reordered);
      }
    },
    [items, onReorder]
  );

  const moveDown = useCallback(
    (index: number) => {
      if (index < items.length - 1) {
        const reordered = reorderArray(items, index, index + 1);
        onReorder(reordered);
      }
    },
    [items, onReorder]
  );

  return {
    dragIndex,
    dropTargetIndex,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDrop,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    moveUp,
    moveDown,
  };
}
