import { createContext } from "react";
import { useReducer } from "react";
import { initialState, appReducer, createActions } from "./store";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const actions = createActions(dispatch);

  return (
    <AppContext.Provider value={{ state, actions }}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;
