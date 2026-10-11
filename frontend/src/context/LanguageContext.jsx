import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { LANGUAGES, TRANSLATIONS } from "../i18n/translations.js";

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem("solar_erp_language");
      if (saved && LANGUAGES.some(l => l.id === saved)) {
        return saved;
      }
    } catch {}
    return "en"; // Default to English as requested
  });

  const isRTL = language === "ur";

  // Change language and persist to localStorage and DOM
  const setLanguage = useCallback((newLang) => {
    if (!LANGUAGES.some(l => l.id === newLang)) return;
    setLanguageState(newLang);
    try {
      localStorage.setItem("solar_erp_language", newLang);
    } catch {}
  }, []);

  // Synchronize document direction and lang attribute
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    if (isRTL) {
      document.body.classList.add("lang-rtl");
    } else {
      document.body.classList.remove("lang-rtl");
    }
  }, [language, isRTL]);

  // Translation helper function supporting nested paths like "nav.inventory"
  const t = useCallback((path, fallback = "") => {
    if (!path) return fallback;
    const keys = path.split(".");

    // 1. Try selected language
    let current = TRANSLATIONS[language];
    let found = true;
    for (const k of keys) {
      if (current && typeof current === "object" && k in current) {
        current = current[k];
      } else {
        found = false;
        break;
      }
    }
    if (found && (typeof current === "string" || typeof current === "number")) {
      return current;
    }

    // 2. Fallback to English
    if (language !== "en") {
      let enCurrent = TRANSLATIONS["en"];
      let enFound = true;
      for (const k of keys) {
        if (enCurrent && typeof enCurrent === "object" && k in enCurrent) {
          enCurrent = enCurrent[k];
        } else {
          enFound = false;
          break;
        }
      }
      if (enFound && (typeof enCurrent === "string" || typeof enCurrent === "number")) {
        return enCurrent;
      }
    }

    return fallback || path;
  }, [language]);

  const currentLangMeta = LANGUAGES.find(l => l.id === language) || LANGUAGES[0];

  const value = {
    language,
    setLanguage,
    t,
    isRTL,
    languages: LANGUAGES,
    currentLangMeta
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    // Graceful fallback if used outside provider
    return {
      language: "en",
      setLanguage: () => {},
      t: (path, fallback) => fallback || path,
      isRTL: false,
      languages: LANGUAGES,
      currentLangMeta: LANGUAGES[0]
    };
  }
  return context;
};

export default LanguageContext;
