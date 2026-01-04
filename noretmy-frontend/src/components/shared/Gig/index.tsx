'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Clock, Heart, CheckCircle, Shield, Award } from 'lucide-react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/lib/axiosInstance';

interface SellerBadgeInfo {
  level: 'new' | 'level_1' | 'level_2' | 'top_rated';
  trustScore: number;
  isVerified?: boolean;
}

interface GigProps {
  gig: {
    _id: number;
    title: string;
    photos: string[];
    profileUrl: string;
    totalStars: number;
    price: string;
    cat?: string;
    image?: string;
    pricingPlan?: {
      basic: {
        price: number;
        deliveryTime: number;
      };
    };
    premiumPlan?: {
      price: number;
      deliveryTime: number;
    };
    seller?: {
      name?: string;
      username?: string;
      profilePicture?: string;
      level?: 'Basic' | 'Pro' | 'Elite';
    };
    sellerBadge?: SellerBadgeInfo | null;
    deliveryTime?: number;
    reviews?: number;
    upgradeOption: string;
    discount: number;
    isBestSeller?: boolean;
    enrollments?: number;
    rating?: number;
    hours?: number;
    sales?: number;
  };
  initialIsFavorite?: boolean;
  onFavoriteChange?: (gigId: number, isFavorite: boolean) => void;
}

