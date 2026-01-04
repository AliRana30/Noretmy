'use client';

import React, { useEffect } from 'react';
import {
  Bell,
  Clock,
  CheckCircle2,
  MessageCircle,
  AlertCircle,
  MoreVertical,
  Trash2,
  Check,
  CheckCheck,
  Package,
  DollarSign,
  ExternalLink,
} from 'lucide-react';
import { SkeletonNotification } from '@/components/shared/Skeletons';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/context/NotificationContext';
import moment from 'moment';

// Notification Page Component
const NotificationsPage: React.FC = () => {
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications();

  const router = useRouter();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="p-2 bg-orange-100 rounded-xl">
                <Bell className="w-6 h-6 text-orange-600" />
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Notifications</h1>
              {unreadCount > 0 && (
                <span className="bg-orange-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg shadow-orange-200 uppercase tracking-wider animate-bounce">
                  {unreadCount} New
                </span>
              )}
            </div>
            <p className="text-gray-500 font-medium">Stay updated with your latest activity and alerts</p>
          </div>

          {notifications.length > 0 && (
            <div className="flex gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-orange-200 hover:text-orange-600 shadow-sm transition-all active:scale-95"
                >
                  <CheckCheck className="w-4 h-4 text-orange-500" />
                  Mark all as read
                </button>
              )}
            </div>
          )}
        </div>

        {/* Notifications List */}
        {loading && notifications.length === 0 ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonNotification key={i} />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-16 text-center shadow-xl shadow-gray-100/50">
            <div className="w-24 h-24 mx-auto mb-6 bg-orange-50 rounded-full flex items-center justify-center">
              <Bell className="w-12 h-12 text-orange-400 opacity-50" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">You're all caught up!</h3>
            <p className="text-gray-500 max-w-xs mx-auto">No new notifications at the moment. We'll let you know when something important happens.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <NotificationCard
                key={notification._id}
                notification={notification}
                onDelete={() => deleteNotification(notification._id)}
                onClick={() => handleNotificationClick(notification)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Notification Card Component
interface NotificationCardProps {
  notification: any;
  onDelete: () => void;
  onClick: () => void;
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onDelete,
  onClick,
}) => {
  const getTypeIcon = () => {
    switch (notification.type) {
      case 'message':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'order':
        return <Package className="w-5 h-5 text-orange-500" />;
      case 'payment':
        return <DollarSign className="w-5 h-5 text-green-500" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'alert':
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div
      onClick={onClick}
      className={`
        relative group bg-white border rounded-2xl p-5 transition-all duration-300 cursor-pointer shadow-sm
        ${notification.isRead
          ? 'border-gray-100 opacity-80 hover:opacity-100'
          : 'border-orange-200 bg-orange-50/10 hover:bg-orange-50/30 ring-1 ring-orange-100/50 shadow-orange-100/20'}
        hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-0.5
      `}
    >
      <div className="flex items-start gap-5">
        {/* Icon */}
        <div className={`
          flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300
          ${notification.isRead ? 'bg-gray-50 text-gray-400' : 'bg-white shadow-lg shadow-orange-100 text-orange-500 group-hover:scale-110'}
        `}>
          {getTypeIcon()}
        </div>

        {/* Content */}
        <div className="flex-grow min-w-0">
          <div className="flex items-center justify-between gap-4 mb-1">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${notification.type === 'order' ? 'bg-orange-100 text-orange-700' :
                  notification.type === 'payment' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-600'
                }`}>
                {notification.type}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                <Clock className="w-3 h-3" />
                {moment(notification.createdAt).fromNow()}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {notification.title && (
            <h4 className={`text-base font-bold mb-1 ${notification.isRead ? 'text-gray-700' : 'text-gray-900 group-hover:text-orange-600 transition-colors'}`}>
              {notification.title}
            </h4>
          )}

          <p className={`text-sm leading-relaxed ${notification.isRead ? 'text-gray-500' : 'text-gray-700 font-medium'}`}>
            {notification.message}
          </p>

          {notification.link && (
            <div className="mt-4 flex items-center gap-2 text-xs font-black text-orange-500 uppercase tracking-tighter group-hover:tracking-normal transition-all">
              Details and Action <ExternalLink className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
      </div>

      {/* Unread Indicator Dot */}
      {!notification.isRead && (
        <div className="absolute top-0 right-0 p-2 origin-top-right">
          <div className="w-3 i-3 bg-orange-500 rounded-full border-2 border-white shadow-sm animate-pulse" />
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;