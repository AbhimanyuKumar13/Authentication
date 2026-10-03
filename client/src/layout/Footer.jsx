import "../styles/Footer.css";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <Link className="footer-title" to="/">
            <img src={logo} alt="" />
            <span>
              PSS <strong>Ledger</strong>
            </span>
          </Link>
          <p>{t("footer.description")}</p>
        </div>
        <div className="footer-details">
          <h3>PSS Ledger</h3>
          <p>{t("footer.details")}</p>
          <Link to="/auth?mode=register">
            {t("common.createAccount")} <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
      <div className="footer-bottom">
        <p>
          &copy; {new Date().getFullYear()} PSS Ledger. {t("footer.rights")}
        </p>
        <p>{t("footer.tagline")}</p>
      </div>
    </footer>
  );
};

export default Footer;
