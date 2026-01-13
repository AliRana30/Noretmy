'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, CheckCheck, Trash2, Clock, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/context/NotificationContext';
import moment from 'moment';

const NotificationBell: React.FC = () => {
    const {
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification
    } = useNotifications();

    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const dropdownRef = useRef<HTMLDivElement>(null);

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

    const handleNotificationClick = (notification: any) => {
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
                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 shadow-lg animate-pulse">
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
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1 transition-colors"
                                >
                                    <CheckCheck className="w-3 h-3" />
                                    Mark all read
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
                        {loading && notifications.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500 mx-auto"></div>
                                <p className="mt-4 text-sm text-gray-500 font-medium">Loading notifications...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-10 text-center text-gray-500">
                                <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Bell className="w-8 h-8 text-orange-400" />
                                </div>
                                <p className="font-bold text-gray-900">No notifications yet</p>
                                <p className="text-sm mt-1">We'll notify you when something happens</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {notifications.slice(0, 10).map((notification) => (
                                    <div
                                        key={notification._id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`p-4 cursor-pointer hover:bg-orange-50/30 transition-all duration-200 group relative ${!notification.isRead ? 'bg-orange-50/20' : ''
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="text-xl flex-shrink-0 bg-white shadow-sm w-10 h-10 rounded-full flex items-center justify-center border border-gray-50 group-hover:scale-110 transition-transform">
                                                {getNotificationIcon(notification.type)}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-0.5">
                                                    {notification.title && (
                                                        <p className={`text-sm font-bold truncate ${notification.isRead ? '!text-gray-700' : '!text-gray-900'}`}>
                                                            {notification.title}
                                                        </p>
                                                    )}
                                                    <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                                        {moment(notification.createdAt).fromNow(true)}
                                                    </span>
                                                </div>
                                                <p className={`text-sm leading-relaxed ${notification.isRead ? '!text-gray-500' : '!text-gray-700'} line-clamp-2`}>
                                                    {notification.message}
                                                </p>
                                                {notification.link && (
                                                    <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-orange-500 uppercase tracking-wider">
                                                        View Details <ExternalLink className="w-2.5 h-2.5" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col items-center gap-2">
                                                {!notification.isRead && (
                                                    <span className="w-2 h-2 bg-orange-500 rounded-full shadow-sm shadow-orange-200 animate-pulse"></span>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteNotification(notification._id);
                                                    }}
                                                    className="p-1.5 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-red-500" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="p-3 border-t border-gray-100 bg-gray-50/50">
                            <button
                                onClick={() => {
                                    router.push('/notifications');
                                    setIsOpen(false);
                                }}
                                className="w-full py-2 bg-white border border-gray-200 rounded-xl text-center text-sm text-gray-700 hover:text-orange-600 hover:border-orange-200 font-semibold shadow-sm transition-all active:scale-95"
                            >
                                View all notification history
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
