'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Type,
  AppWindowMacIcon,
  MousePointer2,
  MoveRight,
  File,
  Search,
  RefreshCw,
  Shapes,
  Disc2,
  Tornado,
  Boxes,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import {
  addWidget,
  setSelectedWidget,
  setEditModeWidgets,
} from '@/lib/redux/features/whiteboardSlice';
import {
  ShellWidgetProps,
  AllWidgetTypes,
  AllWidgetType,
  TextWidget,
  IframeEmbedWidget,
} from '@/lib/type';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import WidgetShell from '../widget/widgetShell';
import SvgIcon from '@/lib/utils/svgIcon';
import { sectionSvg } from '@/lib/utils/svgBag';
import { HiOutlineSparkles } from 'react-icons/hi2';
import { Separator } from '../ui/separator';
import { createTextNode } from '@/lib/utils/textNodeCreator';
import BrainstormInput from '../widget/widgetBrainstorm';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
// 기본 그리드 설정
let baseSpacing = 48; // 기본 간격
let basePointSize = 4; // 기본 점 크기

export const FONT_SIZE = 16;
export const RESIZE_HANDLE_SIZE = 8;
export const ZOOM_SPEED = 0.001; // 줌 속도 조절 상수

export default function Whiteboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const widgets = useSelector(
    (state: RootState) => state.whiteboard.widgets
  ) as ShellWidgetProps<AllWidgetTypes>[];

  const dispatch = useDispatch();
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [tool, setTool] = useState<'select' | AllWidgetType>('select');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [spacePressed, setSpacePressed] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [isBrainstormActive, setIsBrainstormActive] = useState(false); // 브레인스톰 상태 추가
  const [url, setUrl] = useState('');
  const selectedWidget = useSelector(
    (state: RootState) => state.whiteboard.selectedWidget
  );

  // Screen 좌표 기준의 마우스 위치를 저장
  const [mousePosition, setMousePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

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

  // window 좌표 기준의 마우스 위치 기준으로 줌인, 줌아웃 구현
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isZooming) {
        setMousePosition({ x: e.clientX, y: e.clientY });
      }
    };

    const handleGlobalWheel = (e: WheelEvent) => {
      if (e.metaKey || e.ctrlKey) {
        e.preventDefault();

        // 줌 시작 시 상태 설정
        if (!isZooming) {
          setIsZooming(true);
          setMousePosition({ x: e.clientX, y: e.clientY });
        }

        const delta = e.deltaY;
        const zoomFactor = Math.exp(-delta * ZOOM_SPEED);
        const newScale = Math.min(Math.max(scale * zoomFactor, 0.1), 5);

        if (mousePosition) {
          const rect = containerRef.current?.getBoundingClientRect();
          if (!rect) return;

          // Screen 좌표에서 컨테이너의 상대적 위치 계산
          const pointX = (mousePosition.x - rect.left) / scale;
          const pointY = (mousePosition.y - rect.top) / scale;

          // 새로운 오프셋 계산
          const newOffset = {
            x: offset.x + (pointX * (scale - newScale)) / newScale,
            y: offset.y + (pointY * (scale - newScale)) / newScale,
          };

          setScale(newScale);
          setOffset(newOffset);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Meta' || e.key === 'Control') {
        setIsZooming(false);
        setMousePosition(null);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('wheel', handleGlobalWheel, { passive: false });
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('wheel', handleGlobalWheel);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [scale, offset, isZooming, mousePosition]);

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

  const processFile = (file: File, dataUrl: string) => {
    const centerX = (window.innerWidth / 2 - offset.x * scale) / scale;
    const centerY = (window.innerHeight / 2 - offset.y * scale) / scale;
    let innerWidget: AllWidgetTypes;

    if (file.type.startsWith('image/')) {
      innerWidget = {
        id: Date.now().toString(),
        type: 'image',
        src: dataUrl,
        x: Math.round(centerX / baseSpacing) * baseSpacing,
        y: Math.round(centerY / baseSpacing) * baseSpacing,
        width: 472,
        name: file.name,
        draggable: true,
        editable: true,
        resizeable: true,
        headerBar: true,
        footerBar: false,
      };
    } else if (file.type === 'application/pdf') {
      innerWidget = {
        id: Date.now().toString(),
        type: 'pdf',
        src: dataUrl,
        x: Math.round(centerX / baseSpacing) * baseSpacing,
        y: Math.round(centerY / baseSpacing) * baseSpacing,
        width: 460,
        draggable: true,
        editable: true,
        resizeable: true,
        headerBar: true,
        footerBar: false,
      };
    } else if (
      file.type === 'text/markdown' ||
      file.type === 'text/x-markdown'
    ) {
      innerWidget = {
        id: Date.now().toString(),
        type: 'text',
        src: dataUrl,
        fontSize: FONT_SIZE,
        x: Math.round(centerX / baseSpacing) * baseSpacing,
        y: Math.round(centerY / baseSpacing) * baseSpacing,
        draggable: true,
        editable: true,
        resizeable: true,
        headerBar: true,
        footerBar: false,
      };
    } else {
      console.warn(`지원되지 않는 파일 형식: ${file.type}`);
      return;
    }

    const newWidget: ShellWidgetProps<AllWidgetTypes> = {
      id: Date.now().toString(),
      type: 'shell',
      x: Math.round(centerX / baseSpacing) * baseSpacing,
      y: Math.round(centerY / baseSpacing) * baseSpacing,
      width: 472,
      height: 184,
      resizable: true,
      editable: true,
      draggable: true,
      innerWidget,
    };

    dispatch(addWidget(newWidget));
    dispatch(setSelectedWidget(newWidget.id));
    setTool('select');
  };

  const handleFileUpload = (dragFile?: File) => {
    const handleFile = (file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          processFile(file, event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    };

    if (dragFile) {
      handleFile(dragFile);
      return;
    }

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*, application/pdf, text/markdown';
    fileInput.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.files?.[0]) {
        handleFile(target.files[0]);
      }
    };
    fileInput.click();
  };

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

    if (tool === 'select' || tool === 'brainStorm') {
      dispatch(setSelectedWidget(null));
      dispatch(setEditModeWidgets(null));
    } else {
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
            // x: Math.round(x / baseSpacing) * baseSpacing,
            // y: Math.round(y / baseSpacing) * baseSpacing,
            draggable: true,
            editable: true,
            resizeable: true,
            headerBar: true,
            footerBar: false,
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
            editable: true,
            resizeable: true,
            headerBar: true,
            footerBar: false,
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
        width: 472,
        height: 184,
        resizable: true,
        editable: true,
        draggable: true,
        innerWidget,
      };

      dispatch(addWidget(newWidget));
      dispatch(setSelectedWidget(newWidget.id));
      setTool('select');
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
  //   e.preventDefault();
  //   e.stopPropagation();

  //   // Command(Mac) 또는 Ctrl(Windows) 키가 눌려있을 때만 줌 동작
  //   if (e.metaKey || e.ctrlKey) {
  //     const delta = e.deltaY;
  //     const zoomFactor = Math.exp(-delta * ZOOM_SPEED);
  //     const newScale = Math.min(Math.max(scale * zoomFactor, 0.1), 5);

  //     // 마우스 포인터 위치 (뷰포트 좌표)
  //     const mouseX = e.clientX;
  //     const mouseY = e.clientY;

  //     // 컨테이너의 위치 정보
  //     const rect = containerRef.current?.getBoundingClientRect();
  //     if (!rect) return;

  //     // 마우스 포인터의 캔버스상 좌표
  //     const pointX = (mouseX - rect.left) / scale - offset.x;
  //     const pointY = (mouseY - rect.top) / scale - offset.y;

  //     // 새로운 오프셋 계산
  //     const newOffset = {
  //       x: offset.x - pointX * (newScale - scale),
  //       y: offset.y - pointY * (newScale - scale),
  //     };

  //     setScale(newScale);
  //     setOffset(newOffset);
  //   }
  // };
  // 기존 텍스트 위젯만 필터링하는 함수 추가

  const getTextWidgets = (
    widgets: ShellWidgetProps<AllWidgetTypes>[]
  ): TextWidget[] => {
    return widgets
      .filter(
        (widget): widget is ShellWidgetProps<TextWidget> =>
          widget.innerWidget.type === 'text'
      )
      .map((widget) => widget.innerWidget);
  };

  // Brainstorm handleCreateTextNode 함수 수정
  const handleCreateTextNode = (text: string) => {
    const container = containerRef.current;
    if (!container) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const textWidgets = getTextWidgets(widgets);

    const newNode = createTextNode(
      text,
      containerWidth,
      containerHeight,
      textWidgets,
      widgets.length,
      scale,
      offset
    );

    // 새로운 위젯을 추가
    const newWidget: ShellWidgetProps<AllWidgetTypes> = {
      id: Date.now().toString(),
      type: 'shell',
      x: newNode.x ?? 0,
      y: newNode.y ?? 0,
      width: 200,
      height: 500,
      resizable: true,
      editable: true,
      draggable: true,
      innerWidget: newNode,
    };

    dispatch(addWidget(newWidget));
    dispatch(setSelectedWidget(newWidget.id));
  };

  const handleZoomIn = () => {
    setScale((prevScale) => Math.min(prevScale + 0.1, 5));
  };

  const handleZoomOut = () => {
    setScale((prevScale) => Math.max(prevScale - 0.1, 0.1));
  };

  // 드래그 앤 드롭 이벤트 리스너
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('dragover', handleDragOver);
      container.addEventListener('drop', handleDrop);
    }

    return () => {
      if (container) {
        container.removeEventListener('dragover', handleDragOver);
        container.removeEventListener('drop', handleDrop);
      }
    };
  }, []);

  // 드래그 오버 핸들러
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // 드롭 핸들러
  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer?.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // URL 추가 핸들러
  const handleUrlAdd = () => {
    if (url && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const centerPosition = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };

      // URL 유효성 검사
      const isUrl = /^(http|https):\/\/[^ "]+$/.test(url);
      if (isUrl) {
        addUrlWidgets(centerPosition, url);
        setUrl('https://'); // 입력 필드 초기화
      } else {
        addTextWidgets(centerPosition, url);
      }
      setTool('select');
    }
  };

  // 클립보드 붙여넣기 및 마우스 이동 이벤트 리스너
  useEffect(() => {
    if (tool !== 'url') {
      const handlePaste = (e: ClipboardEvent) => {
        e.preventDefault();
        const pastedText = e.clipboardData?.getData('text');

        if (pastedText && mousePosition) {
          const isUrl = /^(http|https):\/\/[^ "]+$/.test(pastedText);
          isUrl
            ? addUrlWidgets(mousePosition, pastedText)
            : addTextWidgets(mousePosition, pastedText);
        }
      };

      const handleMouseMove = (e: MouseEvent) => {
        setMousePosition({ x: e.clientX, y: e.clientY });
      };

      document.addEventListener('paste', handlePaste);
      document.addEventListener('mousemove', handleMouseMove);

      return () => {
        document.removeEventListener('paste', handlePaste);
        document.removeEventListener('mousemove', handleMouseMove);
      };
    }
  }, [widgets, mousePosition]);

  const addTextWidgets = (mousePos: { x: number; y: number }, text: string) => {
    const x = (mousePos.x - offset.x * scale) / scale;
    const y = (mousePos.y - offset.y * scale) / scale;

    const innerWidget: TextWidget = {
      id: Date.now().toString(),
      type: 'text',
      mkText: text,
      fontSize: FONT_SIZE,
      draggable: true,
      editable: true,
      resizeable: true,
      headerBar: true,
      footerBar: false,
    };
    const newWidget: ShellWidgetProps<AllWidgetTypes> = {
      id: Date.now().toString(),
      type: 'shell',
      width: 472,
      height: 184,
      x,
      y,
      resizable: true,
      editable: true,
      draggable: true,
      innerWidget,
    };
    dispatch(addWidget(newWidget));
  };

  const addUrlWidgets = (mousePos: { x: number; y: number }, text: string) => {
    const x = (mousePos.x - offset.x * scale) / scale;
    const y = (mousePos.y - offset.y * scale) / scale;

    const innerWidget: IframeEmbedWidget = {
      id: Date.now().toString(),
      type: 'url',
      src: text,
      draggable: true,
      editable: true,
      resizeable: true,
      headerBar: true,
      footerBar: false,
    };
    const newWidget: ShellWidgetProps<AllWidgetTypes> = {
      id: Date.now().toString(),
      type: 'shell',
      width: 472,
      height: 712, // URL 위젯 기본 높이
      x,
      y,
      resizable: true,
      editable: true,
      draggable: true,
      innerWidget,
    };
    dispatch(addWidget(newWidget));
  };

  return (
    <div className='flex flex-col h-screen'>
      {/* 툴바 */}
      {/* <div className='flex justify-between items-center p-4 bg-gray-100 border-b'>
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
      </div> */}
      <div className='left-1/2 fixed bottom-8 border -translate-x-1/2 border-muted rounded-lg p-1 bg-white z-50 shadow-md h-11'>
        <div className='flex space-x-2 items-center'>
          <Button
            variant={tool === 'select' ? 'toolSelect' : 'white'}
            size='icon'
            onClick={() => setTool('select')}
          >
            <MousePointer2 className='h-4 w-4' />
            <span className='sr-only'>Select tool</span>
          </Button>
          <Separator orientation='vertical' className='h-6' />
          <Button
            variant={tool === 'text' ? 'toolSelect' : 'white'}
            size='icon'
            onClick={() => setTool('text')}
          >
            <Type className='h-4 w-4' />
            <span className='sr-only'>Text tool</span>
          </Button>
          <Button
            variant={tool === 'arrow' ? 'toolSelect' : 'white'}
            size='icon'
            onClick={() => setTool('arrow')}
          >
            <MoveRight className='h-4 w-4' />
            <span className='sr-only'>Text tool</span>
          </Button>
          <Button
            variant={tool === 'section' ? 'toolSelect' : 'white'}
            size='icon'
            onClick={() => setTool('section')}
            className='group'
          >
            <SvgIcon
              fill='none'
              width={16}
              height={16}
              className='flex items-center justify-center'
            >
              {sectionSvg({
                isActive: tool === 'section',
                className: 'group-hover:stroke-teal-500',
              })}
            </SvgIcon>
            <span className='sr-only'>Text tool</span>
          </Button>
          <Button
            variant={tool === 'boardLink' ? 'toolSelect' : 'white'}
            size='icon'
            onClick={() => setTool('boardLink')}
          >
            <Disc2 className='h-4 w-4' />
            <span className='sr-only'>Text tool</span>
          </Button>
          <Separator orientation='vertical' className='h-6' />
          <Button
            variant={tool === 'brainStorm' ? 'toolSelect' : 'white'}
            size='icon'
            onClick={() => {
              setTool('brainStorm');
              setIsBrainstormActive((prev) => !prev);
            }}
          >
            <Tornado className='h-4 w-4' />
            <span className='sr-only'>Text tool</span>
          </Button>
          <Button
            variant={tool === 'mindmap' ? 'toolSelect' : 'white'}
            size='icon'
            onClick={() => setTool('mindmap')}
          >
            <Boxes className='h-4 w-4' />
            <span className='sr-only'>Text tool</span>
          </Button>
          <Button
            variant={tool === 'refresh' ? 'toolSelect' : 'white'}
            size='icon'
            onClick={() => setTool('refresh')}
            disabled
          >
            <RefreshCw className='h-4 w-4' />
            <span className='sr-only'>Text tool</span>
          </Button>
          <Separator orientation='vertical' className='h-6' />
          <Button
            variant={tool === 'search' ? 'toolSelect' : 'white'}
            size='icon'
            onClick={() => setTool('search')}
          >
            <Search className='h-4 w-4' />
            <span className='sr-only'>Text tool</span>
          </Button>
          <Button
            variant={tool === 'upload' ? 'toolSelect' : 'white'}
            size='icon'
            onClick={() => handleFileUpload()}
          >
            <File className='h-4 w-4' />
            <span className='sr-only'>Text tool</span>
          </Button>
          {/* <Button
            variant={tool === 'url' ? 'toolSelect' : 'white'}
            size='icon'
            onClick={() => setTool('url')}
          >
            <AppWindowMacIcon className='h-4 w-4' />
            <span className='sr-only'>Text tool</span>
          </Button> */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={tool === 'url' ? 'toolSelect' : 'white'}
                size='icon'
                onClick={() => setTool('url')}
              >
                <AppWindowMacIcon className='h-4 w-4' />
                <span className='sr-only'>Text tool</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-120 bg-white'>
              <div className='grid gap-4'>
                <div className='space-y-2'>
                  <h4 className='font-medium leading-none'>Input URL</h4>
                  <p className='text-sm text-muted-foreground'>
                    You can input the URL of the page you want to embed.
                  </p>
                </div>
                <div className='grid gap-2'>
                  <div className='grid grid-cols-3 items-center gap-4'>
                    <Label htmlFor='url'>URL</Label>
                    <Input
                      id='url'
                      defaultValue='https://'
                      className='col-span-2 h-8'
                      onChange={(e) => setUrl(e.target.value)}
                    />
                  </div>
                  <Button
                    variant='outline'
                    size='icon'
                    className='w-full'
                    onClick={handleUrlAdd}
                  >
                    <Plus className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button
            variant={tool === 'template' ? 'toolSelect' : 'white'}
            size='icon'
            onClick={() => setTool('template')}
          >
            <Shapes className='h-4 w-4' />
            <span className='sr-only'>Text tool</span>
          </Button>
          <Separator orientation='vertical' className='h-6' />
          <Button
            variant={tool === 'aiSearch' ? 'toolSelect' : 'white'}
            size='icon'
            onClick={() => setTool('aiSearch')}
          >
            <HiOutlineSparkles className='h-4 w-4' />
            <span className='sr-only'>Text tool</span>
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
          // onWheel={handleWheel}
          className={`${spacePressed ? 'cursor-grab' : 'cursor-crosshair'} ${
            isPanning ? 'cursor-grabbing' : ''
          }`}
        />
        {/* WidgetShell 컴포넌트들을 렌더링 */}
        {widgets.map((widget) => (
          <WidgetShell
            key={widget.id}
            widget={widget}
            scale={scale}
            offset={offset}
            draggable={widget.innerWidget.draggable}
            editable={widget.innerWidget.editable}
            resizeable={widget.innerWidget.resizeable}
            headerBar={widget.innerWidget.headerBar}
            footerBar={widget.innerWidget.footerBar}
          />
        ))}
        <BrainstormInput
          onCreateNode={handleCreateTextNode}
          isActive={isBrainstormActive}
          setIsActive={setIsBrainstormActive}
          setTool={setTool}
        />
      </div>
    </div>
  );
}
