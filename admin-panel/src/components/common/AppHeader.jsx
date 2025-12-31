import { useState, useContext, useRef, useEffect } from 'react';
import { Search, Moon, Sun, Bell, LogOut, User, Settings, ChevronDown, X, Check } from 'lucide-react';
import { DarkModeContext } from '../../context/darkModeContext';
import { useLocalization } from '../../context/LocalizationContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import navbarTranslations from '../../localization/navbar.json';
import LanguageSwitcher from '../languageSwitcher/LanguageSwitcher';
import axios from 'axios';
import { API_CONFIG } from '../../config/api';

export default function AppHeader() {
  const { darkMode, dispatch } = useContext(DarkModeContext);
  const { getTranslation } = useLocalization();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  
  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);

  // Load read notification IDs from localStorage
  const getReadNotificationIds = () => {
    try {
      return JSON.parse(localStorage.getItem('readNotificationIds') || '[]');
    } catch {
      return [];
    }
  };

  // Save read notification IDs to localStorage
  const saveReadNotificationIds = (ids) => {
    localStorage.setItem('readNotificationIds', JSON.stringify(ids));
  };

  // Fetch notifications from backend or generate dynamic ones
  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const response = await axios.get(`${API_CONFIG.BASE_URL}/api/admin/notifications?limit=10&read=false`, {
        withCredentials: true
      });
      
      const readIds = getReadNotificationIds();
      
      if (response?.data?.data && response.data.data.length > 0) {
        // Use real notifications from backend
        const notificationsWithReadState = response.data.data.map(n => ({
          id: n._id || n.id,
          type: n.type || 'alert',
          title: n.title || 'Notification',
          message: n.message || '',
          time: getRelativeTime(new Date(n.createdAt)),
          read: readIds.includes(n._id || n.id) || n.isRead
        }));
        setNotifications(notificationsWithReadState);
      } else {
        // Fallback: Generate dynamic notifications based on recent platform activity
        await fetchDynamicNotifications(readIds);
      }
    } catch (error) {
      // Fallback to dynamic notifications based on recent activity
      const readIds = getReadNotificationIds();
      await fetchDynamicNotifications(readIds);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Fetch dynamic notifications based on actual platform activity
  const fetchDynamicNotifications = async (readIds = []) => {
    try {
      const [usersRes, ordersRes, jobsRes] = await Promise.allSettled([
        axios.get(`${API_CONFIG.BASE_URL}/api/admin/users?limit=1&sortBy=createdAt&sortOrder=desc`, { withCredentials: true }),
        axios.get(`${API_CONFIG.BASE_URL}/api/admin/orders?limit=1`, { withCredentials: true }),
        axios.get(`${API_CONFIG.BASE_URL}/api/job?limit=1`, { withCredentials: true }),
      ]);

      const dynamicNotifs = [];
      const now = new Date();

      // Check for recent users
      if (usersRes.status === 'fulfilled' && usersRes.value?.data?.data?.[0]) {
        const user = usersRes.value.data.data[0];
        const userDate = new Date(user.createdAt);
        if ((now - userDate) < 86400000) { // Within 24 hours
          dynamicNotifs.push({
            id: 'user-' + user._id,
            type: 'user',
            title: 'New User Registered',
            message: `${user.fullName || user.username} just signed up`,
            time: getRelativeTime(userDate),
            read: readIds.includes('user-' + user._id)
          });
        }
      }

      // Check for recent orders
      if (ordersRes.status === 'fulfilled' && ordersRes.value?.data?.data?.[0]) {
        const order = ordersRes.value.data.data[0];
        const orderDate = new Date(order.createdAt);
        if ((now - orderDate) < 86400000) {
          dynamicNotifs.push({
            id: 'order-' + order._id,
            type: 'order',
            title: 'New Order Placed',
            message: `Order for $${order.price || order.totalPrice || 0}`,
            time: getRelativeTime(orderDate),
            read: readIds.includes('order-' + order._id)
          });
        }
      }

      // Check for recent jobs
      if (jobsRes.status === 'fulfilled' && jobsRes.value?.data?.[0]) {
        const job = jobsRes.value.data[0];
        const jobDate = new Date(job.createdAt);
        if ((now - jobDate) < 86400000) {
          dynamicNotifs.push({
            id: 'job-' + job._id,
            type: 'job',
            title: 'New Gig Posted',
            message: job.title || 'A new service was posted',
            time: getRelativeTime(jobDate),
            read: readIds.includes('job-' + job._id)
          });
        }
      }

      // If no recent activity, show system notification
      if (dynamicNotifs.length === 0) {
        dynamicNotifs.push({
          id: 'system-welcome',
          type: 'alert',
          title: 'Welcome to Admin Panel',
          message: 'All systems operational',
          time: 'Just now',
          read: readIds.includes('system-welcome')
        });
      }

      setNotifications(dynamicNotifs);
    } catch (err) {
      // Final fallback
      setNotifications([{
        id: 'system-fallback',
        type: 'alert',
        title: 'Admin Panel Ready',
        message: 'All systems operational',
        time: 'Just now',
        read: true
      }]);
    }
  };



  const getRelativeTime = (date) => {
    const now = new Date();
    const diff = Math.floor((now - date) / 1000 / 60);
    
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff} min ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)} hours ago`;
    return `${Math.floor(diff / 1440)} days ago`;
  };

  useEffect(() => {
    fetchNotifications();
    
    // Refresh notifications every 5 minutes
    const interval = setInterval(fetchNotifications, 300000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const markAsRead = (id) => {
    // Update state
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    // Persist to localStorage
    const readIds = getReadNotificationIds();
    if (!readIds.includes(id)) {
      saveReadNotificationIds([...readIds, id]);
    }
  };

  const markAllAsRead = () => {
    // Update state
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    // Persist all IDs to localStorage
    const allIds = notifications.map(n => n.id);
    saveReadNotificationIds(allIds);
  };

  // Get only unread notifications for display in dropdown
  const unreadNotifications = notifications.filter(n => !n.read);

  const getNotificationIcon = (type) => {
    const icons = {
      user: '👤',
      order: '📦',
      withdrawal: '💰',
      alert: '🔔',
      job: '💼',
    };
    return icons[type] || '📌';
  };

  return (
    <header className={`h-16 flex items-center justify-between px-6 border-b transition-colors duration-300 sticky top-0 z-50 ${
      darkMode 
        ? 'bg-[#1a1a2e]/95 border-white/10 backdrop-blur-xl' 
        : 'bg-white/95 border-gray-200 backdrop-blur-xl'
    }`}>

      {/* Search Bar */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative flex-1">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={getTranslation(navbarTranslations, 'search') || 'Search...'}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all duration-200 outline-none ${
              darkMode 
                ? 'bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-orange-500/50 focus:bg-white/10' 
                : 'bg-gray-100 border border-transparent text-gray-900 placeholder-gray-500 focus:border-orange-500 focus:bg-white'
            }`}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-2">
        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Dark Mode Toggle */}
        <button
          onClick={() => dispatch({ type: 'TOGGLE' })}
          className={`p-2.5 rounded-xl transition-all duration-200 ${
            darkMode 
              ? 'bg-white/5 hover:bg-white/10 text-yellow-400' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
          }`}
          aria-label="Toggle dark mode"
        >
          {darkMode ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-2.5 rounded-xl transition-all duration-200 ${
              darkMode 
                ? 'bg-white/5 hover:bg-white/10 text-gray-300' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className={`absolute right-0 mt-2 w-80 rounded-2xl shadow-2xl overflow-hidden z-[9999] ${
              darkMode 
                ? 'bg-[#1a1a2e] border border-white/10' 
                : 'bg-white border border-gray-200'
            }`}>
              <div className={`px-4 py-3 flex items-center justify-between border-b ${
                darkMode ? 'border-white/10' : 'border-gray-100'
              }`}>
                <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Notifications
                </h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllAsRead}
                      className="text-xs font-medium text-orange-500 hover:text-orange-600"
                    >
                      Mark all read
                    </button>
                  )}
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-orange-500/20 text-orange-500">
                    {unreadCount} new
                  </span>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {loadingNotifications ? (
                  <div className="p-4 text-center">
                    <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : unreadNotifications.length === 0 ? (
                  <div className={`p-8 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No new notifications</p>
                  </div>
                ) : (
                  unreadNotifications.map((notification) => (
                    <div 
                      key={notification.id}
                      onClick={() => markAsRead(notification.id)}
                      className={`px-4 py-3 flex items-start gap-3 cursor-pointer transition-colors ${
                        darkMode ? 'bg-orange-500/5 hover:bg-orange-500/10' : 'bg-orange-50 hover:bg-orange-100'
                      }`}
                    >
                      <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {notification.title}
                        </p>
                        <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {notification.message}
                        </p>
                        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          {notification.time}
                        </p>
                      </div>
                      <span className="w-2 h-2 bg-orange-500 rounded-full mt-2"></span>
                    </div>
                  ))
                )}
              </div>
              <div className={`px-4 py-3 border-t ${darkMode ? 'border-white/10' : 'border-gray-100'}`}>
                <button 
                  onClick={() => { setShowNotifications(false); navigate('/notifications'); }}
                  className="w-full text-center text-sm font-medium text-orange-500 hover:text-orange-600"
                >
                  View All Notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-xl transition-all duration-200 ${
              darkMode 
                ? 'bg-white/5 hover:bg-white/10' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <div className="relative">
              <img
                src={user?.img || user?.profilePicture || 'https://via.placeholder.com/32'}
                alt={user?.fullName || 'User'}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-orange-500/30"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-[#1a1a2e]"></span>
            </div>
            <div className="hidden md:block text-left">
              <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {user?.fullName?.split(' ')[0] || 'Admin'}
              </p>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {user?.role || 'Administrator'}
              </p>
            </div>
            <ChevronDown className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          </button>

          {/* User Dropdown */}
          {showUserMenu && (
            <div className={`absolute right-0 mt-2 w-56 rounded-2xl shadow-2xl overflow-hidden z-[9999] ${
              darkMode 
                ? 'bg-[#1a1a2e] border border-white/10' 
                : 'bg-white border border-gray-200'
            }`}>
              <div className={`px-4 py-3 border-b ${darkMode ? 'border-white/10' : 'border-gray-100'}`}>
                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {user?.fullName || 'Admin User'}
                </p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {user?.email || 'admin@noretmy.com'}
                </p>
              </div>
              
              <div className="py-2">
                <button
                  onClick={() => { setShowUserMenu(false); navigate('/profile'); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                    darkMode 
                      ? 'text-gray-300 hover:bg-white/5' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <User className="w-4 h-4" />
                  Profile
                </button>
                <button
                  onClick={() => { setShowUserMenu(false); navigate('/settings'); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                    darkMode 
                      ? 'text-gray-300 hover:bg-white/5' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
              </div>
              
              <div className={`border-t py-2 ${darkMode ? 'border-white/10' : 'border-gray-100'}`}>
                <button
                  onClick={handleLogout}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                    darkMode 
                      ? 'text-red-400 hover:bg-red-500/10' 
                      : 'text-red-600 hover:bg-red-50'
                  }`}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
