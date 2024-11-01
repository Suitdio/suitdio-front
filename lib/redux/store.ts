import { configureStore } from '@reduxjs/toolkit';
import whiteboardReducer from './features/whiteboardSlice';
import arrowReducer from './features/arrowSlice';

export const store = configureStore({
  reducer: {
    whiteboard: whiteboardReducer,
    arrow: arrowReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
