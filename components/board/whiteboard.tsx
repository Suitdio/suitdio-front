"use client";
import { Action, UnknownAction, Store, Dispatch } from "redux";
import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  Type,
  AppWindowMacIcon,
  MousePointer2,
  MoveRight,
  File,
  Search,
  RefreshCw,
  Shapes,
  Disc2,
  Tornado,
  Boxes,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import {
  addWidget,
  setSelectedWidget,
  setEditModeWidgets,
  updateArrowEndpoints,
  setWidgets,
  updateWidget,
} from "@/lib/redux/features/whiteboardSlice";
import {
  ShellWidgetProps,
  AllWidgetTypes,
  AllWidgetType,
  TextWidget,
  SectionWidget,
  isArrow,
  ArrowWidget,
  EdgePosition,
} from "@/lib/type";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import WidgetShell from "../widget/widgetShell";
import SvgIcon from "@/lib/utils/svgIcon";
import { sectionSvg } from "@/lib/utils/svgBag";
import { HiOutlineSparkles } from "react-icons/hi2";
import { Separator } from "../ui/separator";
import { createTextNode } from "@/lib/utils/textNodeCreator";
import BrainstormInput from "../widget/widgetBrainstorm";
import CreateBoardDialog from "../ui/creatboard";
import {
  setIsArrowMode,
  updateArrowPositions,
  addArrow,
  updateArrow,
  setArrowEndPoint,
} from "@/lib/redux/features/arrowSlice";
import {
  getConnectorPoints,
  getClosestSidePoint,
  findClosestWidgetAtPoint,
} from "@/lib/utils/arrowutils/arrowPath";
import ArrowR from "@/components/ui/arrow/arrowR";

// 기본 그리드 설정
let baseSpacing = 48; // 기본 간격
let basePointSize = 4; // 기본 점 크기

export const FONT_SIZE = 16;
export const RESIZE_HANDLE_SIZE = 8;
export const ZOOM_SPEED = 0.001; // 줌 속도 조절 상수

