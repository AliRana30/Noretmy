'use client';
import axios from 'axios';
import { ChartArea, Star, TrendingUp, Clock, CheckCircle, AlertCircle, DollarSign, Award, Users, MessageSquare } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from 'recharts';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { SkeletonDashboard } from '@/components/shared/Skeletons';

interface SellerLevel {
  level: string;
  label: string;
  badge: string;
  color: string;
  nextLevel: string | null;
  progress: number;
}

interface DashboardData {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  pendingInvitations: number;
  earnings: number;
  availableForWithdrawal: number;
  pendingClearance: number;
  currentMonthEarnings: number;
  avgSellingPrice: number;
  rating: number;
  totalReviews: number;
  completionRate: number;
  onTimeDeliveryRate: number;
  responseRate: number;
  successScore: number;
  sellerLevel: SellerLevel;
  currentMonth: string;
  monthlyEarnings: { name: string; earnings: number }[];
}

const SellerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();

  // Auth check
  const user = useSelector((state: any) => state?.auth?.user);
  const isLoggedIn = !!user;
  const userRole = String(user?.role || '').toLowerCase();
  const isSeller = user?.isSeller === true || userRole === 'freelancer' || userRole === 'seller';

  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalOrders: 0,
    activeOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    pendingInvitations: 0,
    earnings: 0,
    availableForWithdrawal: 0,
    pendingClearance: 0,
    currentMonthEarnings: 0,
    avgSellingPrice: 0,
    rating: 0,
    totalReviews: 0,
    completionRate: 100,
    onTimeDeliveryRate: 100,
    responseRate: 98,
    successScore: 0,
    sellerLevel: {
      level: 'new',
      label: 'New Seller',
      badge: '🆕',
      color: '#4CAF50',
      nextLevel: 'Level 1 Seller',
      progress: 0
    },
    currentMonth: new Date().toLocaleString("default", { month: "long" }),
    monthlyEarnings: [],
  });

  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

  const apiBase = (BACKEND_URL || '').replace(/\/$/, '');
  const apiRoot = apiBase.endsWith('/api') ? apiBase : `${apiBase}/api`;

  // Auth protection
  useEffect(() => {
    if (!isLoggedIn) {
      toast.info('Please sign in to access the seller dashboard', {
        position: 'top-center',
        autoClose: 3000,
      });
      router.push('/login');
      return;
    }
    if (!isSeller) {
      toast.error('You need a seller account to access this page', {
        position: 'top-center',
        autoClose: 3000,
      });
      router.push('/');
      return;
    }
    setIsChecking(false);
  }, [isLoggedIn, isSeller, router]);

  const handleWithdrawClick = () => {
    window.location.href = '/withdraw/';
  };

  useEffect(() => {
    if (!isLoggedIn || !isSeller) return;

    const fetchSellerDetails = async () => {
      try {
        const response = await axios.get(
          `${apiRoot}/seller/stats`,
          { withCredentials: true },
        );

        const data = await response.data;

        setDashboardData({
          totalOrders: data.totalOrders || 0,
          activeOrders: data.activeOrders || 0,
          completedOrders: data.completedOrders || 0,
          cancelledOrders: data.cancelledOrders || 0,
          pendingInvitations: data.pendingInvitations || 0,
          earnings: data.earnings || 0,
          availableForWithdrawal: data.availableForWithdrawal || 0,
          pendingClearance: data.pendingClearance || 0,
          currentMonthEarnings: data.currentMonthEarnings || 0,
          avgSellingPrice: data.avgSellingPrice || 0,
          rating: parseFloat(data.rating) || 0,
          totalReviews: data.totalReviews || 0,
          completionRate: data.completionRate || 100,
          onTimeDeliveryRate: data.onTimeDeliveryRate || 100,
          responseRate: data.responseRate || 98,
          successScore: data.successScore || 0,
          sellerLevel: data.sellerLevel || {
            level: 'new',
            label: 'New Seller',
            badge: '🆕',
            color: '#4CAF50',
            nextLevel: 'Level 1 Seller',
            progress: 0
          },
          currentMonth: new Date().toLocaleString("default", { month: "long" }),
          monthlyEarnings: (data.monthlyEarnings || []).map((earnings: number, index: number) => ({
            name: new Date(2025, index).toLocaleString("default", { month: "short" }),
            earnings,
          }))
        });
      } catch (error: any) {
        console.error('Error fetching seller details:', error);
        if (error.response?.status === 401) {
          toast.error('Session expired. Please sign in again.');
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSellerDetails();
  }, [isLoggedIn, isSeller, BACKEND_URL, router]);

  // Show skeleton while checking auth
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="skeleton h-10 w-64 mb-2" />
            <div className="skeleton h-5 w-96" />
          </div>
          <SkeletonDashboard />
        </div>
      </div>
    );
  }

  // Check if withdrawal is allowed (amount > $20)
  const withdrawalAllowed = dashboardData.availableForWithdrawal >= 20;

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Header with Seller Level Badge */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                    Seller Dashboard
                  </h1>
                  {/* Seller Level Badge */}
                  <div
                    className="text-sm font-semibold text-gray-700"
                  >
                    <span>{dashboardData.sellerLevel.label}</span>
                  </div>
                </div>
                <p className="text-gray-500">
                  Welcome back, {user?.name}! Here's your performance overview.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              {dashboardData.pendingInvitations > 0 && (
                <Link
                  href="/orders/invitations"
                  className="px-4 py-2 bg-blue-50 text-orange-200 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-100 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  {dashboardData.pendingInvitations} Pending Invitations
                </Link>
              )}
              <button
                onClick={handleWithdrawClick}
                disabled={!withdrawalAllowed}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${withdrawalAllowed
                  ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
              >
                Withdraw Funds
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-8">
        {/* Seller Level Progress */}
        {dashboardData.sellerLevel.nextLevel && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-orange-500" />
                <span className="font-semibold text-gray-800">Progress to {dashboardData.sellerLevel.nextLevel}</span>
              </div>
              <span className="text-sm text-gray-500">{dashboardData.sellerLevel.progress}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${dashboardData.sellerLevel.progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Complete more orders, maintain high ratings, and deliver on time to level up!
            </p>
          </div>
        )}

        {/* Success Score Card */}
        <div className="bg-orange-600 rounded-xl shadow-lg p-6 mb-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold opacity-90">Success Score</h2>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold">{dashboardData.successScore}</span>
                <span className="text-xl opacity-80">/100</span>
              </div>
              <p className="text-sm opacity-80 mt-1">Based on your overall performance metrics</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold">{dashboardData.rating}</div>
                <div className="text-xs opacity-80">Rating</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold">{dashboardData.completionRate}%</div>
                <div className="text-xs opacity-80">Completion</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold">{dashboardData.onTimeDeliveryRate}%</div>
                <div className="text-xs opacity-80">On-time</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold">{dashboardData.responseRate}%</div>
                <div className="text-xs opacity-80">Response</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Available for Withdrawal */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 relative">
            <div className="absolute top-0 right-0 mt-4 mr-4">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <div className="px-6 py-5">
              <div className="text-sm font-medium text-gray-500 mb-1">
                Available for Withdrawal
              </div>
              <div className="flex items-end">
                <span className="text-3xl font-bold text-gray-800">
                  ${dashboardData.availableForWithdrawal.toFixed(2)}
                </span>
              </div>
              {dashboardData.pendingClearance > 0 && (
                <div className="mt-2 text-xs text-blue-600">
                  ${dashboardData.pendingClearance.toFixed(2)} pending clearance
                </div>
              )}
              {!withdrawalAllowed && (
                <div className="mt-2 text-xs text-gray-500">
                  Need minimum $20 to withdraw
                </div>
              )}
            </div>
          </div>

          {/* Total Earnings */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 relative">
            <div className="absolute top-0 right-0 mt-4 mr-4">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <div className="px-6 py-5">
              <div className="text-sm font-medium text-gray-500 mb-1">
                Total Earnings
              </div>
              <div className="flex items-end">
                <span className="text-3xl font-bold text-gray-800">
                  ${dashboardData.earnings.toFixed(2)}
                </span>
              </div>
              <div className="mt-2 text-xs text-orange-600">
                {dashboardData.currentMonth}: ${dashboardData.currentMonthEarnings.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Active Orders */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 relative">
            <div className="absolute top-0 right-0 mt-4 mr-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="px-6 py-5">
              <div className="text-sm font-medium text-gray-500 mb-1">
                Active Orders
              </div>
              <div className="flex items-end">
                <span className="text-3xl font-bold text-gray-800">
                  {dashboardData.activeOrders}
                </span>
                <span className="text-sm text-gray-500 ml-2 mb-1">
                  of {dashboardData.totalOrders} total
                </span>
              </div>
              <div className="mt-2 flex gap-2 text-xs">
                <span className="text-orange-600">{dashboardData.completedOrders} completed</span>
                <span className="text-gray-400">•</span>
                <span className="text-red-500">{dashboardData.cancelledOrders} cancelled</span>
              </div>
            </div>
          </div>

          {/* Average Selling Price */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 relative">
            <div className="absolute top-0 right-0 mt-4 mr-4">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Star className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="px-6 py-5">
              <div className="text-sm font-medium text-gray-500 mb-1">
                Avg. Selling Price
              </div>
              <div className="flex items-end">
                <span className="text-3xl font-bold text-gray-800">
                  ${dashboardData.avgSellingPrice.toFixed(2)}
                </span>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Based on {dashboardData.completedOrders} completed orders
              </div>
            </div>
          </div>
        </div>

        {/* Reviews & Rating Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Rating & Reviews</h3>
              <Star className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold text-gray-800">{dashboardData.rating}</div>
              <div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${star <= Math.round(dashboardData.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-1">{dashboardData.totalReviews} reviews</p>
              </div>
            </div>
          </div>

          {/* Earnings Chart - spans 2 columns */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Earnings Overview</h3>
              <ChartArea className="w-5 h-5 text-gray-400" />
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dashboardData.monthlyEarnings}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="earnings"
                    stroke="#ea580c"
                    strokeWidth={2}
                    dot={{ fill: '#ea580c', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 mt-6">
          <h3 className="font-semibold text-gray-800 mb-6">Detailed Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Rating */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Rating</span>
                <span className="text-sm font-medium text-gray-800">{dashboardData.rating}/5.0</span>
              </div>
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 rounded-full"
                  style={{ width: `${(dashboardData.rating / 5) * 100}%` }}
                />
              </div>
            </div>

            {/* Completion Rate */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Completion Rate</span>
                <span className="text-sm font-medium text-gray-800">{dashboardData.completionRate}%</span>
              </div>
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full"
                  style={{ width: `${dashboardData.completionRate}%` }}
                />
              </div>
            </div>

            {/* On-time Delivery */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">On-time Delivery</span>
                <span className="text-sm font-medium text-gray-800">{dashboardData.onTimeDeliveryRate}%</span>
              </div>
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${dashboardData.onTimeDeliveryRate}%` }}
                />
              </div>
            </div>

            {/* Response Rate */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Response Rate</span>
                <span className="text-sm font-medium text-gray-800">{dashboardData.responseRate}%</span>
              </div>
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${dashboardData.responseRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
