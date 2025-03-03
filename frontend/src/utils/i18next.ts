import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      home: "Home",
      devices: "Devices",
      members: "Members",
      automations: "Automations",
      settings: "Settings",
    },
  },
  cz: {
    translation: {
      home: "Domů",
      devices: "Zařízení",
      members: "Uživatelé",
      automations: "Automatizace",
      settings: "Nastavení",
    },
  },
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
