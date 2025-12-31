'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  HomeIcon,
  CreditCardIcon,
  UserCircleIcon,
  ChatBubbleLeftEllipsisIcon,
  CogIcon,
  BellIcon,
  MegaphoneIcon,
  LanguageIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { PackageIcon, SearchIcon, Heart } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { logoutUser } from '@/store/authSlice';
import { useRouter } from 'next/navigation';
import LanguageSwitcher from '@/components/shared/LanguageSwitcher';
import { useTranslations } from '@/hooks/useTranslations';
import NotificationBell from '@/components/shared/NotificationBell';

const Navbar: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;
  const { t } = useTranslations();

  const user = useSelector((state: any) => (state?.auth?.user));
  const isLoggedIn = mounted && !!user; // Only check after mount to avoid hydration mismatch
  const isSeller = user?.isSeller || false;

  const dispatch = useDispatch();
  const router = useRouter();

  // Mark as mounted after client-side hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      // Call the backend API to log out
      const response = await fetch(`${BACKEND_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include', // Ensure cookies are cleared
      });

      if (response.ok) {
        // Clear Redux state
        dispatch(logoutUser());

        // Redirect to login page
        router.push('/login');
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const ProfileModal = () => {
    const profileModalList = [
      {
        icon: <UserCircleIcon className="h-5 w-5 mr-3 text-orange-500" />,
        text: t('navbar:profile.title'),
        href: '/profile',
      },
      {
        icon: <Heart className="h-5 w-5 mr-3 text-red-500" />,
        text: t('navbar:profile.favorites'),
        href: '/favorites',
      },
      {
        icon: <CreditCardIcon className="h-5 w-5 mr-3 text-blue-500" />,
        text: t('navbar:profile.payments'),
        href: '/seller-board',
        showForSeller: true,
      },
      {
        icon: <PackageIcon className="h-5 w-5 mr-3 text-orange-500" />,
        text: t('navbar:navigation.orders'),
        href: '/orders',
      },
      {
        icon: <BellIcon className="h-5 w-5 mr-3 text-blue-500" />,
        text: t('navbar:profile.notifications'),
        href: '/notifications',
      },
      {
        icon: <MegaphoneIcon className="h-5 w-5 mr-3 text-orange-500" />,
        text: t('navbar:profile.promote'),
        href: '/promote-gigs',
        showForSeller: true, // <-- only show if NOT seller
      }
    ];

    if (!isModalOpen) return null;

    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center px-4"
        onClick={() => setIsModalOpen(false)}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Modal */}
        <div
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-[calc(100vw-2rem)] sm:max-w-sm overflow-hidden transform transition-all duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6">
            <div className="flex items-center space-x-4">
              <div className="relative flex-shrink-0">
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt="Profile"
                    className="h-16 w-16 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center shadow-lg">
                    <UserCircleIcon className="h-10 w-10 text-orange-500" />
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-orange-400 rounded-full border-3 border-white"></div>
              </div>
              <div className="flex-1 text-white min-w-0">
                <h2 className="text-lg font-bold truncate">
                  {user?.fullName || user?.username || 'User'}
                </h2>
                <p className="text-sm text-orange-100 truncate">
                  {user?.email || ''}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20"
                aria-label={t('navbar:aria.closeModal')}
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Profile Actions */}
          <div className="p-4 space-y-1 max-h-[50vh] overflow-y-auto">
            {profileModalList.map((item, index) => {
              if (!user?.isSeller && item.showForSeller === true) {
                return null;
              }
              return (
                <Link
                  onClick={() => setIsModalOpen(false)}
                  key={index}
                  href={item.href}
                  className="flex items-center p-3 hover:bg-gray-50 rounded-xl transition-all duration-200 group"
                >
                  {item.icon}
                  <span className="text-gray-700 group-hover:text-gray-900 font-medium">
                    {item.text}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Language Switcher */}
          <div className="px-4 pb-4">
            <div className="flex items-center p-3 bg-gray-50 rounded-xl">
              <LanguageIcon className="h-5 w-5 mr-3 text-gray-500" />
              <span className="text-gray-700 font-medium mr-3">{t('navbar:profile.language')}:</span>
              <div className="ml-auto">
                <LanguageSwitcher />
              </div>
            </div>
          </div>

          {/* Logout/Login Action */}
          <div className="p-4 border-t border-gray-100">
            {user ? (
              <button
                onClick={() => {
                  handleLogout();
                  setIsModalOpen(false);
                }}
                className="w-full flex items-center justify-center p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all duration-200 font-medium"
              >
                <UserCircleIcon className="h-5 w-5 mr-2" />
                {t('navbar:auth.logout')}
              </button>
            ) : (
              <Link
                onClick={() => setIsModalOpen(false)}
                href="/login"
                className="w-full flex items-center justify-center p-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-all duration-200 font-medium"
              >
                <UserCircleIcon className="h-5 w-5 mr-2" />
                {t('navbar:auth.signIn')}
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  };

  const navigationItems = [
    {
      icon: <HomeIcon className="h-5 w-5 mr-1" />,
      text: t('navbar:navigation.home'),
      href: '/',
    },
    // Conditionally show Search Gigs for sellers only
    ...(!isSeller ? [
      {
        icon: <SearchIcon className="h-5 w-5 mr-1" />,
        text: t('navbar:navigation.searchServices'),
        href: '/search-gigs',
      }
    ] : [
      {
        icon: <PackageIcon className="h-5 w-5 mr-1" />,
        text: t('navbar:navigation.orders'),
        href: '/orders',
      }
    ]),
    {
      icon: <ChatBubbleLeftEllipsisIcon className="h-5 w-5 mr-1" />,
      text: t('navbar:navigation.chat'),
      href: '/chat',
    },
  ];

  return (
    <>
      <nav className="bg-white shadow-md h-16 sm:h-20 flex items-center w-full sticky top-0 z-[60]">
        <div className="container mx-auto px-4 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center space-x-6">
            <Link href="/">
              <Image
                src="/logo/tagslogo.png"
                alt={t('navbar:aria.logo')}
                width={140}
                height={60}
                className="h-12 sm:h-14 w-auto max-w-[120px] sm:max-w-none object-contain"
                priority
              />
            </Link>

            {/* Navigation Links - Desktop */}
            <div className="hidden lg:flex items-center space-x-4">
              {navigationItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className="flex items-center text-gray-600 hover:text-blue-600 transition-colors px-3 py-2 rounded-lg"
                >
                  {item.icon}
                  {item.text}
                </Link>
              ))}
            </div>
          </div>

          {/* Profile and Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Language Switcher - Always visible on desktop */}
            <div className="hidden lg:flex items-center">
              <div className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                <LanguageIcon className="h-5 w-5 text-gray-500" />
                <LanguageSwitcher />
              </div>
            </div>

            {isLoggedIn ? (
              <>
                {/* Notification Bell */}
                <NotificationBell />

                {/* Profile Icon for logged-in users */}
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="hover:bg-gray-100 p-2 rounded-full transition-colors flex-shrink-0"
                  aria-label={t('navbar:aria.profileButton')}
                >
                  {user?.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt="Profile"
                      className="h-7 w-7 sm:h-8 sm:w-8 rounded-full object-cover border-2 border-gray-200 hover:border-blue-400 transition-colors"
                    />
                  ) : (
                    <UserCircleIcon className="h-7 w-7 sm:h-8 sm:w-8 text-gray-500 hover:text-blue-600" />
                  )}
                </button>
              </>
            ) : (
              // Sign in and Join buttons for non-logged-in users
              <div className="hidden sm:flex items-center space-x-3">
                <Link
                  href="/login"
                  className="px-4 py-2 text-gray-800 font-medium hover:text-black transition-colors rounded-lg border border-gray-300 bg-white hover:bg-gray-100"
                >
                  {t('navbar:auth.signIn')}
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors rounded-lg shadow-sm"
                >
                  {t('navbar:auth.join')}
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6 text-gray-600" />
              ) : (
                <Bars3Icon className="h-6 w-6 text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-16 sm:top-20 bg-white z-30 overflow-y-auto">
          <div className="container mx-auto px-4 py-6">
            {/* Mobile Navigation Links */}
            <div className="space-y-2 mb-6">
              {navigationItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors px-4 py-3 rounded-lg text-lg"
                >
                  {item.icon}
                  <span className="ml-2">{item.text}</span>
                </Link>
              ))}
            </div>

            {/* Language Switcher for Mobile */}
            <div className="border-t border-gray-100 pt-4 mb-4">
              <div className="flex items-center px-4 py-3 bg-gray-50 rounded-lg">
                <LanguageIcon className="h-5 w-5 text-gray-500 mr-3" />
                <span className="text-gray-700 font-medium mr-3">{t('navbar:profile.language')}:</span>
                <LanguageSwitcher />
              </div>
            </div>

            {/* Auth buttons for mobile (non-logged in users) */}
            {!isLoggedIn && (
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full text-center px-4 py-3 text-gray-800 font-medium hover:text-black transition-colors rounded-lg border border-gray-300 bg-white hover:bg-gray-100"
                >
                  {t('navbar:auth.signIn')}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full text-center px-4 py-3 bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors rounded-lg shadow-sm"
                >
                  {t('navbar:auth.join')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Profile Modal */}
      <ProfileModal />
    </>
  );
};

export default Navbar;