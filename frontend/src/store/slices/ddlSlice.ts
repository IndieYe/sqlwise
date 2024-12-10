import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface DDLState {
    selectedTable: string;
}

const initialState: DDLState = {
    selectedTable: '',
};

export const ddlSlice = createSlice({
    name: 'ddl',
    initialState,
    reducers: {
        setSelectedTable: (state, action: PayloadAction<string>) => {
            state.selectedTable = action.payload;
        },
    },
});

export const { setSelectedTable } = ddlSlice.actions;
export default ddlSlice.reducer;