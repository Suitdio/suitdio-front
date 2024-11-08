import React, { use, useEffect, useState } from "react";
import {
  AllWidgetTypes,
  EdgePosition,
  NODE_WIDGET_TYPES,
  NodeWidgetType,
  ShellWidgetProps,
  SectionWidget,
  isSection,
} from "@/lib/type";
import WidgetText from "./widgetText";
import WidgetBoard from "./widgetBoard";
import WidgetSection from "./widgetSection";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteWidget,
  setEditModeWidgets,
  setSelectedWidget,
  updateWidget,
} from "@/lib/redux/features/whiteboardSlice";
import WidgetArea from "./widgetArea";
import {
  snap,
  snapHeight,
  snapWidgetPosition,
  snapWidgetResize,
} from "@/lib/utils/snapping";
import { RootState } from "@/lib/redux/store";
import { Button } from "../ui/button";
import { ChevronDown, Ellipsis, Info } from "lucide-react";
import SvgIcon from "@/lib/utils/svgIcon";
import {
  arrowModeSvg,
  chevronDownSvg8px,
  circleSvg,
  downWrapArrow,
  pauseSvg,
  recordSvg,
  sixBoltSvg,
  wideFrameSvg8px,
} from "@/lib/utils/svgBag";
import {
  setArrowStartPoint,
  setIsArrowMode,
  setIsDrawing,
  setArrowEndPoint,
} from "@/lib/redux/features/arrowSlice";
import {
  isCompletelyContained,
  updateSectionAndMembers,
  updateSectionResize,
  limitMovementInSection,
} from "@/lib/utils/sectionHelpers";

interface WidgetShellProps {
  widget: ShellWidgetProps<AllWidgetTypes>;
  scale: number;
  offset: { x: number; y: number };
  draggable: boolean;
  editable: boolean;
  resizeable: boolean;
  headerBar: boolean;
  footerBar: boolean;
  fill?: string;
  memberIds?: string[];
}

//resize 핸들 스타일 함수
const getHandleStyle = (position: string): React.CSSProperties => {
  const baseStyle: React.CSSProperties = {
    position: "absolute",
    backgroundColor: "transparent",
  };

  switch (position) {
    // 모서리 핸들
    case "nw":
      return {
        ...baseStyle,
        top: "-8px",
        left: "-8px",
        width: "16px",
        height: "16px",
        cursor: "nw-resize",
      };
    case "ne":
      return {
        ...baseStyle,
        top: "-8px",
        right: "-8px",
        width: "16px",
        height: "16px",
        cursor: "ne-resize",
      };
    case "sw":
      return {
        ...baseStyle,
        bottom: "-8px",
        left: "-8px",
        width: "16px",
        height: "16px",
        cursor: "sw-resize",
      };
    case "se":
      return {
        ...baseStyle,
        bottom: "-8px",
        right: "-8px",
        width: "16px",
        height: "16px",
        cursor: "se-resize",
      };
    // 면 핸들
    case "n":
      return {
        ...baseStyle,
        top: "-4px",
        left: "16px", // 모서리 핸들을 피해서 시작
        right: "16px", // 모서리 핸들을 피해서 끝
        height: "8px",
        cursor: "n-resize",
      };
    case "s":
      return {
        ...baseStyle,
        bottom: "-4px",
        left: "16px",
        right: "16px",
        height: "8px",
        cursor: "s-resize",
      };
    case "w":
      return {
        ...baseStyle,
        left: "-4px",
        top: "16px",
        bottom: "16px",
        width: "8px",
        cursor: "w-resize",
      };
    case "e":
      return {
        ...baseStyle,
        right: "-4px",
        top: "16px",
        bottom: "16px",
        width: "8px",
        cursor: "e-resize",
      };
    default:
      return baseStyle;
  }
};