export default function Whiteboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const widgets = useSelector(
    (state: RootState) => state.whiteboard.widgets
  ) as ShellWidgetProps<AllWidgetTypes>[];

  const dispatch = useDispatch();
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [tool, setTool] = useState<"select" | AllWidgetType>("select");
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [spacePressed, setSpacePressed] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [isBrainstormActive, setIsBrainstormActive] = useState(false); // 브레인스톰 상태 추가
  const [contentTitle, setContentTitle] = useState(""); // contentTitle 상태 추가
  const [dialogOpen, setDialogOpen] = useState(false); // 다이얼로그 상태 추가
  const [isDrawingArrow, setIsDrawingArrow] = useState(false); //화살표
  const [tempArrow, setTempArrow] = useState<ArrowWidget | null>(null); // 화살표
  const [startObject, setStartObject] = // 화살표 시작 위젯
    useState<ShellWidgetProps<AllWidgetTypes> | null>(null);
  const [boardPosition, setBoardPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isBoardPlacementMode, setIsBoardPlacementMode] = useState(false);

  const lastUpdate = useSelector((state: RootState) => state.arrow.lastUpdate);
  // 섹션 드래그 상태 추가
  const [sectionDraft, setSectionDraft] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  // 입력 변경 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContentTitle(e.target.value);
  };

  const selectedWidget = useSelector(
    (state: RootState) => state.whiteboard.selectedWidget
  );

  // Screen 좌표 기준의 마우스 위치를 저장
  const [mousePosition, setMousePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const isArrowMode = useSelector(
    (state: RootState) => state.arrow.isArrowMode
  );

  const containerRef = useRef<HTMLDivElement>(null);

  // 스페이스바 누르면 드래그 모드, 떼면 드래그 모드 종료
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !spacePressed) {
        setSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setSpacePressed(false);
        setIsPanning(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [spacePressed]);

  //20px을 기준으로 그리드 그리기
  const drawGrid = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      ctx.save();

      // 줌 레벨에 따른 그리드 간격과 점 크기 조정
      if (scale < 0.3) {
        baseSpacing = 60;
        basePointSize = 4;
      } else {
        baseSpacing = 48;
      }

      ctx.strokeStyle = "#DBDBDB";
      ctx.lineWidth = basePointSize;

      // 화면에 보이는 영역의 좌표 계산
      const canvas = canvasRef.current;
      if (!canvas) return;

      const visibleStartX = -offset.x;
      const visibleEndX = canvas.width / scale - offset.x;
      const visibleStartY = -offset.y;
      const visibleEndY = canvas.height / scale - offset.y;

      // 그리드 시작점을 간격에 맞춰 조정
      const startX = Math.floor(visibleStartX / baseSpacing) * baseSpacing;
      const startY = Math.floor(visibleStartY / baseSpacing) * baseSpacing;

      // 화면에 보이는 영역만 그리드 그리기
      for (let x = startX; x < visibleEndX; x += baseSpacing) {
        for (let y = startY; y < visibleEndY; y += baseSpacing) {
          ctx.beginPath();
          ctx.arc(x, y, basePointSize * 0.25, 0, 2 * Math.PI);
          ctx.stroke();
        }
      }
      ctx.restore();
    },
    [offset, scale]
  );

  //브라우저 줌 이벤트 방지
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventDefault = (e: WheelEvent) => {
      e.preventDefault();
    };

    container.addEventListener("wheel", preventDefault, { passive: false });

    return () => {
      container.removeEventListener("wheel", preventDefault);
    };
  }, []);

  //arrow 모드 종료 시 선택된 위젯 초기화
  useEffect(() => {
    dispatch(setSelectedWidget(null));
  }, [isArrowMode]);

  // window 좌표 기준의 마우스 위치 기준으로 줌인, 줌아웃 구현
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isZooming) {
        setMousePosition({ x: e.clientX, y: e.clientY });
      }
    };

    const handleGlobalWheel = (e: WheelEvent) => {
      if (e.metaKey || e.ctrlKey) {
        e.preventDefault();

        // 줌 시작 시 상태 설정
        if (!isZooming) {
          setIsZooming(true);
          setMousePosition({ x: e.clientX, y: e.clientY });
        }

        const delta = e.deltaY;
        const zoomFactor = Math.exp(-delta * ZOOM_SPEED);
        const newScale = Math.min(Math.max(scale * zoomFactor, 0.1), 5);

        if (mousePosition) {
          const rect = containerRef.current?.getBoundingClientRect();
          if (!rect) return;

          // Screen 좌표서 컨테이너의 상대적 위치 계산
          const pointX = (mousePosition.x - rect.left) / scale;
          const pointY = (mousePosition.y - rect.top) / scale;

          // 새로운 오프셋 계산
          const newOffset = {
            x: offset.x + (pointX * (scale - newScale)) / newScale,
            y: offset.y + (pointY * (scale - newScale)) / newScale,
          };

          setScale(newScale);
          setOffset(newOffset);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Meta" || e.key === "Control") {
        setIsZooming(false);
        setMousePosition(null);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("wheel", handleGlobalWheel, { passive: false });
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("wheel", handleGlobalWheel);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [scale, offset, isZooming, mousePosition]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(scale, scale);
    ctx.translate(offset.x, offset.y);

    drawGrid(ctx);

    // 섹션 드래프트 그리기
    if (sectionDraft) {
      ctx.fillStyle = "rgba(200, 200, 200, 0.2)";
      ctx.strokeStyle = "#00A3FF";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(
        sectionDraft.x,
        sectionDraft.y,
        sectionDraft.width,
        sectionDraft.height
      );
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }, [scale, offset, sectionDraft]);

  useEffect(() => {
    redraw();
  }, [scale, offset, redraw]);

  //마우스를 다운을 트리거로 위젯 생성, 선택, 드래그 모드 설정
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (spacePressed) {
      setIsPanning(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - offset.x * scale) / scale;
    const y = (e.clientY - rect.top - offset.y * scale) / scale;

    if (tool === "select" || tool === "brainStorm") {
      dispatch(setSelectedWidget(null));
      dispatch(setEditModeWidgets(null));
      // 보드 생성 모드일 때
    } else if (tool === "boardLink" && isBoardPlacementMode) {
      const position = {
        x: Math.round(x / baseSpacing) * baseSpacing,
        y: Math.round(y / baseSpacing) * baseSpacing,
      };
      setBoardPosition(position);
      setDialogOpen(true);
      setIsBoardPlacementMode(false);
      setTool("select");
      return;
    } else if (tool === "section") {
      const startPos = {
        x: Math.round(x / baseSpacing) * baseSpacing,
        y: Math.round(y / baseSpacing) * baseSpacing,
      };
      setDragStart(startPos);
      setSectionDraft({
        x: startPos.x,
        y: startPos.y,
        width: 0,
        height: 0,
      });
    } else {
      let innerWidget: AllWidgetTypes;
      // tool 타입에 따른 innerWidget 설정
      switch (tool) {
        case "text":
          innerWidget = {
            id: Date.now().toString(),
            type: "text",
            text: JSON.stringify([
              {
                type: "paragraph",
                content: "New Text",
              },
            ]),
            fontSize: FONT_SIZE,
            x: Math.round(x / baseSpacing) * baseSpacing,
            y: Math.round(y / baseSpacing) * baseSpacing,
            draggable: true,
            editable: true,
            resizeable: true,
            headerBar: true,
            footerBar: false,
          };
          break;

        default:
          return;
      }

      // 공통 shell 위젯 생성
      const newWidget: ShellWidgetProps<AllWidgetTypes> = {
        id: Date.now().toString(),
        type: tool,
        x: Math.round(x / baseSpacing) * baseSpacing,
        y: Math.round(y / baseSpacing) * baseSpacing,
        width: 472,
        height: 184,
        resizable: true,
        editable: true,
        draggable: true,
        innerWidget,
      };

      dispatch(addWidget(newWidget));
      dispatch(setSelectedWidget(newWidget.id));
      setTool("select");
    }
    redraw();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isPanning) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setOffset((prev) => ({
        x: prev.x + dx / scale,
        y: prev.y + dy / scale,
      }));
      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }

    if (tool === "section" && sectionDraft) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const currentX = (e.clientX - rect.left - offset.x * scale) / scale;
      const currentY = (e.clientY - rect.top - offset.y * scale) / scale;

      const width = Math.abs(currentX - dragStart.x);
      const height = Math.abs(currentY - dragStart.y);
      const sectionX = Math.min(currentX, dragStart.x);
      const sectionY = Math.min(currentY, dragStart.y);

      setSectionDraft({
        x: Math.round(sectionX / baseSpacing) * baseSpacing,
        y: Math.round(sectionY / baseSpacing) * baseSpacing,
        width: Math.round(width / baseSpacing) * baseSpacing,
        height: Math.round(height / baseSpacing) * baseSpacing,
      });
      redraw();
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === "section" && sectionDraft) {
      if (sectionDraft.width > 0 && sectionDraft.height > 0) {
        const innerWidget: SectionWidget = {
          id: Date.now().toString(),
          type: "section",
          x: sectionDraft.x,
          y: sectionDraft.y,
          width: sectionDraft.width,
          height: sectionDraft.height,
          fill: "rgba(200, 200, 200, 0.2)",
          memberIds: [],
          draggable: true,
          editable: false,
          resizeable: true,
          headerBar: false,
          footerBar: false,
        };

        const newWidget: ShellWidgetProps<AllWidgetTypes> = {
          id: Date.now().toString(),
          type: "section",
          x: sectionDraft.x,
          y: sectionDraft.y,
          width: sectionDraft.width,
          height: sectionDraft.height,
          resizable: true,
          editable: true,
          draggable: true,
          innerWidget,
        };

        dispatch(addWidget(newWidget));
      }
      setSectionDraft(null);
      setTool("select");
    }
    setIsPanning(false);
  };

  // const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
  //   e.preventDefault();
  //   e.stopPropagation();

  //   // Command(Mac) 또는 Ctrl(Windows) 키가 눌려있을 때만 줌 동작
  //   if (e.metaKey || e.ctrlKey) {
  //     const delta = e.deltaY;
  //     const zoomFactor = Math.exp(-delta * ZOOM_SPEED);
  //     const newScale = Math.min(Math.max(scale * zoomFactor, 0.1), 5);

  //     // 마우스 포인터 위치 (뷰포트 좌표)
  //     const mouseX = e.clientX;
  //     const mouseY = e.clientY;

  //     // 컨테이너의 위치 정보
  //     const rect = containerRef.current?.getBoundingClientRect();
  //     if (!rect) return;

  //     // 마우스 포인터의 캔버스상 좌표
  //     const pointX = (mouseX - rect.left) / scale - offset.x;
  //     const pointY = (mouseY - rect.top) / scale - offset.y;

  //     // 새로운 오프셋 계산
  //     const newOffset = {
  //       x: offset.x - pointX * (newScale - scale),
  //       y: offset.y - pointY * (newScale - scale),
  //     };

  //     setScale(newScale);
  //     setOffset(newOffset);
  //   }
  // };

  //Brainstorm  브레인 스톰
  // 기존 텍스트 위젯만 필터링하는 함수 추가
  const getTextWidgets = (
    widgets: ShellWidgetProps<AllWidgetTypes>[]
  ): TextWidget[] => {
    return widgets
      .filter(
        (widget): widget is ShellWidgetProps<TextWidget> =>
          widget.innerWidget.type === "text"
      )
      .map((widget) => widget.innerWidget);
  };

  // handleCreateTextNode 함수 수정
  const handleCreateTextNode = (text: string) => {
    const container = containerRef.current;
    if (!container) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const textWidgets = getTextWidgets(widgets);

    const newNode = createTextNode(
      text,
      containerWidth,
      containerHeight,
      textWidgets,
      widgets.length,
      scale,
      offset
    );

    // 새로운 위젯을 추가
    const newWidget: ShellWidgetProps<AllWidgetTypes> = {
      id: Date.now().toString(),
      type: "text",
      x: newNode.x,
      y: newNode.y,
      width: 200,
      height: 500,
      resizable: true,
      editable: true,
      draggable: true,
      innerWidget: newNode,
    };

    dispatch(addWidget(newWidget));
    // dispatch(setSelectedWidget(newWidget.id));  // 브레인 스톰 모드에서 text 위젯 생성시 선택
  };

  // 저장 클릭 핸들러 수정
  const handleSaveClick = useCallback(
    (e?: React.MouseEvent<HTMLButtonElement>) => {
      e?.preventDefault();

      if (!boardPosition || !contentTitle.trim()) {
        return;
      }

      // 제목과 내용을 분리
      const initialText = JSON.stringify([
        {
          type: "paragraph",
          content: "", // 내용은 빈 문자열로 초기화
        },
      ]);

      const newBoard: ShellWidgetProps<AllWidgetTypes> = {
        id: `board-${widgets.length + 1}`,
        type: "boardLink",
        x: boardPosition.x,
        y: boardPosition.y,
        width: 500,
        height: 300,
        resizable: true,
        editable: true,
        draggable: true,
        innerWidget: {
          id: `board-inner-${widgets.length + 1}`,
          type: "boardLink",
          titleBlock: contentTitle, // 제목은 contentTitle 사용
          width: 500,
          height: 300,
          x: boardPosition.x,
          y: boardPosition.y,
          draggable: true,
          editable: true,
          resizeable: true,
          headerBar: true,
          footerBar: true,
          text: initialText, // 내용은 빈 텍스트로 초기화
        },
      };

      dispatch(addWidget(newBoard));

      setDialogOpen(false);
      setContentTitle("");
      setBoardPosition(null);
    },
    [boardPosition, contentTitle, widgets, dispatch]
  );

  // 보드 생성 버튼 클릭 핸들러 수정
  const handleAddBoard = useCallback(() => {
    setIsBoardPlacementMode(true); // 보드 배치 모드 활성화
  }, []);

  const handleZoomIn = () => {
    setScale((prevScale) => Math.min(prevScale + 0.1, 5));
  };

  const handleZoomOut = () => {
    setScale((prevScale) => Math.max(prevScale - 0.1, 0.1));
  };

  //화살표 시작
  // 화살표 생성 모드 활성화
  const handleArrowToolClick = () => {
    dispatch(setIsArrowMode(true));
  };

  const updateArrows = useCallback(
    (widget: ArrowWidget) => {
      const fromWidget = widgets.find((w) => w.id === widget.from);
      const toWidget = widgets.find((w) => w.id === widget.to);

      if (fromWidget && toWidget) {
        const result = getConnectorPoints(
          fromWidget.innerWidget,
          toWidget.innerWidget
        );
        return {
          ...widget,
          points: result.points,
          arrowTipX: result.arrowTipX,
          arrowTipY: result.arrowTipY,
        };
      }
      return widget;
    },
    [dispatch, widgets]
  );

  // lastUpdate 변경될 때마다 화살표 업데이트
  useEffect(() => {
    if (lastUpdate) {
      const { movedShapeId, shapes: updatedShapes } = lastUpdate;

      // 기존 위젯들을 유지하면서 업데이트된 위젯들만 추가/수정
      const existingWidgets = widgets.filter(
        (w) => !updatedShapes.some((us) => us.id === w.id)
      );

      const newWidgets = [...existingWidgets, ...updatedShapes];
      dispatch(setWidgets(newWidgets));
    }
  }, [lastUpdate, dispatch]);

  // 화살표 (빨간원) 점(from, to) 드래그 함수
  const handleArrowDragMove = useCallback(
    (id: string, x: number, y: number, type: "from" | "to") => {
      const currentArrow = widgets.find((w) => w.id === id);
      if (!currentArrow || !isArrow(currentArrow.innerWidget)) return;

      const otherWidgets = widgets.filter((s) => {
        if (isArrow(currentArrow.innerWidget)) {
          return (
            s.id !== currentArrow.innerWidget.from &&
            s.id !== currentArrow.innerWidget.to &&
            !isArrow(s.innerWidget)
          );
        }
        return false;
      });

      // 타입 단언을 사용하여 타입 호환성 문제 해결
      const closestWidget = findClosestWidgetAtPoint(
        x,
        y,
        otherWidgets.map((w) => ({
          ...w.innerWidget,
          resizeable: true,
          headerBar: false,
          footerBar: false,
        })) as AllWidgetTypes[]
      );

      let finalPoint = { x, y };
      if (closestWidget) {
        finalPoint = getClosestSidePoint(closestWidget as AllWidgetTypes, x, y);
      }

      const updatedWidgets = widgets.map((widget) => {
        if (widget.id === id && isArrow(widget.innerWidget)) {
          const points = [...widget.innerWidget.points];
          if (type === "from") {
            points[0] = finalPoint.x;
            points[1] = finalPoint.y;
          } else {
            points[points.length - 2] = finalPoint.x;
            points[points.length - 1] = finalPoint.y;
            return {
              ...widget,
              innerWidget: {
                ...widget.innerWidget,
                points,
                arrowTipX: finalPoint.x,
                arrowTipY: finalPoint.y,
              },
            };
          }
          return {
            ...widget,
            innerWidget: {
              ...widget.innerWidget,
              points,
            },
          };
        }
        return widget;
      });

      dispatch(setWidgets(updatedWidgets));

      if (closestWidget && "id" in closestWidget) {
        // widgetId가 undefined가 아닌 경우에만 dispatch
        const widgetId = closestWidget.id;
        if (widgetId) {
          dispatch(
            updateArrowEndpoints({
              arrowId: id,
              type,
              widgetId,
            })
          );
        }
      }
    },
    [widgets, dispatch]
  );

  // 타입 가드 함수 수정
  const isAllWidgetTypes = (
    widget: ShellWidgetProps<AllWidgetTypes>
  ): widget is ShellWidgetProps<AllWidgetTypes> => {
    return (
      widget.innerWidget.type === "text" ||
      widget.innerWidget.type === "section" ||
      widget.innerWidget.type === "image" ||
      widget.innerWidget.type === "pdf" ||
      widget.innerWidget.type === "url" ||
      widget.innerWidget.type === "boardLink"
    );
  };
  //화살표 끝

  // Arrow 버튼 클릭 핸들러 수정
  const handleArrowButtonClick = () => {
    console.log("11. Arrow button clicked");
    dispatch(setIsArrowMode(true));
    setTool("arrow");
    console.log("12. Arrow mode activated");
  };

  // Arrow 그리기 시작
  const handleArrowStart = useCallback(
    (e: MouseEvent, targetObject: ShellWidgetProps<AllWidgetTypes>) => {
      console.log("10. Starting arrow drawing from:", targetObject);
      if (!isArrowMode) {
        console.log("Arrow mode is not active, returning");
        return;
      }

      console.log("3. Target object for arrow start:", targetObject);
      const point = getClosestSidePoint(
        targetObject.innerWidget,
        e.clientX,
        e.clientY
      );
      console.log("4. Calculated start point:", point);

      const newArrow: ArrowWidget = {
        id: `arrow-${Date.now()}`,
        type: "arrow",
        from: targetObject.id,
        to: "",
        points: [point.x, point.y, e.clientX, e.clientY],
        arrowTipX: e.clientX,
        arrowTipY: e.clientY,
        arrowHeads: { left: false, right: true },
      };

      console.log("5. Created new arrow:", newArrow);
      setIsDrawingArrow(true);
      setTempArrow(newArrow);
      setStartObject(targetObject);
    },
    [isArrowMode]
  );

  // Arrow 드래그 중
  const handleArrowDrag = useCallback(
    (e: MouseEvent) => {
      if (!isDrawingArrow || !tempArrow) {
        console.log("Not in drawing state or no temp arrow");
        return;
      }

      console.log("6. Dragging arrow");
      const mousePoint = { x: e.clientX, y: e.clientY };
      console.log("7. Mouse position:", mousePoint);

      const updatedPoints = [
        tempArrow.points[0],
        tempArrow.points[1],
        mousePoint.x,
        mousePoint.y,
      ];

      console.log("10. Updated arrow points:", updatedPoints);
      setTempArrow({
        ...tempArrow,
        points: updatedPoints,
        arrowTipX: mousePoint.x,
        arrowTipY: mousePoint.y,
      });
    },
    [isDrawingArrow, tempArrow]
  );

  // Arrow 그리기 완료
  const handleArrowComplete = useCallback(
    (e: MouseEvent) => {
      if (!isDrawingArrow || !tempArrow || !startObject) {
        console.log("Cannot complete arrow - missing required state");
        return;
      }

      console.log("11. Completing arrow drawing");
      const endObject = findClosestWidgetAtPoint(
        e.clientX,
        e.clientY,
        widgets.filter((w) => w.id !== startObject.id).map((w) => w.innerWidget)
      );

      if (endObject) {
        console.log("12. Found end object:", endObject);
        const finalPoints = getConnectorPoints(
          startObject.innerWidget,
          endObject
        ).points;
        console.log("13. Calculated final points:", finalPoints);

        // 화살표 완료 처리
        dispatch(
          setArrowEndPoint({
            x: finalPoints[finalPoints.length - 2],
            y: finalPoints[finalPoints.length - 1],
            widgetId: endObject.id,
          })
        );
        console.log("14. Arrow end point set");
      }

      setIsDrawingArrow(false);
      setTempArrow(null);
      setStartObject(null);
      console.log("15. Arrow drawing state reset");
    },
    [isDrawingArrow, tempArrow, startObject, widgets, dispatch]
  );

  // 마우스 이벤트 핸들러 수정
  useEffect(() => {
    if (isArrowMode) {
      window.addEventListener("mousemove", handleArrowDrag);
      window.addEventListener("mouseup", handleArrowComplete);
      return () => {
        window.removeEventListener("mousemove", handleArrowDrag);
        window.removeEventListener("mouseup", handleArrowComplete);
      };
    }
  }, [isArrowMode, handleArrowDrag, handleArrowComplete]);

  // 화살표 업데이트 핸들러
  const handleArrowUpdate = (
    arrow: ShellWidgetProps<ArrowWidget>,
    newAttrs: Partial<ArrowWidget>
  ) => {
    dispatch(
      updateWidget({
        ...arrow,
        innerWidget: {
          ...arrow.innerWidget,
          ...newAttrs,
        },
      })
    );
  };

  // Arrow 노드 클릭 핸들러
  const handleArrowNodeClick = useCallback(
    (
      position: EdgePosition,
      targetWidget: ShellWidgetProps<AllWidgetTypes>
    ) => {
      if (!isArrowMode) return;

      console.log("Current widgets before action:", widgets);
      console.log("Target widget:", targetWidget);

      const centerX = targetWidget.x + (targetWidget.width || 0) / 2;
      const centerY = targetWidget.y + (targetWidget.height || 0) / 2;

      let point;
      switch (position) {
        case "n":
          point = { x: centerX, y: targetWidget.y };
          break;
        case "s":
          point = {
            x: centerX,
            y: targetWidget.y + (targetWidget.height || 0),
          };
          break;
        case "w":
          point = { x: targetWidget.x, y: centerY };
          break;
        case "e":
          point = { x: targetWidget.x + (targetWidget.width || 0), y: centerY };
          break;
        default:
          return;
      }

      if (!isDrawingArrow) {
        // 화살표 그리기 시작
        console.log("Starting arrow drawing from widget:", targetWidget.id);
        setIsDrawingArrow(true);
        const newArrow: ArrowWidget = {
          id: `temp-arrow-${Date.now()}`,
          type: "arrow",
          from: targetWidget.id,
          to: "",
          points: [point.x, point.y, point.x, point.y],
          arrowTipX: point.x,
          arrowTipY: point.y,
          arrowHeads: { left: false, right: true },
        };
        setTempArrow(newArrow);
        setStartObject(targetWidget);
      } else {
        // 화살표 그리기 완료
        if (startObject && tempArrow && startObject.id !== targetWidget.id) {
          const finalPoints = getConnectorPoints(
            startObject.innerWidget,
            targetWidget.innerWidget
          ).points;

          const newArrowWidget: ShellWidgetProps<ArrowWidget> = {
            id: `arrow-${Date.now()}`,
            type: "arrow",
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            resizable: false,
            editable: true,
            draggable: true,
            innerWidget: {
              ...tempArrow,
              id: `arrow-${Date.now()}`,
              to: targetWidget.id,
              points: finalPoints,
            },
          };

          // 기존 위젯들을 유지하면서 새 화살표 추가
          dispatch(addWidget(newArrowWidget));

          // 상태 초기화
          setIsDrawingArrow(false);
          setTempArrow(null);
          setStartObject(null);
          dispatch(setIsArrowMode(false));
        }
      }
    },
    [isArrowMode, isDrawingArrow, startObject, tempArrow, dispatch, widgets]
  );

  // 위젯 배열 변경 감지
  useEffect(() => {
    console.log("Widgets array updated:", widgets);
  }, [widgets]);

  // lastUpdate 효과 제거 (중복 렌더링 방지)
  useEffect(() => {
    if (lastUpdate && lastUpdate.shapes.length > 0) {
      // 이미 handleArrowNodeClick에서 화살표를 추가했으므로 여기서는 처리하지 않음
      return;
    }
  }, [lastUpdate]);

  // 위젯 이동 시 화살표 업데이트
  useEffect(() => {
    const updateArrowConnections = () => {
      // 모든 화살표 찾기
      const arrows = widgets.filter((w) => w.type === "arrow");

      // 업데이트가 필요한 화살표만 찾기
      const arrowsToUpdate = arrows.filter((arrow) => {
        const arrowWidget = arrow.innerWidget as ArrowWidget;
        const fromWidget = widgets.find((w) => w.id === arrowWidget.from);
        const toWidget = widgets.find((w) => w.id === arrowWidget.to);

        if (!fromWidget || !toWidget) return false;

        // 현재 연결점과 새로운 연결점 비교
        const result = getConnectorPoints(
          fromWidget.innerWidget,
          toWidget.innerWidget
        );
        const currentPoints = arrowWidget.points;

        return (
          result.points[0] !== currentPoints[0] ||
          result.points[1] !== currentPoints[1] ||
          result.points[2] !== currentPoints[2] ||
          result.points[3] !== currentPoints[3]
        );
      });

      // 변경이 필요한 화살표만 업데이트
      if (arrowsToUpdate.length > 0) {
        arrowsToUpdate.forEach((arrow) => {
          const arrowWidget = arrow.innerWidget as ArrowWidget;
          const fromWidget = widgets.find((w) => w.id === arrowWidget.from);
          const toWidget = widgets.find((w) => w.id === arrowWidget.to);

          if (fromWidget && toWidget) {
            const result = getConnectorPoints(
              fromWidget.innerWidget,
              toWidget.innerWidget
            );

            dispatch(
              updateArrow({
                arrowId: arrow.id,
                fromId: arrowWidget.from,
                toId: arrowWidget.to,
                points: result.points,
                arrowTipX: result.arrowTipX,
                arrowTipY: result.arrowTipY,
              })
            );
          }
        });
      }
    };

    // 위젯이 변경될 때마다 화살표 업데이트
    const timeoutId = setTimeout(updateArrowConnections, 0);
    return () => clearTimeout(timeoutId);
  }, [widgets, dispatch]);

  return (
    <div className="flex flex-col h-screen">
      {/* 툴바 */}
      {/* <div className='flex justify-between items-center p-4 bg-gray-100 border-b'>
        <div className='flex space-x-2'>
          <Button variant='outline' size='icon' onClick={handleZoomOut}>
            <ZoomOut className='h-4 w-4' />
            <span className='sr-only'>Zoom out</span>
          </Button>
          <Button variant='outline' size='icon' onClick={handleZoomIn}>
            <ZoomIn className='h-4 w-4' />
            <span className='sr-only'>Zoom in</span>
          </Button>
        </div>
      </div> */}
      <div className="left-1/2 fixed bottom-8 border -translate-x-1/2 border-muted rounded-lg p-1 bg-white z-50 shadow-md h-11">
        <div className="flex space-x-2 items-center">
          <Button
            variant={tool === "select" ? "toolSelect" : "white"}
            size="icon"
            onClick={() => setTool("select")}
          >
            <MousePointer2 className="h-4 w-4" />
            <span className="sr-only">Select tool</span>
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button
            variant={tool === "text" ? "toolSelect" : "white"}
            size="icon"
            onClick={() => setTool("text")}
          >
            <Type className="h-4 w-4" />
            <span className="sr-only">Text tool</span>
          </Button>
          <Button
            variant={tool === "arrow" ? "toolSelect" : "white"}
            size="icon"
            onClick={() => {
              setTool("arrow");
              handleArrowButtonClick();
            }}
          >
            <MoveRight className="h-4 w-4" />
            <span className="sr-only">Text tool</span>
          </Button>
          <Button
            variant={tool === "section" ? "toolSelect" : "white"}
            size="icon"
            onClick={() => setTool("section")}
            className="group"
          >
            <SvgIcon
              fill="none"
              width={16}
              height={16}
              className="flex items-center justify-center"
            >
              {sectionSvg({
                isActive: tool === "section",
                className: "group-hover:stroke-teal-500",
              })}
            </SvgIcon>
            <span className="sr-only">Text tool</span>
          </Button>
          <Button
            variant={tool === "boardLink" ? "toolSelect" : "white"}
            size="icon"
            onClick={() => {
              setTool("boardLink");
              handleAddBoard();
            }}
          >
            <Disc2 className="h-4 w-4" />
            <span className="sr-only">Text tool</span>
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button
            variant={tool === "brainStorm" ? "toolSelect" : "white"}
            size="icon"
            onClick={() => {
              setTool("brainStorm");
              setIsBrainstormActive((prev) => !prev);
            }}
          >
            <Tornado className="h-4 w-4" />
            <span className="sr-only">Text tool</span>
          </Button>
          <Button
            variant={tool === "mindmap" ? "toolSelect" : "white"}
            size="icon"
            onClick={() => setTool("mindmap")}
          >
            <Boxes className="h-4 w-4" />
            <span className="sr-only">Text tool</span>
          </Button>
          <Button
            variant={tool === "refresh" ? "toolSelect" : "white"}
            size="icon"
            onClick={() => setTool("refresh")}
            disabled
          >
            <RefreshCw className="h-4 w-4" />
            <span className="sr-only">Text tool</span>
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button
            variant={tool === "search" ? "toolSelect" : "white"}
            size="icon"
            onClick={() => setTool("search")}
          >
            <Search className="h-4 w-4" />
            <span className="sr-only">Text tool</span>
          </Button>
          <Button
            variant={tool === "upload" ? "toolSelect" : "white"}
            size="icon"
            onClick={() => setTool("upload")}
          >
            <File className="h-4 w-4" />
            <span className="sr-only">Text tool</span>
          </Button>
          <Button
            variant={tool === "url" ? "toolSelect" : "white"}
            size="icon"
            onClick={() => setTool("url")}
          >
            <AppWindowMacIcon className="h-4 w-4" />
            <span className="sr-only">Text tool</span>
          </Button>
          <Button
            variant={tool === "template" ? "toolSelect" : "white"}
            size="icon"
            onClick={() => setTool("template")}
          >
            <Shapes className="h-4 w-4" />
            <span className="sr-only">Text tool</span>
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button
            variant={tool === "aiSearch" ? "toolSelect" : "white"}
            size="icon"
            onClick={() => setTool("aiSearch")}
          >
            <HiOutlineSparkles className="h-4 w-4" />
            <span className="sr-only">Text tool</span>
          </Button>
        </div>
      </div>

      <div ref={containerRef} className="flex-grow overflow-hidden relative">
        <canvas
          ref={canvasRef}
          width={window.innerWidth}
          height={window.innerHeight - 64}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          // onWheel={handleWheel}
          className={`${spacePressed ? "cursor-grab" : "cursor-crosshair"} ${
            isPanning ? "cursor-grabbing" : ""
          }`}
        />
        {/* WidgetShell 컴포넌트을 렌더링 */}
        {widgets.map((widget) => (
          <WidgetShell
            key={widget.id}
            widget={widget}
            scale={scale}
            offset={offset}
            draggable={widget.resizable}
            editable={widget.editable}
            resizeable={widget.resizable}
            headerBar={false}
            footerBar={false}
          />
        ))}
        <CreateBoardDialog
          contentTitle={contentTitle}
          handleInputChange={handleInputChange}
          handleSaveClick={handleSaveClick}
          className="custom-dialog-class"
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
        <BrainstormInput
          onCreateNode={handleCreateTextNode}
          isActive={isBrainstormActive}
          setIsActive={setIsBrainstormActive}
          setTool={setTool}
        />
      </div>

      {/* Arrow 버튼 */}
      {/* <Button
        variant={isArrowMode ? "toolSelect" : "white"}
        size="icon"
        onClick={handleArrowButtonClick}
      >
        <MoveRight className="h-4 w-4" />
        <span className="sr-only">Arrow tool</span>
      </Button> */}

      {/* 임시 화살표 렌더링 */}
      {isDrawingArrow && tempArrow && (
        <ArrowR
          shapeProps={tempArrow}
          isSelected={true}
          scale={scale}
          offset={offset}
          onChange={() => {}}
          onDragMove={() => {}}
        />
      )}

      {/* 기존 화살표들 렌더링 */}
      {widgets
        .filter((w) => w.innerWidget.type === "arrow")
        .map((arrow) => {
          const arrowWidget = arrow as ShellWidgetProps<ArrowWidget>;
          return (
            <ArrowR
              key={arrow.id}
              shapeProps={arrowWidget.innerWidget}
              isSelected={selectedWidget === arrow.id}
              scale={scale}
              offset={offset}
              onChange={(newAttrs) => {
                dispatch(
                  updateWidget({
                    ...arrowWidget,
                    innerWidget: {
                      ...arrowWidget.innerWidget,
                      ...newAttrs,
                    },
                  })
                );
              }}
              onDragMove={handleArrowDragMove}
            />
          );
        })}
    </div>
  );
}
