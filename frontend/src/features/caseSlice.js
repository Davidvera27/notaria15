import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Asynchronous thunk to fetch cases from the backend
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
  reducers: {
    // Reducer to remove a case from the state
    removeCase: (state, action) => {
      state.cases = state.cases.filter(c => c.id !== action.payload);
    }
  },
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

// Export the action to remove a case
export const { removeCase } = caseSlice.actions;

export default caseSlice.reducer;