export default function WidgetShell({
  widget,
  scale,
  offset,
  draggable,
  editable,
  resizeable,
  headerBar,
  footerBar,
  fill,
  memberIds,
}: WidgetShellProps) {
  const dispatch = useDispatch();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isNodeWidget, setIsNodeWidget] = useState(false);
  const isArrowMode = useSelector(
    (state: RootState) => state.arrow.isArrowMode
  );
  const editModeWidgets = useSelector(
    (state: RootState) => state.whiteboard.editModeWidgets
  );
  const selectedWidget = useSelector(
    (state: RootState) => state.whiteboard.selectedWidget
  );
  const [isSelected, setIsSelected] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [hoveredEdge, setHoveredEdge] = useState<EdgePosition>(null);

  const [isArrowNodeHovered, setIsArrowNodeHovered] = useState(false);

  const widgets = useSelector((state: RootState) => state.whiteboard.widgets);

  useEffect(() => {
    setIsSelected(selectedWidget === widget.id);
    if (selectedWidget !== null && selectedWidget !== editModeWidgets) {
      dispatch(setEditModeWidgets(null));
    }
  }, [selectedWidget]);

  useEffect(() => {
    setIsEditMode(editModeWidgets === widget.id);
  }, [editModeWidgets]);

  useEffect(() => {
    if (isSelected) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isSelected]);

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, isResizing]);

  useEffect(() => {
    setIsNodeWidget(isNodeWidgetType(widget.innerWidget.type));
  }, [widget.innerWidget.type]);

  const handleHeightChange = (height: number) => {
    if (height !== widget.height) {
      // header 높이 52px 추가
      if (headerBar) {
        height = height + 52;
      }
      if (footerBar) {
        height = height + 52;
      }
      const snappedHeight = snapHeight(height);
      dispatch(
        updateWidget({
          ...widget,
          height: snappedHeight,
        })
      );
    }
  };

  // arrow 노드 스타일 함수 수정
  const setArrowNodeStyle = (position: string): React.CSSProperties => {
    console.log("4. Setting arrow node style for position:", position);
    const baseStyle: React.CSSProperties = {
      position: "absolute",
      width: hoveredEdge === position ? "10px" : "6px", // hover 시 크기 증가
      height: hoveredEdge === position ? "10px" : "6px",
      backgroundColor: "#FFB300",
      outline:
        hoveredEdge === position
          ? "none"
          : `${
              isEditMode
                ? "2px solid black"
                : isSelected
                ? "2px solid #BBDEFB"
                : "#e0e0e0"
            }`,
      borderRadius: "50%",
      display: hoveredEdge === position ? "block" : "none",
      cursor: "pointer",
      zIndex: 10, // resize 핸들보다 위에 표시
      transition: "all 0.2s ease",
    };

    const positions = {
      n: {
        top: hoveredEdge === "n" ? "-6px" : "-4px",
        left: "50%",
        transform: "translateX(-50%)",
      },
      s: {
        bottom: hoveredEdge === "s" ? "-6px" : "-4px",
        left: "50%",
        transform: "translateX(-50%)",
      },
      w: {
        left: hoveredEdge === "w" ? "-6px" : "-4px",
        top: "50%",
        transform: "translateY(-50%)",
      },
      e: {
        right: hoveredEdge === "e" ? "-6px" : "-4px",
        top: "50%",
        transform: "translateY(-50%)",
      },
    };

    return {
      ...baseStyle,
      ...(positions[position as keyof typeof positions] || {}),
    };
  };

  // arrow node hover 핸들러 수정
  const handleArrowNodeHover = (
    position: EdgePosition,
    isHovering: boolean,
    e: React.MouseEvent
  ) => {
    if (!isArrowMode) return; // arrow 모드일 때만 동작

    console.log("1. Arrow node hover event:", { position, isHovering });
    e.stopPropagation();
    setIsArrowNodeHovered(isHovering);

    if (isHovering) {
      console.log("2. Setting hovered edge:", position);
      setHoveredEdge(position);
    } else {
      console.log("3. Clearing hovered edge");
      setHoveredEdge(null);
    }
  };

  // isDrawing 상태를 컴포넌트 최상단으로 이동
  const isDrawing = useSelector((state: RootState) => state.arrow.isDrawing);

  // arrow node click 핸들러 수정
  const handleArrowNodeClick = (
    e: React.MouseEvent,
    position: EdgePosition
  ) => {
    console.log("1. Arrow node clicked", { position });
    if (!isArrowMode) {
      console.log("2. Not in arrow mode, ignoring click");
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    // 위젯의 중심점 계산
    const centerX = widget.x + (widget.width || 0) / 2;
    const centerY = widget.y + (widget.height || 0) / 2;

    // 클릭한 위치에 따른 점 조정
    let point;
    switch (position) {
      case "n":
        point = { x: centerX, y: widget.y, widgetId: widget.id };
        break;
      case "s":
        point = {
          x: centerX,
          y: widget.y + (widget.height || 0),
          widgetId: widget.id,
        };
        break;
      case "w":
        point = { x: widget.x, y: centerY, widgetId: widget.id };
        break;
      case "e":
        point = {
          x: widget.x + (widget.width || 0),
          y: centerY,
          widgetId: widget.id,
        };
        break;
      default:
        console.log("Invalid position:", position);
        return;
    }

    if (!isDrawing) {
      // 시작점 설정
      console.log("3. Setting arrow start point:", point);
      dispatch(setArrowStartPoint(point));
      dispatch(setIsDrawing(true));
    } else {
      // 끝점 설정
      console.log("4. Setting arrow end point:", point);
      dispatch(setArrowEndPoint(point));
      dispatch(setIsDrawing(false));
    }
  };

  const renderInnerWidget = () => {
    switch (widget.innerWidget.type) {
      case "text":
        return (
          <WidgetText
            {...widget.innerWidget}
            editable={editable ? isEditMode : false}
            autoFocus={isEditMode}
            onHeightChange={handleHeightChange}
          />
        );
      case "section":
        const sectionWidget = {
          ...widget,
          type: "section" as const,
          innerWidget: {
            ...widget.innerWidget,
            type: "section" as const,
            fill: widget.innerWidget.fill || "rgba(200, 200, 200, 0.2)",
            memberIds: (widget.innerWidget as SectionWidget).memberIds || [],
          },
        } satisfies ShellWidgetProps<SectionWidget>;

        return (
          <WidgetSection
            widget={sectionWidget}
            isSelected={isSelected}
            onSelect={() => dispatch(setSelectedWidget(widget.id))}
            onChange={(newAttrs) => {
              dispatch(
                updateWidget({
                  ...widget,
                  ...newAttrs,
                })
              );
            }}
            shapes={widgets}
            updateShapes={(newShapes) => {
              newShapes.forEach((shape) => {
                dispatch(updateWidget(shape));
              });
            }}
            scale={scale}
            offset={offset}
          />
        );

      case "boardLink":
        return (
          <div className="flex flex-col h-full">
            {headerBar && (
              <h2 className="text-xl font-semibold text-center">
                {widget.innerWidget.titleBlock}
              </h2>
            )}

            <div className="flex-grow p-4">
              <WidgetBoard
                {...widget.innerWidget}
                editable={false}
                autoFocus={false}
                onHeightChange={handleHeightChange}
                fontSize={16}
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // 드래그 핸들러
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isEditMode && draggable && !isArrowNodeHovered) {
      e.preventDefault();
      e.stopPropagation();
      if (
        e.target instanceof HTMLElement &&
        e.target.classList.contains("resize-handle") &&
        resizeable
      ) {
        setIsResizing(true);
        setResizeDirection(e.target.classList[1]); // nw, ne, sw, se
      } else {
        setIsDragging(true);
      }
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging && !isResizing) return;
    e.preventDefault();
    e.stopPropagation();

    if (isDragging) {
      const { x: snappedX, y: snappedY } = snapWidgetPosition(
        e.clientX - dragStart.x + widget.x * scale,
        e.clientY - dragStart.y + widget.y * scale,
        scale
      );

      const dx = snappedX / scale - widget.x;
      const dy = snappedY / scale - widget.y;

      if (isSection(widget.innerWidget)) {
        // 섹션 이동 시 멤버들도 함께 이동
        const updatedShapes = updateSectionAndMembers(widget, dx, dy, widgets);
        updatedShapes.forEach((shape) => {
          dispatch(updateWidget(shape));
        });
      } // 객체를 드래그하는 경우
      else {
        const newX = snappedX / scale;
        const newY = snappedY / scale;

        // 현재 객체의 포함 관계를 즉시 업데이트
        widgets.forEach((otherWidget) => {
          if (
            isSection(otherWidget.innerWidget) &&
            otherWidget.id !== widget.id
          ) {
            const isCurrentlyMember =
              otherWidget.innerWidget.memberIds.includes(widget.id);
            const isNowContained = isCompletelyContained(
              { ...widget, x: newX, y: newY },
              otherWidget
            );

            if (isNowContained && !isCurrentlyMember) {
              // 객체가 섹션 내부에 있고, 현재 멤버가 아니라면 추가
              dispatch(
                updateWidget({
                  ...otherWidget,
                  innerWidget: {
                    ...otherWidget.innerWidget,
                    memberIds: [
                      ...otherWidget.innerWidget.memberIds,
                      widget.id,
                    ],
                  },
                })
              );
            } else if (!isNowContained && isCurrentlyMember) {
              // 객체가 섹션 내부에 없고, 현재 멤버라면 제거
              dispatch(
                updateWidget({
                  ...otherWidget,
                  innerWidget: {
                    ...otherWidget.innerWidget,
                    memberIds: otherWidget.innerWidget.memberIds.filter(
                      (id) => id !== widget.id
                    ),
                  },
                })
              );
            }
          }
        });

        // 객체 위치 업데이트
        dispatch(
          updateWidget({
            ...widget,
            x: newX,
            y: newY,
          })
        );
      }
    } else if (isResizing) {
      // 기존 크기 조절 로직 유지
      // 섹션 크기 조절 시 멤버들의 위치와 크기도 업데이트 필요
      if (isSection(widget.innerWidget)) {
        const newPositions = snapWidgetResize(
          resizeDirection!,
          dragStart,
          { x: e.clientX, y: e.clientY },
          widget,
          scale,
          isNodeWidget ? 8 : 0
        );

        const updatedShapes = updateSectionResize(
          widget,
          newPositions.width,
          newPositions.height,
          newPositions.x,
          newPositions.y,
          widgets
        );

        updatedShapes.forEach((shape) => {
          dispatch(updateWidget(shape));
        });
      } else {
        // 일반 위젯의 크기 조절
        const newPositions = snapWidgetResize(
          resizeDirection!,
          dragStart,
          { x: e.clientX, y: e.clientY },
          widget,
          scale,
          isNodeWidget ? 8 : 0
        );

        dispatch(
          updateWidget({
            ...widget,
            ...newPositions,
          })
        );
      }
    }

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeDirection(null);
  };

  // 더블클릭 핸들러 추가
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (widget.innerWidget.type === "text") {
      dispatch(setEditModeWidgets(widget.id));
      dispatch(setSelectedWidget(null));
    }
  };

  // 키보드 삭제 이벤트
  const handleKeyDown = (e: KeyboardEvent) => {
    if (isEditMode) return;
    if (isSelected && (e.key === "Delete" || e.key === "Backspace")) {
      dispatch(deleteWidget(widget.id));
    }
  };

  // 타입 가드 헬퍼 함수
  const isNodeWidgetType = (type: string): type is NodeWidgetType => {
    return NODE_WIDGET_TYPES.includes(type as NodeWidgetType);
  };

  // 호버 이벤트 핸들러
  const handleEdgeHover = (position: EdgePosition) => {
    setHoveredEdge(position);
    console.log(`Hovered edge: ${position}`); // 디버깅용
  };

  return (
    <div
      className="widget-shell group"
      style={{
        position: "absolute",
        zIndex: widget.innerWidget.type === "section" ? 1 : 2,
        padding: "4px",
        margin: isNodeWidget ? `${4 * scale}px` : "0",
        left: `${(widget.x + offset.x) * scale}px`, // offset을 더한 후 scale 적용
        top: `${(widget.y + offset.y) * scale}px`, // offset을 더한 후 scale 적용
        width: `${widget.width}px`,
        height: `${widget.height}px`,
        transform: `scale(${scale})`,
        transformOrigin: "0 0",
        backgroundColor:
          widget.innerWidget.type === "section"
            ? "rgba(200, 200, 200, 0.2)"
            : "white",
        opacity: widget.innerWidget.type === "section" ? 0.8 : 1,
        border: `2px solid ${
          isEditMode
            ? "black"
            : isSelected
            ? "#BBDEFB"
            : isArrowMode
            ? "#F1F5F9"
            : "#e0e0e0"
        }`,
        outline: `${
          isEditMode
            ? "2px solid black"
            : isSelected
            ? "2px solid #BBDEFB"
            : "none"
        }`,
        outlineOffset: "0px", // 음수 값을 주면 안쪽으로 들어갑니다
        borderRadius: "4px",
        // overflow: 'hidden',
      }}
      onClick={() => dispatch(setSelectedWidget(widget.id))}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {headerBar && (
        <div className="transition-opacity duration-200 hover:bg-gray-100 header-bar opacity-0 group-hover:opacity-100">
          <div className="flex items-center">
            <Button
              size="icon"
              className=" rounded-none p-2 bg-white"
              onClick={() => console.log("clicked")}
            >
              <SvgIcon
                fill="none"
                width={8}
                height={9}
                className="flex items-center justify-center"
              >
                {chevronDownSvg8px}
              </SvgIcon>
            </Button>
            <Button size="icon" className=" rounded-none p-2 bg-white">
              <SvgIcon
                fill="none"
                width={8}
                height={9}
                className="flex items-center justify-center"
              >
                {wideFrameSvg8px}
              </SvgIcon>
            </Button>
          </div>
          <div className="flex items-center">
            <Button size="icon" className=" rounded-none p-2 bg-white">
              <SvgIcon
                fill="none"
                width={8}
                height={9}
                className="flex items-center justify-center text-black"
              >
                {arrowModeSvg}
              </SvgIcon>
            </Button>
            <Button size="icon" className=" rounded-none p-2 bg-white">
              <Info className="text-black" />
            </Button>
            <Button size="icon" className=" rounded-none p-2 bg-white">
              <Ellipsis className="text-black" />
            </Button>
          </div>
        </div>
      )}

      {renderInnerWidget()}
      {footerBar && (
        <div className="footer-bar">
          <div className="flex items-center justify-between space-x-1  h-full pl-4">
            <div className="text-[12px] text-muted-foreground">v 3.26</div>
            <div className="w-[2px] h-[2px] bg-muted-foreground rounded-full" />
            <div className="text-[12px] text-muted-foreground">24.08.17</div>
            <div className="w-[2px] h-[2px] bg-muted-foreground rounded-full" />
            <div className="text-[12px] text-muted-foreground">08:28</div>
          </div>
          <div className="flex items-center">
            <Button size="icon" className=" rounded-none p-2 bg-white">
              <SvgIcon
                fill="none"
                width={8}
                height={9}
                className="flex items-center justify-center text-black"
              >
                {sixBoltSvg}
              </SvgIcon>
            </Button>
            <Button size="icon" className=" rounded-none p-2 bg-white">
              <SvgIcon
                fill="none"
                width={8}
                height={9}
                className="flex items-center justify-center text-black"
              >
                {pauseSvg}
              </SvgIcon>
            </Button>
            <Button size="icon" className=" rounded-none p-2 bg-white">
              <SvgIcon
                fill="none"
                width={8}
                height={9}
                className="flex items-center justify-center text-black"
              >
                {recordSvg}
              </SvgIcon>
            </Button>
          </div>
        </div>
      )}
      {/* {isSelected && (
        
      )} */}
      <>
        <div className="resize-handle nw" style={getHandleStyle("nw")} />
        <div className="resize-handle ne" style={getHandleStyle("ne")} />
        <div className="resize-handle sw" style={getHandleStyle("sw")} />
        <div className="resize-handle se" style={getHandleStyle("se")} />
        <div
          className="resize-handle n"
          style={getHandleStyle("n")}
          onMouseEnter={() => handleEdgeHover("n")}
          onMouseLeave={() => handleEdgeHover(null)}
        />
        <div
          className="resize-handle s"
          style={getHandleStyle("s")}
          onMouseEnter={() => handleEdgeHover("s")}
          onMouseLeave={() => handleEdgeHover(null)}
        />
        <div
          className="resize-handle w"
          style={getHandleStyle("w")}
          onMouseEnter={() => handleEdgeHover("w")}
          onMouseLeave={() => handleEdgeHover(null)}
        />
        <div
          className="resize-handle e"
          style={getHandleStyle("e")}
          onMouseEnter={() => handleEdgeHover("e")}
          onMouseLeave={() => handleEdgeHover(null)}
        />
      </>
      <div
        className="arrow-node-container"
        style={{ pointerEvents: isArrowMode ? "all" : "none" }}
      >
        {isArrowMode && (
          <>
            <div
              className="arrow-node n"
              style={setArrowNodeStyle("n")}
              onMouseEnter={(e) => handleArrowNodeHover("n", true, e)}
              onMouseLeave={(e) => handleArrowNodeHover("n", false, e)}
              onClick={(e) => {
                console.log("North node clicked");
                handleArrowNodeClick(e, "n");
              }}
              onMouseDown={(e) => e.stopPropagation()}
            />
            <div
              className="arrow-node s"
              style={setArrowNodeStyle("s")}
              onMouseEnter={(e) => handleArrowNodeHover("s", true, e)}
              onMouseLeave={(e) => handleArrowNodeHover("s", false, e)}
              onClick={(e) => handleArrowNodeClick(e, "s")}
              onMouseDown={(e) => e.stopPropagation()}
            />
            <div
              className="arrow-node w"
              style={setArrowNodeStyle("w")}
              onMouseEnter={(e) => handleArrowNodeHover("w", true, e)}
              onMouseLeave={(e) => handleArrowNodeHover("w", false, e)}
              onClick={(e) => handleArrowNodeClick(e, "w")}
              onMouseDown={(e) => e.stopPropagation()}
            />
            <div
              className="arrow-node e"
              style={setArrowNodeStyle("e")}
              onMouseEnter={(e) => handleArrowNodeHover("e", true, e)}
              onMouseLeave={(e) => handleArrowNodeHover("e", false, e)}
              onClick={(e) => handleArrowNodeClick(e, "e")}
              onMouseDown={(e) => e.stopPropagation()}
            />
          </>
        )}
      </div>
    </div>
  );
}
