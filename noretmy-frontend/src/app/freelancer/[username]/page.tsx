'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import {
  MapPin,
  Star,
  Clock,
  Briefcase,
  Award,
  ChevronRight,
  MessageCircle,
  ArrowLeft,
  Globe,
  GraduationCap,
  ShieldCheck
} from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';
import { StoreProvider } from '@/store/StoreProvider';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import SellerBadge, {
  TrustScore,
  ReliabilityIndicators,
  AchievementBadge,
  SellerBadgeCard
} from '@/components/shared/SellerBadge';
import { useSellerBadge } from '@/hooks/useSellerBadge';

interface FreelancerData {
  user: {
    _id: string;
    fullName: string;
    username: string;
    memberSince: string;
    isCompany: boolean;
  };
  profile: {
    profilePicture: string | null;
    profileHeadline: string | null;
    description: string | null;
    skills: string[];
    location: string | null;
    country: string | null;
    countryCode: string | null;
    languages: string[];
    education: any[];
    certifications: any[];
  };
  stats: {
    totalGigs: number;
    completedOrders: number;
    totalReviews: number;
    averageRating: number;
    averagePrice: number;
    totalEarnings: number;
    avgDeliveryTime: string;
    completionRate: number;
    successRate: number;
  };
  gigs: {
    _id: string;
    title: string;
    category: string;
    subCategory: string;
    description: string;
    image: string | null;
    price: number;
    deliveryTime: number;
    sales: number;
    rating: number;
    reviewCount: number;
    createdAt: string;
  }[];
  reviews: {
    _id: string;
    gigId: string;
    star: number;
    desc: string;
    user: {
      fullName: string;
      username: string;
      profilePicture?: string | null;
    };
    createdAt: string;
  }[];
}

