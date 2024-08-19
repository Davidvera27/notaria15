import { configureStore } from '@reduxjs/toolkit';
import caseReducer from './features/caseSlice';
import protocolistReducer from './features/protocolistSlice';
import pdfDataReducer from './features/pdfDataSlice';
import finishedCaseReducer from './features/finishedCaseSlice';


const store = configureStore({
  reducer: {
    cases: caseReducer,
    protocolists: protocolistReducer,
    pdfData: pdfDataReducer,
    finishedCases: finishedCaseReducer,
  },
});

export default store;