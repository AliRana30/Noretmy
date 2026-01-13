export function getOptions(lng = 'en') {
  return {
    lng,
    fallbackLng: 'en',
    supportedLngs: ['en', 'es'],
    defaultNS: 'common',
    ns: [
      'common',
      'auth',
      'navigation',
      'gigs',
      'orders',
      'profile',
      'home',
      'chat',
      'navbar',
      'search',
      'order-request',
      'notifications',
      'favorites',
      'footer',
    ],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    react: {
      useSuspense: false,
    },
  };
}
