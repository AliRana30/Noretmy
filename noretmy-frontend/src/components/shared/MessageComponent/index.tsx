import React, { useState } from 'react';
import moment from 'moment';
import Image from 'next/image';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Package,
  ExternalLink,
  User,
  Loader2
} from 'lucide-react';
import MessageAttachmentDisplay from '../MessageAttachmentDisplay';

const defaultAvatar =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=80&q=80';

interface OrderData {
  gigTitle?: string;
  gigImage?: string;
  planTitle?: string;
  price?: number;
  deliveryTime?: string;
  status?: string;
  invitationStatus?: string;
}

interface MessageAttachment {
  _id?: string;
  url: string;
  thumbnailUrl?: string;
  type?: string;
  name?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  publicId?: string;
  dimensions?: { width: number; height: number };
}

interface MessageProps {
  item: {
    _id?: string;
    desc: string;
    createdAt: string;
    senderId?: string;
    userId?: string;
    image?: string;
    messageType?: 'text' | 'file' | 'order_invitation' | 'order_accepted' | 'order_rejected' | 'order_update' | 'milestone_update' | 'payment_update' | 'system';
    orderId?: string;
    orderData?: OrderData;
    attachments?: MessageAttachment[];
  };
  userId: string;
  receiverId: string;
  currentUserAvatar?: string;
  otherUserAvatar?: string;
  otherUserName?: string;
  isSeller?: boolean;
  onOrderAction?: (orderId: string, action: 'accept' | 'reject', reason?: string) => void;
  otherUserId?: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

const MessageComponent: React.FC<MessageProps> = ({
  item,
  userId,
  receiverId,
  currentUserAvatar,
  otherUserAvatar,
  otherUserName,
  isSeller = false,
  onOrderAction,
  otherUserId,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const messageSenderId = item.userId || item.senderId;
  // Ensure string comparison for ID matching
  const isSelf = String(messageSenderId) === String(userId);
  const messageType = item.messageType || 'text';

  const avatarSource = isSelf
    ? (currentUserAvatar || defaultAvatar)
    : (otherUserAvatar || item.image || defaultAvatar);

  // Handle accept invitation
  const handleAcceptInvitation = async () => {
    if (!item.orderId) return;
    setIsLoading(true);
    try {
      await axios.post(
        `${BACKEND_URL}/orders/invitation/accept`,
        { invitationId: item.orderId },
        { withCredentials: true }
      );
      toast.success('Order accepted! The client can now proceed with payment.');
      if (onOrderAction) onOrderAction(item.orderId, 'accept');
      // Force refresh messages
      window.location.reload();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to accept invitation');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle reject invitation
  const handleRejectInvitation = async () => {
    if (!item.orderId) return;
    setIsLoading(true);
    try {
      await axios.post(
        `${BACKEND_URL}/orders/invitation/reject`,
        { invitationId: item.orderId, reason: rejectReason },
        { withCredentials: true }
      );
      toast.info('Order invitation declined.');
      setShowRejectModal(false);
      if (onOrderAction) onOrderAction(item.orderId, 'reject', rejectReason);
      // Force refresh messages
      window.location.reload();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject invitation');
    } finally {
      setIsLoading(false);
    }
  };

  // Render order invitation card
  const renderOrderInvitation = () => {
    const orderData = item.orderData;
    const invitationStatus = orderData?.invitationStatus || 'pending';
    const canTakeAction = isSeller && !isSelf && invitationStatus === 'pending';

    return (
      <div className={`rounded-xl shadow-lg overflow-hidden max-w-md ${isSelf ? 'bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200'
        : 'bg-white border border-gray-200'
        }`}>
        {/* Header */}
        <div className={`px-4 py-3 flex items-center gap-2 ${invitationStatus === 'accepted' ? 'bg-orange-500' :
          invitationStatus === 'rejected' ? 'bg-red-500' :
            'bg-gradient-to-r from-orange-500 to-orange-600'
          } text-white`}>
          <Package className="w-5 h-5" />
          <span className="font-semibold">
            {invitationStatus === 'accepted' ? 'Order Accepted' :
              invitationStatus === 'rejected' ? 'Order Declined' :
                'Order Invitation'}
          </span>
          {invitationStatus === 'pending' && (
            <span className="ml-auto text-xs bg-white/20 px-2 py-1 rounded-full">Pending</span>
          )}
        </div>

        {/* Gig Preview */}
        {orderData?.gigImage && (
          <div className="relative h-32 w-full">
            <Image
              src={orderData.gigImage}
              alt={orderData.gigTitle || 'Gig'}
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="p-4 space-y-3">
          <h4 className="font-semibold text-gray-900 line-clamp-2">
            {orderData?.gigTitle || 'Service Request'}
          </h4>

          {/* Plan & Price */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {orderData?.planTitle || 'Standard'} Package
            </span>
            <span className="font-bold text-orange-600 flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              {orderData?.price?.toFixed(2) || '0.00'}
            </span>
          </div>

          {/* Delivery Time */}
          {orderData?.deliveryTime && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>Delivery: {orderData.deliveryTime} days</span>
            </div>
          )}

          {/* Message */}
          {item.desc && (
            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg italic">
              "{item.desc}"
            </p>
          )}

          {/* Status Badge */}
          {invitationStatus !== 'pending' && (
            <div className={`flex items-center gap-2 p-2 rounded-lg ${invitationStatus === 'accepted' ? 'bg-orange-50 text-orange-700' : 'bg-red-50 text-red-700'
              }`}>
              {invitationStatus === 'accepted' ? (
                <><CheckCircle className="w-4 h-4" /> Order has been accepted</>
              ) : (
                <><XCircle className="w-4 h-4" /> Order has been declined</>
              )}
            </div>
          )}

          {/* Action Buttons (for seller only) */}
          {canTakeAction && (
            <div className="flex gap-2 pt-2 border-t">
              <button
                onClick={handleAcceptInvitation}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Accept
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                Decline
              </button>
            </div>
          )}

          {/* View Profile Link (for seller to view client profile) */}
          {isSeller && !isSelf && otherUserId && (
            <Link
              href={`/client/${otherUserId}`}
              className="flex items-center justify-center gap-2 py-2 text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
            >
              <User className="w-4 h-4" />
              View Client Profile
              <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Decline Order</h3>
              <p className="text-sm text-gray-600 mb-4">
                Please provide a reason for declining this order (optional):
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reason for declining..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                rows={3}
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectInvitation}
                  disabled={isLoading}
                  className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Declining...' : 'Decline Order'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render order status message
  const renderOrderStatus = () => {
    const isAccepted = messageType === 'order_accepted';

    return (
      <div className={`flex items-center gap-3 p-4 rounded-xl ${isAccepted
        ? 'bg-orange-50 border border-orange-200'
        : 'bg-red-50 border border-red-200'
        }`}>
        {isAccepted ? (
          <CheckCircle className="w-8 h-8 text-orange-500 flex-shrink-0" />
        ) : (
          <XCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
        )}
        <div>
          <p className={`font-medium ${isAccepted ? 'text-orange-700' : 'text-red-700'}`}>
            {item.desc}
          </p>
          {isAccepted && (
            <p className="text-sm text-orange-600 mt-1">
              You can now proceed with payment to start the project.
            </p>
          )}
        </div>
      </div>
    );
  };

  // Render regular text message
  const renderTextMessage = () => (
    <div
      className={`p-4 rounded-2xl shadow ${isSelf
        ? 'bg-gradient-to-r from-orange-400 to-orange-300 text-white'
        : 'bg-gray-200 text-gray-800'
        }`}
    >
      {item.desc && <p>{item.desc}</p>}
      {item.attachments && item.attachments.length > 0 && (
        <MessageAttachmentDisplay
          attachments={item.attachments}
          isSelf={isSelf}
        />
      )}
    </div>
  );

  // Render file message (message with attachments)
  const renderFileMessage = () => (
    <div
      className={`p-4 rounded-2xl shadow ${isSelf
        ? 'bg-gradient-to-r from-orange-400 to-orange-300 text-white'
        : 'bg-gray-200 text-gray-800'
        }`}
    >
      {item.desc && <p className="mb-2">{item.desc}</p>}
      {item.attachments && item.attachments.length > 0 && (
        <MessageAttachmentDisplay
          attachments={item.attachments}
          isSelf={isSelf}
        />
      )}
    </div>
  );

  // Determine which content to render
  const renderMessageContent = () => {
    switch (messageType) {
      case 'order_invitation':
        return renderOrderInvitation();
      case 'order_accepted':
      case 'order_rejected':
        return renderOrderStatus();
      case 'file':
        return renderFileMessage();
      case 'order_update':
      case 'milestone_update':
      case 'payment_update':
      case 'system':
        return (
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-700">
            <p>{item.desc}</p>
          </div>
        );
      default:
        return renderTextMessage();
    }
  };

  return (
    <div
      className={`flex items-start gap-4 my-6 ${isSelf ? 'flex-row' : 'flex-row-reverse'
        }`}
    >
      {/* Avatar */}
      <img
        src={avatarSource}
        alt="avatar"
        className="w-12 h-12 rounded-full object-cover border border-gray-300 shadow-lg flex-shrink-0"
      />

      {/* Message Content */}
      <div
        className={`flex flex-col ${isSelf ? 'items-start' : 'items-end'
          }`}
      >
        {/* User Name */}
        <span
          className={`text-sm font-semibold mb-1 ${isSelf ? 'text-orange-500' : 'text-gray-700'
            }`}
        >
          {isSelf ? 'Me' : (otherUserName || receiverId)}
        </span>

        {/* Message Content */}
        {renderMessageContent()}

        {/* Timestamp */}
        <span className="text-xs text-gray-500 mt-2">
          {moment(item.createdAt).format('h:mm A')}
        </span>
      </div>
    </div>
  );
};

export default MessageComponent;
