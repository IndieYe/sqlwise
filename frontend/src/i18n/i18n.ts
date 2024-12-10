import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enUS from './en-US.json';
import zhCN from './zh-CN.json';

// Get saved language settings from localStorage
const savedLanguage = localStorage.getItem('language') || 'zh-CN';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      'en-US': enUS,
      'zh-CN': zhCN,
    },
    lng: savedLanguage, // Use saved language settings
    fallbackLng: 'en-US',
    interpolation: {
      escapeValue: false,
    },
  });

// Add language switching function
export const changeLanguage = (language: string) => {
  i18n.changeLanguage(language);
  localStorage.setItem('language', language);
};

export default i18n;
