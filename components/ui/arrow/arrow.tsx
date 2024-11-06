// components/shapes/Arrow.tsx
// ArrowLine, ArrowText, ArrowSettings 컴포넌트들을 조합하여 전체 화살표 기능을 제공합니다.

"use client"; // 클라이언트 사이드에서만 실행되도록 지정

import React, { useCallback } from "react";
import { ArrowHeadState, ArrowWidget } from "@/lib/type";
import ArrowLine from "@/components/ui/arrow/arrowLine";
import ArrowText from "./arrowText";
import ArrowSettings from "./arrowSettings";
import { useDispatch, useSelector } from "react-redux";
import {
  toggleSettings,
  closeSettings,
  toggleTextBox,
} from "@/lib/redux/features/arrowSlice";
import type { RootState } from "@/lib/redux/store";
import type { AppDispatch } from "@/lib/redux/store";

interface ArrowProps {
  shapeProps: ArrowWidget;
  isSelected?: boolean;
  onSelect?: () => void;
  onChange: (newAttrs: Partial<ArrowWidget>) => void;
  onDragMove: (id: string, x: number, y: number, type: "from" | "to") => void;
}

const Arrow: React.FC<ArrowProps> = ({
  shapeProps,
  isSelected,
  onSelect,
  onChange,
  onDragMove,
}) => {
  const { points, id, arrowHeads } = shapeProps;
  const dispatch = useDispatch<AppDispatch>();

  // Redux 상태 가져오기
  const { showSettings, isTextBoxVisible } = useSelector(
    (state: RootState) => ({
      showSettings:
        state.arrow.showSettings && state.arrow.selectedArrowId === id,
      isTextBoxVisible: state.arrow.textBoxVisibility[id] || false,
    })
  );

  // 우클릭 이벤트 핸들러
  const handleContextMenu = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      dispatch(toggleSettings(id));
    },
    [dispatch, id]
  );

  // 더블클릭 이벤트 핸들러
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      if (e.button === 0) {
        dispatch(toggleTextBox(id));
      }
    },
    [dispatch, id]
  );

  // 설정 닫기 핸들러
  const handleSettingsClose = useCallback(() => {
    dispatch(closeSettings());
  }, [dispatch]);

  // 화살표 헤드 토글 핸들러
  const handleArrowHeadToggle = useCallback(
    (newHeads: ArrowHeadState) => {
      onChange({ ...shapeProps, arrowHeads: newHeads });
    },
    [onChange, shapeProps]
  );

  // 화살표 클릭 핸들러
  const handleArrowClick = useCallback(() => {
    if (onSelect) {
      onSelect();
    }
  }, [onSelect]);

  return (
    <>
      {/* 화살표 라인 */}
      <ArrowLine
        shapeProps={shapeProps}
        isSelected={isSelected}
        onSelect={handleArrowClick}
        onDragMove={onDragMove}
        onContextMenu={handleContextMenu}
        onDoubleClick={handleDoubleClick}
      />

      {/* 텍스트 박스 */}
      {isTextBoxVisible && (
        <ArrowText
          points={points}
          isSelected={isSelected}
          onDoubleClick={handleDoubleClick}
          arrowId={id}
        />
      )}

      {/* 설정 패널 */}
      {showSettings && (
        <ArrowSettings
          position={{ x: points[0], y: points[1] }}
          arrowHeads={arrowHeads}
          onClose={handleSettingsClose}
          onArrowHeadToggle={handleArrowHeadToggle}
        />
      )}
    </>
  );
};

export default Arrow;
