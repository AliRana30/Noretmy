'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

type BadgeLevel = 'new' | 'level_1' | 'level_2' | 'top_rated';

interface BadgeMetrics {
  completedOrders: number;
  averageRating: number;
  totalReviews: number;
  completionRate: number;
  onTimeDeliveryRate: number;
  responseRate: number;
}

interface Achievement {
  type: string;
  earnedAt: Date;
  metadata?: Record<string, any>;
}

interface ReliabilityIndicators {
  showOnTimeRate: boolean;
  showResponseTime: boolean;
  showCompletionRate: boolean;
}

interface DisplayBadge {
  label: string;
  emoji: string;
  color: string;
}

interface SellerBadgeData {
  level: BadgeLevel;
  label: string;
  trustScore: number;
  searchBoost?: number;
  displayBadge: DisplayBadge;
  metrics: BadgeMetrics;
  achievements: Achievement[];
  reliabilityIndicators: ReliabilityIndicators;
}

interface NextLevelInfo {
  target: BadgeLevel;
  label: string;
  requirements: {
    orders: number;
    rating: number;
    completion: number;
    earnings: number;
  };
  progress: {
    orders: number;
    rating: number;
    completion: number;
    earnings: number;
  };
}

interface PerformanceDetails {
  currentLevel: BadgeLevel;
  label: string;
  trustScore: number;
  metrics: BadgeMetrics & {
    totalOrders: number;
    cancelledOrders: number;
    disputedOrders: number;
    activeGigs: number;
    totalEarnings?: number;
  };
  nextLevel: NextLevelInfo | null;
  recentReviews: any[];
  lastEvaluated?: Date;
  nextEvaluation?: Date;
}

/**
 * Hook to fetch a seller's badge information
 */
export const useSellerBadge = (sellerId: string | undefined) => {
  const [badge, setBadge] = useState<SellerBadgeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sellerId) {
      setLoading(false);
      return;
    }

    const fetchBadge = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(`${BACKEND_URL}/badges/seller/${sellerId}`);
        
        if (response.data.success) {
          setBadge(response.data.data);
        } else {
          setError(response.data.message || 'Failed to fetch badge');
        }
      } catch (err: any) {
        console.error('Error fetching seller badge:', err);
        setError(err.response?.data?.message || 'Failed to fetch badge');
        
        setBadge({
          level: 'new',
          label: 'New Seller',
          trustScore: 50,
          displayBadge: { label: 'New Seller', emoji: '🆕', color: '#4CAF50' },
          metrics: {
            completedOrders: 0,
            averageRating: 0,
            totalReviews: 0,
            completionRate: 100,
            onTimeDeliveryRate: 100,
            responseRate: 100
          },
          achievements: [],
          reliabilityIndicators: {
            showOnTimeRate: true,
            showResponseTime: true,
            showCompletionRate: true
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBadge();
  }, [sellerId]);

  return { badge, loading, error };
};

/**
 * Hook to fetch multiple seller badges at once
 */
export const useMultipleSellerBadges = (sellerIds: string[]) => {
  const [badges, setBadges] = useState<Record<string, {
    level: BadgeLevel;
    label: string;
    trustScore: number;
    rating: number;
    completedOrders: number;
    onTimeRate: number;
  }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBadges = useCallback(async () => {
    if (!sellerIds || sellerIds.length === 0) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(`${BACKEND_URL}/badges/batch`, {
        sellerIds
      });
      
      if (response.data.success) {
        setBadges(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch badges');
      }
    } catch (err: any) {
      console.error('Error fetching seller badges:', err);
      setError(err.response?.data?.message || 'Failed to fetch badges');
    } finally {
      setLoading(false);
    }
  }, [sellerIds.join(',')]);

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  return { badges, loading, error, refetch: fetchBadges };
};

/**
 * Hook for sellers to get their own badge and performance details
 */
export const useMyBadge = () => {
  const [badge, setBadge] = useState<SellerBadgeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMyBadge = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${BACKEND_URL}/badges/my-badge`, {
        withCredentials: true
      });
      
      if (response.data.success) {
        setBadge(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch badge');
      }
    } catch (err: any) {
      console.error('Error fetching my badge:', err);
      setError(err.response?.data?.message || 'Failed to fetch badge');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyBadge();
  }, [fetchMyBadge]);

  return { badge, loading, error, refetch: fetchMyBadge };
};

/**
 * Hook for sellers to get detailed performance breakdown
 */
export const useMyPerformance = () => {
  const [performance, setPerformance] = useState<PerformanceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPerformance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${BACKEND_URL}/badges/my-performance`, {
        withCredentials: true
      });
      
      if (response.data.success) {
        setPerformance(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch performance');
      }
    } catch (err: any) {
      console.error('Error fetching performance:', err);
      setError(err.response?.data?.message || 'Failed to fetch performance');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPerformance();
  }, [fetchPerformance]);

  return { performance, loading, error, refetch: fetchPerformance };
};

/**
 * Hook to get seller achievements
 */
export const useSellerAchievements = (sellerId: string | undefined) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sellerId) {
      setLoading(false);
      return;
    }

    const fetchAchievements = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(`${BACKEND_URL}/badges/seller/${sellerId}/achievements`);
        
        if (response.data.success) {
          setAchievements(response.data.data);
        } else {
          setError(response.data.message || 'Failed to fetch achievements');
        }
      } catch (err: any) {
        console.error('Error fetching achievements:', err);
        setError(err.response?.data?.message || 'Failed to fetch achievements');
      } finally {
        setLoading(false);
      }
    };

    fetchAchievements();
  }, [sellerId]);

  return { achievements, loading, error };
};

export default useSellerBadge;
