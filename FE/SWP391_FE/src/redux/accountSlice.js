import { createSlice } from "@reduxjs/toolkit";

const initialState = null;

export const accountSlice = createSlice({
  name: "account",
  initialState,
  reducers: {
    login: (state, action) => {
      state = action.payload;
      return state;
    },
    logout: () => {
      localStorage.removeItem("token");
      localStorage.removeItem("userData");
      return initialState;
    },
    restoreUser: (state, action) => {
      state = action.payload;
      return state;
    },
  },
});

// Action creators are generated for each case reducer function
export const { login, logout, restoreUser } = accountSlice.actions;

export default accountSlice.reducer;
