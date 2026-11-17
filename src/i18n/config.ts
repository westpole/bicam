import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import en from './locales/en/translation.json';

/** Default namespace used by `useTranslation()` without arguments. */
export const defaultNS = 'translation';

/** Bundled translation resources. Add a new locale folder and register it here. */
export const resources = {
  en: { translation: en },
} as const;

const supportedLanguages = Object.keys(resources);

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    defaultNS,
    fallbackLng: 'en',
    supportedLngs: supportedLanguages,
    interpolation: {
      // React already escapes rendered values.
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
