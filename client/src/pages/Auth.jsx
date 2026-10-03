import { useContext, useState } from "react";
import "../styles/Auth.css";
import { Navigate } from "react-router-dom";
import { Context } from "../context/AuthContext.js";
import Login from "../components/Login";
import Register from "../components/Register";
import AuthBrand from "../components/AuthBrand";
import { useTranslation } from "react-i18next";

const Auth = () => {
  const { isAuthenticated } = useContext(Context);
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(
    () =>
      new URLSearchParams(window.location.search).get("mode") !== "register",
  );
  if (isAuthenticated) {
    return <Navigate to={"/"} />;
  }
  return (
    <>
      <div className="auth-page">
        <div className="auth-container">
          <AuthBrand />
          <div className="auth-toggle">
            <button
              className={`toggle-btn ${isLogin ? "active" : ""}`}
              onClick={() => setIsLogin(true)}
            >
              {t("common.login")}
            </button>
            <button
              className={`toggle-btn ${!isLogin ? "active" : ""}`}
              onClick={() => setIsLogin(false)}
            >
              {t("common.register")}
            </button>
          </div>
          {isLogin ? <Login /> : <Register />}
        </div>
      </div>
    </>
  );
};

export default Auth;
