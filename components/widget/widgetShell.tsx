import { ShellWidgetProps, TextWidget } from '@/lib/type';

const RESIZE_HANDLE_SIZE = 8;

interface RenderOptions {
  isSelected: boolean;
  scale: number;
  offset: { x: number; y: number };
}

export default class WidgetShell {
  static render(
    ctx: CanvasRenderingContext2D,
    widget: ShellWidgetProps<TextWidget>,
    options: RenderOptions
  ) {
    const { isSelected } = options;

    // 위젯 배경 그리기
    ctx.save();
    ctx.fillStyle = isSelected ? '#e3f2fd' : 'white';
    ctx.fillRect(widget.x, widget.y, widget.width, widget.height);

    // 위젯 테두리 그리기
    ctx.strokeStyle = isSelected ? '#2196f3' : '#000000';
    ctx.strokeRect(widget.x, widget.y, widget.width, widget.height);

    // 텍스트 렌더링
    ctx.fillStyle = 'black';
    ctx.font = `${widget.innerWidget.fontSize}px Arial`;
    ctx.fillText(
      widget.innerWidget.text,
      widget.x + 5,
      widget.y + widget.innerWidget.fontSize + 5
    );

    // 선택된 위젯인 경우 리사이즈 핸들 그리기
    if (isSelected) {
      this.drawResizeHandles(ctx, widget);
    }

    ctx.restore();
  }

  static drawResizeHandles(
    ctx: CanvasRenderingContext2D,
    widget: ShellWidgetProps<TextWidget>
  ) {
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

  static isClickOnResizeHandle(
    widget: ShellWidgetProps<TextWidget>,
    x: number,
    y: number
  ) {
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
  }

  static resizeWidget(
    widget: ShellWidgetProps<TextWidget>,
    x: number,
    y: number,
    direction: string,
    gridSize: number
  ) {
    let newWidth = widget.width;
    let newHeight = widget.height;
    let newX = widget.x;
    let newY = widget.y;

    if (direction.includes('e')) {
      newWidth = Math.max(20, Math.round((x - widget.x) / gridSize) * gridSize);
    }
    if (direction.includes('s')) {
      newHeight = Math.max(
        20,
        Math.round((y - widget.y) / gridSize) * gridSize
      );
    }
    if (direction.includes('w')) {
      const deltaX = Math.round((widget.x - x) / gridSize) * gridSize;
      newWidth = Math.max(20, widget.width + deltaX);
      newX = widget.x - deltaX;
    }
    if (direction.includes('n')) {
      const deltaY = Math.round((widget.y - y) / gridSize) * gridSize;
      newHeight = Math.max(20, widget.height + deltaY);
      newY = widget.y - deltaY;
    }

    return { ...widget, x: newX, y: newY, width: newWidth, height: newHeight };
  }
}
