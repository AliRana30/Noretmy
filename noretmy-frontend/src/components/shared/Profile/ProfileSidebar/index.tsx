'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
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
  Circle,
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

const formatMemberSince = (createdAt: string): string => {
  if (!createdAt) return 'Recently';
  const date = new Date(createdAt);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
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
              <div className="relative w-20 h-20 rounded-full border-4 border-white shadow-md overflow-hidden bg-gray-100">
                <Image
                  src={profileData.profilePicture || '/images/placeholder-avatar.png'}
                  alt={profileData.fullName || 'User'}
                  fill
                  className="object-cover"
                />
              </div>
              {/* Online Status Indicator */}
              <div className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white ${profileData.isOnline ? 'bg-orange-500' : 'bg-gray-400'
                }`} />
            </div>

            {/* User Info */}
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {profileData.fullName || 'User'}
              </h3>
              <p className="text-sm text-gray-500 truncate">@{profileData.username || 'username'}</p>

              {/* Online Status Text */}
              <div className="flex items-center gap-1.5 text-sm">
                <Circle className={`w-2.5 h-2.5 ${profileData.isOnline ? 'text-orange-500 fill-orange-500' : 'text-gray-400 fill-gray-400'}`} />
                <span className={profileData.isOnline ? 'text-orange-600' : 'text-gray-500'}>
                  {profileData.isOnline ? t('profile:sidebar.status.online', 'Online') : t('profile:sidebar.status.offline', 'Offline')}
                </span>
              </div>

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
