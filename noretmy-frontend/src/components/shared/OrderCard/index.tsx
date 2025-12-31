import React, { useState } from 'react';
import { Calendar, DollarSign, ExternalLink, Star, MessageCircle } from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';
import { useRouter } from 'next/navigation';
import ReviewModal from '../ReviewModal';
import axios from 'axios';

interface Seller {
  _id: string;
  username: string;
  image?: string;
}

interface Gig {
  _id: string;
  title: string;
  photos?: string[];
}

export interface Order {
  _id: string;
  isMilestone: boolean;
  gigId?: Gig;
  price: number;
  sellerId?: Seller;
  buyerId?: {
    _id: string;
    username: string;
  };
  status: string;
  attachments?: any[];
  isCompleted?: boolean;
  payment_intent?: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
  paymentMethod?: string;
  milestones?: any[];
  statusHistory?: any[];
}

interface OrderCardProps {
  order: Order;
  onViewDetails: (orderId: string) => void;
}

const getStatusStyle = (
  status: string,
): { bgColor: string; textColor: string } => {
  switch (status?.toLowerCase()) {
    case 'created':
      return { bgColor: 'bg-slate-100', textColor: 'text-slate-700' };
    case 'pending':
      return { bgColor: 'bg-amber-100', textColor: 'text-amber-700' };
    case 'started':
    case 'in_progress':
      return { bgColor: 'bg-blue-100', textColor: 'text-blue-700' };
    case 'delivered':
      return { bgColor: 'bg-orange-100', textColor: 'text-orange-700' };
    case 'completed':
      return { bgColor: 'bg-slate-700', textColor: 'text-white' };
    case 'waitingreview':
      return { bgColor: 'bg-orange-500', textColor: 'text-white' };
    case 'revision':
      return { bgColor: 'bg-amber-500', textColor: 'text-white' };
    case 'cancelled':
      return { bgColor: 'bg-slate-400', textColor: 'text-white' };
    default:
      return { bgColor: 'bg-gray-100', textColor: 'text-gray-700' };
  }
};

const OrderCard: React.FC<OrderCardProps> = ({ order, onViewDetails }) => {
  const { t } = useTranslations();
  const router = useRouter();
  const [showReviewModal, setShowReviewModal] = useState(false);
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;
  const gigPhoto =
    order?.gigId?.photos?.[0]?.trim() || 'https://via.placeholder.com/96';
  const gigTitle = order?.gigId?.title || t('details.orderInfo.untitledGig', { ns: 'orders', defaultValue: 'Untitled Gig' });
  const sellerUsername = order?.sellerId?.username || t('details.seller.unknown', { ns: 'orders', defaultValue: 'Unknown Seller' });
  const sellerImage =
    order?.sellerId?.image || 'https://via.placeholder.com/40';
  const price = order?.price ? `$${order.price.toLocaleString()}` : t('details.orderInfo.na', { ns: 'orders', defaultValue: 'N/A' });
  const status = order?.status ? t(`details.status.${order.status.toLowerCase()}`, { ns: 'orders', defaultValue: order.status }) : t('details.orderInfo.na', { ns: 'orders', defaultValue: 'N/A' });
  const createdAt = order?.createdAt
    ? new Date(order.createdAt).toLocaleDateString()
    : '';

  const statusStyle = getStatusStyle(order?.status || '');
  const showReviewButton = order?.status?.toLowerCase() === 'waitingreview';
  const showChatButton = order?.status !== 'completed' && order?.status !== 'cancelled';

  const handleChatClick = async () => {
    const sellerId = order?.sellerId?._id;
    const buyerId = order?.buyerId?._id;
    if (!sellerId || !buyerId) return;

    try {
      // First check if conversation exists
      const response = await axios.get(
        `${BACKEND_URL}/conversations/user/single/${sellerId}/${buyerId}`,
        { withCredentials: true }
      );

      if (response.status === 200) {
        const { conversationId } = response.data;
        router.push(`/message/${conversationId}?sellerId=${sellerId}&buyerId=${buyerId}`);
      } else if (response.status === 204) {
        // Create new conversation if it doesn't exist
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
      console.error('Error checking/creating conversation:', error);
      // Fallback to concatenated ID
      router.push(`/message/${sellerId}${buyerId}?sellerId=${sellerId}&buyerId=${buyerId}`);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
      {/* Order Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <img
            src={gigPhoto}
            alt={gigTitle}
            className="h-16 w-16 rounded-lg object-cover"
          />
          <div>
            <h3 className="font-semibold text-gray-900">{gigTitle}</h3>
            <div className="mt-1 flex items-center space-x-2">
              <img
                src={sellerImage}
                alt={sellerUsername}
                className="h-6 w-6 rounded-full"
              />
              <span className="text-sm text-gray-600">{sellerUsername}</span>
            </div>
          </div>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm ${statusStyle.bgColor} ${statusStyle.textColor}`}
        >
          {status}
        </span>
      </div>

      {/* Order Details */}
      <div className="mb-4 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar size={16} />
          <span className="text-sm">{t('details.orderInfo.orderedOn', { ns: 'orders', defaultValue: 'Ordered on' })} {createdAt}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <DollarSign size={16} />
          <span className="text-sm">{price}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2">
        <button
          onClick={() => onViewDetails(order._id)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-50 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
        >
          {t('actions.viewDetails', { ns: 'orders', defaultValue: 'View Details' })}
          <ExternalLink size={16} />
        </button>

        {/* Review Button - shown when order is waiting for review */}
        {showReviewButton && (
          <button
            onClick={() => setShowReviewModal(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 hover:bg-orange-700 py-2 text-sm font-medium text-white transition-all shadow-sm hover:shadow-md"
          >
            <Star size={16} />
            Leave a Review
          </button>
        )}

        {/* Chat Button - shown for active orders */}
        {showChatButton && (
          <button
            onClick={handleChatClick}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-50 py-2 text-sm font-medium text-orange-600 hover:bg-orange-100 transition-colors"
          >
            <MessageCircle size={16} />
            Message Seller
          </button>
        )}
      </div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        orderId={order._id}
        gigTitle={gigTitle}
        sellerName={sellerUsername}
        onReviewSubmitted={() => {
          // Optionally refresh orders list
          window.location.reload();
        }}
      />
    </div>
  );
};

export default OrderCard;
