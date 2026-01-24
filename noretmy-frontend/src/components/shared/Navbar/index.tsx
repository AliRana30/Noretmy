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
import { PackageIcon, SearchIcon, Heart, ChevronDown } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { logoutUser } from '@/store/authSlice';
import { useRouter } from 'next/navigation';
import LanguageSwitcher from '@/components/shared/LanguageSwitcher';
import { useTranslations } from '@/hooks/useTranslations';
import NotificationBell from '@/components/shared/NotificationBell';

const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23f97316'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";

const Navbar: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchType, setSearchType] = useState<'services' | 'freelancers'>('services');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;
  const { t } = useTranslations();

  const user = useSelector((state: any) => (state?.auth?.user));
  const isLoggedIn = mounted && !!user; // Only check after mount to avoid hydration mismatch
  const isSeller = user?.isSeller || false;

  const dispatch = useDispatch();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include', // Ensure cookies are cleared
      });

      if (response.ok) {
        dispatch(logoutUser());

        router.push('/login');
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    const path = searchType === 'services'
      ? `/search-gigs?q=${encodeURIComponent(searchQuery.trim())}`
      : `/freelancer?q=${encodeURIComponent(searchQuery.trim())}`;
    
    // Delay navigation slightly for loading bar animation
    setTimeout(() => {
      router.push(path);
      setSearchQuery('');
      // Reset after navigation
      setTimeout(() => setIsSearching(false), 800);
    }, 150);
  };

  const ProfileModal = () => {
    const [onlineForMessages, setOnlineForMessages] = useState(true);

    const profileModalList = [
      {
        icon: <UserCircleIcon className="h-5 w-5" />,
        text: t('navbar:profile.title'),
        href: '/profile',
      },
      {
        icon: <Heart className="h-5 w-5" />,
        text: t('navbar:profile.favorites'),
        href: '/favorites',
      },
      {
        icon: <CreditCardIcon className="h-5 w-5" />,
        text: t('navbar:profile.payments'),
        href: '/seller-board',
        showForSeller: true,
      },
      {
        icon: <PackageIcon className="h-5 w-5" />,
        text: t('navbar:navigation.orders'),
        href: '/orders',
      },
      {
        icon: <BellIcon className="h-5 w-5" />,
        text: t('navbar:profile.notifications'),
        href: '/notifications',
      },
      {
        icon: <MegaphoneIcon className="h-5 w-5" />,
        text: t('navbar:profile.promote'),
        href: '/promote-gigs',
        showForSeller: true,
      }
    ];

    if (!isModalOpen) return null;

    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center px-4"
        onClick={() => setIsModalOpen(false)}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/30" />

        {/* Modal - Reference Style */}
        <div
          className="relative bg-white rounded-2xl shadow-xl w-full max-w-[360px] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Profile Header - Clean White Background */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt="Profile"
                    className="h-12 w-12 rounded-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).onerror = null; (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }}
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <img src={DEFAULT_AVATAR} alt="Default Avatar" className="h-7 w-7" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-gray-900 truncate">
                  {user?.fullName || user?.username || 'User'}
                </h3>
                <p className="text-sm text-gray-500 truncate">
                  {user?.isSeller ? 'Freelancer' : 'Client'}
                </p>
              </div>
            </div>
          </div>

          {/* Online Toggle */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-normal text-gray-900">Online for messages</span>
              <button
                onClick={() => setOnlineForMessages(!onlineForMessages)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  onlineForMessages ? 'bg-orange-500' : 'bg-gray-300'
                }`}
                role="switch"
                aria-checked={onlineForMessages}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    onlineForMessages ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Profile Actions - Outline Icons */}
          <div className="py-2">
            {profileModalList.map((item, index) => {
              if (!user?.isSeller && item.showForSeller === true) {
                return null;
              }
              return (
                <Link
                  onClick={() => setIsModalOpen(false)}
                  key={index}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-orange-50 transition-colors group"
                >
                  <div className="text-gray-700 group-hover:text-orange-600 transition-colors">
                    {item.icon}
                  </div>
                  <span className="text-sm font-normal text-gray-900 group-hover:text-orange-600 transition-colors">
                    {item.text}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Language Switcher */}
          <div className="border-t border-gray-100">
            <div className="flex items-center gap-3 px-4 py-3">
              <LanguageIcon className="h-5 w-5 text-gray-700" />
              <span className="text-sm font-normal text-gray-900">{t('navbar:profile.language')}:</span>
              <div className="ml-auto">
                <LanguageSwitcher />
              </div>
            </div>
          </div>

          {/* Logout/Login Action */}
          <div className="border-t border-gray-100">
            {user ? (
              <button
                onClick={() => {
                  handleLogout();
                  setIsModalOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors group"
              >
                <UserCircleIcon className="h-5 w-5 text-gray-700 group-hover:text-red-600 transition-colors" />
                <span className="text-sm font-normal text-gray-900 group-hover:text-red-600 transition-colors">
                  {t('navbar:auth.logout')}
                </span>
              </button>
            ) : (
              <Link
                onClick={() => setIsModalOpen(false)}
                href="/login"
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50 transition-colors group"
              >
                <UserCircleIcon className="h-5 w-5 text-gray-700 group-hover:text-orange-600 transition-colors" />
                <span className="text-sm font-normal text-gray-900 group-hover:text-orange-600 transition-colors">
                  {t('navbar:auth.signIn')}
                </span>
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  };

  const navigationItems = [
    {
      icon: <UserCircleIcon className="h-5 w-5 mr-1" />,
      text: t('navbar:navigation.about') || 'About',
      href: '/about',
    },
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
      {/* Loading Bar */}
      {isSearching && (
        <div className="fixed top-0 left-0 right-0 z-[70] h-1 bg-gray-200 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-orange-400 to-orange-500 animate-progress" />
        </div>
      )}
      
      <nav className="bg-white shadow-md h-16 sm:h-20 flex items-center w-full sticky top-0 z-[60]">
        <div className="container mx-auto px-4 flex justify-between items-center gap-4">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
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
          </div>

          {/* Search Bar - Desktop Only - Upwork Style */}
          <div className="hidden lg:flex flex-1 max-w-xl mx-4">
            <form onSubmit={handleSearch} className="flex items-center w-full bg-white border border-gray-300 rounded-full overflow-hidden hover:border-gray-400 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
              {/* Search Icon + Input */}
              <div className="flex items-center flex-1 pl-4">
                <SearchIcon className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search"
                  className="w-full py-2.5 text-sm text-gray-900 placeholder-gray-500 bg-transparent outline-none"
                />
              </div>

              {/* Vertical Divider */}
              <div className="h-8 w-px bg-gray-300 mx-2"></div>

              {/* Dropdown Selector */}
              <div className="relative flex-shrink-0">
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value as 'services' | 'freelancers')}
                  className="appearance-none bg-transparent pl-3 pr-10 py-2.5 text-sm font-medium text-gray-700 cursor-pointer outline-none hover:text-gray-900 transition-colors"
                >
                  <option value="services">Jobs</option>
                  <option value="freelancers">Freelancers</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
            </form>
          </div>

          {/* Navigation Links - Desktop */}
          <div className="hidden lg:flex items-center space-x-2">
            {navigationItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className="flex items-center text-gray-600 hover:text-orange-600 transition-colors px-3 py-2 rounded-lg text-sm"
              >
                {item.icon}
                {item.text}
              </Link>
            ))}
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
                      className="h-7 w-7 sm:h-8 sm:w-8 rounded-full object-cover border-2 border-gray-200 hover:border-orange-400 transition-colors"
                      onError={(e) => { (e.target as HTMLImageElement).onerror = null; (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }}
                    />
                  ) : (
                    <img src={DEFAULT_AVATAR} alt="Default Avatar" className="h-7 w-7 sm:h-8 sm:w-8 text-gray-500 hover:text-orange-600" />
                  )}
                </button>
              </>
            ) : (
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
                  className="flex items-center text-gray-700 hover:text-orange-600 hover:bg-gray-50 transition-colors px-4 py-3 rounded-lg text-lg"
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
      
      {/* CSS Animation for Loading Bar */}
      <style jsx>{`
        @keyframes progress {
          0% { width: 0%; }
          50% { width: 50%; }
          80% { width: 80%; }
          100% { width: 95%; }
        }
        .animate-progress {
          animation: progress 1.5s ease-out forwards;
        }
      `}</style>
    </>
  );
};

export default Navbar;