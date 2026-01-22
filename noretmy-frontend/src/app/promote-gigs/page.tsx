"use client"
import PromotionalPlansScreen from "@/components/shared/PromotinalPlans";
import PromotionPlanHistory from "@/components/shared/PromotionalPlanHistory";
import axios from "axios";
import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

const PromoteGigs = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

  const normalizePromotions = (raw: any): any[] => {
    const now = new Date();
    if (!Array.isArray(raw)) return [];

    return raw
      .filter((p: any) => p.status !== 'deleted') // Filter out deleted promotions
      .map((p: any) => {
      if (p?.planKey && (p?.expiresAt || p?.activatedAt || p?.purchasedAt)) {
        const expiresAt = p.expiresAt ? new Date(p.expiresAt) : null;
        const activatedAt = p.activatedAt ? new Date(p.activatedAt) : null;
        const purchasedAt = p.purchasedAt ? new Date(p.purchasedAt) : null;
        const createdAt = p.createdAt ? new Date(p.createdAt) : null;
        const startDate = activatedAt || purchasedAt || createdAt || null;

        const isActive = p.status === 'active' && !!expiresAt && expiresAt > now;
        const remainingDays = expiresAt
          ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
          : 0;

        return {
          _id: p._id,
          promotionPlan: p.planKey,
          status: p.status,
          isActive,
          isForAll: p.promotionType === 'all_gigs',
          promotionStartDate: startDate ? startDate.toISOString() : null,
          promotionEndDate: expiresAt ? expiresAt.toISOString() : null,
          remainingDays,
          durationDays: p.durationDays ?? 30,
          amountPaid: p.totalAmount,
          gig: p.gigId
            ? {
                _id: p.gigId._id,
                title: p.gigId.title,
                photos: p.gigId.photos,
              }
            : null,
          createdAt: p.createdAt,
        };
      }

      return p;
    });
  };

  const fetchPromotions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/subscription/history`, {
        withCredentials: true
      });

      if (response.data) {
        const raw = Array.isArray(response.data) ? response.data : response.data.data;
        setPromotions(normalizePromotions(raw));
      }
      setError(null);
    } catch (err: any) {
      if (err.response?.status !== 403) {
        setError(err.message);
        toast.error(err.response?.data?.message || err.message || 'Failed to fetch promotions');
      }
    } finally {
      setLoading(false);
    }
  }, [BACKEND_URL]);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  const handleRefresh = () => {
    fetchPromotions();
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
          <p className="text-gray-500">Loading your promotions...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="overflow-x-hidden p-6 bg-gray-50 min-h-screen">
      <PromotionalPlansScreen />
      <PromotionPlanHistory
        promotionHistory={promotions}
        onRefresh={handleRefresh}
      />
    </main>
  );
};

export default PromoteGigs;
