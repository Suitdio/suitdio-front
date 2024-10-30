'use client';

import React, { useRef, useState } from 'react';
import { ShellWidgetProps, AllWidgetTypes } from '@/lib/type';

interface WidgetShellComponentProps<T extends AllWidgetTypes> {
  widget: ShellWidgetProps<T>;
  children: React.ReactNode;
  onUpdate?: (updatedWidget: ShellWidgetProps<T>) => void;
  onDelete?: () => void;
}

const GRID_SIZE = 20;
const RESIZE_HANDLE_SIZE = 8;

export default function WidgetShell<T extends AllWidgetTypes>({
  widget,
  children,
  onUpdate,
  onDelete,
}: WidgetShellComponentProps<T>) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const shellRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!widget.draggable) return;

    const rect = shellRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const isOnResizeHandle = widget.resizable && checkResizeHandle(x, y);
    if (isOnResizeHandle) {
      setIsResizing(true);
      setResizeDirection(isOnResizeHandle);
    } else {
      setIsDragging(true);
      setDragStart({ x: e.clientX - widget.x, y: e.clientY - widget.y });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging && !isResizing) return;

    if (isDragging) {
      const newX =
        Math.round((e.clientX - dragStart.x) / GRID_SIZE) * GRID_SIZE;
      const newY =
        Math.round((e.clientY - dragStart.y) / GRID_SIZE) * GRID_SIZE;

      onUpdate?.({
        ...widget,
        x: newX,
        y: newY,
      });
    } else if (isResizing && resizeDirection) {
      const rect = shellRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const updatedWidget = resizeShell(widget, x, y, resizeDirection);
      onUpdate?.(updatedWidget);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeDirection(null);
  };

  React.useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing]);

  const checkResizeHandle = (x: number, y: number): string | null => {
    const handles = [
      { x: 0, y: 0, direction: 'nw' },
      { x: widget.width, y: 0, direction: 'ne' },
      { x: 0, y: widget.height, direction: 'sw' },
      { x: widget.width, y: widget.height, direction: 'se' },
    ];

    for (const handle of handles) {
      if (
        Math.abs(x - handle.x) <= RESIZE_HANDLE_SIZE / 2 &&
        Math.abs(y - handle.y) <= RESIZE_HANDLE_SIZE / 2
      ) {
        return handle.direction;
      }
    }

    return null;
  };

  const resizeShell = (
    shell: ShellWidgetProps<T>,
    x: number,
    y: number,
    direction: string
  ): ShellWidgetProps<T> => {
    let newWidth = shell.width;
    let newHeight = shell.height;
    let newX = shell.x;
    let newY = shell.y;

    if (direction.includes('e')) {
      newWidth = Math.max(GRID_SIZE, Math.round(x / GRID_SIZE) * GRID_SIZE);
    }
    if (direction.includes('s')) {
      newHeight = Math.max(GRID_SIZE, Math.round(y / GRID_SIZE) * GRID_SIZE);
    }
    if (direction.includes('w')) {
      const deltaX = Math.round((shell.x - x) / GRID_SIZE) * GRID_SIZE;
      newWidth = Math.max(GRID_SIZE, shell.width + deltaX);
      newX = shell.x - deltaX;
    }
    if (direction.includes('n')) {
      const deltaY = Math.round((shell.y - y) / GRID_SIZE) * GRID_SIZE;
      newHeight = Math.max(GRID_SIZE, shell.height + deltaY);
      newY = shell.y - deltaY;
    }

    return {
      ...shell,
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
    };
  };

  return (
    <div
      ref={shellRef}
      className={`absolute ${widget.isSelected ? 'ring-2 ring-blue-500' : ''}`}
      style={{
        left: widget.x,
        top: widget.y,
        width: widget.width,
        height: widget.height,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
    >
      {children}

      {widget.resizable && widget.isSelected && (
        <>
          <div className='absolute -top-1 -left-1 w-2 h-2 bg-blue-500 cursor-nw-resize' />
          <div className='absolute -top-1 -right-1 w-2 h-2 bg-blue-500 cursor-ne-resize' />
          <div className='absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 cursor-sw-resize' />
          <div className='absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 cursor-se-resize' />
        </>
      )}
    </div>
  );
}
