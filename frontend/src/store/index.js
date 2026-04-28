import { configureStore } from '@reduxjs/toolkit';
import authReducer       from './slices/authSlice';
import teamReducer       from './slices/teamSlice';
import classifierReducer from './slices/classifierSlice';
import chatIAReducer     from './slices/chatIASlice';

const store = configureStore({
  reducer: {
    auth:       authReducer,
    team:       teamReducer,
    classifier: classifierReducer,
    chatIA:     chatIAReducer,
  },
});

export default store;
