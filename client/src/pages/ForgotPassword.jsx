import { useState } from "react";
import "../styles/Auth.css";
import axios from "axios";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import AuthBrand from "../components/AuthBrand";
import { useTranslation } from "react-i18next";
import { localizeApiMessage } from "../utils/localizeApiMessage.js";
import i18n from "../i18n.js";

const ForgotPassword = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    await axios
      .post(
        "http://localhost:4000/api/v1/user/password/forgot",
        { email, language: i18n.resolvedLanguage },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
      .then((res) => {
        toast.success(
          localizeApiMessage(
            res.data.message,
            t,
            t("api.emailSent", { email }),
          ),
        );
      })
      .catch((error) => {
        toast.error(
          localizeApiMessage(
            error.response?.data?.message,
            t,
            t("api.resetEmailFailed"),
          ),
        );
      });
  };
  return (
    <>
      <div className="forgot-password-page">
        <div className="forgot-password-container">
          <AuthBrand />
          <h2>{t("auth.forgotHeading")}</h2>
          <p>{t("auth.forgotDescription")}</p>
          <form
            onSubmit={handleForgotPassword}
            className="forgot-password-form"
          >
            <label className="auth-field" htmlFor="forgot-email">
              <span>{t("auth.email")}</span>
              <input
                id="forgot-email"
                type="email"
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                className="forgot-input"
                required
              />
            </label>
            <button className="forgot-btn" type="submit">
              {t("auth.sendResetLink")}
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

export default ForgotPassword;
