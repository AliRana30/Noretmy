import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getMyNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "../utils/adminApi";
import { toast } from "react-hot-toast";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
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
  }, []);

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
    fetchNotifications();
    // Poll for new notifications
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

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
