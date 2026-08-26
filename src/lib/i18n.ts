import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import type { Language } from "../types.ts";

export const languages: Array<{ code: Language; label: string; nativeLabel: string }> = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "fr", label: "French", nativeLabel: "Français" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी" },
  { code: "es", label: "Spanish", nativeLabel: "Español" },
  { code: "zh", label: "Chinese", nativeLabel: "中文" },
  { code: "bn", label: "Bengali", nativeLabel: "বাংলা" },
];

const resources = {
  en: {
    translation: {
      "language": "Language",
      "citizenPortal": "Citizen Portal",
      "integrityPortal": "Integrity Portal",
      "adminDashboard": "Admin Dashboard",
      "fieldOperations": "Field Operations",
      "systemAnalytics": "System Analytics",
      "systemStatus": "System Status",
      "operational": "Operational",
      "secure": "SECURE",
      "switchPersona": "Switch Persona & Role",
      "citizen": "Citizen",
      "vault": "Vault",
      "admin": "Admin",
      "field": "Field",
      "analytics": "Analytics",
      "platformDescription": "AI-Assisted Civic Accountability & Integrity Platform",
      "footer": "© 2026 CivicAI Global Monitoring System • v2.5.0-stable",
      "database": "Database Cluster: Primary",
      "aiNode": "AI Node: Gemini-3.7-Flash",
      "Citizen Accountability Dashboard": "Citizen Accountability Dashboard",
      "Integrity Evidence Vault": "Integrity Evidence Vault",
      "Neighborhood Live Issue Map": "Neighborhood Live Issue Map",
      "High Urgency Neighborhood Alerts": "High Urgency Neighborhood Alerts",
      "Start Report": "Start Report",
      "Open Vault": "Open Vault",
      "Field Officer Operations": "Field Officer Operations",
      "Total Assigned": "Total Assigned",
      "In Progress": "In Progress",
      "Critical Urgency": "Critical Urgency",
      "Resolved": "Resolved",
      "Search tickets, addresses...": "Search tickets, addresses...",
      "Status:": "Status:",
      "Sort:": "Sort:",
      "Report Issue": "Report Issue",
      "Submit Report": "Submit Report",
      "Cancel": "Cancel",
      "Close": "Close",
      "Description": "Description",
      "Category": "Category",
      "Department": "Department",
      "Assigned Officer": "Assigned Officer",
      "Report Count / Upvotes": "Report Count / Upvotes",
      "Search": "Search",
      "Refresh": "Refresh",
      "Loading...": "Loading...",
      "No issues found": "No issues found",
      "Target threshold: > 90%": "Target threshold: > 90%",
      "Based on verified sign-offs": "Based on verified sign-offs"
    }
  },
  hi: {
    translation: {
      "language": "भाषा",
      "citizenPortal": "नागरिक पोर्टल",
      "integrityPortal": "सत्यनिष्ठा पोर्टल",
      "adminDashboard": "प्रशासन डैशबोर्ड",
      "fieldOperations": "मैदानी संचालन",
      "systemAnalytics": "सिस्टम एनालिटिक्स",
      "systemStatus": "सिस्टम स्थिति",
      "operational": "सक्रिय",
      "secure": "सुरक्षित",
      "switchPersona": "भूमिका बदलें",
      "citizen": "नागरिक",
      "vault": "वॉल्ट",
      "admin": "प्रशासन",
      "field": "मैदान",
      "analytics": "एनालिटिक्स",
      "platformDescription": "AI-सहायित नागरिक जवाबदेही और सत्यनिष्ठा प्लेटफ़ॉर्म",
      "footer": "© 2026 CivicAI ग्लोबल मॉनिटरिंग सिस्टम • v2.5.0-stable",
      "database": "डेटाबेस क्लस्टर: प्राथमिक",
      "aiNode": "AI नोड: Gemini-3.7-Flash",
      "Citizen Accountability Dashboard": "नागरिक जवाबदेही डैशबोर्ड",
      "Integrity Evidence Vault": "सत्यनिष्ठा साक्ष्य वॉल्ट",
      "Neighborhood Live Issue Map": "पड़ोस का लाइव समस्या मानचित्र",
      "High Urgency Neighborhood Alerts": "पड़ोस की उच्च प्राथमिकता सूचनाएं",
      "Start Report": "रिपोर्ट शुरू करें",
      "Open Vault": "वॉल्ट खोलें",
      "Field Officer Operations": "मैदानी अधिकारी संचालन",
      "Total Assigned": "कुल सौंपे गए",
      "In Progress": "प्रगति में",
      "Critical Urgency": "अत्यंत जरूरी",
      "Resolved": "समाधान किया गया",
      "Search tickets, addresses...": "टिकट, पते खोजें...",
      "Status:": "स्थिति:",
      "Sort:": "क्रम:",
      "Report Issue": "समस्या रिपोर्ट करें",
      "Submit Report": "रिपोर्ट जमा करें",
      "Cancel": "रद्द करें",
      "Close": "बंद करें",
      "Description": "विवरण",
      "Category": "श्रेणी",
      "Department": "विभाग",
      "Assigned Officer": "सौंपे गए अधिकारी",
      "Report Count / Upvotes": "रिपोर्ट संख्या / समर्थन",
      "Search": "खोजें",
      "Refresh": "रिफ्रेश करें",
      "Loading...": "लोड हो रहा है...",
      "No issues found": "कोई समस्या नहीं मिली",
      "Target threshold: > 90%": "लक्ष्य सीमा: > 90%",
      "Based on verified sign-offs": "सत्यापित अनुमोदनों पर आधारित"
    }
  },
  es: {
    translation: {
      "language": "Idioma",
      "citizenPortal": "Portal Ciudadano",
      "integrityPortal": "Portal de Integridad",
      "adminDashboard": "Panel de Administración",
      "fieldOperations": "Operaciones de Campo",
      "systemAnalytics": "Analítica del Sistema",
      "systemStatus": "Estado del Sistema",
      "operational": "Operativo",
      "secure": "SEGURO",
      "switchPersona": "Cambiar Persona y Rol",
      "citizen": "Ciudadano",
      "vault": "Bóveda",
      "admin": "Admin",
      "field": "Campo",
      "analytics": "Analítica",
      "platformDescription": "Plataforma de responsabilidad e integridad cívica asistida por IA",
      "footer": "© 2026 Sistema de Monitoreo Global CivicAI • v2.5.0-stable",
      "database": "Clúster de Base de Datos: Primario",
      "aiNode": "Nodo de IA: Gemini-3.7-Flash",
      "Citizen Accountability Dashboard": "Panel de Responsabilidad Ciudadana",
      "Integrity Evidence Vault": "Bóveda de Evidencias de Integridad",
      "Neighborhood Live Issue Map": "Mapa de Problemas en Vivo del Vecindario",
      "High Urgency Neighborhood Alerts": "Alertas Vecinales de Alta Urgencia",
      "Start Report": "Iniciar Reporte",
      "Open Vault": "Abrir Bóveda",
      "Field Officer Operations": "Operaciones del Oficial de Campo",
      "Total Assigned": "Total Asignado",
      "In Progress": "En Progreso",
      "Critical Urgency": "Urgencia Crítica",
      "Resolved": "Resuelto",
      "Search tickets, addresses...": "Buscar tickets, direcciones...",
      "Status:": "Estado:",
      "Sort:": "Ordenar:",
      "Report Issue": "Reportar Problema",
      "Submit Report": "Enviar Reporte",
      "Cancel": "Cancelar",
      "Close": "Cerrar",
      "Description": "Descripción",
      "Category": "Categoría",
      "Department": "Departamento",
      "Assigned Officer": "Oficial Asignado",
      "Report Count / Upvotes": "Informes / Votos",
      "Search": "Buscar",
      "Refresh": "Actualizar",
      "Loading...": "Cargando...",
      "No issues found": "No se encontraron problemas",
      "Target threshold: > 90%": "Umbral objetivo: > 90%",
      "Based on verified sign-offs": "Basado en aprobaciones verificadas"
    }
  },
  fr: { translation: {} },
  zh: { translation: {} },
  bn: {
    translation: {
      "language": "ভাষা",
      "citizenPortal": "নাগরিক পোর্টাল",
      "integrityPortal": "সততা পোর্টাল",
      "adminDashboard": "প্রশাসন ড্যাশবোর্ড",
      "fieldOperations": "মাঠ পরিচালনা",
      "systemAnalytics": "সিস্টেম অ্যানালিটিক্স",
      "systemStatus": "সিস্টেমের অবস্থা",
      "operational": "সচল",
      "secure": "নিরাপদ",
      "switchPersona": "পরিচয় ও ভূমিকা বদলান",
      "citizen": "নাগরিক",
      "vault": "ভল্ট",
      "admin": "অ্যাডমিন",
      "field": "মাঠ",
      "analytics": "অ্যানালিটিক্স",
      "platformDescription": "AI-সহায়িত নাগরিক জবাবদিহি ও সততা প্ল্যাটফর্ম",
      "footer": "© 2026 CivicAI গ্লোবাল মনিটরিং সিস্টেম • v2.5.0-stable",
      "database": "ডেটাবেস ক্লাস্টার: প্রাথমিক",
      "aiNode": "AI নোড: Gemini-3.7-Flash",
      "Citizen Accountability Dashboard": "নাগরিক জবাবদিহি ড্যাশবোর্ড",
      "Integrity Evidence Vault": "সততা প্রমাণ ভল্ট",
      "Neighborhood Live Issue Map": "এলাকার লাইভ সমস্যা মানচিত্র",
      "High Urgency Neighborhood Alerts": "এলাকার উচ্চ জরুরি সতর্কতা",
      "Start Report": "রিপোর্ট শুরু করুন",
      "Open Vault": "ভল্ট খুলুন",
      "Field Officer Operations": "মাঠ কর্মকর্তার পরিচালনা",
      "Total Assigned": "মোট বরাদ্দ",
      "In Progress": "চলমান",
      "Critical Urgency": "অত্যন্ত জরুরি",
      "Resolved": "সমাধান হয়েছে",
      "Search tickets, addresses...": "টিকিট, ঠিকানা খুঁজুন...",
      "Status:": "অবস্থা:",
      "Sort:": "সাজান:",
      "Report Issue": "সমস্যা রিপোর্ট করুন",
      "Submit Report": "রিপোর্ট জমা দিন",
      "Cancel": "বাতিল",
      "Close": "বন্ধ করুন",
      "Description": "বিবরণ",
      "Category": "বিভাগ",
      "Department": "দপ্তর",
      "Assigned Officer": "দায়িত্বপ্রাপ্ত কর্মকর্তা",
      "Report Count / Upvotes": "রিপোর্ট / সমর্থন",
      "Search": "খুঁজুন",
      "Refresh": "রিফ্রেশ",
      "Loading...": "লোড হচ্ছে...",
      "No issues found": "কোনো সমস্যা পাওয়া যায়নি",
      "Target threshold: > 90%": "লক্ষ্য সীমা: > ৯০%",
      "Based on verified sign-offs": "যাচাইকৃত অনুমোদনের ভিত্তিতে"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem("civicai-language") || "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;

export function setGlobalLanguage(lang: Language) {
  i18n.changeLanguage(lang);
  localStorage.setItem("civicai-language", lang);
}

// Temporary stubs for backwards compatibility to prevent ts errors
export type TranslationKey = string;
export function translate(language: Language, key: TranslationKey): string {
  return i18n.t(key, { lng: language });
}
export function localizeDocument(language: Language): void {
  setGlobalLanguage(language);
}