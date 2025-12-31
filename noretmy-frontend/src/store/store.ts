'use client';

import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // Local storage for persistence
import authReducer from './authSlice';
import gigsReducer from './gigSlice';

// Persist configuration for the auth slice
const authPersistConfig = {
  key: 'auth',
  storage,
  whitelist: ['user'], // Only persist specific fields (optional)
  version: 1, // Helps in migrating stored state
};

// Persisted reducers
const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    gigs: gigsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Required for redux-persist
    }),
});

// Persistor instance
export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
