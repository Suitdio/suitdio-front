'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PlusCircle, Move, Type, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TextWidget {
  id: string;
  x: number;
  y: number;
  text: string;
  width: number;
  height: number;
  isResizing: boolean;
}

const GRID_SIZE = 20;
const FONT_SIZE = 16;
const RESIZE_HANDLE_SIZE = 8;

export default function Whiteboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [widgets, setWidgets] = useState<TextWidget[]>([]);
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [tool, setTool] = useState<'select' | 'text'>('select');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  const drawGrid = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      ctx.save();
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1;

      const scaledGridSize = GRID_SIZE;

      const startX = Math.floor(-offset.x / scaledGridSize) * scaledGridSize;
      const startY = Math.floor(-offset.y / scaledGridSize) * scaledGridSize;
      const endX = startX + ctx.canvas.width / scale;
      const endY = startY + ctx.canvas.height / scale;

      for (let x = startX; x < endX; x += scaledGridSize) {
        for (let y = startY; y < endY; y += scaledGridSize) {
          ctx.beginPath();
          ctx.arc(x, y, 0.5, 0, 2 * Math.PI);
          ctx.stroke();
        }
      }
      ctx.restore();
    },
    [offset, scale]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventDefault = (e: WheelEvent) => {
      e.preventDefault();
    };

    container.addEventListener('wheel', preventDefault, { passive: false });

    return () => {
      container.removeEventListener('wheel', preventDefault);
    };
  }, []);

  const drawWidgets = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      widgets.forEach((widget) => {
        ctx.save();
        ctx.fillStyle = widget.id === selectedWidget ? '#e3f2fd' : 'white';
        ctx.fillRect(widget.x, widget.y, widget.width, widget.height);
        ctx.strokeStyle = widget.id === selectedWidget ? '#2196f3' : '#000000';
        ctx.strokeRect(widget.x, widget.y, widget.width, widget.height);
        ctx.fillStyle = 'black';
        ctx.font = `${FONT_SIZE}px Arial`;
        ctx.fillText(widget.text, widget.x + 5, widget.y + FONT_SIZE + 5);

        // Draw resize handles if the widget is selected
        if (widget.id === selectedWidget) {
          const handles = [
            { x: widget.x, y: widget.y, cursor: 'nwse-resize' },
            { x: widget.x + widget.width, y: widget.y, cursor: 'nesw-resize' },
            { x: widget.x, y: widget.y + widget.height, cursor: 'nesw-resize' },
            {
              x: widget.x + widget.width,
              y: widget.y + widget.height,
              cursor: 'nwse-resize',
            },
          ];

          handles.forEach((handle) => {
            ctx.fillStyle = '#2196f3';
            ctx.fillRect(
              handle.x - RESIZE_HANDLE_SIZE / 2,
              handle.y - RESIZE_HANDLE_SIZE / 2,
              RESIZE_HANDLE_SIZE,
              RESIZE_HANDLE_SIZE
            );
          });
        }

        ctx.restore();
      });
    },
    [widgets, selectedWidget]
  );

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(scale, scale);
    ctx.translate(offset.x, offset.y);
    drawGrid(ctx);
    drawWidgets(ctx);
    ctx.restore();
  }, [drawGrid, drawWidgets, scale, offset]);

  useEffect(() => {
    redraw();
  }, [scale, offset, redraw]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - offset.x * scale) / scale;
    const y = (e.clientY - rect.top - offset.y * scale) / scale;

    if (tool === 'text') {
      const newWidget: TextWidget = {
        id: Date.now().toString(),
        x: Math.round(x / GRID_SIZE) * GRID_SIZE,
        y: Math.round(y / GRID_SIZE) * GRID_SIZE,
        text: 'New Text',
        width: 100,
        height: 30,
        isResizing: false,
      };
      setWidgets([...widgets, newWidget]);
      setSelectedWidget(newWidget.id);
      setTool('select');
    } else {
      const clickedWidget = widgets.find(
        (widget) =>
          x >= widget.x &&
          x <= widget.x + widget.width &&
          y >= widget.y &&
          y <= widget.y + widget.height
      );

      // handleMouseDown 함수 내부에서 selectedWidget 상태를 업데이트하고,
      if (clickedWidget) {
        setSelectedWidget(clickedWidget.id);
        const isOnResizeHandle = isClickOnResizeHandle(clickedWidget, x, y);
        if (isOnResizeHandle) {
          setIsResizing(true);
          setResizeDirection(isOnResizeHandle);
        } else {
          setIsDragging(true);
          setDragStart({ x: x - clickedWidget.x, y: y - clickedWidget.y });
        }
      } else {
        setSelectedWidget(null);
      }
    }

    redraw();
  };

  const isClickOnResizeHandle = (widget: TextWidget, x: number, y: number) => {
    const handles = [
      { x: widget.x, y: widget.y, direction: 'nw' },
      { x: widget.x + widget.width, y: widget.y, direction: 'ne' },
      { x: widget.x, y: widget.y + widget.height, direction: 'sw' },
      {
        x: widget.x + widget.width,
        y: widget.y + widget.height,
        direction: 'se',
      },
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

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - offset.x * scale) / scale;
    const y = (e.clientY - rect.top - offset.y * scale) / scale;

    if (isDragging && selectedWidget) {
      const widget = widgets.find((w) => w.id === selectedWidget);
      if (widget) {
        const newX = Math.floor((x - dragStart.x) / GRID_SIZE) * GRID_SIZE;
        const newY = Math.floor((y - dragStart.y) / GRID_SIZE) * GRID_SIZE;
        setWidgets(
          widgets.map((w) =>
            w.id === selectedWidget ? { ...w, x: newX, y: newY } : w
          )
        );
      }
    } else if (isResizing && selectedWidget && resizeDirection) {
      setWidgets(
        widgets.map((widget) =>
          widget.id === selectedWidget
            ? resizeWidget(widget, x, y, resizeDirection)
            : widget
        )
      );
    }

    redraw();
  };

  const resizeWidget = (
    widget: TextWidget,
    x: number,
    y: number,
    direction: string
  ) => {
    let newWidth = widget.width;
    let newHeight = widget.height;
    let newX = widget.x;
    let newY = widget.y;

    if (direction.includes('e')) {
      newWidth = Math.max(
        20,
        Math.round((x - widget.x) / GRID_SIZE) * GRID_SIZE
      );
    }
    if (direction.includes('s')) {
      newHeight = Math.max(
        20,
        Math.round((y - widget.y) / GRID_SIZE) * GRID_SIZE
      );
    }
    if (direction.includes('w')) {
      const deltaX = Math.round((widget.x - x) / GRID_SIZE) * GRID_SIZE;
      newWidth = Math.max(20, widget.width + deltaX);
      newX = widget.x - deltaX;
    }
    if (direction.includes('n')) {
      const deltaY = Math.round((widget.y - y) / GRID_SIZE) * GRID_SIZE;
      newHeight = Math.max(20, widget.height + deltaY);
      newY = widget.y - deltaY;
    }

    return { ...widget, x: newX, y: newY, width: newWidth, height: newHeight };
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeDirection(null);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY;
    const newScale = Math.min(Math.max(scale - delta * 0.001, 0.1), 5);
    setScale(newScale);
  };

  const handleZoomIn = () => {
    setScale((prevScale) => Math.min(prevScale + 0.1, 5));
  };

  const handleZoomOut = () => {
    setScale((prevScale) => Math.max(prevScale - 0.1, 0.1));
  };

  return (
    <div className='flex flex-col h-screen'>
      <div className='flex justify-between items-center p-4 bg-gray-100 border-b'>
        <div className='flex space-x-2'>
          <Button
            variant={tool === 'select' ? 'default' : 'outline'}
            size='icon'
            onClick={() => setTool('select')}
          >
            <Move className='h-4 w-4' />
            <span className='sr-only'>Select tool</span>
          </Button>
          <Button
            variant={tool === 'text' ? 'default' : 'outline'}
            size='icon'
            onClick={() => setTool('text')}
          >
            <Type className='h-4 w-4' />
            <span className='sr-only'>Text tool</span>
          </Button>
        </div>
        <div className='flex space-x-2'>
          <Button variant='outline' size='icon' onClick={handleZoomOut}>
            <ZoomOut className='h-4 w-4' />
            <span className='sr-only'>Zoom out</span>
          </Button>
          <Button variant='outline' size='icon' onClick={handleZoomIn}>
            <ZoomIn className='h-4 w-4' />
            <span className='sr-only'>Zoom in</span>
          </Button>
        </div>
      </div>
      <div ref={containerRef} className='flex-grow overflow-hidden'>
        <canvas
          ref={canvasRef}
          width={window.innerWidth}
          height={window.innerHeight - 64}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          className='cursor-crosshair'
        />
      </div>
    </div>
  );
}
