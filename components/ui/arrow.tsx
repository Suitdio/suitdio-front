// components/Arrow.tsx

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  toggleSettings,
  closeSettings,
  toggleTextBox,
} from "@/lib/redux/features/arrowSlice";
import { RootState, AppDispatch } from "@/lib/redux/store";
import { ArrowWidget } from "@/lib/type";
import {
  getConnectorPoints,
  getClosestSidePoint,
} from "@/lib/utils/arrowutils/arrowPath";

interface ArrowProps {
  arrow: ArrowWidget;
  scale: number;
  offset: { x: number; y: number };
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newAttrs: Partial<ArrowWidget>) => void;
  onDragMove: (id: string, x: number, y: number, type: "from" | "to") => void;
}

const Arrow: React.FC<ArrowProps> = ({
  arrow,
  scale,
  offset,
  isSelected,
  onSelect,
  onChange,
  onDragMove,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const dispatch = useDispatch<AppDispatch>();
  const { showSettings, isTextBoxVisible } = useSelector(
    (state: RootState) => ({
      showSettings:
        state.arrow.showSettings && state.arrow.selectedArrowId === arrow.id,
      isTextBoxVisible: state.arrow.textBoxVisibility[arrow.id] || false,
    })
  );
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (canvasRef.current) {
      setContext(canvasRef.current.getContext("2d"));
    }
  }, [canvasRef]);

  // 화살표 그리기
  const drawArrow = useCallback(() => {
    if (!context) return;
    context.clearRect(
      0,
      0,
      canvasRef.current!.width,
      canvasRef.current!.height
    );
    context.save();
    context.scale(scale, scale);
    context.translate(offset.x, offset.y);

    const { points, arrowTipX, arrowTipY, arrowHeads, text } = arrow;

    // 화살표 선 그리기
    context.beginPath();
    context.moveTo(points[0], points[1]);
    for (let i = 2; i < points.length; i += 2) {
      context.lineTo(points[i], points[i + 1]);
    }
    context.strokeStyle = isSelected ? "#00A3FF" : "black";
    context.lineWidth = 2;
    context.stroke();

    // 화살표 머리 그리기
    if (arrowHeads.right) {
      drawArrowHead(
        context,
        points[points.length - 4],
        points[points.length - 3],
        arrowTipX,
        arrowTipY
      );
    }
    if (arrowHeads.left) {
      drawArrowHead(context, points[0], points[1], points[2], points[3]);
    }

    // 텍스트 그리기
    if (text) {
      const midPoint = calculateArrowMidpoint(points);
      context.font = "16px Arial";
      context.fillStyle = "black";
      context.textAlign = "center";
      context.fillText(text, midPoint.x, midPoint.y - 10);
    }

    context.restore();
  }, [context, arrow, isSelected, scale, offset]);

  // 화살표 머리 그리기 함수
  const drawArrowHead = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number
  ) => {
    const headlen = 10;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headlen * Math.cos(angle - Math.PI / 6),
      toY - headlen * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headlen * Math.cos(angle + Math.PI / 6),
      toY - headlen * Math.sin(angle + Math.PI / 6)
    );
    ctx.strokeStyle = isSelected ? "#00A3FF" : "black";
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  // 화살표 중간점 계산 함수
  const calculateArrowMidpoint = (points: number[]) => {
    const midIndex = Math.floor(points.length / 2);
    return {
      x: (points[midIndex - 2] + points[midIndex]) / 2,
      y: (points[midIndex - 1] + points[midIndex + 1]) / 2,
    };
  };

  useEffect(() => {
    drawArrow();
  }, [drawArrow]);

  // 우클릭 이벤트 핸들러
  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    dispatch(toggleSettings(arrow.id));
  };

  // 더블클릭 이벤트 핸들러
  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    dispatch(toggleTextBox(arrow.id));
    handleTextEdit();
  };

  // 텍스트 편집
  const handleTextEdit = useCallback(() => {
    setIsEditing(true);
    const text = prompt("텍스트를 입력하세요:", arrow.text || "");
    if (text !== null) {
      onChange({ text });
    }
    setIsEditing(false);
  }, [arrow.text, onChange]);

  // 화살표 클릭 핸들러
  const handleArrowClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.stopPropagation();
    onSelect();
  };

  // 드래그 이벤트 핸들러
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isSelected) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left - offset.x * scale) / scale;
    const y = (e.clientY - rect.top - offset.y * scale) / scale;

    // 드래그 시작 위치 저장 등 필요한 로직 추가
  };

  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight}
      style={{ position: "absolute", top: 0, left: 0 }}
      onContextMenu={handleContextMenu}
      onDoubleClick={handleDoubleClick}
      onClick={handleArrowClick}
      onMouseDown={handleMouseDown}
    />
  );
};

export default Arrow;
