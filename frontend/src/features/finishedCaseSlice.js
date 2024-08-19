import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchFinishedCases = createAsyncThunk('finishedCases/fetchFinishedCases', async () => {
    const response = await axios.get('http://127.0.0.1:5000/api/finished_cases');
    return response.data;
});

const finishedCaseSlice = createSlice({
    name: 'finishedCases',
    initialState: {
        finishedCases: [],
        status: 'idle',
        error: null
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchFinishedCases.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchFinishedCases.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.finishedCases = action.payload;
            })
            .addCase(fetchFinishedCases.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;
            });
    }
});

export default finishedCaseSlice.reducer;
