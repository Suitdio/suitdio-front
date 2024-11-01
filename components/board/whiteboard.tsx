'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  PlusCircle,
  Move,
  Type,
  ZoomIn,
  ZoomOut,
  AppWindowMacIcon,
  MoveDownRight,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import {
  addWidget,
  updateWidget,
  setSelectedWidget,
} from '@/lib/redux/features/whiteboardSlice';
import { ShellWidgetProps, AllWidgetTypes, AllWidgetType } from '@/lib/type';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import WidgetShell from '../widget/widgetShell';
import { setIsArrowMode } from '@/lib/redux/features/arrowSlice';
import { isArrayBuffer } from 'util/types';

// 기본 그리드 설정
let baseSpacing = 48; // 기본 간격
let basePointSize = 4; // 기본 점 크기

export const FONT_SIZE = 16;
export const RESIZE_HANDLE_SIZE = 8;

export default function Whiteboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const widgets = useSelector(
    (state: RootState) => state.whiteboard.widgets
  ) as ShellWidgetProps<AllWidgetTypes>[];
  const selectedWidget = useSelector(
    (state: RootState) => state.whiteboard.selectedWidget
  );
  const dispatch = useDispatch();

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [tool, setTool] = useState<'select' | AllWidgetType>('select');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [spacePressed, setSpacePressed] = useState(false);
  const isArrowMode = useSelector(
    (state: RootState) => state.arrow.isArrowMode
  );

  const containerRef = useRef<HTMLDivElement>(null);

  // 스페이스바 누르면 드래그 모드, 떼면 드래그 모드 종료
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

  //20px을 기준으로 그리드 그리기
  const drawGrid = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      ctx.save();

      // 줌 레벨에 따른 그리드 간격과 점 크기 조정
      if (scale < 0.3) {
        baseSpacing = 60;
        basePointSize = 4;
      } else {
        baseSpacing = 48;
      }

      ctx.strokeStyle = '#DBDBDB';
      ctx.lineWidth = basePointSize;

      // 화면에 보이는 영역의 좌표 계산
      const canvas = canvasRef.current;
      if (!canvas) return;

      const visibleStartX = -offset.x;
      const visibleEndX = canvas.width / scale - offset.x;
      const visibleStartY = -offset.y;
      const visibleEndY = canvas.height / scale - offset.y;

      // 그리드 시작점을 간격에 맞춰 조정
      const startX = Math.floor(visibleStartX / baseSpacing) * baseSpacing;
      const startY = Math.floor(visibleStartY / baseSpacing) * baseSpacing;

      // 화면에 보이는 영역만 그리드 그리기
      for (let x = startX; x < visibleEndX; x += baseSpacing) {
        for (let y = startY; y < visibleEndY; y += baseSpacing) {
          ctx.beginPath();
          ctx.arc(x, y, basePointSize * 0.25, 0, 2 * Math.PI);
          ctx.stroke();
        }
      }
      ctx.restore();
    },
    [offset, scale]
  );

  //브라우저 줌 이벤트 방지
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

  //arrow 모드 종료 시 선택된 위젯 초기화
  useEffect(() => {
    dispatch(setSelectedWidget(null));
  }, [isArrowMode]);

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
    ctx.restore();
  }, [drawGrid, scale, offset]);

  useEffect(() => {
    redraw();
  }, [scale, offset, redraw]);

  //마우스를 다운을 트리거로 위젯 생성, 선택, 드래그 모드 설정
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

    if (tool !== 'select') {
      let innerWidget: AllWidgetTypes;
      // tool 타입에 따른 innerWidget 설정
      switch (tool) {
        case 'text':
          innerWidget = {
            id: Date.now().toString(),
            type: 'text',
            text: JSON.stringify([
              {
                type: 'paragraph',
                content: 'New Text',
              },
            ]),
            fontSize: FONT_SIZE,
            draggable: true,
            x: Math.round(x / baseSpacing) * baseSpacing,
            y: Math.round(y / baseSpacing) * baseSpacing,
          };
          break;

        case 'section':
          innerWidget = {
            id: Date.now().toString(),
            type: 'section',
            width: 100,
            height: 100,
            fill: '#ffffff',
            memberIds: [],
            // section 타입에 맞는 추가 속성들 설정
            x: Math.round(x / baseSpacing) * baseSpacing,
            y: Math.round(y / baseSpacing) * baseSpacing,
            draggable: true,
          };
          break;

        default:
          return;
      }

      // 공통 shell 위젯 생성
      const newWidget: ShellWidgetProps<AllWidgetTypes> = {
        id: Date.now().toString(),
        type: 'shell',
        x: Math.round(x / baseSpacing) * baseSpacing,
        y: Math.round(y / baseSpacing) * baseSpacing,
        width: 500,
        height: 300,
        resizable: true,
        editable: true,
        draggable: true,
        innerWidget,
      };

      dispatch(addWidget(newWidget));
      dispatch(setSelectedWidget(newWidget.id));
      setTool('select');
    } else {
      dispatch(setSelectedWidget(null));
    }

    redraw();
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
  };

  const handleMouseUp = () => {
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
      {/* 툴바 */}
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
          <Button
            variant={tool === 'section' ? 'default' : 'outline'}
            size='icon'
            onClick={() => setTool('section')}
          >
            <AppWindowMacIcon className='h-4 w-4' />
            <span className='sr-only'>Text tool</span>
          </Button>
          <Button
            variant={tool === 'arrow' ? 'default' : 'outline'}
            size='icon'
            onClick={() => dispatch(setIsArrowMode(true))}
          >
            <MoveDownRight className='h-4 w-4' />
            <span className='sr-only'>Text tool</span>
          </Button>
          <Button
            variant={tool === 'arrow' ? 'default' : 'outline'}
            size='icon'
            onClick={() => dispatch(setIsArrowMode(false))}
          >
            <X className='h-4 w-4' />
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
      <div ref={containerRef} className='flex-grow overflow-hidden relative'>
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
        {/* WidgetShell 컴포넌트들을 렌더링 */}
        {widgets.map((widget) => (
          <WidgetShell
            key={widget.id}
            widget={widget}
            isSelected={widget.id === selectedWidget}
            scale={scale}
            offset={offset}
          />
        ))}
      </div>
    </div>
  );
}
