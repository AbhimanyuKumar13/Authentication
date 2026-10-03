import { useContext, useState } from "react";
import "../styles/Auth.css";
import axios from "axios";
import { Link, Navigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Context } from "../context/AuthContext.js";
import AuthBrand from "../components/AuthBrand";
import { useTranslation } from "react-i18next";
import { localizeApiMessage } from "../utils/localizeApiMessage.js";

const ResetPassword = () => {
  const { isAuthenticated, setIsAuthenticated, setUser } = useContext(Context);
  const { token } = useParams();
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleResetPassword = async (e) => {
    e.preventDefault();
    await axios
      .put(
        `http://localhost:4000/api/v1/user/password/reset/${token}`,
        { password, confirmPassword },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
      .then((res) => {
        toast.success(
          localizeApiMessage(res.data.message, t, t("api.passwordReset")),
        );
        setIsAuthenticated(true);
        setUser(res.data.user);
      })
      .catch((error) => {
        toast.error(
          localizeApiMessage(
            error.response?.data?.message,
            t,
            t("api.invalidResetToken"),
          ),
        );
      });
  };
  if (isAuthenticated) {
    return <Navigate to={"/"} />;
  }

  return (
    <>
      <div className="reset-password-page">
        <div className="reset-password-container">
          <AuthBrand />
          <h2>{t("auth.resetHeading")}</h2>
          <p>{t("auth.resetDescription")}</p>
          <form onSubmit={handleResetPassword} className="reset-password-form">
            <label className="auth-field" htmlFor="reset-password">
              <span>{t("auth.newPassword")}</span>
              <input
                id="reset-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={32}
                onChange={(e) => {
                  setPassword(e.target.value);
                }}
                value={password}
                className="reset-input"
              />
            </label>
            <label className="auth-field" htmlFor="reset-confirm-password">
              <span>{t("auth.confirmPassword")}</span>
              <input
                id="reset-confirm-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={32}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                }}
                value={confirmPassword}
                className="reset-input"
              />
            </label>
            <button type="submit" className="reset-btn">
              {t("auth.resetPassword")}
            </button>
          </form>
          <Link className="auth-return-link" to="/auth?mode=login">
            {t("common.backToLogin")}
          </Link>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;
