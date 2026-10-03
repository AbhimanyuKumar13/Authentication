import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";

const LanguageSwitcher = ({ className = "" }) => {
  const { i18n, t } = useTranslation();

  return (
    <label className={`language-switcher ${className}`.trim()}>
      <span className="sr-only">{t("common.language")}</span>
      <select
        aria-label={t("common.language")}
        value={i18n.resolvedLanguage || i18n.language}
        onChange={(event) => i18n.changeLanguage(event.target.value)}
      >
        <option value="en">{t("common.english")}</option>
        <option value="hi">{t("common.hindi")}</option>
      </select>
    </label>
  );
};

export default LanguageSwitcher;

LanguageSwitcher.propTypes = {
  className: PropTypes.string,
};
