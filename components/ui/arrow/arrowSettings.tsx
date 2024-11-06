// components/shapes/ArrowSettings.tsx
// 화살표 헤드 온/오프 설정 컴포넌트

import React, { useRef, useEffect } from "react";
import { ArrowHeadState } from "@/lib/type";

interface ArrowSettingsProps {
  position: { x: number; y: number };
  arrowHeads: ArrowHeadState;
  onClose: () => void;
  onArrowHeadToggle: (heads: ArrowHeadState) => void;
}

const ArrowSettings: React.FC<ArrowSettingsProps> = ({
  position,
  arrowHeads,
  onClose,
  onArrowHeadToggle,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 캔버스 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 설정 패널 그리기
    drawSettingsPanel(ctx);
  }, [position, arrowHeads]);

  const drawSettingsPanel = (ctx: CanvasRenderingContext2D) => {
    // 배경 패널
    ctx.fillStyle = "white";
    ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.beginPath();
    ctx.roundRect(position.x, position.y - 100, 200, 100, 5);
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.stroke();

    // 텍스트 스타일 설정
    ctx.font = "14px Arial";
    ctx.fillStyle = "black";
    ctx.textBaseline = "middle";

    // 왼쪽 화살표 설정
    ctx.fillText("Left Arrow:", position.x + 10, position.y - 70);
    drawToggleButton(
      ctx,
      position.x + 100,
      position.y - 85,
      arrowHeads.left,
      "left"
    );

    // 오른쪽 화살표 설정
    ctx.fillText("Right Arrow:", position.x + 10, position.y - 30);
    drawToggleButton(
      ctx,
      position.x + 100,
      position.y - 45,
      arrowHeads.right,
      "right"
    );

    // 닫기 버튼
    ctx.fillStyle = "red";
    ctx.fillText("X", position.x + 180, position.y - 85);
  };

  const drawToggleButton = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    isActive: boolean,
    type: "left" | "right"
  ) => {
    // 토글 버튼 배경
    ctx.fillStyle = isActive ? "#E5F6FD" : "#F3F4F6";
    ctx.beginPath();
    ctx.roundRect(x, y, 80, 30, 3);
    ctx.fill();
    ctx.strokeStyle = isActive ? "#00A3FF" : "#D1D5DB";
    ctx.stroke();

    // 토글 텍스트
    ctx.fillStyle = isActive ? "#00A3FF" : "#6B7280";
    ctx.textAlign = "center";
    ctx.fillText(isActive ? "On" : "Off", x + 40, y + 15);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 닫기 버튼 영역 확인
    if (
      x >= position.x + 170 &&
      x <= position.x + 190 &&
      y >= position.y - 90 &&
      y <= position.y - 80
    ) {
      onClose();
      return;
    }

    // 왼쪽 화살표 토글 버튼 영역 확인
    if (
      x >= position.x + 100 &&
      x <= position.x + 180 &&
      y >= position.y - 85 &&
      y <= position.y - 55
    ) {
      onArrowHeadToggle({ ...arrowHeads, left: !arrowHeads.left });
      return;
    }

    // 오른쪽 화살표 토글 버튼 영역 확인
    if (
      x >= position.x + 100 &&
      x <= position.x + 180 &&
      y >= position.y - 45 &&
      y <= position.y - 15
    ) {
      onArrowHeadToggle({ ...arrowHeads, right: !arrowHeads.right });
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight}
      onClick={handleClick}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "all",
        cursor: "pointer",
      }}
    />
  );
};

export default ArrowSettings;
