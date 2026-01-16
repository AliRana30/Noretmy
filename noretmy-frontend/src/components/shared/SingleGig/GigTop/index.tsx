'use client';

import Image from 'next/image';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, ShoppingBag, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from '@/hooks/useTranslations';
import SellerBadge from '@/components/shared/SellerBadge';
import FallbackAvatar from '@/components/shared/FallbackAvatar';

interface GigTopProps {
  seller: string;
  avatar: string;
  gig: string;
  description: string;
  completedOrders: number;
  images: string[];
  category: string;
  upgradeOption: string;
  sales: number;
  successScore?: number | null;
  completionRate?: number | null;
  sellerBadge?: string;
  sellerLevel?: {
    level: 'new' | 'level_1' | 'level_2' | 'top_rated';
    label: string;
  };
  onContactSeller: () => void;
}

const GigTop: React.FC<GigTopProps> = ({
  seller,
  avatar,
  gig,
  description,
  completedOrders,
  images,
  category,
  sales,
  successScore,
  completionRate,
  sellerBadge,
  sellerLevel,
  onContactSeller,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [showFullDescription, setShowFullDescription] = useState<boolean>(false);
  const { t } = useTranslations();

  const nextImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link href="/" className="hover:text-slate-700">Home</Link>
          <span>/</span>
          <Link href="/search-gigs" className="hover:text-slate-700">Services</Link>
          <span>/</span>
          <span className="text-slate-900">{category}</span>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left - Image Gallery */}
          <div className="relative">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100">
              {images.length > 0 ? (
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="relative w-full h-full"
                >
                  <Image
                    src={images[currentIndex]}
                    alt={`${gig} - Image ${currentIndex + 1}`}
                    fill
                    className="object-cover"
                  />
                </motion.div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  No images available
                </div>
              )}

              {/* Navigation */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all"
                  >
                    <ChevronLeft className="w-5 h-5 text-slate-700" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all"
                  >
                    <ChevronRight className="w-5 h-5 text-slate-700" />
                  </button>
                </>
              )}

              {/* Image Counter */}
              {images.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-slate-900/80 text-white text-sm px-3 py-1 rounded-full">
                  {currentIndex + 1} / {images.length}
                </div>
              )}
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`relative w-20 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${index === currentIndex ? 'border-orange-500' : 'border-transparent'
                      }`}
                  >
                    <Image src={img} alt={`Thumbnail ${index + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right - Details */}
          <div className="space-y-6">
            {/* Category Badge */}
            <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 text-sm font-medium rounded-full">
              {category}
            </span>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
              {gig}
            </h1>

            {/* Seller Info */}
            <Link href={`/freelancer/${seller}`} className="flex items-center gap-3 group">
              <FallbackAvatar
                src={avatar}
                alt={seller}
                name={seller}
                size="md"
                className=""
              />
              <div>
                <p className="font-semibold text-slate-900 group-hover:text-orange-600 transition-colors">
                  {seller}
                </p>
                {sellerLevel && sellerLevel.level !== 'new' ? (
                  <SellerBadge level={sellerLevel.level} label={sellerLevel.label} size="sm" />
                ) : sellerBadge && sellerBadge !== 'new' && sellerBadge !== 'New Seller' ? (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>{sellerBadge}</span>
                  </div>
                ) : null}
              </div>
            </Link>

            {/* Stats */}
            <div className="flex items-center gap-6 py-4 border-y border-slate-100">
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">{completedOrders || 0}</p>
                <p className="text-sm text-slate-500">Orders</p>
              </div>
              <div className="w-px h-10 bg-slate-200"></div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">
                  {typeof successScore === 'number' ? `${Math.round(successScore)}%` : 'N/A'}
                </p>
                <p className="text-sm text-slate-500">Success Score</p>
              </div>
              <div className="w-px h-10 bg-slate-200"></div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">
                  {typeof completionRate === 'number' ? `${Math.round(completionRate)}%` : 'N/A'}
                </p>
                <p className="text-sm text-slate-500">Completion Rate</p>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">{t('gigs:single.gigTop.aboutThisService') || 'About This Service'}</h3>
              <p className={`text-slate-600 leading-relaxed ${!showFullDescription && 'line-clamp-4'}`}>
                {description}
              </p>
              {description && description.length > 200 && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-orange-600 hover:text-orange-700 font-medium mt-2"
                >
                  {showFullDescription ? (t('gigs:single.gigTop.showLess') || 'Show less') : (t('gigs:single.gigTop.readMore') || 'Read more')}
                </button>
              )}
            </div>

            {/* Contact Button */}
            <button
              onClick={onContactSeller}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-8 rounded-xl transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Contact Seller
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GigTop;