const GigCard: React.FC<GigProps> = ({ gig, initialIsFavorite = false, onFavoriteChange }) => {
  const [isLiked, setIsLiked] = useState(initialIsFavorite);
  const [isToggling, setIsToggling] = useState(false);
  const [imageError, setImageError] = useState(false);
  const router = useRouter();
  const user = useSelector((state: any) => state?.auth?.user);
  const isLoggedIn = !!user;

  useEffect(() => {
    setIsLiked(initialIsFavorite);
  }, [initialIsFavorite]);

  // Check if this gig is in favorites on mount
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!isLoggedIn || initialIsFavorite !== undefined) return;
      try {
        const response = await axiosInstance.get(`/users/favorites/check/${gig._id}`);
        setIsLiked(response.data.isFavorite);
      } catch (error) {
        // Silently fail - not critical
      }
    };
    checkFavoriteStatus();
  }, [gig._id, isLoggedIn, initialIsFavorite]);

  const displayRating = gig.rating || gig.totalStars || 0;
  const totalReviews = gig.reviews || 0;
  const displaySales = gig.sales || gig.enrollments || 0;
  const displayPrice = gig.premiumPlan?.price || gig.pricingPlan?.basic?.price || parseFloat(gig.price) || 0;
  const deliveryDays = gig.premiumPlan?.deliveryTime || gig.pricingPlan?.basic?.deliveryTime || gig.deliveryTime || 3;

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      toast.info('Please sign in to add favorites', {
        position: 'top-center',
        autoClose: 3000,
        onClick: () => router.push('/login'),
      });
      return;
    }

    if (isToggling) return;

    setIsToggling(true);
    const previousState = isLiked;

    // Optimistic update
    setIsLiked(!isLiked);

    try {
      const response = await axiosInstance.post('/users/favorites/toggle', {
        gigId: gig._id
      });

      if (response.data.isFavorite) {
        toast.success('Added to favorites!', { autoClose: 2000 });
      } else {
        toast.info('Removed from favorites', { autoClose: 2000 });
      }

      // Call callback if provided
      onFavoriteChange?.(gig._id, response.data.isFavorite);
    } catch (error) {
      // Revert on error
      setIsLiked(previousState);
      toast.error('Failed to update favorites', { autoClose: 2000 });
    } finally {
      setIsToggling(false);
    }
  };

  const getLevelColor = (level?: string) => {
    switch (level) {
      case 'Elite':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Pro':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Get badge display info based on seller badge level
  const getBadgeDisplayInfo = (badgeLevel?: string) => {
    switch (badgeLevel) {
      case 'top_rated':
        return {
          label: 'Top Rated',
          bgColor: 'bg-gradient-to-r from-yellow-500 to-amber-500',
          textColor: 'text-white',
          icon: Award
        };
      case 'level_2':
        return {
          label: 'Level 2',
          bgColor: 'bg-gradient-to-r from-purple-500 to-indigo-500',
          textColor: 'text-white',
          icon: Shield
        };
      case 'level_1':
        return {
          label: 'Level 1',
          bgColor: 'bg-gradient-to-r from-blue-500 to-cyan-500',
          textColor: 'text-white',
          icon: CheckCircle
        };
      default:
        return null;
    }
  };

  const badgeDisplay = gig.sellerBadge ? getBadgeDisplayInfo(gig.sellerBadge.level) : null;

  return (
    <Link href={`/gig/${gig._id}`} className="block group">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-orange-200 transform hover:-translate-y-1">
        {/* Image Container */}
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          <Image
            src={imageError ? '/placeholder.jpg' : (gig.image || gig.photos?.[0] || '/placeholder.jpg')}
            alt={gig.title}
            fill
            className="object-cover  transition-transform duration-500"
            onError={() => setImageError(true)}
          />

          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Top Badges */}
          <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
            <div className="flex flex-col gap-2">
              {/* Promotion badge hidden - promotions feel organic */}
              {gig.discount > 0 && (
                <span className="bg-orange-400 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
                  {gig.discount}% OFF
                </span>
              )}
            </div>

            {/* Like Button */}
            <button
              onClick={handleFavoriteClick}
              className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
            >
              <Heart
                className={`w-5 h-5 transition-colors ${isLiked ? 'fill-red-500 text-red-500' : 'text-slate-600'}`}
              />
            </button>
          </div>

          {/* Seller Badge */}
          {badgeDisplay && (
            <div className="absolute bottom-3 left-3">
              <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full shadow-lg ${badgeDisplay.bgColor} ${badgeDisplay.textColor}`}>
                <badgeDisplay.icon className="w-3.5 h-3.5" />
                <span>{badgeDisplay.label}</span>
              </div>
            </div>
          )}

          {/* Trust Score Indicator */}
          {gig.sellerBadge?.trustScore && gig.sellerBadge.trustScore >= 80 && (
            <div className="absolute bottom-3 right-3">
              <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm text-xs font-medium px-2 py-1 rounded-full shadow-lg text-orange-700">
                <Shield className="w-3 h-3 fill-orange-500 text-orange-500" />
                <span>{gig.sellerBadge.trustScore}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Category */}
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">
            {gig.cat || 'Freelance Service'}
          </p>

          {/* Title */}
          <h3 className="font-semibold text-slate-900 mb-3 line-clamp-2  transition-colors leading-snug min-h-[2.75rem]">
            {gig.title}
          </h3>

          {/* Seller Info */}
          {gig.seller && (
            <div className="flex items-center gap-2 mb-3">
              <div className="relative w-8 h-8 rounded-full overflow-hidden bg-slate-200 flex-shrink-0">
                <Image
                  src={gig.seller.profilePicture || '/default-avatar.png'}
                  alt={gig.seller.username || 'Seller'}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/default-avatar.png';
                  }}
                />
              </div>
              <span className="text-sm text-slate-600 font-medium truncate">
                {gig.seller.username}
              </span>
            </div>
          )}

          {/* Rating & Reviews */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold text-slate-900">{displayRating.toFixed(1)}</span>
              <span className="text-slate-500 text-sm">({totalReviews})</span>
            </div>
            {displaySales > 0 && (
              <>
                <span className="text-slate-300">|</span>
                <div className="flex items-center gap-1 text-sm text-slate-500">
                  <CheckCircle className="w-3.5 h-3.5 text-orange-500" />
                  <span>{displaySales} sold</span>
                </div>
              </>
            )}
          </div>

          {/* Delivery Time */}
          <div className="flex items-center gap-1.5 text-sm text-slate-600 mb-4">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Delivery in {deliveryDays} days</span>
          </div>

          {/* Price */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500">Starting at</span>
              <p className="text-xl font-bold text-slate-900">
                ${displayPrice.toFixed(0)}
              </p>
            </div>
            <div className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all">
              View
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default GigCard;
