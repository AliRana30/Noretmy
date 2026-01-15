import { useState, useContext, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Moon, Sun } from 'lucide-react';
import { DarkModeContext } from '../../context/darkModeContext.jsx';
import SidebarItem from './SidebarItem';
import SidebarLogo from './SidebarLogo';
import { SIDEBAR_NAV_LIST, SIDEBAR_SERVICE_ITEMS, SIDEBAR_USER_ITEMS } from './SidebarConfig';
import { useAuth } from '../../context/AuthContext';
import { useLocalization } from '../../context/LocalizationContext';
import sidebarTranslations from '../../localization/sidebar.json';

const FALLBACK_AVATAR = "/fallback-avatar.svg";
const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23f97316'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true;
  });
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, hasPermission, logout, user } = useAuth();
  const { getTranslation } = useLocalization();
  const { darkMode, dispatch } = useContext(DarkModeContext);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Check on mount
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleToggleSidebar = () => setIsOpen(!isOpen);

  const handleToggleTheme = () => {
    dispatch({ type: 'TOGGLE' });
  };

  const isPathSelected = (pathname, id) => {
    if (id === '/') {
      return pathname === '/' || pathname === '/dashboard';
    }
    return pathname === id || pathname.startsWith(id + '/');
  };

  const handleItemClick = (id) => () => {
    if (id === 'logout') {
      logout();
      navigate('/login');
      return;
    }
    if (id === 'profile') {
      navigate('/profile');
      return;
    }
    if (id === 'settings') {
      navigate('/settings');
      return;
    }
    if (id === 'system-health') {
      navigate('/system-health');
      return;
    }
    if (id === 'logs') {
      navigate('/logs');
      return;
    }
    if (id.startsWith('/')) {
      navigate(id);
    }
  };

  const filteredNavItems = SIDEBAR_NAV_LIST.filter((item) => {
    if (item.allowedRoles) {
      if (item.allowedRoles.includes('admin') && !isAdmin()) {
        return false;
      }
    }
    if (item.requiredPermission && !hasPermission(item.requiredPermission)) {
      return false;
    }
    return true;
  });

  return (
    <div
      className={`relative h-screen transition-all duration-300 ease-in-out flex flex-col ${
        isOpen ? 'lg:min-w-64 md:min-w-56 sm:min-w-[140px] min-w-[120px]' : 'w-16 sm:w-20'
      } ${
        darkMode 
          ? 'bg-gray-900 border-r border-gray-700' 
          : 'bg-white border-r border-gray-200'
      }`}
    >
      {/* Toggle Button */}
      <button
        onClick={handleToggleSidebar}
        className={`absolute z-10 -right-3 top-[74px] w-6 h-6 rounded-full flex items-center justify-center shadow-md transition-all cursor-pointer ${
          darkMode 
            ? 'bg-gray-800 border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white' 
            : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700'
        }`}
      >
        {isOpen ? (
          <ChevronLeft className="w-3.5 h-3.5" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Logo */}
      <SidebarLogo isOpen={isOpen} darkMode={darkMode} />

      <hr className={darkMode ? 'border-gray-700' : 'border-gray-200'} />

      {/* Navigation Items */}
      <div className="flex flex-col flex-1 py-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 240px)' }}>
        {/* Main Section */}
        {isOpen && (
          <div className="lg:px-5 md:px-4 px-2 mb-3">
            <p className={`text-[10px] font-bold uppercase tracking-wider ${
              darkMode ? 'text-gray-500' : 'text-gray-400'
            }`}>
              {getTranslation(sidebarTranslations, 'main') || 'Main'}
            </p>
          </div>
        )}

        {filteredNavItems.map((item) => {
          return (
            <SidebarItem
              key={item.id}
              icon={item.icon}
              label={item.translationKey ? getTranslation(sidebarTranslations, item.translationKey) : item.label}
              isOpen={isOpen}
              isSelected={isPathSelected(location.pathname, item.id)}
              onClick={handleItemClick(item.id)}
              darkMode={darkMode}
            />
          );
        })}

        {/* Service Section */}
        {isOpen && (
          <>
            <div className="px-5 mt-6 mb-3">
              <p className={`text-[10px] font-bold uppercase tracking-wider ${
                darkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>
                {getTranslation(sidebarTranslations, 'service') || 'Service'}
              </p>
            </div>
            {SIDEBAR_SERVICE_ITEMS.map((item) => (
              <SidebarItem
                key={item.id}
                icon={item.icon}
                label={getTranslation(sidebarTranslations, item.id) || item.label}
                isOpen={isOpen}
                isSelected={location.pathname === `/${item.id}`}
                onClick={handleItemClick(item.id)}
                darkMode={darkMode}
              />
            ))}
          </>
        )}

        {/* User Section */}
        {isOpen && (
          <>
            <div className="px-5 mt-6 mb-3">
              <p className={`text-[10px] font-bold uppercase tracking-wider ${
                darkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>
                {getTranslation(sidebarTranslations, 'user') || 'User'}
              </p>
            </div>
            {SIDEBAR_USER_ITEMS.map((item) => (
              <SidebarItem
                key={item.id}
                icon={item.icon}
                label={getTranslation(sidebarTranslations, item.id) || item.label}
                isOpen={isOpen}
                isSelected={location.pathname === `/${item.id}`}
                onClick={handleItemClick(item.id)}
                darkMode={darkMode}
                isLogout={item.id === 'logout'}
              />
            ))}
          </>
        )}
      </div>

      {/* Theme Toggle Button */}
      <div className={`px-4 py-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <button
          onClick={handleToggleTheme}
          className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-all ${
            darkMode 
              ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? (
            <>
              <Sun className="w-4 h-4" />
              {isOpen && <span className="text-sm">Light Mode</span>}
            </>
          ) : (
            <>
              <Moon className="w-4 h-4" />
              {isOpen && <span className="text-sm">Dark Mode</span>}
            </>
          )}
        </button>
      </div>

      {/* User Profile Section at Bottom */}
      {isOpen && (
        <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <img
              src={user?.img || user?.profilePicture || FALLBACK_AVATAR}
              alt="User"
              className="w-10 h-10 rounded-full object-cover ring-2 ring-orange-500/30"
              onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_AVATAR; }}
            />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {user?.fullName || user?.username || 'Admin'}
              </p>
              <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {user?.role || 'Administrator'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
