'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import ProfileCard from '@/components/shared/Profile/ProfileCard';
import Gigs from '@/components/shared/Profile/ProfileGigGrid';
import UserDetailsCard from '@/components/shared/Profile/SellerDetails';
import ProjectsPortfolioSection from '../portfolio';
import ProfileReviews from './ProfileReviews';
import ProfileOrders from './ProfileOrders';
import ProfileSidebar from './ProfileSidebar';
import ProfileEarnings from './ProfileEarnings';
import { useUserRole } from '@/util/basic';
import { useDispatch } from 'react-redux';
import { updateProfilePicture } from '@/store/authSlice';
import toast from 'react-hot-toast';
import { Briefcase, FolderOpen, Star, ShoppingBag, DollarSign, User } from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';

// Helper function to calculate member since duration
const calculateMemberSince = (createdAt: string): string => {
  if (!createdAt) return 'Recently';
  const now = new Date();
  const created = new Date(createdAt);
  const diffMs = now.getTime() - created.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 1) return 'Today';
  if (diffDays === 1) return '1 day';
  if (diffDays < 30) return `${diffDays} days`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return '1 month';
  if (diffMonths < 12) return `${diffMonths} months`;
  const diffYears = Math.floor(diffMonths / 12);
  if (diffYears === 1) return '1 year';
  return `${diffYears} years`;
};

// Skeleton loaders for each section
const SectionSkeleton = ({ type }: { type: string }) => {
  switch (type) {
    case 'profile':
      return (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-start gap-6">
              <div className="skeleton w-24 h-24 rounded-full" />
              <div className="flex-1 space-y-3">
                <div className="skeleton h-6 w-48" />
                <div className="skeleton h-4 w-32" />
                <div className="skeleton h-4 w-64" />
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="skeleton h-5 w-32 mb-4" />
            <div className="skeleton h-20 w-full" />
          </div>
        </div>
      );
    case 'gigs':
    case 'portfolio':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="skeleton h-40 w-full rounded-lg mb-4" />
              <div className="skeleton h-5 w-3/4 mb-2" />
              <div className="skeleton h-4 w-1/2" />
            </div>
          ))}
        </div>
      );
    case 'reviews':
      return (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="skeleton w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-32" />
                  <div className="skeleton h-3 w-24" />
                  <div className="skeleton h-16 w-full mt-2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    case 'orders':
      return (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="skeleton h-5 w-48" />
                  <div className="skeleton h-4 w-32" />
                </div>
                <div className="skeleton h-8 w-24 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      );
    case 'earnings':
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="skeleton h-4 w-24 mb-2" />
                <div className="skeleton h-8 w-32" />
              </div>
            ))}
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="skeleton h-5 w-40 mb-4" />
            <div className="skeleton h-64 w-full" />
          </div>
        </div>
      );
    default:
      return <div className="skeleton h-64 w-full rounded-xl" />;
  }
};

// Empty state component
const EmptyState = ({ section, isSeller, t }: { section: string; isSeller: boolean; t: any }) => {
  const emptyStates: Record<string, { icon: any; title: string; description: string; action?: { label: string; href: string } }> = {
    gigs: {
      icon: Briefcase,
      title: t('profile:empty.gigs.title', 'No Gigs Yet'),
      description: t('profile:empty.gigs.description', 'Create your first gig to start selling your services.'),
      action: { label: t('profile:empty.gigs.action', 'Create Gig'), href: '/create-new' },
    },
    portfolio: {
      icon: FolderOpen,
      title: t('profile:empty.portfolio.title', 'No Projects Yet'),
      description: t('profile:empty.portfolio.description', 'Add your best work to showcase your skills.'),
      action: { label: t('profile:empty.portfolio.action', 'Add Project'), href: '/portfolio' },
    },
    reviews: {
      icon: Star,
      title: t('profile:empty.reviews.title', 'No Reviews Yet'),
      description: t('profile:empty.reviews.description', 'Complete orders to receive reviews from clients.'),
    },
    orders: {
      icon: ShoppingBag,
      title: t('profile:empty.orders.title', 'No Orders Yet'),
      description: t('profile:empty.orders.description', isSeller ? 'Orders will appear here when clients purchase your services.' : 'Your orders will appear here when you make a purchase.'),
    },
    earnings: {
      icon: DollarSign,
      title: t('profile:empty.earnings.title', 'No Earnings Yet'),
      description: t('profile:empty.earnings.description', 'Complete orders to start earning.'),
    },
  };

  const state = emptyStates[section] || {
    icon: User,
    title: 'Nothing here yet',
    description: 'Content will appear here.',
  };

  const Icon = state.icon;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-50 mb-4">
        <Icon className="w-8 h-8 text-orange-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{state.title}</h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">{state.description}</p>
      {state.action && (
        <a
          href={state.action.href}
          className="inline-flex items-center px-4 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors"
        >
          {state.action.label}
        </a>
      )}
    </div>
  );
};

