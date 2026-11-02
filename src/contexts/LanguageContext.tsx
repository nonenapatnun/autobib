import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppLanguage = 'th' | 'en';

interface LanguageContextType {
  lang: AppLanguage;
  setLang: (lang: AppLanguage) => void;
  toggleLang: () => void;
  t: (thText: string, enText: string) => string;
}

const STORAGE_KEY = 'autobiblio_ui_language';

const LanguageContext = createContext<LanguageContextType>({
  lang: 'th',
  setLang: () => {},
  toggleLang: () => {},
  t: (thText: string) => thText,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<AppLanguage>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'en' || saved === 'th') {
        return saved;
      }
    } catch {
      // ignore storage errors
    }
    return 'th';
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = lang;
    } catch {
      // ignore storage errors
    }
  }, [lang]);

  const setLang = (newLang: AppLanguage) => {
    setLangState(newLang);
  };

  const toggleLang = () => {
    setLangState((prev) => (prev === 'th' ? 'en' : 'th'));
  };

  const t = (thText: string, enText: string): string => {
    return lang === 'en' ? enText : thText;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
