import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getMyNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "../utils/adminApi";
import { toast } from "react-hot-toast";
import { useAuth } from "./AuthContext";
import { io as createSocket } from "socket.io-client";
import { API_CONFIG } from "../config/api";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
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

  const fetchNotifications = useCallback(async () => {
    // Only fetch if authenticated and we have a user
    if (!isAuthenticated() || !user) return;
    
    try {
      setLoading(true);
      const response = await getMyNotifications();
      if (response && response.notifications) {
        setNotifications(response.notifications);
        const unread = response.notifications.filter(n => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Error fetching admin notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const handleMarkAsRead = async (id) => {
    // Optimistic UI update
    const prevNotifications = [...notifications];
    const prevUnreadCount = unreadCount;

    setNotifications(prev => 
      prev.map(n => n._id === id ? { ...n, isRead: true } : n)
    );
    
    // Important: decrement unread count if it was unread
    const notif = notifications.find(n => n._id === id);
    if (notif && !notif.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
    } else if (!notif) {
        // Fallback if not in list
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
      await markAllNotificationsAsRead();
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
      // Poll for new notifications
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [fetchNotifications, isAuthenticated, user]);

  // Realtime notifications via Socket.IO
  useEffect(() => {
    if (!isAuthenticated() || !user) return;

    const adminId = getAdminId();
    if (!adminId) {
      console.warn('[Admin Notifications] Missing admin id; socket will not register userOnline');
    }

    const socket = createSocket(API_CONFIG.BASE_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling']
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
      // Keep UI consistent with DB: refetch full list
      fetchNotifications();
    };

    // Backend emits `notification` in most places; promotion uses `newNotification`
    socket.on('notification', handleRealtimeNotification);
    socket.on('newNotification', handleRealtimeNotification);

    return () => {
      socket.off('notification', handleRealtimeNotification);
      socket.off('newNotification', handleRealtimeNotification);
      socket.disconnect();
    };
  }, [fetchNotifications, getAdminId, isAuthenticated, user]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      fetchNotifications,
      markAsRead: handleMarkAsRead,
      markAllAsRead: handleMarkAllAsRead
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
