import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchPdfData = createAsyncThunk('pdfData/fetchPdfData', async () => {
  const response = await axios.get('http://127.0.0.1:5000/extract-data');
  return response.data;
});

const pdfDataSlice = createSlice({
  name: 'pdfData',
  initialState: {
    pdfData: [],
    status: 'idle',
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPdfData.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchPdfData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.pdfData = action.payload;
      })
      .addCase(fetchPdfData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  }
});

export default pdfDataSlice.reducer;
