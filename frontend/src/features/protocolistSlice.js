import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchProtocolists = createAsyncThunk('protocolists/fetchProtocolists', async () => {
  const response = await axios.get('http://127.0.0.1:5000/protocolists');
  return response.data;
});

const protocolistSlice = createSlice({
  name: 'protocolists',
  initialState: {
    protocolists: [],
    status: 'idle',
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProtocolists.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchProtocolists.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.protocolists = action.payload;
      })
      .addCase(fetchProtocolists.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  }
});

export default protocolistSlice.reducer;
