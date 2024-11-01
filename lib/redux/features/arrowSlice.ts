import { ShellWidgetProps, AllWidgetTypes } from '@/lib/type';
import { createSlice } from '@reduxjs/toolkit';

interface ArrowState {
  isArrowMode: boolean;
  widgets: ShellWidgetProps<AllWidgetTypes>[];
}

const initialState: ArrowState = {
  isArrowMode: false,
  widgets: [],
};

const arrowSlice = createSlice({
  name: 'arrow',
  initialState,
  reducers: {
    setIsArrowMode: (state, action) => {
      state.isArrowMode = action.payload;
    },
  },
});

export const { setIsArrowMode } = arrowSlice.actions;
export default arrowSlice.reducer;
