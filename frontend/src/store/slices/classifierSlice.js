import { createSlice } from '@reduxjs/toolkit';

const classifierSlice = createSlice({
  name: 'classifier',
  initialState: {
    step: 1,                  // 1-6
    inputMethod: null,        // 'text' | 'image' | 'ocr'
    result: null,             // resultado final de clasificación
    loading: false,
    error: null,
    upgradeError: null,       // { currentPlan, limit, used, resetDate } — HTTP 429
  },
  reducers: {
    setStep:         (state, { payload }) => { state.step = payload; },
    setInputMethod:  (state, { payload }) => { state.inputMethod = payload; state.step = 2; },
    setResult:       (state, { payload }) => { state.result = payload; state.step = 6; },
    setLoading:      (state, { payload }) => { state.loading = payload; },
    setError:        (state, { payload }) => { state.error = payload; state.loading = false; },
    setUpgradeError: (state, { payload }) => { state.upgradeError = payload; state.loading = false; },
    clearUpgradeError: (state) => { state.upgradeError = null; },
    resetClassifier: () => ({
      step: 1, inputMethod: null, result: null,
      loading: false, error: null, upgradeError: null,
    }),
  },
});

export const {
  setStep, setInputMethod, setResult, setLoading,
  setError, setUpgradeError, clearUpgradeError, resetClassifier,
} = classifierSlice.actions;

export default classifierSlice.reducer;
