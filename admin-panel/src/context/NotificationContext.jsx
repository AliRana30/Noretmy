import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getAdminNotifications, markNotificationAsRead, markAllAdminNotificationsAsRead } from "../utils/adminApi";
import { toast } from "react-hot-toast";
import { useAuth } from "./AuthContext";
import { io as createSocket } from "socket.io-client";
import { API_CONFIG } from "../config/api";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { isAuthenticated, user } = useAuth();

  const getAdminId = useCallback(() => {
    return (
      user?._id ||
      user?.id ||
      user?.user?._id ||
      user?.user?.id ||
      user?.data?._id ||
      user?.data?.id ||
      null
    );
  }, [user]);

  const fetchNotifications = useCallback(async ({ page = currentPage } = {}) => {
    if (!isAuthenticated() || !user) return;
    
    try {
      setLoading(true);
      const response = await getAdminNotifications({ limit: 10, page });
      const list = response?.data || response?.notifications || response || [];
      const pagination = response?.pagination || {};

      if (Array.isArray(list)) {
        setNotifications(list);
        setCurrentPage(Number(pagination.current || page || 1));
        setTotalPages(Math.max(1, Number(pagination.pages || 1)));
        const unread = list.filter(n => !n.isRead).length;
        setUnreadCount(unread);
      } else {
        setNotifications([]);
        setUnreadCount(0);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching admin notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, isAuthenticated, user]);

  const goToPage = useCallback((page) => {
    const bounded = Math.min(Math.max(1, Number(page) || 1), totalPages);
    fetchNotifications({ page: bounded });
  }, [fetchNotifications, totalPages]);

  const handleMarkAsRead = async (id) => {
    const prevNotifications = [...notifications];
    const prevUnreadCount = unreadCount;

    setNotifications(prev => 
      prev.map(n => n._id === id ? { ...n, isRead: true } : n)
    );
    
    const notif = notifications.find(n => n._id === id);
    if (notif && !notif.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
    } else if (!notif) {
        setUnreadCount(prev => Math.max(0, prev - 1));
    }

    try {
      await markNotificationAsRead(id);
    } catch (error) {
      setNotifications(prevNotifications);
      setUnreadCount(prevUnreadCount);
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    const prevNotifications = [...notifications];
    const prevUnreadCount = unreadCount;

    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await markAllAdminNotificationsAsRead();
      toast.success('All notifications marked as read');
    } catch (error) {
      setNotifications(prevNotifications);
      setUnreadCount(prevUnreadCount);
      toast.error('Failed to mark all as read');
    }
  };

  useEffect(() => {
    if (isAuthenticated() && user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [fetchNotifications, isAuthenticated, user]);

  useEffect(() => {
    if (!isAuthenticated() || !user) return;

    const adminId = getAdminId();
    if (!adminId) {
      console.warn('[Admin Notifications] Missing admin id; socket will not register userOnline');
    }

    // Strip /api suffix for socket connection (if present)
    const SOCKET_URL = API_CONFIG.BASE_URL.replace(/\/api\/?$/, '');
    
    const socket = createSocket(SOCKET_URL, {
      withCredentials: true,
      transports: ['polling', 'websocket']
    });

    socket.on('connect', () => {
      console.log('🔌 [Admin Socket] Connected:', socket.id);
      if (adminId) {
        socket.emit('userOnline', String(adminId));
        console.log('🟢 [Admin Socket] userOnline emitted:', String(adminId));
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 [Admin Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.error('❌ [Admin Socket] connect_error:', err?.message || err);
    });

    const handleRealtimeNotification = (payload) => {
      console.log('📩 [Admin Socket] notification received:', payload);
      fetchNotifications();
    };

    socket.on('notification', handleRealtimeNotification);
    socket.on('newNotification', handleRealtimeNotification);
    socket.on('adminNotification', handleRealtimeNotification); // Admin-specific events

    return () => {
      socket.off('notification', handleRealtimeNotification);
      socket.off('newNotification', handleRealtimeNotification);
      socket.off('adminNotification', handleRealtimeNotification);
      socket.disconnect();
    };
  }, [fetchNotifications, getAdminId, isAuthenticated, user]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      currentPage,
      totalPages,
      fetchNotifications,
      goToPage,
      markAsRead: handleMarkAsRead,
      markAllAsRead: handleMarkAllAsRead
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
