import { configureStore } from '@reduxjs/toolkit';
import authReducer       from './slices/authSlice';
import teamReducer       from './slices/teamSlice';
import classifierReducer from './slices/classifierSlice';
import chatIAReducer     from './slices/chatIASlice';
import trackingReducer   from './slices/trackingSlice';

const store = configureStore({
  reducer: {
    auth:       authReducer,
    team:       teamReducer,
    classifier: classifierReducer,
    chatIA:     chatIAReducer,
    tracking:   trackingReducer,
  },
});

export default store;
