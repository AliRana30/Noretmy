import { useState, useContext } from "react";
import { Search, Bell, MessageSquare, Maximize2, ChevronDown, User } from "lucide-react";
import { useLocalization } from "../../context/LocalizationContext.jsx";
import navbarTranslations from "../../localization/navbar.json";
import LanguageSwitcher from "../languageSwitcher/LanguageSwitcher";
import { useAuth } from "../../context/AuthContext";
import NotificationDropdown from "./NotificationDropdown";

// Bundled fallback avatar (public asset, works even when offline)
const FALLBACK_AVATAR = "/fallback-avatar.svg";

// Default fallback avatar SVG as data URI (backup for onError)
const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23f97316'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";

const Navbar = () => {
  const { getTranslation } = useLocalization();
  const { user } = useAuth();
  const [messageCount] = useState(2);

  return (
    <nav className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <input
            type="text"
            placeholder={getTranslation(navbarTranslations, "search") || "Search..."}
            className="w-64 lg:w-80 pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Language Switcher */}
        <div className="px-2">
          <LanguageSwitcher />
        </div>

        {/* Fullscreen */}
        <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700">
          <Maximize2 className="w-5 h-5" />
        </button>

        {/* Notifications */}
        <NotificationDropdown />

        {/* Messages */}
        <div className="relative">
          <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700">
            <MessageSquare className="w-5 h-5" />
          </button>
          {messageCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-orange-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
              {messageCount}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-gray-200 mx-2" />

        {/* User Profile */}
        <button className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-gray-50 transition-colors">
          <img
            src={user?.img || user?.profilePicture || FALLBACK_AVATAR}
            alt="Profile"
            className="w-9 h-9 rounded-full object-cover ring-2 ring-gray-100"
            onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_AVATAR; }}
          />
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium text-gray-900">
              {user?.fullName || user?.username || "Admin User"}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {user?.role || "Administrator"}
            </p>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400 hidden md:block" />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
