'use client';

import React, { useEffect, useState } from 'react';
import GigTop from '@/components/shared/SingleGig/GigTop';
import PricingPlans from '@/components/shared/SingleGig/PricinPlan';
import ReviewsComponent from '../reviews';
import { useRouter } from 'next/navigation';
import SingleGigSkeleton from '@/skelton/SingleGigSkelton';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { showError } from '@/util/toast';
import { useTranslations } from '@/hooks/useTranslations';

interface GigDetailsSectionProps {
  id: string;
}

const GigDetailsSection: React.FC<GigDetailsSectionProps> = ({ id }) => {
  const [loading, setLoading] = useState(true);
  const [gigTopProps, setGigTopProps] = useState<any>(null);
  const [gig, setGig] = useState<any>(null);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [pricingPlans, setPricingPlans] = useState<any[]>([]);
  const [reviewsProps, setReviewsProps] = useState<any[]>([]);

  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;
  const buyerId = useSelector((state: any) => state.auth?.user?.id);
  const router = useRouter();

  const { t, getCurrentLanguage } = useTranslations();
  const currentLanguage = getCurrentLanguage();

  useEffect(() => {
    const fetchGigData = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/job/single/${id}?lang=${currentLanguage}`);
        const data = await response.json();

        const { gig, seller, reviews } = data;

        setGig(gig);

        // Setup GigTop props
        setGigTopProps({
          seller: seller?.userName || 'N/A',
          avatar: seller?.profilePicture || '/images/placeholder-avatar.png',
          gig: gig?.title || 'N/A',
          description: gig?.description || 'N/A',
          completedOrders: gig?.sales || 0,
          images: gig?.photos || [],
          category: gig?.cat || [],
          upgradeOption: gig?.upgradeOption,
          sales: gig?.sales,
          sellerBadge: seller?.sellerLevel?.label || null,
          sellerLevel: seller?.sellerLevel || null,
        });

        // Setup Pricing Plans
        setPricingPlans([
          {
            title: gig.pricingPlan?.basic?.title || t('gigs:create.form.pricing.basic'),
            price: gig.pricingPlan?.basic?.price || 0,
            description: gig.pricingPlan?.basic?.description || 'N/A',
            deliveryTime: gig.pricingPlan?.basic?.deliveryTime || 0,
          },
          {
            title: gig.pricingPlan?.premium?.title || t('gigs:create.form.pricing.premium'),
            price: gig.pricingPlan?.premium?.price || 0,
            description: gig.pricingPlan?.premium?.description || 'N/A',
            deliveryTime: gig.pricingPlan?.premium?.deliveryTime || 0,
          },
          {
            title: gig.pricingPlan?.pro?.title || t('gigs:create.form.pricing.pro'),
            price: gig.pricingPlan?.pro?.price || 0,
            description: gig.pricingPlan?.pro?.description || 'N/A',
            deliveryTime: gig.pricingPlan?.pro?.deliveryTime || 0,
          },
        ]);

        // Setup FAQs
        setFaqs(
          gig.faqs?.map((faq: any) => ({
            question: faq.question || 'N/A',
            answer: faq.answer || 'N/A',
          })) || []
        );

        // Setup Reviews
        setReviewsProps(
          reviews?.map((review: any) => ({
            sellerImage: review.user?.profilePicture || '/images/placeholder-avatar.png',
            name: review.user?.username || t('gigs:single.reviews.anonymous'),
            clientType: 'Client',
            location: 'Unknown',
            rating: review.star || 0,
            date: review.createdAt || 'N/A',
            reviewText: review.desc || t('gigs:single.reviews.noReviewText'),
          })) || []
        );

        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };

    fetchGigData();
  }, [id, currentLanguage, t]);

  const handleChatIconPress = async () => {
    if (!buyerId) {
      showError(t('gigs:single.errors.loginRequired'));
      return;
    }

    try {
      const sellerId = gig?.sellerId;
      const response = await axios.get(
        `${BACKEND_URL}/conversations/user/single/${sellerId}/${buyerId}`,
        { withCredentials: true }
      );

      if (response.status === 200) {
        const { conversationId } = response.data;
        router.push(`/message/${conversationId}?sellerId=${sellerId}&buyerId=${buyerId}`);
      } else if (response.status === 204) {
        const createResponse = await axios.post(
          `${BACKEND_URL}/conversations`,
          { sellerId, buyerId },
          { withCredentials: true }
        );

        if (createResponse.status === 201) {
          const { conversationId } = createResponse.data;
          router.push(`/message/${conversationId}?sellerId=${sellerId}&buyerId=${buyerId}`);
        }
      }
    } catch (error) {
      // Silently handle conversation errors
    }
  };

  if (loading) {
    return <SingleGigSkeleton />;
  }

  if (!gig || !gigTopProps) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 bg-gray-50 rounded-lg shadow-sm border border-gray-100 my-8 mx-auto max-w-2xl">
        <div className="text-center">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('gigs:single.errors.noGigTitle')}</h3>
          <p className="text-gray-600 mb-6">{t('gigs:single.errors.noGigDescription')}</p>
          <button
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors duration-300"
            onClick={() => window.history.back()}
          >
            {t('gigs:single.errors.goBack')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <GigTop {...gigTopProps} onContactSeller={handleChatIconPress} />
      <PricingPlans
        gigId={gig._id}
        pricingPlans={pricingPlans}
        sellerId={gig?.sellerId}
        onPlanSelect={() => { }}
      />
    </div>
  );
};

export default GigDetailsSection;
