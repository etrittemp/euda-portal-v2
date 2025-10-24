import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language } from '../i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Try to load language from localStorage
    const saved = localStorage.getItem('appLanguage');
    if (saved && ['en', 'sq', 'sr'].includes(saved)) {
      return saved as Language;
    }

    // Try to detect from browser
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('sq')) return 'sq';
    if (browserLang.startsWith('sr')) return 'sr';

    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('appLanguage', lang);
  };

  useEffect(() => {
    // Update HTML lang attribute
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
