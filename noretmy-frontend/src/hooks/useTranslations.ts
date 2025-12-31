import { useTranslation } from 'react-i18next';

export const useTranslations = () => {
  const { t, i18n } = useTranslation();

  const changeLanguage = async (language: string) => {
    try {
      await i18n.changeLanguage(language);
      localStorage.setItem('i18nextLng', language);
      return true;
    } catch (error) {
      console.error('Error changing language:', error);
      return false;
    }
  };

  const getCurrentLanguage = () => i18n.language;

  const getAvailableLanguages = () => i18n.languages;

  return {
    t,
    i18n,
    changeLanguage,
    getCurrentLanguage,
    getAvailableLanguages,
  };
}; 