import React, { useEffect, useState } from 'react';
import {
  AllWidgetTypes,
  NODE_WIDGET_TYPES,
  NodeWidgetType,
  ShellWidgetProps,
} from '@/lib/type';
import WidgetText from './widgetText';
import { useDispatch } from 'react-redux';
import {
  deleteWidget,
  setSelectedWidget,
  updateWidget,
} from '@/lib/redux/features/whiteboardSlice';
import WidgetArea from './widgetArea';
import { snapWidgetPosition, snapWidgetResize } from '@/lib/utils/snapping';

interface WidgetShellProps {
  widget: ShellWidgetProps<AllWidgetTypes>;
  isSelected: boolean;
  scale: number;
  offset: { x: number; y: number };
}

const getHandleStyle = (position: string): React.CSSProperties => {
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    backgroundColor: 'transparent',
  };

  switch (position) {
    // 모서리 핸들 - 더 넓은 클릭 영역
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
    // 면 핸들 - 전체 면적으로 확장
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
  isSelected,
  scale,
  offset,
}: WidgetShellProps) {
  const dispatch = useDispatch();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isNodeWidget, setIsNodeWidget] = useState(false);

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

  const renderInnerWidget = () => {
    switch (widget.innerWidget.type) {
      case 'text':
        return <WidgetText {...widget.innerWidget} />;
      // 다른 위젯 타입들도 여기에 추가 가능
      case 'section':
        return <WidgetArea />;
      default:
        return null;
    }
  };

  // 드래그 핸들러
  const handleMouseDown = (e: React.MouseEvent) => {
    if (
      e.target instanceof HTMLElement &&
      e.target.classList.contains('resize-handle')
    ) {
      setIsResizing(true);
      setResizeDirection(e.target.classList[1]); // nw, ne, sw, se
    } else {
      setIsDragging(true);
    }
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging && !isResizing) return;

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

  // 키보드 삭제 이벤트
  const handleKeyDown = (e: KeyboardEvent) => {
    if (isSelected && (e.key === 'Delete' || e.key === 'Backspace')) {
      dispatch(deleteWidget(widget.id));
    }
  };

  // 타입 가드 헬퍼 함수
  const isNodeWidgetType = (type: string): type is NodeWidgetType => {
    return NODE_WIDGET_TYPES.includes(type as NodeWidgetType);
  };

  return (
    <div
      style={{
        position: 'absolute',
        zIndex: 1,
        // padding: `${isNodeWidget ? 'none' : '2px'}`,
        margin: isNodeWidget ? '4px ' : '0',
        left: `${(widget.x + offset.x) * scale}px`, // offset을 더한 후 scale 적용
        top: `${(widget.y + offset.y) * scale}px`, // offset을 더한 후 scale 적용
        width: `${widget.width}px`,
        height: `${widget.height}px`,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        backgroundColor: isSelected ? '#e3f2fd' : 'white',
        border: `${isSelected ? '4px solid #2196f3' : '2px solid #e0e0e0'}`,
        outline: `${
          isNodeWidget ? 'none' : isSelected ? 'none' : '2px solid #e0e0e0'
        }`,
        outlineOffset: '-2px', // 음수 값을 주면 안쪽으로 들어갑니다
        borderRadius: '4px',
        overflow: 'hidden',
      }}
      onClick={() => dispatch(setSelectedWidget(widget.id))}
      onMouseDown={handleMouseDown}
    >
      {renderInnerWidget()}
      {isSelected && (
        <>
          <div className='resize-handle nw' style={getHandleStyle('nw')} />
          <div className='resize-handle ne' style={getHandleStyle('ne')} />
          <div className='resize-handle sw' style={getHandleStyle('sw')} />
          <div className='resize-handle se' style={getHandleStyle('se')} />
          <div className='resize-handle n' style={getHandleStyle('n')} />
          <div className='resize-handle s' style={getHandleStyle('s')} />
          <div className='resize-handle w' style={getHandleStyle('w')} />
          <div className='resize-handle e' style={getHandleStyle('e')} />
        </>
      )}
    </div>
  );
}
