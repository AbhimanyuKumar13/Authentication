import { createContext } from "react";

export const Context = createContext({
  isAuthenticated: null,
  setIsAuthenticated: () => {},
  authLoading: true,
  setAuthLoading: () => {},
  user: null,
  setUser: () => {},
});
