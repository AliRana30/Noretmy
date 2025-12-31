'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon, StarIcon } from '@heroicons/react/24/solid';
import { useTranslations } from '@/hooks/useTranslations';

interface FAQ {
  question: string;
  answer: string;
}

interface Review {
  sellerImage?: string;
  name?: string;
  clientType?: string;
  location?: string;
  rating?: number;
  date?: string;
  reviewText?: string;
}

interface FaqReviewsSectionProps {
  faqs: FAQ[];
  reviews: Review[];
}

const FaqReviewsSection: React.FC<FaqReviewsSectionProps> = ({
  faqs,
  reviews,
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const { t } = useTranslations();

  const toggleFaq = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section className="py-12 mb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Container - Card based with clear separation */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
            {/* Reviews Section */}
            <div className="p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {t('gigs:single.reviews.title')}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {t('gigs:single.reviews.subtitle')}
                </p>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {reviews.length > 0 ? (
                  reviews.map((review, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gray-50 border border-gray-100 rounded-xl p-5 hover:shadow-sm transition-shadow duration-200"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-white shadow">
                            <Image
                              src={review.sellerImage || '/images/placeholder-avatar.png'}
                              alt={review.name || t('gigs:single.reviews.anonymous')}
                              width={48}
                              height={48}
                              className="object-cover"
                            />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div>
                              <h3 className="text-sm font-semibold text-gray-900">
                                {review.name || t('gigs:single.reviews.anonymous')}
                              </h3>
                              <p className="text-xs text-gray-500">
                                {[review.clientType, review.location]
                                  .filter(Boolean)
                                  .join(' • ')}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <StarIcon
                                  key={i}
                                  className={`h-4 w-4 ${i < (review.rating || 0)
                                      ? 'text-orange-400'
                                      : 'text-gray-200'
                                    }`}
                                />
                              ))}
                            </div>
                          </div>

                          <div className="mt-3">
                            <p className="text-gray-700 text-sm leading-relaxed">
                              {review.reviewText || t('gigs:single.reviews.noReviewText')}
                            </p>
                          </div>

                          {review.date && (
                            <p className="mt-2 text-xs text-gray-400">
                              {new Date(review.date).toLocaleString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                      <StarIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-gray-900 font-medium mb-1">
                      {t('gigs:single.reviews.noReviewsYet', 'No reviews yet')}
                    </h3>
                    <p className="text-gray-500 text-sm">
                      {t('gigs:single.reviews.beFirst', 'Be the first to leave a review')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* FAQ Section */}
            <div className="p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {t('gigs:single.faqs.title')}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {t('gigs:single.faqs.subtitle')}
                </p>
              </div>

              <div className="space-y-3">
                {faqs.length > 0 ? (
                  faqs.map((faq, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gray-50 border border-gray-100 rounded-xl overflow-hidden"
                    >
                      <button
                        onClick={() => toggleFaq(index)}
                        className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-100 transition-colors duration-200"
                      >
                        <span className="text-sm font-medium text-gray-900 pr-4">
                          {faq.question}
                        </span>
                        <ChevronDownIcon
                          className={`h-5 w-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${activeIndex === index ? 'transform rotate-180' : ''
                            }`}
                        />
                      </button>

                      <AnimatePresence>
                        {activeIndex === index && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="border-t border-gray-100"
                          >
                            <div className="p-5 text-sm text-gray-600 leading-relaxed bg-white">
                              {faq.answer}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                      <ChevronDownIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-gray-900 font-medium mb-1">
                      {t('gigs:single.faqs.noFaqsYet', 'No FAQs available')}
                    </h3>
                    <p className="text-gray-500 text-sm">
                      {t('gigs:single.faqs.contactSeller', 'Contact the seller for more information')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FaqReviewsSection;
