import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AllWidgetTypes, ShellWidgetProps, TextWidget } from '@/lib/type';

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

const whiteboardSlice = createSlice({
  name: 'whiteboard',
  initialState,
  reducers: {
    addWidget: (
      state,
      action: PayloadAction<ShellWidgetProps<AllWidgetTypes>>
    ) => {
      state.widgets.push(action.payload);
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
  },
});

export const {
  addWidget,
  updateWidget,
  deleteWidget,
  setSelectedWidget,
  setEditModeWidgets,
} = whiteboardSlice.actions;
export default whiteboardSlice.reducer;
