import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
const resources = {
  en: {
    translation: {
      welcome: "Welcome",
      submit: "Submit",
      logout: "Logout",
      // add all your page text keys here
    }
  },
  es: {
    translation: {
      welcome: "Bienvenido",
      submit: "Enviar",
      logout: "Cerrar sesión",
    }
  },
  fr: {
    translation: {
      welcome: "Bienvenue",
      submit: "Soumettre",
      logout: "Déconnexion",
    }
  },
  hi: {
    translation: {
      welcome: "स्वागत है",
      submit: "जमा करें",
      logout: "लॉग आउट",
    }
  }
};


i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('lang') || 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false }
  });
// src/translations.js
export const translations = {
  en: {
    dashboardTitle: "Citizen Accountability Dashboard",
    reportDefect: "Report Public Defect",
    // Add all other text strings here
  },
  hi: {
    dashboardTitle: "नागरिक जवाबदेही डैशबोर्ड",
    reportDefect: "सार्वजनिक दोष की रिपोर्ट करें",
    // Add Hindi translations here
  }
};

export default i18n;