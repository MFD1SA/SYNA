import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { translations, type Language, type TranslationKey } from "./translations";

interface LanguageContextType {
  lang: Language;
  dir: "rtl" | "ltr";
  t: TranslationKey;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem("doma-lang");
    return (saved === "en" ? "en" : "ar") as Language;
  });

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === "ar" ? "en" : "ar"));
  }, []);

  useEffect(() => {
    localStorage.setItem("doma-lang", lang);
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang]);

  const value: LanguageContextType = {
    lang,
    dir: lang === "ar" ? "rtl" : "ltr",
    t: translations[lang],
    toggleLang,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};
