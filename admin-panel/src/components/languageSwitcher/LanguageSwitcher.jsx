import React, { useContext } from 'react';
import { useLocalization } from '../../context/LocalizationContext';
import { DarkModeContext } from '../../context/darkModeContext';

const LanguageSwitcher = () => {
  const { currentLanguage, changeLanguage } = useLocalization();
  const { darkMode } = useContext(DarkModeContext);

  const handleLanguageChange = (language) => {
    changeLanguage(language);
  };

  const getButtonClass = (lang) => {
    const isActive = currentLanguage === lang;
    
    if (isActive) {
      return "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 bg-orange-500 text-white";
    }
    
    return `px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
      darkMode 
        ? 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white' 
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
    }`;
  };

  return (
    <div className={`flex items-center gap-1 p-1 rounded-xl ${
      darkMode ? 'bg-white/5' : 'bg-gray-100'
    }`}>
      <button
        className={getButtonClass('en')}
        onClick={() => handleLanguageChange('en')}
      >
        EN
      </button>
      <button
        className={getButtonClass('es')}
        onClick={() => handleLanguageChange('es')}
      >
        ES
      </button>
    </div>
  );
};

export default LanguageSwitcher;