const FreelancerProfileContent = () => {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const { t } = useTranslations();
  const currentUser = useSelector((state: RootState) => state?.auth?.user);

  const [freelancer, setFreelancer] = useState<FreelancerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'gigs' | 'reviews'>('gigs');

  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

  // Fetch seller badge data
  const { badge: sellerBadge, loading: badgeLoading } = useSellerBadge(freelancer?.user._id);

  useEffect(() => {
    const fetchFreelancerProfile = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${BACKEND_URL}/users/freelancer/${username}`);
        setFreelancer(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load freelancer profile');
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchFreelancerProfile();
    }
  }, [username, BACKEND_URL]);

  const handleContactFreelancer = () => {
    if (!currentUser) {
      router.push('/login');
      return;
    }
    // Navigate to chat with this freelancer
    router.push(`/chat?freelancer=${freelancer?.user._id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <div className="text-slate-600 font-medium">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (error || !freelancer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Freelancer Not Found</h2>
          <p className="text-slate-600 mb-4">{error || 'The freelancer you are looking for does not exist.'}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const { user, profile, stats, gigs, reviews } = freelancer;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Back Button */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>

      {/* Profile Header */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
          <div className="p-6">
            <div className="flex flex-col md:flex-row items-start gap-6 relative z-10">
              {/* Profile Picture */}
              <div className="relative">
                <Image
                  src={profile.profilePicture || '/images/placeholder-avatar.png'}
                  alt={user.fullName}
                  width={128}
                  height={128}
                  className="w-32 h-32 rounded-xl border-4 border-slate-50 shadow-sm object-cover"
                />
                {stats.averageRating >= 4.5 && (
                  <div className="absolute -bottom-2 -right-2 bg-orange-500 text-white p-1.5 rounded-full border-2 border-white">
                    <Award className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1 md:pb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-slate-900">{user.fullName}</h1>
                  {sellerBadge && (
                    <SellerBadge
                      level={sellerBadge.level as 'new' | 'level_1' | 'level_2' | 'top_rated'}
                      showTooltip
                    />
                  )}
                </div>
                {profile.profileHeadline && (
                  <p className="text-slate-700 mt-1">{profile.profileHeadline}</p>
                )}
                {/* Reliability Indicators */}
                {sellerBadge && (
                  <div className="mt-2">
                    <ReliabilityIndicators
                      onTimeRate={sellerBadge.metrics.onTimeDeliveryRate}
                      responseTime={sellerBadge.metrics.responseRate >= 90 ? '< 1 hr' : '< 24 hrs'}
                      completionRate={sellerBadge.metrics.completionRate}
                    />
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={handleContactFreelancer}
                className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
              >
                <MessageCircle className="w-5 h-5" />
                Contact
              </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4 mt-6">
              <div className="bg-slate-50 rounded-lg p-3 md:p-4 text-center">
                <div className="flex items-center justify-center gap-1 text-xl md:text-2xl font-bold text-slate-900">
                  <Star className="w-4 h-4 md:w-5 md:h-5 text-yellow-500 fill-yellow-500" />
                  {stats.averageRating.toFixed(1)}
                </div>
                <p className="text-xs md:text-sm text-slate-600">Rating</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 md:p-4 text-center">
                <div className="text-xl md:text-2xl font-bold text-slate-900">{stats.totalReviews}</div>
                <p className="text-xs md:text-sm text-slate-600">Reviews</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 md:p-4 text-center">
                <div className="text-xl md:text-2xl font-bold text-slate-900">{stats.completedOrders}</div>
                <p className="text-xs md:text-sm text-slate-600">Orders</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 md:p-4 text-center">
                <div className="text-xl md:text-2xl font-bold text-slate-900">{stats.totalGigs}</div>
                <p className="text-xs md:text-sm text-slate-600">Gigs</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 md:p-4 text-center col-span-2 sm:col-span-1">
                <div className="text-xl md:text-2xl font-bold text-slate-900">${stats.averagePrice.toFixed(0)}</div>
                <p className="text-xs md:text-sm text-slate-600">Avg. Price</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - About */}
          <div className="lg:col-span-1 space-y-6">

            {/* About Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">About</h2>

              {profile.location && (
                <div className="flex items-center gap-3 text-slate-600 mb-3">
                  <MapPin className="w-5 h-5 text-slate-400" />
                  <span>{profile.location}, {profile.country}</span>
                </div>
              )}

              <div className="flex items-center gap-3 text-slate-600 mb-3">
                <Clock className="w-5 h-5 text-slate-400" />
                <span>Member since {new Date(user.memberSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
              </div>

              {profile.languages && profile.languages.length > 0 && (
                <div className="flex items-start gap-3 text-slate-600 mb-3">
                  <Globe className="w-5 h-5 text-slate-400 mt-0.5" />
                  <span>{profile.languages.join(', ')}</span>
                </div>
              )}

              <div className="flex items-center gap-3 text-slate-600 mb-3 pt-3 border-t border-slate-100">
                <Briefcase className="w-5 h-5 text-slate-400" />
                <span>Total Earnings: <strong className="text-slate-900">${stats.totalEarnings?.toLocaleString() || '0'}</strong></span>
              </div>

              {profile.description && (
                <p className="text-slate-600 mt-4">
                  {profile.description}
                </p>
              )}
            </div>

            {/* Performance Metrics Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Performance</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">Completion Rate</span>
                    <span className="font-semibold text-slate-900">{stats.completionRate || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div
                      className="bg-green-500 h-1.5 rounded-full transition-all duration-1000"
                      style={{ width: `${stats.completionRate || 0}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">Success Rate</span>
                    <span className="font-semibold text-slate-900">{stats.successRate || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full transition-all duration-1000"
                      style={{ width: `${stats.successRate || 0}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-600 pt-2">
                  <Clock className="w-5 h-5 text-slate-400" />
                  <div className="text-sm">
                    <span className="text-slate-500">Avg. Delivery:</span>
                    <strong className="text-slate-900 ml-1">{stats.avgDeliveryTime || 'N/A'}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Skills Card */}
            {profile.skills && profile.skills.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-orange-50 text-orange-600 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Education Card */}
            {profile.education && profile.education.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  Education
                </h2>
                <div className="space-y-3">
                  {profile.education.map((edu: any, index: number) => (
                    <div key={index} className="text-slate-600">
                      <p className="font-medium text-slate-800">{edu.degree}</p>
                      <p className="text-sm">{edu.school}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications Card */}
            {profile.certifications && profile.certifications.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" />
                  Certifications
                </h2>
                <div className="space-y-3">
                  {profile.certifications.map((cert: any, index: number) => (
                    <div key={index} className="text-slate-600">
                      <p className="font-medium text-slate-800">{cert.name}</p>
                      <p className="text-sm">{cert.issuer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Gigs & Reviews */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveTab('gigs')}
                className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${activeTab === 'gigs'
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
              >
                Gigs ({stats.totalGigs})
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${activeTab === 'reviews'
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
              >
                Reviews ({stats.totalReviews})
              </button>
            </div>

            {/* Gigs Tab */}
            {activeTab === 'gigs' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gigs.length === 0 ? (
                  <div className="col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
                    <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600">No gigs available yet</p>
                  </div>
                ) : (
                  gigs.map((gig) => (
                    <Link
                      href={`/gig/${gig._id}`}
                      key={gig._id}
                      className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group"
                    >
                      <div className="relative h-40">
                        <Image
                          src={gig.image || '/images/placeholder-gig.png'}
                          alt={gig.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium text-slate-900 line-clamp-2 mb-2 group-hover:text-orange-500 transition-colors">
                          {gig.title}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span>{gig.rating.toFixed(1)}</span>
                          <span className="text-slate-400">({gig.reviewCount})</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-500">{gig.sales} orders</span>
                          <span className="font-bold text-slate-900">From ${gig.price}</span>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
                    <Star className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600">No reviews yet</p>
                  </div>
                ) : (
                  reviews.map((review) => (
                    <div
                      key={review._id}
                      className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                          {review.user?.profilePicture ? (
                            <Image
                              src={review.user.profilePicture}
                              alt={review.user.fullName}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-slate-600 font-medium">
                              {review.user?.fullName?.charAt(0).toUpperCase() || '?'}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-medium text-slate-900">{review.user.fullName}</p>
                              <p className="text-sm text-slate-500">@{review.user.username}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${i < review.star
                                    ? 'text-yellow-500 fill-yellow-500'
                                    : 'text-slate-300'
                                    }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-slate-600">{review.desc}</p>
                          <p className="text-xs text-slate-400 mt-2">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const FreelancerProfilePage = () => {
  return (
    <StoreProvider>
      <FreelancerProfileContent />
    </StoreProvider>
  );
};

export default FreelancerProfilePage;
