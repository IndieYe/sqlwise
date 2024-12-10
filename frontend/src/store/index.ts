import { configureStore } from '@reduxjs/toolkit';
import schemaReducer from './slices/schemaSlice';
import recordsReducer from './slices/recordsSlice';
import taskReducer from './slices/taskSlice';
import ddlReducer from './slices/ddlSlice';
import appReducer from './slices/appSlice';

export const store = configureStore({
  reducer: {
    schema: schemaReducer,
    records: recordsReducer,
    task: taskReducer,
    ddl: ddlReducer,
    app: appReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;