import { createContext, useState, useEffect, useContext } from "react";
import i18n from "../i18n";

export const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return {
    ...context,
    t: (key, options) => i18n.t(key, options),
  };
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    // Initialize language from localStorage or default to 'vi'
    return localStorage.getItem("language") || "vi";
  });

  useEffect(() => {
    // Set i18n language when component mounts or currentLanguage changes
    i18n.changeLanguage(currentLanguage);
    localStorage.setItem("language", currentLanguage);
  }, [currentLanguage]);

  const changeLanguage = (lang) => {
    setCurrentLanguage(lang);
  };

  return <LanguageContext.Provider value={{ currentLanguage, changeLanguage }}>{children}</LanguageContext.Provider>;
};
