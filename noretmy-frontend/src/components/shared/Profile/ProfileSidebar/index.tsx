'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import FallbackAvatar from '@/components/shared/FallbackAvatar';
import {
  User,
  MessageSquare,
  ShoppingBag,
  Briefcase,
  FolderOpen,
  Star,
  DollarSign,
  Settings,
  Plus,
  Megaphone,
  Edit3,
} from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';

interface ProfileSidebarProps {
  profileData: {
    fullName: string;
    username: string;
    profilePicture: string;
    profileHeadline?: string;
    createdAt: string;
    isOnline?: boolean;
  };
  isSeller: boolean;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const getNavigationItems = (isSeller: boolean, t: any) => {
  const items = [
    { id: 'profile', label: t('profile:sidebar.nav.profile', 'Profile'), icon: User },
    { id: 'messages', label: t('profile:sidebar.nav.messages', 'Messages'), icon: MessageSquare, href: '/chat' },
    { id: 'orders', label: t('profile:sidebar.nav.orders', 'Orders'), icon: ShoppingBag },
    { id: 'gigs', label: t('profile:sidebar.nav.gigs', 'Gigs'), icon: Briefcase, sellerOnly: true },
    { id: 'portfolio', label: t('profile:sidebar.nav.portfolio', 'Portfolio'), icon: FolderOpen, sellerOnly: true },
    { id: 'reviews', label: t('profile:sidebar.nav.reviews', 'Reviews'), icon: Star },
    { id: 'earnings', label: t('profile:sidebar.nav.earnings', 'Earnings'), icon: DollarSign, sellerOnly: true },

  ];

  return items.filter(item => !item.sellerOnly || isSeller);
};

const getQuickActions = (isSeller: boolean, t: any) => {
  if (!isSeller) return [];

  return [
    { id: 'create-gig', label: t('profile:sidebar.actions.createGig', 'Create New Gig'), icon: Plus, href: '/create-new' },
    { id: 'add-project', label: t('profile:sidebar.actions.addProject', 'Add Project'), icon: FolderOpen, href: '/portfolio' },
    { id: 'promote-gigs', label: t('profile:sidebar.actions.promoteGigs', 'Promote Gigs'), icon: Megaphone, href: '/promote-gigs' },
    { id: 'edit-profile', label: t('profile:sidebar.actions.editProfile', 'Edit Profile'), icon: Edit3, href: '/settings' },
  ];
};

// Moved inside component to have access to t function
const createFormatMemberSince = (t: any) => (createdAt: string): string => {
  if (!createdAt) return t('profile:sidebar.recently', 'Recently');
  const date = new Date(createdAt);
  // Use navigator.language for locale-aware formatting
  const locale = typeof window !== 'undefined' ? navigator.language : 'en-US';
  return date.toLocaleDateString(locale, { month: 'short', year: 'numeric' });
};

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
  profileData,
  isSeller,
  activeSection,
  onSectionChange,
}) => {
  const router = useRouter();
  const { t } = useTranslations();

  const navigationItems = getNavigationItems(isSeller, t);
  const quickActions = getQuickActions(isSeller, t);
  const formatMemberSince = createFormatMemberSince(t);

  const handleNavClick = (item: any) => {
    if (item.href) {
      router.push(item.href);
    } else {
      onSectionChange(item.id);
    }
  };

  return (
    <aside className="w-full lg:w-72 flex-shrink-0 max-w-full overflow-hidden">
      <div className="sticky top-24 space-y-4">
        {/* User Info Card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {/* Header Background */}
          <div className="h-16 bg-gradient-to-r from-orange-600 to-orange-400" />

          {/* Profile Content */}
          <div className="px-5 pb-5">
            {/* Avatar */}
            <div className="relative -mt-10 mb-3">
              <div className="relative">
                <FallbackAvatar
                  src={profileData.profilePicture}
                  alt={profileData.fullName || 'User'}
                  name={profileData.fullName}
                  className="border-4 border-white shadow-md"
                  size="lg"
                />
              </div>
            </div>

            {/* User Info */}
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {profileData.fullName || 'User'}
              </h3>
              <p className="text-sm text-gray-500 truncate">@{profileData.username || 'username'}</p>

              {/* Member Since */}
              <p className="text-xs text-gray-400 pt-1">
                {t('profile:sidebar.memberSince', 'Member since')} {formatMemberSince(profileData.createdAt)}
              </p>

              {/* Bio/Headline */}
              {profileData.profileHeadline && (
                <p className="text-sm text-gray-600 pt-2 line-clamp-2">
                  {profileData.profileHeadline}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {t('profile:sidebar.navigation', 'Navigation')}
            </h4>
          </div>
          <nav className="py-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all duration-200 ${isActive
                    ? 'bg-orange-50 text-orange-600 font-semibold border-l-3 border-orange-500'
                    : 'text-slate-600 hover:bg-gray-50 hover:text-slate-900 border-l-3 border-transparent'
                    }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-orange-500' : 'text-slate-400'}`} />
                  <span className="text-sm">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
};

export default ProfileSidebar;
