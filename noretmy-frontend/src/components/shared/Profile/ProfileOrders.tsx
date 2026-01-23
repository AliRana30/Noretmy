'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import {
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowRight,
  Package,
  DollarSign,
  Star,
  Calendar
} from 'lucide-react';

interface Order {
  _id: string;
  status: string;
  progress: number;
  price: number;
  createdAt: string;
  deliveryDate?: string;
  isUserSeller: boolean;
  isUserBuyer: boolean;
  gig: {
    title: string;
    image: string | null;
  };
  buyer: {
    name: string;
    image: string | null;
  };
  seller: {
    name: string;
    image: string | null;
  };
  latestTimelineEvent?: {
    event: string;
    timestamp: string;
  };
}

interface ProfileOrdersProps {
  isSeller: boolean;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Pending', color: 'text-amber-600', bgColor: 'bg-amber-50' },
  accepted: { label: 'Accepted', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  started: { label: 'In Progress', color: 'text-purple-600', bgColor: 'bg-purple-50' },
  halfwayDone: { label: '50% Complete', color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  delivered: { label: 'Delivered', color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
  waitingReview: { label: 'Awaiting Review', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
  completed: { label: 'Completed', color: 'text-orange-600', bgColor: 'bg-orange-50' },
  cancelled: { label: 'Cancelled', color: 'text-red-600', bgColor: 'bg-red-50' },
};

const ProfileOrders: React.FC<ProfileOrdersProps> = ({ isSeller }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/orders/userOrders`, {
          withCredentials: true,
        });
        setOrders(response.data);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [BACKEND_URL]);

  const activeOrders = orders.filter(o => !['completed', 'cancelled'].includes(o.status));
  const completedOrders = orders.filter(o => ['completed', 'cancelled'].includes(o.status));
  const displayOrders = activeTab === 'active' ? activeOrders : completedOrders;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'active'
            ? 'bg-orange-500 text-white'
            : 'bg-white/10 text-black hover:bg-white/20'
            }`}
        >
          Active ({activeOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'completed'
            ? 'bg-orange-500 text-white'
            : 'bg-white/10 text-black hover:bg-white/20'
            }`}
        >
          Completed ({completedOrders.length})
        </button>
      </div>

      {/* Orders List */}
      {displayOrders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-slate-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            No {activeTab} orders
          </h3>
          <p className="text-slate-400">
            {activeTab === 'active'
              ? "You don't have any active orders at the moment."
              : "You haven't completed any orders yet."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {displayOrders.map((order) => {
            const status = statusConfig[order.status] || statusConfig.pending;
            const otherParty = order.isUserSeller ? order.buyer : order.seller;
            const roleLabel = order.isUserSeller ? 'Client' : 'Freelancer';

            return (
              <Link
                key={order._id}
                href={`/orders/${order._id}`}
                className="block bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl p-4 transition-all group"
              >
                <div className="flex items-start gap-4">
                  {/* Gig Image */}
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={order.gig?.image || '/images/placeholder-gig.png'}
                      alt={order.gig?.title || 'Order'}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Order Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                      <div>
                        <h3 className="font-semibold line-clamp-1 group-hover:text-orange-400 transition-colors">
                          {order.gig?.title || 'Order'}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          {otherParty?.image && (
                            <Image
                              src={otherParty.image}
                              alt={otherParty.name}
                              width={20}
                              height={20}
                              className="rounded-full"
                            />
                          )}
                          <span className="text-sm text-slate-400">
                            {roleLabel}: {otherParty?.name || 'Unknown'}
                          </span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.bgColor} ${status.color} flex-shrink-0`}>
                        {status.label}
                      </span>
                    </div>

                    {/* Order Details */}
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-medium">${order.price.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                      {order.progress > 0 && order.status !== 'completed' && (
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-slate-600 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-orange-500 rounded-full"
                              style={{ width: `${order.progress}%` }}
                            />
                          </div>
                          <span className="text-xs">{order.progress}%</span>
                        </div>
                      )}
                    </div>

                    {/* Latest Activity */}
                    {order.latestTimelineEvent && (
                      <p className="text-xs text-slate-500 mt-2">
                        Latest: {order.latestTimelineEvent.event}
                      </p>
                    )}
                  </div>

                  {/* Arrow */}
                  <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-orange-400 transition-colors flex-shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* View All Link */}
      <div className="text-center pt-4">
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 font-medium transition-colors"
        >
          View All Orders
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default ProfileOrders;
