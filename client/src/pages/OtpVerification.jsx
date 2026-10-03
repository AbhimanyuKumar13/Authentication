import { useContext, useState } from "react";
import "../styles/Auth.css";
import axios from "axios";
import { Link, Navigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Context } from "../context/AuthContext.js";
import AuthBrand from "../components/AuthBrand";
import { useTranslation } from "react-i18next";
import { localizeApiMessage } from "../utils/localizeApiMessage.js";

const OtpVerification = () => {
  const { isAuthenticated, setIsAuthenticated, setUser } = useContext(Context);
  const { email } = useParams();
  const { t } = useTranslation();
  const [otp, setOtp] = useState(["", "", "", "", ""]);

  const handleChange = (value, index) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Safe focus to next input
    if (value && index < otp.length - 1) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };
  const handleOtpVerification = async (e) => {
    e.preventDefault();
    const enteredOtp = otp.join("");
    const data = {
      email,
      otp: enteredOtp,
    };
    await axios
      .post("http://localhost:4000/api/v1/user/otp-verification", data, {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((res) => {
        toast.success(
          localizeApiMessage(res.data.message, t, t("api.accountVerified")),
        );
        setIsAuthenticated(true);
        setUser(res.data.user);
      })
      .catch((error) => {
        toast.error(
          localizeApiMessage(
            error?.response?.data?.message,
            t,
            t("api.invalidOtp"),
          ),
        );
        setIsAuthenticated(false);
        setUser(null);
      });
  };
  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      document.getElementById(`otp-input-${index - 1}`).focus();
    }
  };
  if (isAuthenticated) {
    return <Navigate to={"/"} />;
  }
  return (
    <>
      <div className="otp-verification-page">
        <div className="otp-container">
          <AuthBrand />
          <h2>{t("auth.otpHeading")}</h2>
          <p>{t("auth.otpDescription")}</p>
          <form onSubmit={handleOtpVerification} className="otp-form">
            <span id="otp-code-label" className="auth-field-label">
              {t("auth.verificationCode")}
            </span>
            <div
              className="otp-input-container"
              role="group"
              aria-labelledby="otp-code-label"
            >
              {otp.map((digit, index) => {
                return (
                  <input
                    id={`otp-input-${index}`}
                    type="text"
                    inputMode="numeric"
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    maxLength={1}
                    key={index}
                    value={digit}
                    aria-label={t("auth.verificationDigit", {
                      current: index + 1,
                    })}
                    onChange={(e) => {
                      handleChange(e.target.value, index);
                    }}
                    onKeyDown={(e) => {
                      handleKeyDown(e, index);
                    }}
                    className="otp-input"
                  />
                );
              })}
            </div>
            <button
              type="submit"
              className="verify-button"
              disabled={otp.some((digit) => !digit)}
            >
              {t("auth.verifyCode")}
            </button>
          </form>
          <Link className="auth-return-link" to="/auth?mode=register">
            {t("auth.backToRegistration")}
          </Link>
        </div>
      </div>
    </>
  );
};

export default OtpVerification;
