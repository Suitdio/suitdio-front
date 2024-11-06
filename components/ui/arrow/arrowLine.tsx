// components/ui/arrow/arrowLine.tsx
// 화살표의 모양과 방향, 드래그 가능한 시작점과 끝점을 관리합니다.

import React, { useRef, useEffect } from "react";
import { ArrowWidget } from "@/lib/type";

interface ArrowLineProps {
  shapeProps: ArrowWidget; // 화살표의 속성
  isSelected?: boolean; // 화살표가 선택되었는지 여부
  onSelect?: () => void; // 화살표 선택 시 호출되는 함수
  onDragMove: (id: string, x: number, y: number, type: "from" | "to") => void; // 드래그 이동 시 호출되는 함수
  onContextMenu: (e: React.MouseEvent<HTMLCanvasElement>) => void; // 우클릭 이벤트 핸들러 추가
  onDoubleClick: (e: React.MouseEvent<HTMLCanvasElement>) => void; // 더블클릭 이벤트 핸들러 추가
}

const ArrowLine: React.FC<ArrowLineProps> = ({
  shapeProps,
  isSelected,
  onSelect,
  onDragMove,
  onContextMenu,
  onDoubleClick,
}) => {
  const { points, arrowTipX, arrowTipY, id, arrowHeads } = shapeProps;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 화살표 헤드의 각도 계산
  const len = points.length;
  const x1 = points[len - 4];
  const y1 = points[len - 3];
  const dx = arrowTipX - x1;
  const dy = arrowTipY - y1;
  const angle = Math.atan2(dy, dx);

  // 시작점의 각도 계산 (왼쪽 화살표를 위해)
  const startDx = points[2] - points[0];
  const startDy = points[3] - points[1];
  const startAngle = Math.atan2(startDy, startDx);

  /**
   * 선택 상태에 따른 화살표 스타일 변경
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 캔버스 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 화살표 선 그리기
    drawArrowLine(ctx);

    // 화살표 헤드 그리기
    if (arrowHeads.right) {
      drawArrowHead(ctx, arrowTipX, arrowTipY, angle);
    }
    if (arrowHeads.left) {
      drawArrowHead(ctx, points[0], points[1], startAngle - Math.PI);
    }

    // 선택된 경우 컨트롤 포인트 그리기
    if (isSelected) {
      drawControlPoints(ctx);
    }
  }, [points, arrowTipX, arrowTipY, isSelected, arrowHeads, angle, startAngle]);

  const drawArrowLine = (ctx: CanvasRenderingContext2D) => {
    ctx.beginPath();
    ctx.moveTo(points[0], points[1]);

    for (let i = 2; i < points.length; i += 2) {
      const radius = 15;

      if (i < points.length - 2) {
        const x1 = points[i - 2];
        const y1 = points[i - 1];
        const x2 = points[i];
        const y2 = points[i + 1];
        const x3 = points[i + 2];
        const y3 = points[i + 3];

        const dx1 = x2 - x1;
        const dy1 = y2 - y1;
        const dx2 = x3 - x2;
        const dy2 = y3 - y2;

        const angle1 = Math.atan2(dy1, dx1);
        const angle2 = Math.atan2(dy2, dx2);

        let angleDiff = angle2 - angle1;
        if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        else if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

        if (Math.abs(angleDiff) < 0.05) {
          ctx.lineTo(x2, y2);
          continue;
        }

        const dist = Math.min(
          radius,
          Math.hypot(dx1, dy1) / 2,
          Math.hypot(dx2, dy2) / 2
        );

        const x2a = x2 - dist * Math.cos(angle1);
        const y2a = y2 - dist * Math.sin(angle1);
        const x2b = x2 + dist * Math.cos(angle2);
        const y2b = y2 + dist * Math.sin(angle2);

        ctx.lineTo(x2a, y2a);
        ctx.arcTo(x2, y2, x2b, y2b, dist);
      } else {
        ctx.lineTo(points[i], points[i + 1]);
      }
    }

    ctx.strokeStyle = isSelected ? "#00A3FF" : "black";
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const drawArrowHead = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    angle: number
  ) => {
    const size = 10;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(-size, size);
    ctx.lineTo(size, size);
    ctx.closePath();
    ctx.fillStyle = isSelected ? "#00A3FF" : "black";
    ctx.fill();
    ctx.restore();
  };

  const drawControlPoints = (ctx: CanvasRenderingContext2D) => {
    ctx.beginPath();
    ctx.arc(points[0], points[1], 5, 0, Math.PI * 2);
    ctx.fillStyle = "red";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(arrowTipX, arrowTipY, 5, 0, Math.PI * 2);
    ctx.fillStyle = "red";
    ctx.fill();
  };

  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight}
      onClick={onSelect}
      onContextMenu={onContextMenu}
      onDoubleClick={onDoubleClick}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "all",
        cursor: isSelected ? "pointer" : "default",
      }}
    />
  );
};

export default ArrowLine;
