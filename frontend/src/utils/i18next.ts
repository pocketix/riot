import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import enTranslation from '@/utils/locales/en.json'
import csTranslation from '@/utils/locales/cs.json'
import Backend from 'i18next-http-backend'
import LanguageDetector from 'i18next-browser-languagedetector'

const resources = {
  en: { translation: enTranslation },
  cs: { translation: csTranslation }
}

// Get stored language or default to English
const storedLanguage = localStorage.getItem('language') || 'en'

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'cs'],
    lng: storedLanguage,
    interpolation: { escapeValue: false },
    react: {
      useSuspense: false
    }
  })

export default i18n
