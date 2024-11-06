import React, { use, useEffect, useState } from 'react';
import {
  AllWidgetTypes,
  EdgePosition,
  NODE_WIDGET_TYPES,
  NodeWidgetType,
  ShellWidgetProps,
} from '@/lib/type';
import WidgetText from './widgetText';
import { useDispatch, useSelector } from 'react-redux';
import {
  deleteWidget,
  setEditModeWidgets,
  setSelectedWidget,
  updateWidget,
} from '@/lib/redux/features/whiteboardSlice';
import WidgetArea from './widgetArea';
import {
  snap,
  snapHeight,
  snapWidgetPosition,
  snapWidgetResize,
} from '@/lib/utils/snapping';
import { RootState } from '@/lib/redux/store';
import { Button } from '../ui/button';
import { ChevronDown, Ellipsis, Info } from 'lucide-react';
import SvgIcon from '@/lib/utils/svgIcon';
import {
  arrowModeSvg,
  chevronDownSvg8px,
  circleSvg,
  downWrapArrow,
  pauseSvg,
  recordSvg,
  sixBoltSvg,
  wideFrameSvg8px,
} from '@/lib/utils/svgBag';
import { FaPause } from 'react-icons/fa';
import { setIsArrowMode } from '@/lib/redux/features/arrowSlice';
import WidgetImage from './widgetImage';
import WidgetPdf from './widgetPdf';
import WidgetUrl from './widgetUrl';

interface WidgetShellProps {
  widget: ShellWidgetProps<AllWidgetTypes>;
  scale: number;
  offset: { x: number; y: number };
  draggable: boolean;
  editable: boolean;
  resizeable: boolean;
  headerBar: boolean;
  footerBar: boolean;
}

//resize 핸들 스타일 함수
const getHandleStyle = (position: string): React.CSSProperties => {
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    backgroundColor: 'transparent',
  };

  switch (position) {
    // 모서리 핸들
    case 'nw':
      return {
        ...baseStyle,
        top: '-8px',
        left: '-8px',
        width: '16px',
        height: '16px',
        cursor: 'nw-resize',
      };
    case 'ne':
      return {
        ...baseStyle,
        top: '-8px',
        right: '-8px',
        width: '16px',
        height: '16px',
        cursor: 'ne-resize',
      };
    case 'sw':
      return {
        ...baseStyle,
        bottom: '-8px',
        left: '-8px',
        width: '16px',
        height: '16px',
        cursor: 'sw-resize',
      };
    case 'se':
      return {
        ...baseStyle,
        bottom: '-8px',
        right: '-8px',
        width: '16px',
        height: '16px',
        cursor: 'se-resize',
      };
    // 면 핸들
    case 'n':
      return {
        ...baseStyle,
        top: '-4px',
        left: '16px', // 모서리 핸들을 피해서 시작
        right: '16px', // 모서리 핸들을 피해서 끝
        height: '8px',
        cursor: 'n-resize',
      };
    case 's':
      return {
        ...baseStyle,
        bottom: '-4px',
        left: '16px',
        right: '16px',
        height: '8px',
        cursor: 's-resize',
      };
    case 'w':
      return {
        ...baseStyle,
        left: '-4px',
        top: '16px',
        bottom: '16px',
        width: '8px',
        cursor: 'w-resize',
      };
    case 'e':
      return {
        ...baseStyle,
        right: '-4px',
        top: '16px',
        bottom: '16px',
        width: '8px',
        cursor: 'e-resize',
      };
    default:
      return baseStyle;
  }
};

