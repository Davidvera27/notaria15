import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchCases = createAsyncThunk('cases/fetchCases', async () => {
  const response = await axios.get('http://127.0.0.1:5000/cases');
  return response.data;
});

const caseSlice = createSlice({
  name: 'cases',
  initialState: {
    cases: [],
    status: 'idle',
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCases.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCases.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.cases = action.payload;
      })
      .addCase(fetchCases.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  }
});

export default caseSlice.reducer;
