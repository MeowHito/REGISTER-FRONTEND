import { createSlice } from "@reduxjs/toolkit";
import _ from "lodash";

const initialState = {
  isLoading: false,
  profile: {},
  order: {},
};

const contextSlice = createSlice({
  name: "context",
  initialState,
  reducers: {
    SET_LOADING: (state, action) => {
      state.isLoading = action.payload;
    },
    SET_PROFILE: (state, action) => {
      state.profile = action.payload;
    },
    SET_ORDER: (state, action) => {
      state.order = action.payload;
    },
    SET_PROPS: (state, action) => {
      const id = action.payload.id || "ctx"
      const payload = action.payload.payload || {}
      state[id] = { ...state[id], ...payload }
    },
    CLEAR_PROPS: (state, action) => {
      const id = action.payload
      if (id) {
        state[id] = {}
      }
    },
    CLEAR_ORDER: (state) => {
      state.order = {};
    },
    CLEAR_CONTEXT: (state) => {
      state.profile = _.cloneDeep(initialState);
    }
  },
});

export const { SET_LOADING, SET_PROFILE, SET_ORDER, SET_PROPS, CLEAR_PROPS, CLEAR_ORDER, CLEAR_CONTEXT } = contextSlice.actions;
export default contextSlice.reducer;
