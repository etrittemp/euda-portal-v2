import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Language } from '../i18n/translations';

interface LanguageSelectorProps {
  variant?: 'default' | 'compact';
  className?: string;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'default',
  className = ''
}) => {
  const { language, setLanguage } = useLanguage();

  const languages: { code: Language; name: string; nativeName: string }[] = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'sq', name: 'Albanian', nativeName: 'Shqip' },
    { code: 'sr', name: 'Serbian', nativeName: 'Српски' },
  ];

  if (variant === 'compact') {
    return (
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
        className={`px-3 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${className || 'bg-white border border-gray-300 text-gray-900'}`}
        style={{ color: className?.includes('text-white') ? 'white' : undefined }}
        aria-label="Select language"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code} className="text-gray-900 bg-white">
            {lang.nativeName}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Globe className="w-5 h-5 text-gray-600" />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
        className="px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        aria-label="Select language"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeName}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;
