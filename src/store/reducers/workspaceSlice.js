import { createSlice } from "@reduxjs/toolkit";

// The back-office "starred" event, kept per user so a shared browser doesn't
// leak one account's selection into another. Persisted with redux-persist.
const initialState = {
  byUser: {},
};

const workspaceSlice = createSlice({
  name: "workspace",
  initialState,
  reducers: {
    SET_ACTIVE_EVENT: (state, action) => {
      const { userId, event } = action.payload;
      if (!userId) return;
      state.byUser = { ...state.byUser, [userId]: event };
    },
    CLEAR_ACTIVE_EVENT: (state, action) => {
      const userId = action.payload;
      if (!userId || !state.byUser) return;
      delete state.byUser[userId];
    },
  },
});

export const { SET_ACTIVE_EVENT, CLEAR_ACTIVE_EVENT } = workspaceSlice.actions;
export default workspaceSlice.reducer;
