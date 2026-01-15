'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

interface Notification {
    _id: string;
    title?: string;
    message: string;
    type: string;
    link?: string;
    isRead: boolean;
    createdAt: string;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    fetchNotifications: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

    const fetchUnreadCount = useCallback(async () => {
        try {
            const response = await axios.get(`${BACKEND_URL}/notification/unread-count`, {
                withCredentials: true,
            });
            setUnreadCount(response.data.count || 0);
        } catch (error) {
            console.error('Failed to fetch unread notifications:', error);
        }
    }, [BACKEND_URL]);

    const fetchFullNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${BACKEND_URL}/notification`, {
                withCredentials: true,
            });
            const data = response.data.notifications || [];
            setNotifications(data);
            setUnreadCount(data.filter((n: Notification) => !n.isRead).length);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [BACKEND_URL]);

    const markAsRead = async (id: string) => {
        const previousNotifications = [...notifications];
        const previousUnreadCount = unreadCount;

        setNotifications((prev) =>
            prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );

        const wasUnread = notifications.find(n => n._id === id && !n.isRead);
        if (wasUnread || notifications.length === 0) { // If not in list yet, still decrement count
            setUnreadCount((prev) => Math.max(0, prev - 1));
        }

        try {
            await axios.put(
                `${BACKEND_URL}/notification/${id}/read`,
                {},
                { withCredentials: true }
            );
        } catch (error) {
            setNotifications(previousNotifications);
            setUnreadCount(previousUnreadCount);
            toast.error('Failed to mark notification as read');
        }
    };

    const markAllAsRead = async () => {
        const previousNotifications = [...notifications];
        const previousUnreadCount = unreadCount;

        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);

        try {
            await axios.put(
                `${BACKEND_URL}/notification/mark-all-read`,
                {},
                { withCredentials: true }
            );
            toast.success('All notifications marked as read');
        } catch (error) {
            setNotifications(previousNotifications);
            setUnreadCount(previousUnreadCount);
            toast.error('Failed to mark all as read');
        }
    };

    const deleteNotification = async (id: string) => {
        const previousNotifications = [...notifications];
        const previousUnreadCount = unreadCount;

        const notif = notifications.find((n) => n._id === id);
        if (notif && !notif.isRead) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
        }
        setNotifications((prev) => prev.filter((n) => n._id !== id));

        try {
            await axios.delete(`${BACKEND_URL}/notification/${id}`, {
                withCredentials: true,
            });
            toast.success('Notification deleted');
        } catch (error) {
            setNotifications(previousNotifications);
            setUnreadCount(previousUnreadCount);
            toast.error('Failed to delete notification');
        }
    };

    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000);

        const handleSync = () => {
            fetchUnreadCount();
            fetchFullNotifications();
        };
        window.addEventListener('notifications_updated', handleSync);

        return () => {
            clearInterval(interval);
            window.removeEventListener('notifications_updated', handleSync);
        };
    }, [fetchUnreadCount, fetchFullNotifications]);

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                loading,
                fetchNotifications: fetchFullNotifications,
                markAsRead,
                markAllAsRead,
                deleteNotification,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
