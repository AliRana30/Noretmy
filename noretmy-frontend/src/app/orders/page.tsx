'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import OrderCard, { Order } from '../../components/shared/OrderCard';
import OrderFilters, { Filters } from '@/components/shared/OrderFilter';
import { useRouter } from 'next/navigation';
import { SkeletonOrdersList } from '@/components/shared/Skeletons';
import { useTranslations } from '@/hooks/useTranslations';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { Package, Plus } from 'lucide-react';

const OrdersPage: React.FC = () => {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isChecking, setIsChecking] = useState(true);
  const { t, getCurrentLanguage } = useTranslations();
  const router = useRouter();
  const backendUrl = process.env.NEXT_PUBLIC_API_URL;

  // Auth check
  const user = useSelector((state: any) => state?.auth?.user);
  const isLoggedIn = !!user;

  // Get current language
  const currentLanguage = getCurrentLanguage();

  // Auth protection
  useEffect(() => {
    if (!isLoggedIn) {
      toast('Please sign in to view your orders', {
        icon: 'ℹ️',
      });
      router.push('/login');
      return;
    }
    setIsChecking(false);
  }, [isLoggedIn, router]);

  const filterOrders = (orders: Order[], filters: Filters): Order[] => {
    let filtered = orders;

    if (filters.status !== 'All') {
      filtered = filtered.filter(
        (order) => order.status?.toLowerCase() === filters.status?.toLowerCase(),
      );
    }

    if (filters.orderType !== 'All') {
      if (filters.orderType === 'Milestone') {
        filtered = filtered.filter((order) => order.isMilestone);
      } else if (filters.orderType === 'Standard') {
        filtered = filtered.filter((order) => !order.isMilestone);
      }
    }

    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (filters.dateRange !== 'custom') {
      if (filters.dateRange === 'last7') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (filters.dateRange === 'last30') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else if (filters.dateRange === 'last90') {
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      }
      if (startDate) {
        filtered = filtered.filter((order) => {
          if (!order.createdAt) return false;
          const orderDate = new Date(order.createdAt);
          return orderDate >= startDate! && orderDate <= now;
        });
      }
    } else {
      if (filters.customStartDate) {
        startDate = new Date(filters.customStartDate);
      }
      if (filters.customEndDate) {
        endDate = new Date(filters.customEndDate);
      }
      if (startDate && endDate) {
        filtered = filtered.filter((order) => {
          if (!order.createdAt) return false;
          const orderDate = new Date(order.createdAt);
          return orderDate >= startDate! && orderDate <= endDate!;
        });
      }
    }

    if (filters.priceRange !== 'All') {
      const [min, max] = filters.priceRange.split('-').map(Number);
      filtered = filtered.filter(
        (order) => order.price >= min && order.price <= max,
      );
    }

    return filtered;
  };

  const handleFilterApply = (filters: Filters) => {
    const newFilteredOrders = filterOrders(allOrders, filters);
    setFilteredOrders(newFilteredOrders);
  };

  const handleViewDetails = (orderId: string) => {
    router.push(`/orders/${orderId}`);
  };

  useEffect(() => {
    if (!isLoggedIn) return;

    const params = new URLSearchParams();
    if (currentLanguage) {
      params.append('lang', currentLanguage);
    }

    axios
      .get<Order[]>(
        `${backendUrl}/orders/userOrders?${params.toString()}`,
        { withCredentials: true },
      )
      .then((response) => {
        setAllOrders(response.data);
        setFilteredOrders(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching orders:', error);
        if (error.response?.status === 401) {
          toast.error('Session expired. Please sign in again.');
          router.push('/login');
        }
        setLoading(false);
      });
  }, [currentLanguage, backendUrl, isLoggedIn, router]);

  // Show skeleton while checking auth
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="page-header">
            <div className="skeleton h-8 w-48 mb-2" />
            <div className="skeleton h-5 w-64" />
          </div>
          <SkeletonOrdersList count={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="page-header">
          <h1 className="page-title">{t('orders:list.title')}</h1>
          <p className="page-subtitle">
            Manage and track all your orders in one place
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <OrderFilters onApply={handleFilterApply} />
        </div>

        {/* Orders Grid */}
        {loading ? (
          <SkeletonOrdersList count={6} />
        ) : filteredOrders.length > 0 ? (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                onViewDetails={handleViewDetails}
                currentUserId={user?._id}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state bg-white border border-gray-200 rounded-xl">
            <div className="empty-state-icon mx-auto">
              <Package className="w-16 h-16 text-gray-300" />
            </div>
            <h3 className="empty-state-title">No orders found</h3>
            <p className="empty-state-description">
              Your orders will appear here once you make a purchase
            </p>
            <button
              onClick={() => router.push('/search-gigs')}
              className="btn btn-primary"
            >
              Browse Services
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
