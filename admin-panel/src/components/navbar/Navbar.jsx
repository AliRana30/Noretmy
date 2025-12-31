import { useState, useContext } from "react";
import { Search, Bell, MessageSquare, Maximize2, ChevronDown } from "lucide-react";
import { useLocalization } from "../../context/LocalizationContext.jsx";
import navbarTranslations from "../../localization/navbar.json";
import LanguageSwitcher from "../languageSwitcher/LanguageSwitcher";
import { useAuth } from "../../context/AuthContext";

const Navbar = () => {
  const { getTranslation } = useLocalization();
  const { user } = useAuth();
  const [notificationCount] = useState(3);
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
        <div className="relative">
          <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700">
            <Bell className="w-5 h-5" />
          </button>
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
              {notificationCount}
            </span>
          )}
        </div>

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
            src={user?.img || user?.profilePicture || "https://images.pexels.com/photos/941693/pexels-photo-941693.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=500"}
            alt="Profile"
            className="w-9 h-9 rounded-full object-cover ring-2 ring-gray-100"
          />
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium text-gray-900">
              {user?.fullName || "Admin User"}
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
