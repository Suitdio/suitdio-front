import React, { useEffect, useState } from 'react';
import { ShellWidgetProps, TextWidget } from '@/lib/type';
import WidgetText from './widgetText';
import { useDispatch } from 'react-redux';
import {
  deleteWidget,
  setSelectedWidget,
  updateWidget,
} from '@/lib/redux/features/whiteboardSlice';

interface WidgetShellProps {
  widget: ShellWidgetProps<TextWidget>;
  isSelected: boolean;
  scale: number;
  offset: { x: number; y: number };
}

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

  const renderInnerWidget = () => {
    switch (widget.innerWidget.type) {
      case 'text':
        return <WidgetText {...widget.innerWidget} />;
      // 다른 위젯 타입들도 여기에 추가 가능
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
      const dx = (e.clientX - dragStart.x) / scale;
      const dy = (e.clientY - dragStart.y) / scale;

      dispatch(
        updateWidget({
          ...widget,
          x: widget.x + dx,
          y: widget.y + dy,
        })
      );
    } else if (isResizing) {
      const dx = (e.clientX - dragStart.x) / scale;
      const dy = (e.clientY - dragStart.y) / scale;

      let newWidth = widget.width;
      let newHeight = widget.height;
      let newX = widget.x;
      let newY = widget.y;

      switch (resizeDirection) {
        case 'se':
          newWidth = widget.width + dx;
          newHeight = widget.height + dy;
          break;
        case 'sw':
          newWidth = widget.width - dx;
          newHeight = widget.height + dy;
          newX = widget.x + dx;
          break;
        case 'ne':
          newWidth = widget.width + dx;
          newHeight = widget.height - dy;
          newY = widget.y + dy;
          break;
        case 'nw':
          newWidth = widget.width - dx;
          newHeight = widget.height - dy;
          newX = widget.x + dx;
          newY = widget.y + dy;
          break;
      }

      dispatch(
        updateWidget({
          ...widget,
          x: newX,
          y: newY,
          width: Math.max(50, newWidth), // 최소 크기 제한
          height: Math.max(50, newHeight),
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

  return (
    <div
      style={{
        position: 'absolute',
        zIndex: 1,
        left: `${(widget.x + offset.x) * scale}px`, // offset을 더한 후 scale 적용
        top: `${(widget.y + offset.y) * scale}px`, // offset을 더한 후 scale 적용
        width: `${widget.width}px`,
        height: `${widget.height}px`,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        backgroundColor: isSelected ? '#e3f2fd' : 'white',
        border: `2px solid ${isSelected ? '#2196f3' : '#e0e0e0'}`,
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
        </>
      )}
    </div>
  );
}

const getHandleStyle = (position: string): React.CSSProperties => {
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    width: '12px',
    height: '12px',
    backgroundColor: '#2196f3',
    borderRadius: '50%',
  };

  switch (position) {
    case 'nw':
      return { ...baseStyle, top: '-6px', left: '-6px', cursor: 'nw-resize' };
    case 'ne':
      return { ...baseStyle, top: '-6px', right: '-6px', cursor: 'ne-resize' };
    case 'sw':
      return {
        ...baseStyle,
        bottom: '-6px',
        left: '-6px',
        cursor: 'sw-resize',
      };
    case 'se':
      return {
        ...baseStyle,
        bottom: '-6px',
        right: '-6px',
        cursor: 'se-resize',
      };
    default:
      return baseStyle;
  }
};
