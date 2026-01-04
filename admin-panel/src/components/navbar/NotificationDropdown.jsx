import { useState, useEffect, useRef, useContext } from 'react';
import { Bell, Check, Trash2, ExternalLink, Clock } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useLocalization } from '../../context/LocalizationContext';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications } = useNotifications();
  const { getTranslation } = useLocalization();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    await markAsRead(id);
  };

  const handleToggle = () => {
    if (!isOpen) {
        fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={handleToggle}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700 relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h3 className="font-semibold text-gray-800 text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs text-orange-500 hover:text-orange-600 font-medium transition-colors flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-gray-400 text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map((notification) => (
                  <div 
                    key={notification._id}
                    className={`block p-4 transition-colors hover:bg-gray-50 ${!notification.isRead ? 'bg-orange-50/30' : ''}`}
                    onClick={(e) => !notification.isRead && handleMarkAsRead(notification._id, e)}
                  >
                    <div className="flex gap-3">
                      <div className={`mt-1 p-2 rounded-lg ${
                        notification.type === 'order' ? 'bg-blue-100 text-blue-600' :
                        notification.type === 'payment' ? 'bg-green-100 text-green-600' :
                        'bg-orange-100 text-orange-600'
                      }`}>
                        <Bell className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm leading-snug ${!notification.isRead ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                          {notification.message}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-[10px] text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(notification.createdAt)}
                          </span>
                          {notification.link && (
                            <Link 
                              to={notification.link}
                              className="text-[10px] text-orange-500 hover:text-orange-600 font-medium flex items-center gap-0.5"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(false);
                                if (!notification.isRead) handleMarkAsRead(notification._id);
                              }}
                            >
                              Details
                              <ExternalLink className="w-2.5 h-2.5" />
                            </Link>
                          )}
                        </div>
                      </div>
                      {!notification.isRead && (
                        <div className="mt-1 w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-3 border-t border-gray-50 text-center bg-gray-50/30">
            <button className="text-xs text-gray-500 hover:text-gray-700 font-medium">
              View all notification history
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
