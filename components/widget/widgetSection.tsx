import React, { useRef, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { updateArrowPositions } from "@/lib/redux/features/arrowSlice";
import {
  SectionWidget,
  AllWidgetTypes,
  isArrow,
  ArrowWidget,
  ShellWidgetProps,
} from "@/lib/type";
import {
  snap,
  snapWidgetPosition,
  snapWidgetResize,
} from "@/lib/utils/snapping";
import {
  isCompletelyContained,
  isWithinBounds,
} from "@/lib/utils/sectionHelpers";

interface WidgetSectionProps {
  widget: ShellWidgetProps<SectionWidget>;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newAttrs: Partial<ShellWidgetProps<SectionWidget>>) => void;
  shapes: ShellWidgetProps<AllWidgetTypes>[];
  updateShapes: (shapes: ShellWidgetProps<AllWidgetTypes>[]) => void;
  scale: number;
  offset: { x: number; y: number };
  fill?: string;
  memberIds?: string[];
}

export default function WidgetSection({
  widget,
  isSelected,
  onSelect,
  onChange,
  shapes,
  updateShapes,
  scale,
  offset,
}: WidgetSectionProps) {
  const dispatch = useDispatch();
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);

  // 섹션 영역 체크 및 멤버 업데이트
  useEffect(() => {
    if (isDragging || isResizing) return;

    const sectionBounds = {
      x: widget.x,
      y: widget.y,
      width: widget.width,
      height: widget.height,
    };

    // 여유 공간을 둔 경계 계산 (100px)
    const margin = 100;
    const boundsWithMargin = {
      x: sectionBounds.x - margin,
      y: sectionBounds.y - margin,
      width: sectionBounds.width + margin * 2,
      height: sectionBounds.height + margin * 2,
    };

    // 섹션 내부에 있는 객체들 찾기
    const newMembers = shapes
      .filter((shape) => {
        if (shape.id === widget.id) return false;
        // sectionHelpers의 함수 사용
        const isContained = isCompletelyContained(shape, widget);
        const isWithinMargin = isWithinBounds(shape, boundsWithMargin);
        const isMember =
          widget.innerWidget.memberIds?.includes(shape.id) || false;

        return isContained || (isMember && isWithinMargin);
      })
      .map((shape) => shape.id);

    // 멤버십이 변경된 경우에만 업데이트
    const sortedNewMembers = [...newMembers].sort();
    const sortedCurrentMembers = [
      ...(widget.innerWidget.memberIds || []),
    ].sort();

    if (
      JSON.stringify(sortedNewMembers) !== JSON.stringify(sortedCurrentMembers)
    ) {
      onChange({
        ...widget,
        innerWidget: {
          ...widget.innerWidget,
          memberIds: newMembers,
        },
      });
    }
  }, [shapes, widget, onChange, isDragging, isResizing]);

  return (
    <div
      className="section-container"
      style={{
        width: "100%",
        height: "100%",
        position: "absolute",
        top: 0,
        left: 0,
        backgroundColor: "rgba(200, 200, 200, 0.2)",
        opacity: 0.8,
        pointerEvents: "all",
        cursor: isDragging ? "grabbing" : "grab",
      }}
    >
      <div
        className="section-content"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
