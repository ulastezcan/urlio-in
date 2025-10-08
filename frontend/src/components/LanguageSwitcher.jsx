import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  return (
    <div className="flex space-x-2">
      <button
        onClick={() => changeLanguage('en')}
        className={`flex items-center px-2 py-1 rounded text-sm ${
          i18n.language === 'en' 
            ? 'bg-blue-100 text-blue-800' 
            : 'text-gray-600 hover:text-blue-600'
        }`}
      >
        🇬🇧 EN
      </button>
      <button
        onClick={() => changeLanguage('tr')}
        className={`flex items-center px-2 py-1 rounded text-sm ${
          i18n.language === 'tr' 
            ? 'bg-blue-100 text-blue-800' 
            : 'text-gray-600 hover:text-blue-600'
        }`}
      >
        🇹🇷 TR
      </button>
    </div>
  );
};

export default LanguageSwitcher;