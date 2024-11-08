import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AllWidgetTypes, ShellWidgetProps, TextWidget } from "@/lib/type";

interface WhiteboardState {
  widgets: ShellWidgetProps<AllWidgetTypes>[];
  selectedWidget: string | string[] | null;
  editModeWidgets: string | string[] | null;
}

const initialState: WhiteboardState = {
  widgets: [],
  selectedWidget: null,
  editModeWidgets: null,
};

// ArrowWidget 인터페이스를 정의합니다.
interface ArrowWidget extends ShellWidgetProps<AllWidgetTypes> {
  from: string;
  to: string;
}

const whiteboardSlice = createSlice({
  name: "whiteboard",
  initialState,
  reducers: {
    addWidget: (
      state,
      action: PayloadAction<ShellWidgetProps<AllWidgetTypes>>
    ) => {
      console.log("Adding widget to state:", action.payload);
      console.log("Current widgets:", state.widgets);

      // 기존 위젯들을 유지하면서 새 위젯 추가
      state.widgets = [...state.widgets, action.payload];

      console.log("Updated widgets:", state.widgets);
    },
    updateWidget: (
      state,
      action: PayloadAction<ShellWidgetProps<AllWidgetTypes>>
    ) => {
      const index = state.widgets.findIndex((w) => w.id === action.payload.id);
      if (index !== -1) {
        state.widgets[index] = action.payload;
      }
    },
    deleteWidget: (state, action: PayloadAction<string>) => {
      state.widgets = state.widgets.filter((w) => w.id !== action.payload);
    },
    setSelectedWidget: (state, action: PayloadAction<string | null>) => {
      state.selectedWidget = action.payload;
    },
    setEditModeWidgets: (state, action: PayloadAction<string | null>) => {
      state.editModeWidgets = action.payload;
    },
    // 화살표의 시작점 또는 끝점을 업데이트하는 리듀서
    updateArrowEndpoints: (
      state,
      action: PayloadAction<{
        arrowId: string; // 업데이트할 화살표의 ID
        type: "from" | "to"; // 시작점("from") 또는 끝점("to")
        widgetId: string; // 연결될 도형의 ID
      }>
    ) => {
      const { arrowId, type, widgetId } = action.payload;
      const arrow = state.widgets.find((s) => s.id === arrowId); // 화살표 찾기
      if (arrow && arrow.type === "arrow") {
        const arrowWidget = arrow as ArrowWidget;
        if (type === "from") {
          arrowWidget.from = widgetId; // 시작점 업데이트
        } else {
          arrowWidget.to = widgetId; // 끝점 업데이트
        }
      }
    },
    setWidgets: (
      state,
      action: PayloadAction<ShellWidgetProps<AllWidgetTypes>[]>
    ) => {
      state.widgets = action.payload;
    },
  },
});

export const {
  addWidget,
  updateWidget,
  deleteWidget,
  setSelectedWidget,
  setEditModeWidgets,
  updateArrowEndpoints,
  setWidgets,
} = whiteboardSlice.actions;
export default whiteboardSlice.reducer;
