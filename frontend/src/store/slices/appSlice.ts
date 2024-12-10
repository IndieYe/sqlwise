import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface EnvData {
  quickSelect: boolean
  sqlDisplayColumns: number
  docDisplayColumns: number
  
  autoMatchSqlLog: boolean // Auto match SQL log
  autoGenRelatedColumns: boolean // Auto generate related columns
  autoMatchDDL: boolean // Auto match DDL
  autoGenSql: boolean // Auto generate SQL
  autoLearnOnRight: boolean // Auto learn when correct
  matchDocCount: number // Match document count
  matchSqlLogCount: number // Match SQL log count
  matchDdlTableCount: number // Match DDL table count
  matchDdlColumnCount: number // Match DDL column count
}

export interface Rule {
  id: number
  name: string
  content: string
}

interface AppState {
  envData: EnvData
  envReady: boolean

  projectId: number
  currentMenu: string
  language: string // Language settings
}

const initialState: AppState = {
  envData: {
    quickSelect: true,
    sqlDisplayColumns: 2,
    docDisplayColumns: 2,
    autoMatchSqlLog: true,
    autoGenRelatedColumns: true,
    autoMatchDDL: true,
    autoGenSql: false,
    autoLearnOnRight: true,
    matchDocCount: 5,
    matchSqlLogCount: 5,
    matchDdlTableCount: 5,
    matchDdlColumnCount: 5,
  },
  envReady: false,
  projectId: 0,
  currentMenu: window.location.pathname.slice(1) || 'records',
  language: localStorage.getItem('language') || 'zh-CN', // Read initial language from localStorage
};

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setInitEnvData: (state, action: PayloadAction<EnvData | undefined>) => {
      if (action.payload) {
        state.envData = action.payload;
      }
      state.envReady = true;
    },
    mergeEnvData: (state, action: PayloadAction<Partial<EnvData>>) => {
      state.envData = { ...state.envData, ...action.payload };
    },
    setProjectId: (state, action: PayloadAction<number>) => {
      state.projectId = action.payload;
    },
    setCurrentMenu: (state, action: PayloadAction<string>) => {
      state.currentMenu = action.payload;
    },
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
      localStorage.setItem('language', action.payload); // Save to localStorage
    },
  },
});

export const {
  setInitEnvData,
  mergeEnvData,
  setCurrentMenu,
  setProjectId,
  setLanguage,
} = appSlice.actions;

export default appSlice.reducer; 