'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import moment from 'moment';
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
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Types
interface NotificationData {
  _id: string;
  title?: string;
  type: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  link?: string;
  isGlobal?: boolean;
}

// Notification Page Component
const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const backendUrl = process.env.NEXT_PUBLIC_API_URL;

  // Fetch Notifications
  useEffect(() => {
    let isMounted = true;

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get<{ notifications: NotificationData[] }>(
          `${backendUrl}/notification`,
          { withCredentials: true },
        );

        if (isMounted) {
          setNotifications(response.data.notifications || []);
        }
      } catch (err) {
        if (isMounted) setError('Failed to load notifications.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchNotifications();

    return () => {
      isMounted = false;
    };
  }, [backendUrl]);

  const markAsRead = async (notificationId: string) => {
    try {
      await axios.put(
        `${backendUrl}/notification/${notificationId}/read`,
        {},
        { withCredentials: true }
      );
      setNotifications((prev) =>
        prev.map((n) => n._id === notificationId ? { ...n, isRead: true } : n)
      );
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(
        `${backendUrl}/notification/mark-all-read`,
        {},
        { withCredentials: true }
      );
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true }))
      );
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      toast.error('Failed to mark all as read');
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await axios.delete(`${backendUrl}/notification/${id}`, {
        withCredentials: true
      });
      setNotifications((prev) => prev.filter((notif) => notif._id !== id));
      toast.success('Notification deleted');
    } catch (err) {
      console.error('Failed to delete notification:', err);
      toast.error('Failed to delete notification');
    }
  };

  const deleteAllNotifications = async () => {
    try {
      await axios.delete(`${backendUrl}/notification`, {
        withCredentials: true
      });
      setNotifications((prev) => prev.filter(n => n.isGlobal)); // Keep global notifications
      toast.success('All notifications deleted');
    } catch (err) {
      console.error('Failed to delete all notifications:', err);
      toast.error('Failed to delete all notifications');
    }
  };

  const handleNotificationClick = (notification: NotificationData) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const getUnreadCount = () => notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Bell className="w-6 h-6 text-orange-600" />
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              {getUnreadCount() > 0 && (
                <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-full">
                  {getUnreadCount()} new
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm">Stay updated with your latest activity</p>
          </div>

          {notifications.length > 0 && (
            <div className="flex gap-2">
              {getUnreadCount() > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <CheckCheck className="w-4 h-4" />
                  Mark all read
                </button>
              )}
              <button
                onClick={deleteAllNotifications}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonNotification key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="text-red-600 font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try again
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-orange-50 rounded-full flex items-center justify-center">
              <Bell className="w-10 h-10 text-orange-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-500">You're all caught up! Check back later for updates.</p>
          </div>
        ) : (
          <div className="space-y-3">
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
  notification: NotificationData;
  onDelete: () => void;
  onClick: () => void;
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onDelete,
  onClick,
}) => {
  const [showMenu, setShowMenu] = useState(false);

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

  const getTypeBadge = () => {
    const badgeClasses: Record<string, string> = {
      message: 'bg-blue-100 text-blue-700',
      order: 'bg-orange-100 text-orange-700',
      payment: 'bg-green-100 text-green-700',
      success: 'bg-green-100 text-green-700',
      alert: 'bg-amber-100 text-amber-700',
      warning: 'bg-amber-100 text-amber-700',
      system: 'bg-gray-100 text-gray-700',
    };
    const className = badgeClasses[notification.type] || 'bg-gray-100 text-gray-700';
    return (
      <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${className}`}>
        {notification.type}
      </span>
    );
  };

  return (
    <div
      onClick={onClick}
      className={`
        relative group bg-white border rounded-xl p-4 transition-all duration-200 cursor-pointer
        ${notification.isRead
          ? 'border-gray-200 hover:border-gray-300'
          : 'border-orange-200 bg-orange-50/30 hover:bg-orange-50'}
        hover:shadow-md
      `}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`
          flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
          ${notification.isRead ? 'bg-gray-100' : 'bg-white shadow-sm'}
        `}>
          {getTypeIcon()}
        </div>

        {/* Content */}
        <div className="flex-grow min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              {getTypeBadge()}
              {notification.link && (
                <ExternalLink className="w-3 h-3 text-gray-400" />
              )}
            </div>

            {/* Menu */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-1.5 rounded-lg hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="w-4 h-4 text-gray-400" />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-1 w-48 rounded-lg shadow-lg bg-white border border-gray-200 z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                      setShowMenu(false);
                    }}
                    className="flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full rounded-lg"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete notification
                  </button>
                </div>
              )}
            </div>
          </div>

          {notification.title && (
            <h4 className={`text-sm font-semibold mb-1 ${notification.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
              {notification.title}
            </h4>
          )}

          <p className={`text-sm ${notification.isRead ? 'text-gray-600' : 'text-gray-900'}`}>
            {notification.message}
          </p>

          <div className="flex items-center gap-2 mt-2">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-400">
              {moment(notification.createdAt).fromNow()}
            </span>
          </div>
        </div>
      </div>

      {/* Unread Indicator */}
      {!notification.isRead && (
        <div className="absolute top-4 right-4 w-2 h-2 bg-orange-500 rounded-full" />
      )}
    </div>
  );
};

export default NotificationsPage;