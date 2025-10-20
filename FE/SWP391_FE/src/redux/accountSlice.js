import { createSlice } from "@reduxjs/toolkit";

const initialState = null;

export const accountSlice = createSlice({
  name: "account",
  initialState,
  reducers: {
    login: (state, action) => {
      return action.payload;
    },
    logout: () => {
      // Clear localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userData");
      localStorage.removeItem("profileData");
      window.location.href = '/login';
      return initialState;
      
    },
    restoreUser: (state, action) => {
      return action.payload;
    },
    updateUser: (state, action) => {
      return { ...state, ...action.payload };
    },
  },
});

// Action creators are generated for each case reducer function
export const { login, logout, restoreUser, updateUser } = accountSlice.actions;

export default accountSlice.reducer;