const ProfileSection = () => {
  const dispatch = useDispatch();
  const { t } = useTranslations();

  const [activeSection, setActiveSection] = useState('profile');
  const [sectionLoading, setSectionLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: '',
    username: '',
    location: '',
    country: '',
    countryCode: '',
    createdAt: '',
    profileHeadline: '',
    profilePicture: '',
    description: '',
    skills: [],
    reviews: [],
    averageRating: 0,
    revenue: {
      total: 0,
      available: 0,
      pending: 0,
      withdrawn: 0,
    },
    isOnline: true,
  });

  const [loading, setLoading] = useState(true);
  const [memberSince, setMemberSince] = useState('Recently');

  const isSeller = useUserRole();

  const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
  const apiBase = (BASE_URL || '').replace(/\/$/, '');
  const apiRoot = apiBase.endsWith('/api') ? apiBase : `${apiBase}/api`;

  // Fetch Profile Data
  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiRoot}/users/profile/seller`, {
        withCredentials: true,
      });
      const payload = response?.data?.data || response?.data;
      setProfileData((prev) => ({
        ...prev,
        ...(payload || {}),
        reviews: Array.isArray(payload?.reviews) ? payload.reviews : prev.reviews,
        revenue: payload?.revenue || prev.revenue,
        isOnline: true,
      }));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile data:', error);
      setLoading(false);
    }
  };

  // Update Profile Data
  const updateProfileData = async (updates: any) => {
    try {
      setSectionLoading(true);
      const response = await axios.put(`${apiRoot}/users/profile/`, updates, {
        withCredentials: true,
      });
      setProfileData((prev) => ({ ...prev, ...response.data }));
      setSectionLoading(false);
    } catch (error) {
      console.error('Error updating profile data:', error);
      setSectionLoading(false);
    }
  };

  // Handle Profile Picture Upload
  const uploadProfilePicture = async (file: File) => {
    try {
      if (!file) {
        toast.error('Please select a file');
        return;
      }

      const loadingToast = toast.loading('Uploading profile picture...');
      const fileName = file.name;
      const formData = new FormData();
      formData.append('images', file, fileName);

      const response = await axios.post(`${apiRoot}/upload`, formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.urls) {
        const newProfilePicture = response.data.urls[0];
        await updateProfileData({ profilePicture: newProfilePicture });
        dispatch(updateProfilePicture(newProfilePicture));
        toast.success('Profile picture updated successfully!', { id: loadingToast });
      } else {
        toast.error('Failed to upload profile picture', { id: loadingToast });
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast.error('Failed to upload profile picture');
    }
  };

  // Handle section change with loading state
  const handleSectionChange = (section: string) => {
    setSectionLoading(true);
    setActiveSection(section);
    setTimeout(() => setSectionLoading(false), 300);
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  useEffect(() => {
    if (profileData.createdAt) {
      setMemberSince(calculateMemberSince(profileData.createdAt));
    }
  }, [profileData.createdAt]);

  // Render the active section content
  const renderSectionContent = () => {
    if (sectionLoading) {
      return <SectionSkeleton type={activeSection} />;
    }

    switch (activeSection) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <ProfileCard
                isOnline={profileData.isOnline}
                profilePicture={profileData.profilePicture}
                name={profileData.fullName}
                tagline={profileData.profileHeadline}
                username={profileData.username}
                rating={profileData.averageRating}
                reviews={profileData.reviews.length}
                from={profileData.country || profileData.location || 'Not specified'}
                memberSince={memberSince}
                onUpdateTagline={(newTagline) =>
                  updateProfileData({ profileHeadline: newTagline })
                }
                onUpdateProfilePicture={(file) => uploadProfilePicture(file)}
              />
            </div>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <UserDetailsCard
                description={profileData.description}
                skills={profileData.skills}
                setDescription={(newDescription) =>
                  updateProfileData({ description: newDescription })
                }
                setSkills={(updatedSkills) =>
                  updateProfileData({ skills: updatedSkills })
                }
              />
            </div>
          </div>
        );

      case 'gigs':
        if (!isSeller) return <EmptyState section="gigs" isSeller={isSeller} t={t} />;
        return (
          <div id="gigs" className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-orange-500" />
                {t('profile:sections.gigs.title', 'My Services')}
              </h2>
              <a href="/create-new" className="text-sm text-orange-600 hover:text-orange-700 font-medium">
                + {t('profile:sections.gigs.createNew', 'Create New')}
              </a>
            </div>
            <Gigs />
          </div>
        );

      case 'portfolio':
        if (!isSeller) return <EmptyState section="portfolio" isSeller={isSeller} t={t} />;
        return (
          <div id="portfolio" className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-orange-500" />
                {t('profile:sections.portfolio.title', 'Portfolio')}
              </h2>
              <a href="/portfolio" className="text-sm text-orange-600 hover:text-orange-700 font-medium">
                + {t('profile:sections.portfolio.addProject', 'Add Project')}
              </a>
            </div>
            <ProjectsPortfolioSection />
          </div>
        );

      case 'reviews':
        return (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2 mb-6">
              <Star className="w-5 h-5 text-orange-500" />
              {t('profile:sections.reviews.title', 'Client Reviews')} ({profileData.reviews?.length || 0})
            </h2>
            {profileData.reviews?.length > 0 ? (
              <ProfileReviews reviews={profileData.reviews} />
            ) : (
              <EmptyState section="reviews" isSeller={isSeller} t={t} />
            )}
          </div>
        );

      case 'orders':
        return (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2 mb-6">
              <ShoppingBag className="w-5 h-5 text-orange-500" />
              {t('profile:sections.orders.title', 'My Orders')}
            </h2>
            <ProfileOrders isSeller={isSeller} />
          </div>
        );

      case 'earnings':
        if (!isSeller) return <EmptyState section="earnings" isSeller={isSeller} t={t} />;
        return (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2 mb-6">
              <DollarSign className="w-5 h-5 text-orange-500" />
              {t('profile:sections.earnings.title', 'Earnings')}
            </h2>
            <ProfileEarnings revenue={profileData.revenue} />
          </div>
        );

      default:
        return <EmptyState section={activeSection} isSeller={isSeller} t={t} />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        <aside className="w-full lg:w-72 flex-shrink-0">
          <div className="static lg:sticky top-24 space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="h-16 bg-gray-200" />
              <div className="px-5 pb-5">
                <div className="skeleton w-20 h-20 rounded-full -mt-10 mb-3" />
                <div className="space-y-2">
                  <div className="skeleton h-5 w-32" />
                  <div className="skeleton h-4 w-24" />
                  <div className="skeleton h-3 w-20" />
                </div>
              </div>
            </div>
            <div className="hidden lg:block bg-white border border-gray-200 rounded-xl p-4">
              <div className="skeleton h-4 w-24 mb-4" />
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="skeleton h-10 w-full mb-2" />
              ))}
            </div>
          </div>
        </aside>
        <main className="flex-1 min-w-0">
          <SectionSkeleton type="profile" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
      <div className="w-full lg:w-72 flex-shrink-0">
        <ProfileSidebar
          profileData={profileData}
          isSeller={isSeller}
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
        />
      </div>
      <main className="flex-1 min-w-0">
        {renderSectionContent()}
      </main>
    </div>
  );
};

export default ProfileSection;
