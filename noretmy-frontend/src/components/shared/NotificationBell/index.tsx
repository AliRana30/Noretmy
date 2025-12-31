'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, CheckCheck, Trash2, Clock, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import moment from 'moment';

interface Notification {
    _id: string;
    title?: string;
    message: string;
    type: string;
    link?: string;
    isRead: boolean;
    createdAt: string;
}

const NotificationBell: React.FC = () => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

    // Fetch unread count
    const fetchUnreadCount = async () => {
        try {
            const response = await axios.get(`${BACKEND_URL}/notification/unread-count`, {
                withCredentials: true
            });
            setUnreadCount(response.data.count || 0);
        } catch (error) {
            console.error('Failed to fetch unread notifications:', error);
        }
    };

    // Fetch notifications
    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${BACKEND_URL}/notification`, {
                withCredentials: true
            });
            setNotifications(response.data.notifications || []);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUnreadCount();

        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleBellClick = () => {
        if (!isOpen) {
            fetchNotifications();
        }
        setIsOpen(!isOpen);
    };

    const markAsRead = async (notificationId: string) => {
        try {
            await axios.put(`${BACKEND_URL}/notification/${notificationId}/read`, {}, {
                withCredentials: true
            });
            setNotifications(prev =>
                prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await axios.put(`${BACKEND_URL}/notification/mark-all-read`, {}, {
                withCredentials: true
            });
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
            toast.success('All notifications marked as read');
        } catch (error) {
            console.error('Failed to mark all as read:', error);
            toast.error('Failed to mark all as read');
        }
    };

    const deleteNotification = async (notificationId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await axios.delete(`${BACKEND_URL}/notification/${notificationId}`, {
                withCredentials: true
            });
            setNotifications(prev => prev.filter(n => n._id !== notificationId));
            const notification = notifications.find(n => n._id === notificationId);
            if (notification && !notification.isRead) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
            toast.success('Notification deleted');
        } catch (error) {
            console.error('Failed to delete notification:', error);
            toast.error('Failed to delete notification');
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.isRead) {
            markAsRead(notification._id);
        }
        if (notification.link) {
            router.push(notification.link);
            setIsOpen(false);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'order': return '📦';
            case 'payment': return '💰';
            case 'message': return '💬';
            case 'warning': return '⚠️';
            case 'success': return '✅';
            case 'alert': return '🚨';
            default: return '🔔';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={handleBellClick}
                className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Notifications"
            >
                <Bell className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 shadow-lg animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Dropdown Modal */}
            {isOpen && (
                <div className="fixed inset-x-4 top-[70px] sm:absolute sm:inset-auto sm:right-0 sm:mt-3 sm:w-96 max-h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[90] transform origin-top-right transition-all duration-200">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-orange-50 to-white">
                        <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
                        <div className="flex items-center gap-2">
                            {notifications.some(n => !n.isRead) && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
                                >
                                    <CheckCheck className="w-3 h-3" />
                                    Mark all read
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 hover:bg-gray-100 rounded-full"
                            >
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-[400px] overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500 mx-auto"></div>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p className="font-medium">No notifications yet</p>
                                <p className="text-sm">We'll notify you when something happens</p>
                            </div>
                        ) : (
                            notifications.slice(0, 10).map((notification) => (
                                <div
                                    key={notification._id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors group ${!notification.isRead ? 'bg-orange-50/50' : ''
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="text-xl flex-shrink-0">
                                            {getNotificationIcon(notification.type)}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            {notification.title && (
                                                <p className="text-sm font-semibold text-gray-800 truncate">
                                                    {notification.title}
                                                </p>
                                            )}
                                            <p className={`text-sm ${notification.isRead ? 'text-gray-500' : 'text-gray-700'} line-clamp-2`}>
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Clock className="w-3 h-3 text-gray-400" />
                                                <span className="text-xs text-gray-400">
                                                    {moment(notification.createdAt).fromNow()}
                                                </span>
                                                {notification.link && (
                                                    <ExternalLink className="w-3 h-3 text-gray-400" />
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-center gap-1">
                                            {!notification.isRead && (
                                                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                                            )}
                                            <button
                                                onClick={(e) => deleteNotification(notification._id, e)}
                                                className="p-1 hover:bg-red-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="p-3 border-t border-gray-100 bg-gray-50">
                            <button
                                onClick={() => {
                                    router.push('/notifications');
                                    setIsOpen(false);
                                }}
                                className="w-full text-center text-sm text-orange-600 hover:text-orange-700 font-medium"
                            >
                                View all notifications
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
