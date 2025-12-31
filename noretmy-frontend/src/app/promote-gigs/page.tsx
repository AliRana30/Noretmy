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

  const fetchPromotions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/subscription/user`, {
        withCredentials: true
      });

      if (response.data) {
        setPromotions(response.data);
      }
      setError(null);
    } catch (err: any) {
      // Only show error if it's not a 403 (which means user isn't a seller)
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
