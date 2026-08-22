import React, { createContext, useContext, useState, useEffect } from "react";
import enIN from "../locales/en-IN.json";
import hiIN from "../locales/hi-IN.json";
import bnIN from "../locales/bn-IN.json";
import mrIN from "../locales/mr-IN.json";
import knIN from "../locales/kn-IN.json";

const LanguageContext = createContext(null);

const localeFiles = {
  "en-IN": enIN,
  "hi-IN": hiIN,
  "bn-IN": bnIN,
  "mr-IN": mrIN,
  "kn-IN": knIN
};

const shortToLongMap = {
  "en": "en-IN",
  "hi": "hi-IN",
  "bn": "bn-IN",
  "mr": "mr-IN",
  "kn": "kn-IN",
  "en-IN": "en-IN",
  "hi-IN": "hi-IN",
  "bn-IN": "bn-IN",
  "mr-IN": "mr-IN",
  "kn-IN": "kn-IN"
};

export function LanguageProvider({ children }) {
  // Read short code or long code from localStorage
  const savedLang = localStorage.getItem("tp-lang") || "en";
  const [locale, setLocale] = useState(shortToLongMap[savedLang] || "en-IN");

  useEffect(() => {
    // Listen to tp-lang-changed event which Topbar dispatches
    const handleLangChange = () => {
      const val = localStorage.getItem("tp-lang") || "en";
      setLocale(shortToLongMap[val] || "en-IN");
    };
    window.addEventListener("tp-lang-changed", handleLangChange);
    return () => {
      window.removeEventListener("tp-lang-changed", handleLangChange);
    };
  }, []);

  const changeLanguage = (shortOrLongCode) => {
    const longCode = shortToLongMap[shortOrLongCode] || "en-IN";
    // Find short code to store in localStorage to keep existing selector aligned
    const shortCode = Object.keys(shortToLongMap).find(key => shortToLongMap[key] === longCode && key.length === 2) || "en";
    
    localStorage.setItem("tp-lang", shortCode);
    setLocale(longCode);
    window.dispatchEvent(new Event("tp-lang-changed"));
  };

  const t = (key, defaultVal) => {
    const keys = key.split(".");
    let val = localeFiles[locale];
    
    for (const k of keys) {
      if (val && typeof val === "object" && k in val) {
        val = val[k];
      } else {
        val = null;
        break;
      }
    }

    if (val !== null && val !== undefined) {
      return val;
    }

    // Fallback to en-IN
    let fallbackVal = localeFiles["en-IN"];
    for (const k of keys) {
      if (fallbackVal && typeof fallbackVal === "object" && k in fallbackVal) {
        fallbackVal = fallbackVal[k];
      } else {
        fallbackVal = null;
        break;
      }
    }

    if (fallbackVal !== null && fallbackVal !== undefined) {
      return fallbackVal;
    }

    return defaultVal !== undefined ? defaultVal : key;
  };

  return (
    <LanguageContext.Provider value={{ locale, shortCode: locale.substring(0, 2), changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
}
