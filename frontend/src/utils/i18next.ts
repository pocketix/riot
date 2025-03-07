import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enTranslation from "@/utils/locales/en.json";
import czTranslation from "@/utils/locales/cz.json";

const resources = {
  en: { translation: enTranslation },
  cz: { translation: czTranslation },
};

// Get stored language or default to English
const storedLanguage = localStorage.getItem("language") || "en";

i18n.use(initReactI18next).init({
  resources,
  fallbackLng: "en",
  lng: storedLanguage,
  interpolation: { escapeValue: false },
});

export default i18n;
