import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  loading: false,
};

const loadingSlice = createSlice({
  name: "loading",
  initialState,
  reducers: {
    OPEN_LOADING: (state) => {
      state.loading = true;
    },
    CLOSE_LOADING: (state) => {
      state.loading = false;
    },
  },
});

export const { OPEN_LOADING, CLOSE_LOADING } = loadingSlice.actions;
export default loadingSlice.reducer;
