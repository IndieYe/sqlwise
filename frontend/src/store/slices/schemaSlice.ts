import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Schema } from '../../api-docs';

interface SchemaState {
  schema?: Schema;
}

const initialState: SchemaState = {
};

export const schemaSlice = createSlice({
  name: 'schema',
  initialState,
  reducers: {
    setSchema: (state, action: PayloadAction<Schema>) => {
      state.schema = action.payload;
    },
  },
});

export const { setSchema } = schemaSlice.actions;
export default schemaSlice.reducer; 