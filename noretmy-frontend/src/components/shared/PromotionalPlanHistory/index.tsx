"use client"
import React, { useState } from 'react';
import { Calendar, Clock, Users, Package, CheckCircle, XCircle, AlertCircle, Trash2, Ban } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Promotion {
  _id: string;
  promotionPlan: string;
  status: string;
  isActive: boolean;
  isForAll: boolean;
  promotionStartDate: string | null;
  promotionEndDate: string;
  remainingDays: number;
  durationDays: number;
  amountPaid?: number;
  gig?: {
    _id: string;
    title: string;
    photos?: string[];
  } | null;
  createdAt: string;
}

interface PromotionPlanHistoryProps {
  promotionHistory: Promotion[];
  onRefresh?: () => void;
}

const PromotionPlanHistory = ({ promotionHistory = [], onRefresh }: PromotionPlanHistoryProps) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

  // Function to format date
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric"
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get status badge styling
  const getStatusBadge = (promotion: Promotion) => {
    if (promotion.isActive || promotion.status === 'active') {
      return {
        className: 'bg-green-100 text-green-800',
        icon: <CheckCircle className="h-3 w-3 mr-1" />,
        text: 'Active'
      };
    } else if (promotion.status === 'expired') {
      return {
        className: 'bg-gray-100 text-gray-600',
        icon: <XCircle className="h-3 w-3 mr-1" />,
        text: 'Expired'
      };
    } else if (promotion.status === 'pending') {
      return {
        className: 'bg-yellow-100 text-yellow-800',
        icon: <AlertCircle className="h-3 w-3 mr-1" />,
        text: 'Pending'
      };
    } else if (promotion.status === 'cancelled') {
      return {
        className: 'bg-red-100 text-red-800',
        icon: <XCircle className="h-3 w-3 mr-1" />,
        text: 'Cancelled'
      };
    }
    return {
      className: 'bg-gray-100 text-gray-600',
      icon: null,
      text: promotion.status
    };
  };

  // Get plan display name
  const getPlanDisplayName = (planId: string): string => {
    const planNames: Record<string, string> = {
      'basic': 'Basic Boost',
      'standard': 'Standard Promotion',
      'premium': 'Premium Spotlight',
      'homepage': 'Ultimate Exposure',
      'featured': 'Featured',
      'sponsored': 'Sponsored'
    };
    return planNames[planId] || planId;
  };

  // Handle delete promotion
  const handleDelete = async (promotionId: string) => {
    if (!confirm('Are you sure you want to delete this promotion?')) return;

    setDeletingId(promotionId);
    try {
      await axios.delete(`${BACKEND_URL}/subscription/${promotionId}`, {
        withCredentials: true
      });
      toast.success('Promotion deleted successfully');
      onRefresh?.();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete promotion');
    } finally {
      setDeletingId(null);
    }
  };

  // Handle cancel promotion
  const handleCancel = async (promotionId: string) => {
    if (!confirm('Are you sure you want to cancel this promotion? This action cannot be undone.')) return;

    setCancellingId(promotionId);
    try {
      await axios.put(`${BACKEND_URL}/subscription/${promotionId}/cancel`, {}, {
        withCredentials: true
      });
      toast.success('Promotion cancelled successfully');
      onRefresh?.();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to cancel promotion');
    } finally {
      setCancellingId(null);
    }
  };

  // Check if promotion can be deleted
  const canDelete = (promotion: Promotion): boolean => {
    return promotion.status !== 'active' || !promotion.isActive;
  };

  // Check if promotion can be cancelled
  const canCancel = (promotion: Promotion): boolean => {
    return promotion.status === 'active' && promotion.isActive;
  };

  // Separate active and expired promotions
  const activePromotions = promotionHistory.filter(p => p.isActive || p.status === 'active');
  const pastPromotions = promotionHistory.filter(p => !p.isActive && p.status !== 'active');

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Active Promotions Section */}
      {activePromotions.length > 0 && (
        <div className="mb-8">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-green-200 bg-green-50">
              <h2 className="text-lg font-semibold text-green-800 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Active Promotions ({activePromotions.length})
              </h2>
              <p className="text-sm text-green-600 mt-1">
                Your currently running promotion plans
              </p>
            </div>

            <div className="divide-y divide-green-100">
              {activePromotions.map((plan) => {
                const statusBadge = getStatusBadge(plan);
                return (
                  <div key={plan._id} className="p-4 sm:p-6 hover:bg-green-25 transition-colors">
                    <div className="flex flex-col lg:flex-row justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center flex-wrap gap-2">
                          <Package className="h-5 w-5 text-green-600" />
                          <h3 className="text-lg font-medium text-gray-900">
                            {getPlanDisplayName(plan.promotionPlan)}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.className}`}>
                            {statusBadge.icon}
                            {statusBadge.text}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 text-gray-400 mr-1.5" />
                            <span>{plan.isForAll ? "All Gigs" : plan.gig?.title || "Single Gig"}</span>
                          </div>
                          {plan.promotionStartDate && (
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 text-gray-400 mr-1.5" />
                              <span>Started: {formatDate(plan.promotionStartDate)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="bg-white rounded-lg px-4 py-2 border border-green-200">
                          <div className="text-xs text-gray-500">Ends On</div>
                          <div className="font-medium text-gray-900">{formatDate(plan.promotionEndDate)}</div>
                        </div>
                        <div className="bg-green-100 rounded-lg px-4 py-2">
                          <div className="text-xs text-green-600">Time Remaining</div>
                          <div className="font-bold text-green-800">
                            {plan.remainingDays} day{plan.remainingDays !== 1 ? 's' : ''} left
                          </div>
                        </div>
                        {canCancel(plan) && (
                          <button
                            onClick={() => handleCancel(plan._id)}
                            disabled={cancellingId === plan._id}
                            className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Ban className="h-4 w-4" />
                            {cancellingId === plan._id ? 'Cancelling...' : 'Cancel'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Promotion History Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Promotion History</h2>
          <p className="text-sm text-gray-500 mt-1">View all your past and current promotion plans</p>
        </div>

        {promotionHistory.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-500">No promotion plans found</h3>
            <p className="text-sm text-gray-400 mt-1">
              Purchase a promotion plan to boost your gig visibility
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {promotionHistory.map((plan) => {
              const statusBadge = getStatusBadge(plan);
              return (
                <div key={plan._id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center flex-wrap gap-2">
                        <Package className="h-5 w-5 text-blue-600" />
                        <h3 className="text-base font-medium text-gray-900">
                          {getPlanDisplayName(plan.promotionPlan)}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.className}`}>
                          {statusBadge.icon}
                          {statusBadge.text}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 text-gray-400 mr-1.5" />
                          <span className="capitalize">{plan.isForAll ? "For All Gigs" : plan.gig?.title || "Single Gig"}</span>
                        </div>
                        {plan.amountPaid && (
                          <div className="font-medium text-gray-700">
                            ${plan.amountPaid.toFixed(2)} paid
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {plan.promotionStartDate && (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-1.5" />
                          <span>{formatDate(plan.promotionStartDate)}</span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-gray-400 mr-1.5" />
                        <span>
                          {plan.isActive
                            ? `${plan.remainingDays} days left`
                            : `Ended ${formatDate(plan.promotionEndDate)}`
                          }
                        </span>
                      </div>
                      {canDelete(plan) && (
                        <button
                          onClick={() => handleDelete(plan._id)}
                          disabled={deletingId === plan._id}
                          className="flex items-center gap-1 px-2 py-1 text-sm text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                          title="Delete promotion"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PromotionPlanHistory;