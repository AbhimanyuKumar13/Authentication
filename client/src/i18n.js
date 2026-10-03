import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import hi from "./locales/hi.json";

const savedLanguage = localStorage.getItem("pss-language");
const initialLanguage = savedLanguage === "hi" ? "hi" : "en";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
  },
  lng: initialLanguage,
  fallbackLng: "en",
  supportedLngs: ["en", "hi"],
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

document.documentElement.lang = initialLanguage === "hi" ? "hi" : "en";

const updateDocumentLocale = (language) => {
  const normalizedLanguage = language === "hi" ? "hi" : "en";
  document.documentElement.lang = normalizedLanguage;
  document.title = i18n.t("common.appTitle", { lng: normalizedLanguage });
  const description = document.querySelector('meta[name="description"]');
  if (description) {
    description.content = i18n.t("common.metaDescription", {
      lng: normalizedLanguage,
    });
  }
};

updateDocumentLocale(initialLanguage);
i18n.on("languageChanged", (language) => {
  const normalizedLanguage = language === "hi" ? "hi" : "en";
  localStorage.setItem("pss-language", normalizedLanguage);
  updateDocumentLocale(normalizedLanguage);
});

export default i18n;
