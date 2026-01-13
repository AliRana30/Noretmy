'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Star, Clock, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import axiosInstance from '@/lib/axiosInstance';
import { useTranslations } from '@/hooks/useTranslations';

interface FavoriteGig {
  _id: string;
  title: string;
  description: string;
  photos: string[];
  pricingPlan?: {
    basic: {
      price: number;
      deliveryTime: number;
    };
  };
  cat: string;
  sales: number;
  seller: {
    _id: string;
    username: string;
    fullName: string;
    profilePicture: string | null;
  };
  rating: number;
  reviewsCount: number;
  createdAt: string;
}

const FavoritesPage = () => {
  const { t } = useTranslations('favorites');
  const router = useRouter();
  const user = useSelector((state: any) => state?.auth?.user);
  const isLoggedIn = !!user;

  const [favorites, setFavorites] = useState<FavoriteGig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isLoggedIn) {
      toast.info(t('favorites:toast.signIn'), {
        position: 'top-center',
        autoClose: 3000,
      });
      router.push('/login');
      return;
    }
    fetchFavorites();
  }, [isLoggedIn, router]);

  const fetchFavorites = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get('/users/favorites');
      setFavorites(response.data.favorites || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      toast.error(t('favorites:toast.fetchError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFavorite = async (gigId: string) => {
    if (removingIds.has(gigId)) return;

    setRemovingIds(prev => new Set(prev).add(gigId));

    try {
      await axiosInstance.delete(`/users/favorites/${gigId}`);
      setFavorites(prev => prev.filter(fav => fav._id !== gigId));
      toast.success(t('favorites:toast.removeSuccess'));
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast.error(t('favorites:toast.removeError'));
    } finally {
      setRemovingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(gigId);
        return newSet;
      });
    }
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">

        {/* Background Elements */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>{t('favorites:back')}</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                <Heart className="w-6 h-6 text-white fill-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{t('favorites:title')}</h1>
                <p className="text-slate-400">
                  {favorites.length} {favorites.length === 1 ? t('favorites:gigSaved') : t('favorites:gigsSaved')}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
              <p className="text-slate-400">{t('favorites:loading')}</p>
            </div>
          ) : favorites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center mb-6">
                <Heart className="w-12 h-12 text-slate-600" />
              </div>
              <h2 className="text-2xl font-semibold text-white mb-2">{t('favorites:empty.title')}</h2>
              <p className="text-slate-400 text-center max-w-md mb-6">
                {t('favorites:empty.description')}
              </p>
              <Link
                href="/search-gigs"
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all"
              >
                {t('favorites:empty.button')}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((gig) => (
                <FavoriteCard
                  key={gig._id}
                  gig={gig}
                  onRemove={handleRemoveFavorite}
                  isRemoving={removingIds.has(gig._id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
};

interface FavoriteCardProps {
  gig: FavoriteGig;
  onRemove: (gigId: string) => void;
  isRemoving: boolean;
}

const FavoriteCard: React.FC<FavoriteCardProps> = ({ gig, onRemove, isRemoving }) => {
  const { t } = useTranslations('favorites');
  const [imageError, setImageError] = useState(false);

  const displayPrice = gig.pricingPlan?.basic?.price || 0;
  const deliveryDays = gig.pricingPlan?.basic?.deliveryTime || 3;

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-orange-500/50 transition-all group">
      {/* Image Section */}
      <Link href={`/gig/${gig._id}`}>
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-800">
          <Image
            src={imageError ? '/placeholder.jpg' : (gig.photos?.[0] || '/placeholder.jpg')}
            alt={gig.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImageError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Category Badge */}
          <div className="absolute top-3 left-3">
            <span className="bg-orange-500/90 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              {gig.cat || t('favorites:service')}
            </span>
          </div>

          {/* Remove Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove(gig._id);
            }}
            disabled={isRemoving}
            className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50"
          >
            {isRemoving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </Link>

      {/* Content Section */}
      <div className="p-5">
        {/* Title */}
        <Link href={`/gig/${gig._id}`}>
          <h3 className="font-semibold text-white mb-3 line-clamp-2 group-hover:text-orange-400 transition-colors leading-snug min-h-[3rem]">
            {gig.title}
          </h3>
        </Link>

        {/* Seller Info */}
        <Link href={`/portfolio/${gig.seller?.username}`} className="flex items-center gap-3 mb-4">
          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-700">
            {gig.seller?.profilePicture ? (
              <Image
                src={gig.seller.profilePicture}
                alt={gig.seller.fullName || gig.seller.username}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-semibold">
                {(gig.seller?.fullName || gig.seller?.username || 'S')[0].toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <p className="text-white font-medium text-sm">{gig.seller?.fullName || gig.seller?.username}</p>
            <p className="text-slate-400 text-xs">@{gig.seller?.username}</p>
          </div>
        </Link>

        {/* Rating & Stats */}
        <div className="flex items-center gap-4 mb-4 text-sm">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-white font-semibold">{gig.rating?.toFixed(1) || '0.0'}</span>
            <span className="text-slate-400">({gig.reviewsCount || 0})</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <Clock className="w-4 h-4" />
            <span>{deliveryDays} {t('favorites:days')}</span>
          </div>
        </div>

        {/* Price & Action */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">{t('favorites:startingAt')}</span>
            <p className="text-xl font-bold text-white">${displayPrice.toFixed(0)}</p>
          </div>
          <Link
            href={`/gig/${gig._id}`}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all"
          >
            {t('favorites:viewGig')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FavoritesPage;
