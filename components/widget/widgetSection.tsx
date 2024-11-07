import React, { useEffect, useState, useCallback } from "react";
import { debounce } from "lodash"; // lodash 임포트
import { SectionWidget, AllWidgetTypes, ShellWidgetProps } from "@/lib/type";
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
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  // 디바운스된 멤버 업데이트 함수
  const updateMembers = useCallback(
    debounce(() => {
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
          const isContained = isCompletelyContained(shape, widget);
          const isWithinMargin = isWithinBounds(shape, boundsWithMargin);
          const isMember =
            widget.innerWidget.memberIds?.includes(shape.id) || false;
          return isContained || (isMember && isWithinMargin);
        })
        .map((shape) => shape.id);

      // 멤버십이 변경된 경우에만 업데이트
      const sortedNewMembers = [...newMembers].sort().join(",");
      const sortedCurrentMembers = [...(widget.innerWidget.memberIds || [])]
        .sort()
        .join(",");

      if (sortedNewMembers !== sortedCurrentMembers) {
        onChange({
          ...widget,
          innerWidget: {
            ...widget.innerWidget,
            memberIds: newMembers,
          },
        });
      }
    }, 200), // 200ms 디바운스 시간
    [widget.x, widget.y, widget.width, widget.height, shapes]
  );

  useEffect(() => {
    updateMembers();
    return () => {
      updateMembers.cancel();
    };
  }, [updateMembers]);

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
