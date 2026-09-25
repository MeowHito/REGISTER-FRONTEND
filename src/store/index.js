import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist-indexeddb-storage';

import contextSlice from "./reducers/contextSlice";
import profileSlice from "./reducers/profileSlice";
import loadingSlice from "./reducers/loadingSlice";
import workspaceSlice from "./reducers/workspaceSlice";

const rootReducer = combineReducers({
  context: contextSlice,
  profile: profileSlice,
  loading: loadingSlice,
  workspace: workspaceSlice
});

const persistConfig = {
  key: 'root',
  storage: storage('actionInThai'),
  whitelist: ['context', 'profile', 'workspace']
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

const persistor = persistStore(store);

export default () => ({ store, persistor });
