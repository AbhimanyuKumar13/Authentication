import { Link } from "react-router-dom";
import logo from "../assets/logo.png";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "react-i18next";

const AuthBrand = () => {
  const { t } = useTranslation();

  return (
    <div className="auth-brand-row">
      <Link className="auth-brand" to="/" aria-label={t("common.homeAria")}>
        <img src={logo} alt="" />
        <span>
          PSS <strong>Ledger</strong>
        </span>
      </Link>
      <LanguageSwitcher />
    </div>
  );
};

export default AuthBrand;
