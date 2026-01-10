'use client';

import { Poppins } from 'next/font/google';
import './globals.css';
import Footer from '@/components/ui/Footer';

import Navbar from '@/components/shared/Navbar';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from '@/store/store';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '@/i18n';
import { useEffect } from 'react';
import i18next from 'i18next';
import { Toaster } from 'react-hot-toast';
import { NotificationProvider } from '@/context/NotificationContext';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Change language on client side if saved in localStorage
  useEffect(() => {
    const savedLang = localStorage.getItem('i18nextLng');
    if (savedLang && i18next.language !== savedLang) {
      i18next.changeLanguage(savedLang);
    }
  }, []);

  return (
    <html lang={i18next.language} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo/noretmy_logo.png" />
        <title>Noretmy</title>
        <meta name="description" content="Providing solutions for your business" />
      </head>
      <body className={poppins.className}>
        <ReduxProvider store={store}>
          <NotificationProvider>
            <Navbar />
            {children}
            <ToastContainer position="top-right" autoClose={4000} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover style={{ zIndex: 99999 }} />
            <Toaster
              position="top-right"
              containerStyle={{ zIndex: 99999 }}
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                  zIndex: 99999,
                },
                success: {
                  style: {
                    background: '#22c55e',
                  },
                  iconTheme: {
                    primary: '#fff',
                    secondary: '#22c55e',
                  },
                },
                error: {
                  style: {
                    background: '#ef4444',
                  },
                  iconTheme: {
                    primary: '#fff',
                    secondary: '#ef4444',
                  },
                },
              }}
            />

            <Footer />
          </NotificationProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
