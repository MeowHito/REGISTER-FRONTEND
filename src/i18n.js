import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import LanguageDetector from "i18next-browser-languagedetector";
import Backend from "i18next-http-backend";
import translationEN from "./assets/locales/EN/translation.json";
import translationTH from "./assets/locales/TH/translation.json";

const resources = {
  en: {
    translation: translationEN
  },
  th: {
    translation: translationTH
  }
};
i18n.use(Backend).use(LanguageDetector).use(initReactI18next).init({
  fallbackLng: "th",
  resources,
  debug: false
});

export default i18n;
