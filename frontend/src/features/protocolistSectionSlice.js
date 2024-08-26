import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Thunk para obtener los protocolistas
export const fetchProtocolistsSection = createAsyncThunk('protocolistSection/fetchProtocolistsSection', async () => {
  const response = await axios.get('http://127.0.0.1:5000/api/protocolists');
  return response.data;
});

// Crear el slice
const protocolistSectionSlice = createSlice({
  name: 'protocolistSection',
  initialState: {
    protocolists: [],
    status: 'idle',
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProtocolistsSection.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchProtocolistsSection.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.protocolists = action.payload;
      })
      .addCase(fetchProtocolistsSection.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  }
});

export default protocolistSectionSlice.reducer;
