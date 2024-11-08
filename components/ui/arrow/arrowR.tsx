// Arrow.tsx

import React, { useRef, useEffect, useState, useCallback } from "react";
import { ArrowHeadState, ArrowWidget } from "@/lib/type";
import { useDispatch, useSelector } from "react-redux";
import {
  toggleSettings,
  closeSettings,
  toggleTextBox,
} from "@/lib/redux/features/arrowSlice";
import type { RootState, AppDispatch } from "@/lib/redux/store";

interface ArrowRProps {
  shapeProps: ArrowWidget;
  isSelected?: boolean;
  onSelect?: () => void;
  onChange: (newAttrs: Partial<ArrowWidget>) => void;
  onDragMove: (id: string, x: number, y: number, type: "from" | "to") => void;
  scale: number;
  offset: { x: number; y: number };
}

const ArrowR: React.FC<ArrowRProps> = ({
  shapeProps,
  isSelected,
  onSelect,
  onChange,
  onDragMove,
  scale,
  offset,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPoint, setDragPoint] = useState<"from" | "to" | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [text, setText] = useState("텍스트를 입력하세요");
  const [isEditing, setIsEditing] = useState(false);
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });

  const dispatch = useDispatch<AppDispatch>();

  // Redux selector 최적화
  const { showSettings, isTextBoxVisible } = useSelector(
    (state: RootState) => ({
      showSettings:
        state.arrow.showSettings &&
        state.arrow.selectedArrowId === shapeProps.id,
      isTextBoxVisible: state.arrow.textBoxVisibility[shapeProps.id] || false,
    }),
    // 이전 값과 현재 값을 비교하는 함수 추가
    (prev, next) =>
      prev.showSettings === next.showSettings &&
      prev.isTextBoxVisible === next.isTextBoxVisible
  );

  // 화살표 그리기
  const drawArrow = useCallback(() => {
    console.log("Drawing arrow with props:", shapeProps);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 캔버스 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 포인트가 있는 경우에만 그리기
    if (shapeProps.points && shapeProps.points.length >= 4) {
      console.log("Drawing arrow with points:", shapeProps.points);

      // 스케일과 오프셋 적용
      ctx.save();
      ctx.scale(scale, scale);
      ctx.translate(offset.x, offset.y);

      // 선 그리기
      ctx.beginPath();
      ctx.moveTo(shapeProps.points[0], shapeProps.points[1]);

      // 중간 점들 연결
      for (let i = 2; i < shapeProps.points.length; i += 2) {
        ctx.lineTo(shapeProps.points[i], shapeProps.points[i + 1]);
      }

      ctx.strokeStyle = isSelected ? "#00A3FF" : "#000000";
      ctx.lineWidth = 2;
      ctx.stroke();

      // 화살표 헤드 그리기
      if (shapeProps.arrowHeads.right) {
        const endPoint = {
          x: shapeProps.points[shapeProps.points.length - 2],
          y: shapeProps.points[shapeProps.points.length - 1],
        };
        const prevPoint = {
          x: shapeProps.points[shapeProps.points.length - 4],
          y: shapeProps.points[shapeProps.points.length - 3],
        };

        const angle = Math.atan2(
          endPoint.y - prevPoint.y,
          endPoint.x - prevPoint.x
        );

        drawArrowHead(ctx, endPoint.x, endPoint.y, angle);
      }

      ctx.restore();
    } else {
      console.log("No points available for arrow");
    }
  }, [shapeProps, isSelected, scale, offset]);

  // 화살표 헤드 그리기 함수
  const drawArrowHead = (
    ctx: CanvasRenderingContext2D,
    toX: number,
    toY: number,
    angle: number
  ) => {
    const headLength = 15;
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLength * Math.cos(angle - Math.PI / 6),
      toY - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      toX - headLength * Math.cos(angle + Math.PI / 6),
      toY - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fillStyle = isSelected ? "#BBDEFB" : "#000000";
    ctx.fill();
  };

  // 텍스트 그리기 함수
  const drawText = (ctx: CanvasRenderingContext2D) => {
    const centerX =
      (shapeProps.points[0] + shapeProps.points[shapeProps.points.length - 2]) /
      2;
    const centerY =
      (shapeProps.points[1] + shapeProps.points[shapeProps.points.length - 1]) /
      2;

    ctx.font = "14px Arial";
    const metrics = ctx.measureText(text);
    const padding = 8;
    const boxWidth = metrics.width + padding * 2;
    const boxHeight = 24;

    setTextPosition({
      x: centerX - boxWidth / 2,
      y: centerY - boxHeight / 2,
    });

    // 텍스트 박스 배경
    ctx.fillStyle = "white";
    ctx.strokeStyle = isSelected ? "#BBDEFB" : "#e0e0e0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(textPosition.x, textPosition.y, boxWidth, boxHeight, 4);
    ctx.fill();
    ctx.stroke();

    // 텍스트
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, centerX, centerY);
  };

  // 설정 패널 그리기 함수
  const drawSettings = (ctx: CanvasRenderingContext2D) => {
    const panelX = shapeProps.arrowTipX + 20;
    const panelY = shapeProps.arrowTipY - 40;

    // 패널 배경
    ctx.fillStyle = "white";
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, 120, 40, 4);
    ctx.fill();
    ctx.stroke();

    // 화살표 헤드 토글 버튼
    drawToggleButton(
      ctx,
      panelX + 10,
      panelY + 10,
      "left",
      shapeProps.arrowHeads.left
    );
    drawToggleButton(
      ctx,
      panelX + 70,
      panelY + 10,
      "right",
      shapeProps.arrowHeads.right
    );
  };

  // 토글 버튼 그리기 함수
  const drawToggleButton = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    side: "left" | "right",
    isActive: boolean
  ) => {
    ctx.fillStyle = isActive ? "#E5F6FD" : "#F3F4F6";
    ctx.strokeStyle = isActive ? "#00A3FF" : "#D1D5DB";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, 40, 20, 4);
    ctx.fill();
    ctx.stroke();

    // 화살표 아이콘
    ctx.beginPath();
    ctx.strokeStyle = isActive ? "#00A3FF" : "#9e9e9e";
    ctx.lineWidth = 2;
    if (side === "left") {
      ctx.moveTo(x + 25, y + 5);
      ctx.lineTo(x + 15, y + 10);
      ctx.lineTo(x + 25, y + 15);
    } else {
      ctx.moveTo(x + 15, y + 5);
      ctx.lineTo(x + 25, y + 10);
      ctx.lineTo(x + 15, y + 15);
    }
    ctx.stroke();
  };

  // 컨트롤 포인트 그리기 함수
  const drawControlPoints = (ctx: CanvasRenderingContext2D) => {
    const points = [
      { x: shapeProps.points[0], y: shapeProps.points[1] },
      {
        x: shapeProps.points[shapeProps.points.length - 2],
        y: shapeProps.points[shapeProps.points.length - 1],
      },
    ];

    points.forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#BBDEFB";
      ctx.fill();
      ctx.strokeStyle = "#2196F3";
      ctx.stroke();
    });
  };

  // 이벤트 핸들러들...
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    console.log("6. Mouse down on arrow canvas");
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - offset.x * scale) / scale;
    const y = (e.clientY - rect.top - offset.y * scale) / scale;

    // 새로운 화살표 시작
    if (!shapeProps.points.length) {
      const newPoints = [x, y, x, y];
      onChange({
        ...shapeProps,
        points: newPoints,
        arrowTipX: x,
        arrowTipY: y,
      });
    }

    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      console.log("7. Mouse move while dragging arrow");
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - offset.x * scale) / scale;
      const y = (e.clientY - rect.top - offset.y * scale) / scale;

      // 화살표 끝점 업데이트
      if (shapeProps.points.length >= 4) {
        const newPoints = [...shapeProps.points];
        newPoints[newPoints.length - 2] = x;
        newPoints[newPoints.length - 1] = y;

        onChange({
          ...shapeProps,
          points: newPoints,
          arrowTipX: x,
          arrowTipY: y,
        });
      }
    },
    [isDragging, scale, offset, onChange, shapeProps]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragPoint(null);
  }, []);

  // 이벤트 리스너 설정
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // 화살표 그리기
  useEffect(() => {
    drawArrow();
  }, [drawArrow]);

  // 화살표 헤드 토글 핸들러
  const handleToggleArrowHead = (side: "left" | "right") => {
    const newHeads: ArrowHeadState = {
      ...shapeProps.arrowHeads,
      [side]: !shapeProps.arrowHeads[side],
    };

    onChange({
      ...shapeProps,
      arrowHeads: newHeads,
    });
  };

  // 설정 패널 클릭 핸들러
  const handleSettingsClick = (e: React.MouseEvent) => {
    if (!showSettings) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - offset.x * scale) / scale;
    const y = (e.clientY - rect.top - offset.y * scale) / scale;

    // 설정 패널 영역 체크
    const panelX = shapeProps.arrowTipX + 20;
    const panelY = shapeProps.arrowTipY - 40;

    // 왼쪽 버튼 영역
    if (
      x >= panelX + 10 &&
      x <= panelX + 50 &&
      y >= panelY + 10 &&
      y <= panelY + 30
    ) {
      handleToggleArrowHead("left");
    }
    // 오른쪽 버튼 영역
    else if (
      x >= panelX + 70 &&
      x <= panelX + 110 &&
      y >= panelY + 10 &&
      y <= panelY + 30
    ) {
      handleToggleArrowHead("right");
    }
  };

  // 설정 패널 닫기 핸들러
  const handleCloseSettings = () => {
    dispatch(closeSettings());
  };

  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "all",
        cursor: isDragging ? "grabbing" : "crosshair",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={(e) => handleMouseMove(e.nativeEvent)}
      onMouseUp={handleMouseUp}
      onClick={handleSettingsClick}
      onContextMenu={(e) => {
        e.preventDefault();
        dispatch(toggleSettings(shapeProps.id));
      }}
      onDoubleClick={() => dispatch(toggleTextBox(shapeProps.id))}
      // ESC 키로 설정 패널 닫기
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          handleCloseSettings();
        }
      }}
      tabIndex={0} // 키보드 이벤트를 받기 위해 필요
    />
  );
};

export default ArrowR;
