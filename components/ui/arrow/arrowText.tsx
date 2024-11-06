// components/shapes/ArrowText.tsx
// 화살표에 표시되는 텍스트 박스의 표시, 위치, 편집을 관리합니다.

import React, { useRef, useEffect, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toggleTextBox } from "@/lib/redux/features/arrowSlice";
import type { RootState, AppDispatch } from "@/lib/redux/store";

interface ArrowTextProps {
  points: number[]; // 화살표의 점들 (x, y 좌표)
  isSelected?: boolean; // 화살표가 선택되었는지 여부
  onDoubleClick: (e: React.MouseEvent<HTMLCanvasElement>) => void; // 더블클릭 이벤트 핸들러
  arrowId: string; // arrowId prop
}

const ArrowText: React.FC<ArrowTextProps> = ({
  points,
  isSelected,
  onDoubleClick,
  arrowId,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dispatch = useDispatch<AppDispatch>();
  const [text, setText] = useState("텍스트를 입력하세요");
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // 텍스트 박스의 위치 계산
  const calculateMidpoint = useCallback(() => {
    const midIndex = Math.floor(points.length / 2);
    return {
      x: (points[midIndex - 2] + points[midIndex]) / 2,
      y: (points[midIndex - 1] + points[midIndex + 1]) / 2,
    };
  }, [points]);

  const [position, setPosition] = useState(() => calculateMidpoint());

  // 화살표가 변경될 때 위치 업데이트
  useEffect(() => {
    if (points.length >= 4) {
      setPosition(calculateMidpoint());
    }
  }, [points, calculateMidpoint]);

  // 텍스트 박스 그리기
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 캔버스 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 텍스트 박스 그리기
    const boxWidth = 200;
    const boxHeight = 50;
    const x = position.x - boxWidth / 2;
    const y = position.y - boxHeight / 2;

    // 배경
    ctx.fillStyle = "white";
    ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;
    ctx.beginPath();
    ctx.roundRect(x, y, boxWidth, boxHeight, 4);
    ctx.fill();

    // 테두리
    ctx.shadowColor = "transparent";
    ctx.strokeStyle = isSelected ? "#00A3FF" : "black";
    ctx.lineWidth = 1;
    ctx.stroke();

    // 텍스트
    ctx.fillStyle = "black";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, position.x, position.y);
  }, [position, text, isSelected, points]);

  // 텍스트 박스 토글
  const handleToggleTextBox = useCallback(() => {
    if (isSelected) {
      dispatch(toggleTextBox(arrowId));
    }
  }, [dispatch, arrowId, isSelected]);

  // 키보드 이벤트 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "T" || e.key === "t") && isSelected) {
        handleToggleTextBox();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSelected, handleToggleTextBox]);

  // 더블클릭으로 편집 모드 진입
  const handleTextDblClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsEditing(true);
    createTextArea(x, y);
  };

  // textarea 생성 및 관리
  const createTextArea = (x: number, y: number) => {
    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);

    textarea.value = text;
    textarea.style.position = "absolute";
    textarea.style.left = `${x}px`;
    textarea.style.top = `${y}px`;
    textarea.style.width = "200px";
    textarea.style.height = "50px";
    textarea.style.fontSize = "16px";
    textarea.style.padding = "5px";
    textarea.style.border = "none";
    textarea.style.outline = "none";
    textarea.style.resize = "none";
    textarea.style.background = "white";
    textarea.style.boxShadow = "0 0 10px rgba(0,0,0,0.2)";
    textarea.style.borderRadius = "4px";

    textarea.focus();

    const handleBlur = () => {
      setText(textarea.value);
      setIsEditing(false);
      document.body.removeChild(textarea);
    };

    textarea.addEventListener("blur", handleBlur);
    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        textarea.blur();
      }
    });
  };

  // 드래그 이벤트 핸들러
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;

    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    setPosition((prev) => ({
      x: prev.x + dx,
      y: prev.y + dy,
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight}
      onDoubleClick={handleTextDblClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "all",
        cursor: isDragging ? "grabbing" : "grab",
      }}
    />
  );
};

export default ArrowText;
