import { useState } from "react";
import PropTypes from "prop-types";
import { Context } from "./AuthContext.js";

const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState(null);

  return (
    <Context.Provider
      value={{
        isAuthenticated,
        setIsAuthenticated,
        authLoading,
        setAuthLoading,
        user,
        setUser,
      }}
    >
      {children}
    </Context.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthProvider;
