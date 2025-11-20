import { createSlice } from "@reduxjs/toolkit";

const initialState = null;

export const accountSlice = createSlice({
  name: "account",
  initialState,
  reducers: {
    login: (state, action) => {
      return { ...state, ...action.payload };
    },
    logout: () => {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userData");
      localStorage.removeItem("profileData");
      return initialState;
    },
    restoreUser: (state, action) => {
      return { ...state, ...action.payload };
    },
  },
});

export const { login, logout, restoreUser } = accountSlice.actions;

export default accountSlice.reducer;
