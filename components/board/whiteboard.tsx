'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PlusCircle, Move, Type, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import {
  addWidget,
  updateWidget,
  setSelectedWidget,
} from '@/lib/redux/features/whiteboardSlice';
import { ShellWidgetProps, TextWidget, AllWidgetTypes } from '@/lib/type';

const GRID_SIZE = 20;
const FONT_SIZE = 16;
const RESIZE_HANDLE_SIZE = 8;

export default function Whiteboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const widgets = useSelector(
    (state: RootState) => state.whiteboard.widgets
  ) as ShellWidgetProps<TextWidget>[];
  const selectedWidget = useSelector(
    (state: RootState) => state.whiteboard.selectedWidget
  );
  const dispatch = useDispatch();

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [tool, setTool] = useState<'select' | 'text'>('select');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [spacePressed, setSpacePressed] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !spacePressed) {
        setSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [spacePressed]);

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
        // 위젯 배경 그리기
        ctx.save();
        // 선택된 위젯은 파란색 배경, 아닌 경우 흰색 배경
        ctx.fillStyle = widget.id === selectedWidget ? '#e3f2fd' : 'white';
        ctx.fillRect(widget.x, widget.y, widget.width, widget.height);

        // 위젯 테두리 그리기
        // 선택된 위젯은 파란색 테두리, 아닌 경우 검은색 테두리
        ctx.strokeStyle = widget.id === selectedWidget ? '#2196f3' : '#000000';
        ctx.strokeRect(widget.x, widget.y, widget.width, widget.height);

        // 텍스트 렌더링
        ctx.fillStyle = 'black';
        ctx.font = `${widget.innerWidget.fontSize}px Arial`;
        ctx.fillText(
          widget.innerWidget.text,
          widget.x + 5, // 텍스트 좌측 여백
          widget.y + FONT_SIZE + 5 // 텍스트 상단 여백
        );

        // 선택된 위젯인 경우 리사이즈 핸들 그리기
        if (widget.id === selectedWidget) {
          // 4개의 모서리에 리사이즈 핸들 추가
          const handles = [
            { x: widget.x, y: widget.y, cursor: 'nwse-resize' }, // 좌상단
            { x: widget.x + widget.width, y: widget.y, cursor: 'nesw-resize' }, // 우상단
            { x: widget.x, y: widget.y + widget.height, cursor: 'nesw-resize' }, // 좌하단
            {
              x: widget.x + widget.width,
              y: widget.y + widget.height,
              cursor: 'nwse-resize',
            }, // 우하단
          ];

          // 각 핸들 그리기
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

    if (spacePressed) {
      setIsPanning(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - offset.x * scale) / scale;
    const y = (e.clientY - rect.top - offset.y * scale) / scale;

    if (tool === 'text') {
      // 내부 텍스트 위젯 생성
      const innerWidget: TextWidget = {
        id: Date.now().toString(), // 고유 ID 생성 (현재 시간 기반)
        type: 'text', // 위젯 타입 지정
        text: 'New Text', // 기본 텍스트 설정
        fontSize: FONT_SIZE, // 글자 크기 설정
        draggable: true, // 드래그 가능하도록 설정
        x: Math.round(x / GRID_SIZE) * GRID_SIZE, // 그리드에 맞춘 X 좌표
        y: Math.round(y / GRID_SIZE) * GRID_SIZE, // 그리드에 맞춘 Y 좌표
      };

      // 외부 쉘 위젯 생성 (내부 위젯을 감싸는 컨테이너)
      const newWidget: ShellWidgetProps<TextWidget> = {
        id: Date.now().toString(), // 쉘의 고유 ID 생성
        type: 'shell', // 쉘 타입 지정
        x: Math.round(x / GRID_SIZE) * GRID_SIZE, // 그리드에 맞춘 X 좌표
        y: Math.round(y / GRID_SIZE) * GRID_SIZE, // 그리드에 맞춘 Y 좌표
        width: 100, // 기본 너비 설정
        height: 30, // 기본 높이 설정
        resizable: true, // 크기 조절 가능하도록 설정
        editable: true, // 편집 가능하도록 설정
        draggable: true, // 드래그 가능하도록 설정
        innerWidget: innerWidget, // 내부 텍스트 위젯 참조
      };

      // Redux 상태 업데이트
      dispatch(addWidget(newWidget)); // 새 위젯을 스토어에 추가
      dispatch(setSelectedWidget(newWidget.id)); // 새로 생성된 위젯을 선택 상태로 설정
      setTool('select'); // 도구를 선택 모드로 변경
    } else {
      const clickedWidget = widgets.find(
        (widget) =>
          x >= widget.x &&
          x <= widget.x + widget.width &&
          y >= widget.y &&
          y <= widget.y + widget.height
      );

      if (clickedWidget) {
        dispatch(setSelectedWidget(clickedWidget.id));
        const isOnResizeHandle = isClickOnResizeHandle(clickedWidget, x, y);
        if (isOnResizeHandle) {
          setIsResizing(true);
          setResizeDirection(isOnResizeHandle);
        } else {
          setIsDragging(true);
          setDragStart({ x: x - clickedWidget.x, y: y - clickedWidget.y });
        }
      } else {
        dispatch(setSelectedWidget(null));
      }
    }

    redraw();
  };

  const isClickOnResizeHandle = (
    widget: ShellWidgetProps<TextWidget>,
    x: number,
    y: number
  ) => {
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

    if (isPanning) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setOffset((prev) => ({
        x: prev.x + dx / scale,
        y: prev.y + dy / scale,
      }));
      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - offset.x * scale) / scale;
    const y = (e.clientY - rect.top - offset.y * scale) / scale;

    if (isDragging && selectedWidget) {
      const widget = widgets.find((w) => w.id === selectedWidget);
      if (widget) {
        const newX = Math.floor((x - dragStart.x) / GRID_SIZE) * GRID_SIZE;
        const newY = Math.floor((y - dragStart.y) / GRID_SIZE) * GRID_SIZE;
        const updatedWidget = { ...widget, x: newX, y: newY };
        dispatch(updateWidget(updatedWidget));
      }
    } else if (isResizing && selectedWidget && resizeDirection) {
      const widget = widgets.find((w) => w.id === selectedWidget);
      if (widget) {
        const updatedWidget = resizeWidget(widget, x, y, resizeDirection);
        dispatch(updateWidget(updatedWidget));
      }
    }

    redraw();
  };

  const resizeWidget = (
    widget: ShellWidgetProps<TextWidget>,
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
    setIsPanning(false);
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
          className={`${spacePressed ? 'cursor-grab' : 'cursor-crosshair'} ${
            isPanning ? 'cursor-grabbing' : ''
          }`}
        />
      </div>
    </div>
  );
}
