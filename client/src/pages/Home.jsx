import { Link } from "react-router-dom";
import "../styles/Home.css";
import Footer from "../layout/Footer";
import logo from "../assets/logo.png";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useTranslation } from "react-i18next";

const Home = () => {
  const { t } = useTranslation();
  return (
    <main className="public-home">
      <header className="public-nav">
        <Link className="public-brand" to="/" aria-label={t("common.homeAria")}>
          <img className="brand-logo" src={logo} alt="" />
          <span>
            PSS <strong>Ledger</strong>
          </span>
        </Link>
        <nav className="public-nav-links" aria-label={t("home.mainNavigation")}>
          <a href="#features">{t("home.features")}</a>
          <a href="#how-it-works">{t("home.howItWorks")}</a>
          <Link className="nav-login" to="/auth?mode=login">
            {t("common.login")}
          </Link>
          <Link className="nav-signup" to="/auth?mode=register">
            {t("common.register")} <span aria-hidden="true">↗</span>
          </Link>
          <LanguageSwitcher className="public-language-switcher" />
        </nav>
      </header>

      <section className="landing-hero">
        <div className="hero-copy">
          <p className="eyebrow">
            <span /> {t("home.eyebrow")}
          </p>
          <h1>
            {t("home.heroFirst")}
            <br />
            <em>{t("home.heroSecond")}</em>
          </h1>
          <p className="hero-description">{t("home.heroDescription")}</p>
          <div className="hero-actions">
            <Link className="primary-action" to="/auth?mode=register">
              {t("common.createAccount")} <span aria-hidden="true">→</span>
            </Link>
            <Link className="secondary-action" to="/auth?mode=login">
              {t("home.alreadyAccount")}
            </Link>
          </div>
          <p className="hero-note">{t("home.heroNote")}</p>
        </div>

        <div className="invoice-scene" aria-label={t("home.previewAria")}>
          <div className="scene-label">
            {t("home.billPreview")} <span>01 / 01</span>
          </div>
          <article className="invoice-sheet">
            <div className="invoice-topline">
              <div>
                <span className="invoice-logo">P</span>
                <div>
                  <b>{t("home.yourBusiness")}</b>
                  <small>{t("home.businessAddress")}</small>
                </div>
              </div>
              <span className="invoice-status">{t("home.taxInvoice")}</span>
            </div>
            <div className="invoice-rule" />
            <div className="invoice-meta">
              <div>
                <small>{t("home.invoiceTo")}</small>
                <b>{t("home.clientName")}</b>
                <span>client@example.com</span>
              </div>
              <div>
                <small>{t("home.invoiceNumber")}</small>
                <b>PSS-2025-001</b>
                <span>{t("home.issueDate", { date: "12 Mar 2025" })}</span>
              </div>
            </div>
            <div className="invoice-table">
              <div className="invoice-row invoice-head">
                <span>{t("home.description")}</span>
                <span>{t("home.quantityShort")}</span>
                <span>{t("home.amount")}</span>
              </div>
              <div className="invoice-row">
                <span>{t("home.professionalServices")}</span>
                <span>2</span>
                <span>₹12,000</span>
              </div>
              <div className="invoice-row">
                <span>{t("home.consultation")}</span>
                <span>1</span>
                <span>₹3,000</span>
              </div>
            </div>
            <div className="invoice-total">
              <span>{t("home.subtotal")}</span>
              <b>₹15,000</b>
              <span>{t("home.gst")}</span>
              <b>₹2,700</b>
              <strong>{t("home.totalDue")}</strong>
              <strong>₹17,700</strong>
            </div>
            <div className="invoice-download">
              <span className="download-symbol">↓</span>
              <span>
                <b>{t("home.invoiceReady")}</b>
                <small>{t("home.downloadPdf")}</small>
              </span>
              <span className="download-check">✓</span>
            </div>
          </article>
          <div className="scene-caption">{t("home.previewCaption")}</div>
        </div>
      </section>

      <section className="feature-section" id="features">
        <div className="section-heading">
          <p className="eyebrow">{t("home.workspaceEyebrow")}</p>
          <h2>{t("home.featuresHeading")}</h2>
          <p>{t("home.featuresDescription")}</p>
        </div>
        <div className="feature-grid">
          <article className="feature-item">
            <span className="feature-number">01</span>
            <h3>{t("home.companyProfile")}</h3>
            <p>{t("home.companyProfileDescription")}</p>
          </article>
          <article className="feature-item">
            <span className="feature-number">02</span>
            <h3>{t("home.gstBillCreation")}</h3>
            <p>{t("home.gstBillDescription")}</p>
          </article>
          <article className="feature-item">
            <span className="feature-number">03</span>
            <h3>{t("home.pdfRecords")}</h3>
            <p>{t("home.pdfRecordsDescription")}</p>
          </article>
        </div>
      </section>

      <section className="steps-section" id="how-it-works">
        <div className="steps-intro">
          <p className="eyebrow">{t("home.getStarted")}</p>
          <h2>
            {t("home.threeSteps")}
            <br />
            <em>{t("home.invoiceReadyHeading")}</em>
          </h2>
          <p>{t("home.stepsDescription")}</p>
          <Link to="/auth?mode=register">
            {t("home.getStarted")} <span aria-hidden="true">→</span>
          </Link>
        </div>
        <ol className="steps-list">
          <li>
            <span>01</span>
            <div>
              <h3>{t("home.stepOneTitle")}</h3>
              <p>{t("home.stepOneDescription")}</p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <h3>{t("home.stepTwoTitle")}</h3>
              <p>{t("home.stepTwoDescription")}</p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <h3>{t("home.stepThreeTitle")}</h3>
              <p>{t("home.stepThreeDescription")}</p>
            </div>
          </li>
        </ol>
      </section>
      <Footer />
    </main>
  );
};

export default Home;
