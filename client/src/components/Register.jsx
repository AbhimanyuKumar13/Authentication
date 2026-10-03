import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { localizeApiMessage } from "../utils/localizeApiMessage.js";
import i18n from "../i18n.js";

const Register = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { register, handleSubmit } = useForm();

  const handleRegister = async (data) => {
    await axios
      .post(
        "http://localhost:4000/api/v1/user/register",
        { ...data, language: i18n.resolvedLanguage },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        },
      )
      .then((res) => {
        toast.success(
          localizeApiMessage(
            res.data.message,
            t,
            t("api.verificationSendFailed"),
          ),
        );
        navigate(`/otp-verification/${encodeURIComponent(data.email)}`);
      })
      .catch((error) => {
        toast.error(
          localizeApiMessage(
            error?.response?.data?.message,
            t,
            t("api.allFieldsRequired"),
          ),
        );
      });
  };

  return (
    <>
      <div>
        <form
          className="auth-form"
          onSubmit={handleSubmit((data) => {
            handleRegister(data);
          })}
        >
          <h2>{t("auth.registerHeading")}</h2>
          <label className="auth-field" htmlFor="register-name">
            <span>{t("auth.fullName")}</span>
            <input
              id="register-name"
              type="text"
              autoComplete="name"
              required
              {...register("name")}
            />
          </label>
          <label className="auth-field" htmlFor="register-email">
            <span>{t("auth.email")}</span>
            <input
              id="register-email"
              type="email"
              autoComplete="email"
              required
              {...register("email")}
            />
          </label>
          <label className="auth-field" htmlFor="register-password">
            <span>{t("auth.password")}</span>
            <input
              id="register-password"
              type="password"
              autoComplete="new-password"
              required
              {...register("password")}
            />
          </label>
          <p className="verification-note">{t("auth.verificationNote")}</p>
          <button type="submit">{t("common.register")}</button>
        </form>
      </div>
    </>
  );
};

export default Register;
