'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Clock, X, MessageSquare, Send, ShoppingCart } from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import axios from 'axios';

interface PricingPlan {
  title: string;
  price: string;
  description: string;
  deliveryTime: string;
}

interface PricingPlansProps {
  gigId: string;
  pricingPlans: PricingPlan[];
  sellerId?: string;
  onPlanSelect: (plan: PricingPlan | null) => void;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

const PricingPlans = ({
  gigId,
  pricingPlans,
  sellerId,
  onPlanSelect,
}: PricingPlansProps) => {
  const [selectedPlan, setSelectedPlan] = useState<number>(1);
  const [showInvitationModal, setShowInvitationModal] = useState(false);
  const [invitationMessage, setInvitationMessage] = useState('');
  const [selectedPlanData, setSelectedPlanData] = useState<PricingPlan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const { t } = useTranslations();
  const user = useSelector((state: any) => state?.auth?.user);
  const isLoggedIn = !!user;
  const isClient = !user?.isSeller;
  const isFreelancer = user?.isSeller || false;
  const userId = user?._id || user?.id;
  const isOwnGig = userId && sellerId ? String(userId) === String(sellerId) : false;

  const handlePlanSelect = (index: number) => {
    if (!isLoggedIn) {
      toast.info(t('gigs:single.pricing.signInRequired') || 'Please sign in to purchase this service', {
        position: 'top-center',
        autoClose: 3000,
      });
      router.push('/login');
      return;
    }

    if (isFreelancer) {
      toast.info(t('gigs:single.pricing.freelancerRestriction') || 'Freelancers cannot order services. Switch to buyer account to order.', {
        position: 'top-center',
        autoClose: 3000,
      });
      return;
    }

    if (isOwnGig) {
      toast.info(t('gigs:single.pricing.ownGigRestriction') || 'You cannot order your own gig.', {
        position: 'top-center',
        autoClose: 3000,
      });
      return;
    }

    const sPlan = pricingPlans[index];
    setSelectedPlan(index);
    setSelectedPlanData(sPlan);
    onPlanSelect(sPlan);
    setShowInvitationModal(true);
  };

  const handleSendInvitation = async () => {
    if (!selectedPlanData) return;

    setIsSubmitting(true);
    try {
      const response = await axios.post(
        `${BACKEND_URL}/orders/invitation`,
        {
          gigId,
          price: parseFloat(selectedPlanData.price),
          message: invitationMessage,
          planTitle: selectedPlanData.title || getPlanLabel(selectedPlan),
          deliveryTime: selectedPlanData.deliveryTime,
        },
        { withCredentials: true }
      );

      toast.success(response.data.message || 'Order request sent successfully! The freelancer will review your request.', {
        position: 'top-center',
        autoClose: 4000,
      });
      setShowInvitationModal(false);
      setInvitationMessage('');
      router.push('/chat');
    } catch (error: any) {
      console.error('Order invitation error:', error);
      toast.error(error.response?.data?.message || 'Failed to send order request. Please try again.', {
        position: 'top-center',
        autoClose: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPlanLabel = (index: number) => {
    switch (index) {
      case 0: return 'Basic';
      case 1: return 'Standard';
      case 2: return 'Premium';
      default: return 'Plan';
    }
  };

  const isButtonDisabled = isFreelancer || isOwnGig;

  return (
    <>
      <div className="bg-slate-50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
              {t('gigs:single.pricing.title') || 'Choose Your Package'}
            </h2>
            <p className="text-slate-600">
              {t('gigs:single.pricing.subtitle') || 'Select the plan that fits your needs'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-2xl transition-all duration-300 ${selectedPlan === index
                  ? 'ring-2 ring-orange-500 shadow-xl scale-[1.02]'
                  : 'border border-slate-200 hover:border-slate-300 hover:shadow-lg'
                  }`}
              >
                {/* Popular Badge for middle plan */}
                {index === 1 && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                    {t('gigs:single.pricing.popular') || 'Popular'}
                  </div>
                )}

                <div className="p-6">
                  {/* Plan Header */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">
                      {plan.title || getPlanLabel(index)}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Clock className="w-4 h-4" />
                      <span>{plan.deliveryTime} {t('gigs:single.pricing.dayDelivery') || 'day delivery'}</span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold text-slate-900">${plan.price}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-slate-600 text-sm leading-relaxed mb-6 min-h-[60px]">
                    {plan.description}
                  </p>

                  {/* Features */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Check className="w-4 h-4 text-orange-500" />
                      <span>{t('gigs:single.pricing.sourceFile') || 'Source file included'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Check className="w-4 h-4 text-orange-500" />
                      <span>{t('gigs:single.pricing.commercialUse') || 'Commercial use'}</span>
                    </div>
                    {index >= 1 && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Check className="w-4 h-4 text-orange-500" />
                        <span>{t('gigs:single.pricing.unlimitedRevisions') || 'Unlimited revisions'}</span>
                      </div>
                    )}
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handlePlanSelect(index)}
                    disabled={isButtonDisabled}
                    className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${isButtonDisabled
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : selectedPlan === index
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/25'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {isFreelancer
                      ? (t('gigs:single.pricing.freelancerOnly') || 'Freelancers Cannot Order')
                      : isOwnGig
                        ? (t('gigs:single.pricing.ownGig') || 'Your Own Gig')
                        : (t('gigs:single.pricing.orderNow') || 'Order Now')
                    }
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Freelancer Notice */}
          {isFreelancer && (
            <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-xl text-center">
              <p className="text-orange-700 text-sm">
                {t('gigs:single.pricing.freelancerNotice') || 'You are logged in as a freelancer. To order services, please switch to a buyer account.'}
              </p>
            </div>
          )}

        </div>
      </div>

      {/* Order Request Modal */}
      {showInvitationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold mb-0.5">
                    {t('gigs:single.invitation.title') || 'Place Your Order'}
                  </h3>
                  <p className="text-orange-100 text-xs">
                    {t('gigs:single.invitation.subtitle') || 'The freelancer will review and start working on your project'}
                  </p>
                </div>
                <button
                  onClick={() => setShowInvitationModal(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-4">
              {/* Selected Plan Summary */}
              <div className="bg-slate-50 rounded-xl p-3 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-slate-900">
                    {selectedPlanData?.title || getPlanLabel(selectedPlan)}
                  </span>
                  <span className="text-lg font-bold text-orange-600">
                    ${selectedPlanData?.price}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Clock className="w-4 h-4" />
                  <span>{selectedPlanData?.deliveryTime} {t('gigs:single.pricing.dayDelivery') || 'day delivery'}</span>
                </div>
              </div>

              {/* Message Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('gigs:single.invitation.messageLabel') || 'Project Requirements (Optional)'}
                </label>
                <textarea
                  value={invitationMessage}
                  onChange={(e) => setInvitationMessage(e.target.value)}
                  placeholder={t('gigs:single.invitation.messagePlaceholder') || 'Describe your project requirements, timeline, or any specific details...'}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none text-sm"
                />
              </div>

              {/* Timeline Info */}
              <div className="bg-blue-50 border border-black rounded-xl p-3 mb-4">
                <p className="text-black text-xs font-medium mb-1">Order Timeline:</p>
                <div className="text-black text-[11px] space-y-0.5">
                  <p>1. Order placed → Freelancer accepts</p>
                  <p>2. Work in progress → Progress updates</p>
                  <p>3. Delivery → You review</p>
                  <p>4. Approve → Make payment</p>
                  <p>5. Rate & Review the freelancer</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowInvitationModal(false)}
                  className="flex-1 py-2.5 px-4 border border-slate-200 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-50 transition-colors"
                >
                  {t('common:buttons.cancel') || 'Cancel'}
                </button>
                <button
                  onClick={handleSendInvitation}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 px-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium text-sm hover:from-orange-600 hover:to-orange-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {t('gigs:single.invitation.send') || 'Place Order'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PricingPlans;
