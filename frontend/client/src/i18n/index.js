import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import vi from "./locales/vi/translation.json";
import en from "./locales/en/translation.json";

// 🔧 Cấu hình i18n
i18n.use(initReactI18next).init({
  resources: {
    vi: { translation: vi },
    en: { translation: en },
  },
  lng: localStorage.getItem("language") || "vi", // Ngôn ngữ mặc định
  fallbackLng: "vi",
  debug: false,

  interpolation: {
    escapeValue: false, // React đã tự escape rồi
  },
});

export default i18n;
