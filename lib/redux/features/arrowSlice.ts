import { ShellWidgetProps, AllWidgetTypes, ArrowWidget } from "@/lib/type";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ArrowState {
  isArrowMode: boolean;
  showSettings: boolean;
  textBoxVisibility: { [key: string]: boolean };
  selectedArrowId: string | null;
  lastUpdate: {
    movedShapeId: string;
    newX: number;
    newY: number;
    shapes: ShellWidgetProps<AllWidgetTypes>[];
  } | null;
  startPoint: { x: number; y: number; widgetId: string } | null;
  isDrawing: boolean;
}

const initialState: ArrowState = {
  isArrowMode: false,
  showSettings: false,
  selectedArrowId: null,
  textBoxVisibility: {},
  lastUpdate: null,
  startPoint: null,
  isDrawing: false,
};

const arrowSlice = createSlice({
  name: "arrow",
  initialState,
  reducers: {
    setIsArrowMode: (state, action: PayloadAction<boolean>) => {
      console.log("6. Setting arrow mode in reducer:", action.payload);
      state.isArrowMode = action.payload;
    },
    toggleSettings: (state, action: PayloadAction<string>) => {
      state.showSettings = !state.showSettings;
      state.selectedArrowId = action.payload;
    },
    closeSettings: (state) => {
      state.showSettings = false;
      state.selectedArrowId = null;
    },
    toggleTextBox: (state, action: PayloadAction<string>) => {
      const arrowId = action.payload;
      state.textBoxVisibility[arrowId] = !state.textBoxVisibility[arrowId];
    },
    setArrowStartPoint: (
      state,
      action: PayloadAction<{ x: number; y: number; widgetId: string }>
    ) => {
      state.startPoint = action.payload;
    },
    setIsDrawing: (state, action: PayloadAction<boolean>) => {
      state.isDrawing = action.payload;
    },
    setArrowEndPoint: (
      state,
      action: PayloadAction<{ x: number; y: number; widgetId: string }>
    ) => {
      console.log("Setting arrow end point:", action.payload);
      if (state.startPoint) {
        console.log("Creating new arrow with start point:", state.startPoint);
        const newArrow: ArrowWidget = {
          id: `arrow-${Date.now()}`,
          type: "arrow",
          from: state.startPoint.widgetId,
          to: action.payload.widgetId,
          points: [
            state.startPoint.x,
            state.startPoint.y,
            action.payload.x,
            action.payload.y,
          ],
          arrowTipX: action.payload.x,
          arrowTipY: action.payload.y,
          arrowHeads: { left: false, right: true },
        };

        console.log("Created new arrow:", newArrow);

        // 새로운 화살표를 Redux store에 추가
        const newArrowWidget: ShellWidgetProps<ArrowWidget> = {
          id: newArrow.id,
          type: "arrow",
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          resizable: false,
          editable: true,
          draggable: true,
          innerWidget: newArrow,
        };

        // 상태 업데이트
        state.lastUpdate = {
          movedShapeId: newArrow.id,
          newX: action.payload.x,
          newY: action.payload.y,
          shapes: [newArrowWidget],
        };

        // 상태 초기화
        state.startPoint = null;
        state.isDrawing = false;
        console.log("Reset arrow state");
      } else {
        console.warn("No start point found when setting end point");
      }
    },
    updateArrowPositions: (
      state,
      action: PayloadAction<ShellWidgetProps<ArrowWidget>[]>
    ) => {
      // 화살표 위치 업데이트 로직
    },
    addArrow: (state, action: PayloadAction<ArrowWidget>) => {
      // 화살표 추가 로직
    },
    updateArrow: (
      state,
      action: PayloadAction<{
        arrowId: string;
        fromId: string;
        toId: string;
        points: number[];
        arrowTipX: number;
        arrowTipY: number;
      }>
    ) => {
      const { arrowId, fromId, toId, points, arrowTipX, arrowTipY } =
        action.payload;

      // lastUpdate 상태 업데이트
      state.lastUpdate = {
        movedShapeId: arrowId,
        newX: arrowTipX,
        newY: arrowTipY,
        shapes: [
          {
            id: arrowId,
            type: "arrow",
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            resizable: false,
            editable: true,
            draggable: true,
            innerWidget: {
              id: arrowId,
              type: "arrow",
              from: fromId,
              to: toId,
              points: points,
              arrowTipX: arrowTipX,
              arrowTipY: arrowTipY,
              arrowHeads: { left: false, right: true },
            },
          },
        ],
      };
    },
  },
});

export const {
  setIsArrowMode,
  toggleSettings,
  closeSettings,
  toggleTextBox,
  setArrowStartPoint,
  setIsDrawing,
  setArrowEndPoint,
  updateArrowPositions,
  addArrow,
  updateArrow,
} = arrowSlice.actions;

export default arrowSlice.reducer;
