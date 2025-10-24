import { useLanguage } from '../contexts/LanguageContext';
import { translations, Translations } from '../i18n/translations';

export const useTranslation = () => {
  const { language } = useLanguage();

  const t = (key: keyof Translations): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  return { t, language };
};
