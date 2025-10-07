import { combineReducers } from "@reduxjs/toolkit";
import accountReducer from "./accountSlice";

const rootReducer = combineReducers({
  account: accountReducer,
});

export default rootReducer;