export default function WidgetShell({
  widget,
  scale,
  offset,
  draggable,
  editable,
  resizeable,
  headerBar,
  footerBar,
}: WidgetShellProps) {
  const dispatch = useDispatch();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isNodeWidget, setIsNodeWidget] = useState(false);
  const isArrowMode = useSelector(
    (state: RootState) => state.arrow.isArrowMode
  );
  const editModeWidgets = useSelector(
    (state: RootState) => state.whiteboard.editModeWidgets
  );
  const selectedWidget = useSelector(
    (state: RootState) => state.whiteboard.selectedWidget
  );
  const [isSelected, setIsSelected] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [hoveredEdge, setHoveredEdge] = useState<EdgePosition>(null);

  const [isArrowNodeHovered, setIsArrowNodeHovered] = useState(false);

  useEffect(() => {
    setIsSelected(selectedWidget === widget.id);
    if (selectedWidget !== null && selectedWidget !== editModeWidgets) {
      dispatch(setEditModeWidgets(null));
    }
  }, [selectedWidget]);

  useEffect(() => {
    setIsEditMode(editModeWidgets === widget.id);
  }, [editModeWidgets]);

  useEffect(() => {
    if (isSelected) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isSelected]);

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing]);

  useEffect(() => {
    setIsNodeWidget(isNodeWidgetType(widget.innerWidget.type));
  }, [widget.innerWidget.type]);

  const handleHeightChange = (height: number) => {
    if (height !== widget.height) {
      // header 높이 52px 추가
      if (headerBar) {
        height = height + 52;
      }
      if (footerBar) {
        height = height + 52;
      }
      const snappedHeight = snapHeight(height);
      dispatch(
        updateWidget({
          ...widget,
          height: snappedHeight,
        })
      );
    }
  };

  // arrow 노드 스타일 함수 수정
  const setArrowNodeStyle = (position: string): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      width: hoveredEdge === position ? '10px' : '6px', // hover 시 크기 증가
      height: hoveredEdge === position ? '10px' : '6px',
      backgroundColor: '#FFB300',
      outline:
        hoveredEdge === position
          ? 'none'
          : `${
              isEditMode
                ? '2px solid black'
                : isSelected
                ? '2px solid #BBDEFB'
                : '#e0e0e0'
            }`,
      borderRadius: '50%',
      display: hoveredEdge === position ? 'block' : 'none',
      cursor: 'pointer',
      zIndex: 10, // resize 핸들보다 위에 표시
      transition: 'all 0.2s ease',
    };

    const positions = {
      n: {
        top: hoveredEdge === 'n' ? '-6px' : '-4px',
        left: '50%',
        transform: 'translateX(-50%)',
      },
      s: {
        bottom: hoveredEdge === 's' ? '-6px' : '-4px',
        left: '50%',
        transform: 'translateX(-50%)',
      },
      w: {
        left: hoveredEdge === 'w' ? '-6px' : '-4px',
        top: '50%',
        transform: 'translateY(-50%)',
      },
      e: {
        right: hoveredEdge === 'e' ? '-6px' : '-4px',
        top: '50%',
        transform: 'translateY(-50%)',
      },
    };

    return {
      ...baseStyle,
      ...(positions[position as keyof typeof positions] || {}),
    };
  };

  // arrow node hover 핸들러
  const handleArrowNodeHover = (
    position: EdgePosition,
    isHovering: boolean,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setIsArrowNodeHovered(isHovering);
    if (isHovering) {
      setHoveredEdge(position);
    }
    if (!isHovering) {
      setHoveredEdge(null);
    }
  };

  const renderInnerWidget = () => {
    switch (widget.innerWidget.type) {
      case 'text':
        return (
          <WidgetText
            {...widget.innerWidget}
            editable={editable ? isEditMode : false}
            autoFocus={isEditMode}
            onHeightChange={handleHeightChange}
          />
        );
      // 다른 위젯 타입들도 여기에 추가 가능
      case 'section':
        return <WidgetArea />;
      case 'image':
        return (
          <WidgetImage
            {...widget.innerWidget}
            width={widget.width}
            onHeightChange={handleHeightChange}
          />
        );
      case 'pdf':
        return (
          <WidgetPdf
            {...widget.innerWidget}
            width={widget.width}
            onHeightChange={handleHeightChange}
          />
        );
      case 'url':
        return (
          <WidgetUrl
            {...widget.innerWidget}
            width={widget.width}
            height={widget.height}
            onHeightChange={handleHeightChange}
          />
        );
      default:
        return null;
    }
  };

  // 드래그 핸들러
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isEditMode && draggable && !isArrowNodeHovered) {
      e.preventDefault();
      e.stopPropagation();
      if (
        e.target instanceof HTMLElement &&
        e.target.classList.contains('resize-handle') &&
        resizeable
      ) {
        setIsResizing(true);
        setResizeDirection(e.target.classList[1]); // nw, ne, sw, se
      } else {
        setIsDragging(true);
      }
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging && !isResizing) return;
    e.preventDefault();
    e.stopPropagation();

    if (isDragging) {
      const { x: snappedX, y: snappedY } = snapWidgetPosition(
        e.clientX - dragStart.x + widget.x * scale,
        e.clientY - dragStart.y + widget.y * scale,
        scale
      );

      dispatch(
        updateWidget({
          ...widget,
          x: snappedX / scale,
          y: snappedY / scale,
        })
      );
    } else if (isResizing) {
      const newPositions = snapWidgetResize(
        resizeDirection!,
        dragStart,
        { x: e.clientX, y: e.clientY },
        widget,
        scale,
        isNodeWidget ? 8 : 0
      );

      dispatch(
        updateWidget({
          ...widget,
          ...newPositions,
        })
      );
    }
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeDirection(null);
  };

  // 더블클릭 핸들러 추가
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (
      widget.innerWidget.type === 'text' ||
      widget.innerWidget.type === 'url' ||
      widget.innerWidget.type === 'pdf'
    ) {
      dispatch(setEditModeWidgets(widget.id));
      dispatch(setSelectedWidget(null));
    }
  };

  // 키보드 삭제 이벤트
  const handleKeyDown = (e: KeyboardEvent) => {
    if (isEditMode) return;
    if (isSelected && (e.key === 'Delete' || e.key === 'Backspace')) {
      dispatch(deleteWidget(widget.id));
    }
  };

  // 타입 가드 헬퍼 함수
  const isNodeWidgetType = (type: string): type is NodeWidgetType => {
    return NODE_WIDGET_TYPES.includes(type as NodeWidgetType);
  };

  // 호버 이벤트 핸들러
  const handleEdgeHover = (position: EdgePosition) => {
    setHoveredEdge(position);
    console.log(`Hovered edge: ${position}`); // 디버깅용
  };

  return (
    <div
      className='widget-shell group'
      style={{
        position: 'absolute',
        zIndex: 1,
        padding: '4px',
        margin: isNodeWidget ? `${4 * scale}px` : '0',
        left: `${(widget.x + offset.x) * scale}px`, // offset을 더한 후 scale 적용
        top: `${(widget.y + offset.y) * scale}px`, // offset을 더한 후 scale 적용
        width: `${widget.width}px`,
        height: `${widget.height}px`,
        transform: `scale(${scale})`,
        transformOrigin: '0 0',
        backgroundColor: isSelected ? 'white' : 'white',
        border: `2px solid ${
          isEditMode
            ? 'black'
            : isSelected
            ? '#BBDEFB'
            : isArrowMode
            ? '#F1F5F9'
            : '#e0e0e0'
        }`,
        outline: `${
          isEditMode
            ? '2px solid black'
            : isSelected
            ? '2px solid #BBDEFB'
            : 'none'
        }`,
        outlineOffset: '0px', // 음수 값을 주면 안쪽으로 들어갑니다
        borderRadius: '4px',
        // overflow: `${widget.innerWidget.type === 'url' ? 'hidden' : 'visible'}`,
      }}
      onClick={() => dispatch(setSelectedWidget(widget.id))}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {headerBar && (
        <div className='transition-opacity duration-200 hover:bg-gray-100 header-bar opacity-0 group-hover:opacity-100'>
          <div className='flex items-center'>
            <Button
              size='icon'
              className=' rounded-none p-2 bg-white'
              onClick={() => console.log('clicked')}
            >
              <SvgIcon
                fill='none'
                width={8}
                height={9}
                className='flex items-center justify-center'
              >
                {chevronDownSvg8px}
              </SvgIcon>
            </Button>
            <Button size='icon' className=' rounded-none p-2 bg-white'>
              <SvgIcon
                fill='none'
                width={8}
                height={9}
                className='flex items-center justify-center'
              >
                {wideFrameSvg8px}
              </SvgIcon>
            </Button>
          </div>
          <div className='flex items-center'>
            <Button size='icon' className=' rounded-none p-2 bg-white'>
              <SvgIcon
                fill='none'
                width={8}
                height={9}
                className='flex items-center justify-center text-black'
              >
                {arrowModeSvg}
              </SvgIcon>
            </Button>
            <Button size='icon' className=' rounded-none p-2 bg-white'>
              <Info className='text-black' />
            </Button>
            <Button size='icon' className=' rounded-none p-2 bg-white'>
              <Ellipsis className='text-black' />
            </Button>
          </div>
        </div>
      )}
      {renderInnerWidget()}
      {footerBar && (
        <div className='footer-bar'>
          <div className='flex items-center justify-between space-x-1  h-full pl-4'>
            <div className='text-[12px] text-muted-foreground'>v 3.26</div>
            <div className='w-[2px] h-[2px] bg-muted-foreground rounded-full' />
            <div className='text-[12px] text-muted-foreground'>24.08.17</div>
            <div className='w-[2px] h-[2px] bg-muted-foreground rounded-full' />
            <div className='text-[12px] text-muted-foreground'>08:28</div>
          </div>
          <div className='flex items-center'>
            <Button size='icon' className=' rounded-none p-2 bg-white'>
              <SvgIcon
                fill='none'
                width={8}
                height={9}
                className='flex items-center justify-center text-black'
              >
                {sixBoltSvg}
              </SvgIcon>
            </Button>
            <Button size='icon' className=' rounded-none p-2 bg-white'>
              <SvgIcon
                fill='none'
                width={8}
                height={9}
                className='flex items-center justify-center text-black'
              >
                {pauseSvg}
              </SvgIcon>
            </Button>
            <Button size='icon' className=' rounded-none p-2 bg-white'>
              <SvgIcon
                fill='none'
                width={8}
                height={9}
                className='flex items-center justify-center text-black'
              >
                {recordSvg}
              </SvgIcon>
            </Button>
          </div>
        </div>
      )}
      {/* {isSelected && (
        
      )} */}
      <>
        <div className='resize-handle nw' style={getHandleStyle('nw')} />
        <div className='resize-handle ne' style={getHandleStyle('ne')} />
        <div className='resize-handle sw' style={getHandleStyle('sw')} />
        <div className='resize-handle se' style={getHandleStyle('se')} />
        <div
          className='resize-handle n'
          style={getHandleStyle('n')}
          onMouseEnter={() => handleEdgeHover('n')}
          onMouseLeave={() => handleEdgeHover(null)}
        />
        <div
          className='resize-handle s'
          style={getHandleStyle('s')}
          onMouseEnter={() => handleEdgeHover('s')}
          onMouseLeave={() => handleEdgeHover(null)}
        />
        <div
          className='resize-handle w'
          style={getHandleStyle('w')}
          onMouseEnter={() => handleEdgeHover('w')}
          onMouseLeave={() => handleEdgeHover(null)}
        />
        <div
          className='resize-handle e'
          style={getHandleStyle('e')}
          onMouseEnter={() => handleEdgeHover('e')}
          onMouseLeave={() => handleEdgeHover(null)}
        />
      </>
      <div className='arrow-node-container'>
        <div
          className='arrow-node n'
          style={setArrowNodeStyle('n')}
          onMouseEnter={(e) => handleArrowNodeHover('n', true, e)}
          onMouseLeave={(e) => handleArrowNodeHover('n', false, e)}
        />
        <div
          className='arrow-node s'
          style={setArrowNodeStyle('s')}
          onMouseEnter={(e) => handleArrowNodeHover('s', true, e)}
          onMouseLeave={(e) => handleArrowNodeHover('s', false, e)}
        />
        <div
          className='arrow-node w'
          style={setArrowNodeStyle('w')}
          onMouseEnter={(e) => handleArrowNodeHover('w', true, e)}
          onMouseLeave={(e) => handleArrowNodeHover('w', false, e)}
        />
        <div
          className='arrow-node e'
          style={setArrowNodeStyle('e')}
          onMouseEnter={(e) => handleArrowNodeHover('e', true, e)}
          onMouseLeave={(e) => handleArrowNodeHover('e', false, e)}
        />
      </div>
    </div>
  );
}
