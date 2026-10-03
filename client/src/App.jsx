import { useContext, useEffect } from "react";
import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import BillingDashboard from "./pages/BillingDashboard";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import OtpVerification from "./pages/OtpVerification";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import { Context } from "./context/AuthContext.js";
import { useTranslation } from "react-i18next";

const App = () => {
  const { t } = useTranslation();
  const { isAuthenticated, setIsAuthenticated, setAuthLoading, setUser } =
    useContext(Context);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await axios.get(
          "http://localhost:4000/api/v1/user/me",
        );
        setUser(response.data.user);
        setIsAuthenticated(true);
      } catch {
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setAuthLoading(false);
      }
    };

    checkSession();
  }, [setAuthLoading, setIsAuthenticated, setUser]);

  return (
    <>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              isAuthenticated === null ? (
                <div className="auth-loading">
                  {t("common.checkingSession")}
                </div>
              ) : isAuthenticated ? (
                <BillingDashboard />
              ) : (
                <Home />
              )
            }
          />
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/otp-verification/:email"
            element={<OtpVerification />}
          />
          <Route path="/forgot/password" element={<ForgotPassword />} />
          <Route path="/forgot/reset/:token" element={<ResetPassword />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastContainer theme="colored" />
      </Router>
    </>
  );
};

export default App;
