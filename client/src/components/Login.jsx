import { useContext } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { toast } from "react-toastify";
import { Context } from "../context/AuthContext.js";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { localizeApiMessage } from "../utils/localizeApiMessage.js";

const Login = () => {
  const { setIsAuthenticated, setUser } = useContext(Context);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { register, handleSubmit } = useForm();
  const handleLogin = async (data) => {
    try {
      const response = await axios.post(
        "http://localhost:4000/api/v1/user/login",
        data,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      toast.success(
        localizeApiMessage(response.data.message, t, t("api.loggedIn")),
      );
      setIsAuthenticated(true);
      setUser(response.data.user);
      navigate("/");
    } catch (error) {
      toast.error(
        localizeApiMessage(
          error.response?.data?.message,
          t,
          t("api.invalidCredentials"),
        ),
      );
    }
  };

  return (
    <>
      <form
        className="auth-form"
        onSubmit={handleSubmit((data) => handleLogin(data))}
      >
        <h2>{t("common.login")}</h2>
        <label className="auth-field" htmlFor="login-email">
          <span>{t("auth.email")}</span>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            {...register("email")}
          />
        </label>
        <label className="auth-field" htmlFor="login-password">
          <span>{t("auth.password")}</span>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            required
            {...register("password")}
          />
        </label>
        <p className="forgot-password">
          <Link to={"/forgot/password"}>{t("auth.forgotPassword")}</Link>
        </p>
        <button type="submit">{t("common.login")}</button>
      </form>
    </>
  );
};

export default Login;
