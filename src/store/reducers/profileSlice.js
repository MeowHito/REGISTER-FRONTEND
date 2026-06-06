import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  loading: false,
  profile: {},
};

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    PROFILE_LOADING: (state, action) => {
      state.loading = action.payload;
    },
    SET_PROFILE: (state, action) => {
      state.profile = action.payload;
    },
    CLEAR_PROFILE: (state) => {
      state.loading = false;
      state.profile = {};
    },
  },
});

export const { PROFILE_LOADING, SET_PROFILE, CLEAR_PROFILE } = profileSlice.actions;
export default profileSlice.reducer;
