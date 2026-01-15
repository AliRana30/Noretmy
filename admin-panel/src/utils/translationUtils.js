import { useLocalization } from '../context/LocalizationContext';

export const useTranslations = (translations) => {
  const { getTranslation } = useLocalization();
  
  return (key) => getTranslation(translations, key);
};

export const formatDate = (date, language) => {
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  return new Date(date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', options);
};

export const formatCurrency = (amount, language) => {
  return new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

export const getMonthName = (monthIndex, language) => {
  const months = {
    en: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ],
    es: [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]
  };
  
  return months[language][monthIndex];
}; 