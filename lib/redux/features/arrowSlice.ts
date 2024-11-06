import { ShellWidgetProps, AllWidgetTypes } from "@/lib/type";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ArrowState {
  isArrowMode: boolean;
  widgets: ShellWidgetProps<AllWidgetTypes>[];
  showSettings: boolean; // 설정 패널의 표시 여부
  textBoxVisibility: { [key: string]: boolean }; // 각 화살표별 텍스트 박스 표시 여부를 저장하는 객체
  selectedArrowId: string | null; // 현재 선택된 화살표의 ID
  lastUpdate: {
    // 마지막 업데이트 정보를 저장하는 객체
    movedShapeId: string; // 이동된 도형의 ID
    newX: number; // 새로운 X 좌표
    newY: number; // 새로운 Y 좌표
    shapes: ShellWidgetProps<AllWidgetTypes>[]; // 모든 도형들의 배열
  } | null;
}

const initialState: ArrowState = {
  isArrowMode: false,
  widgets: [],
  showSettings: false,
  textBoxVisibility: {},
  selectedArrowId: null,
  lastUpdate: null,
};

const arrowSlice = createSlice({
  name: "arrow",
  initialState,
  reducers: {
    // 설정 패널 토글 및 선택된 화살표 ID 설정
    toggleSettings: (state, action: PayloadAction<string>) => {
      state.showSettings = !state.showSettings;
      state.selectedArrowId = action.payload;
    },
    // 설정 패널 닫기 및 선택된 화살표 초기화
    closeSettings: (state) => {
      state.showSettings = false;
      state.selectedArrowId = null;
    },

    // 특정 화살표의 텍스트 박스 표시 여부 토글
    toggleTextBox: (state, action: PayloadAction<string>) => {
      const arrowId = action.payload;
      state.textBoxVisibility[arrowId] = !state.textBoxVisibility[arrowId];
    },

    // 화살표 위치 업데이트 정보 저장
    updateArrowPositions: (
      state,
      action: PayloadAction<{
        movedShapeId: string;
        newX: number;
        newY: number;
        shapes: ShellWidgetProps<AllWidgetTypes>[];
      }>
    ) => {
      state.lastUpdate = action.payload;
    },

    setIsArrowMode: (state, action) => {
      state.isArrowMode = action.payload;
    },
  },
});

export const {
  toggleSettings,
  closeSettings,
  toggleTextBox,
  updateArrowPositions,
  setIsArrowMode,
} = arrowSlice.actions;
export default arrowSlice.reducer;
