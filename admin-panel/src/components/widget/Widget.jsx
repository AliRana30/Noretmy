import { useContext } from 'react';
import { TrendingUp, TrendingDown, Users, Package, DollarSign, Briefcase, CreditCard, MessageSquare, FileCheck, Bell } from 'lucide-react';
import { DarkModeContext } from '../../context/darkModeContext';
import { useLocalization } from '../../context/LocalizationContext.jsx';
import homeTranslations from '../../localization/home.json';
import widgetTranslations from '../../localization/widget.json';

const Widget = ({ 
  type, 
  count, 
  title, 
  subtitle, 
  icon, 
  color, 
  isCurrency = false,
  trend = 'up',
  trendValue = 12
}) => {
  const { darkMode } = useContext(DarkModeContext);
  const { getTranslation } = useLocalization();
  
  let data;

  // Icon mapping for emojis to Lucide icons
  const getIcon = (iconType) => {
    const iconMap = {
      '👥': Users,
      '📦': Package,
      '💰': DollarSign,
      '💼': Briefcase,
      '💸': CreditCard,
      '💬': MessageSquare,
      '📄': FileCheck,
      '🔔': Bell,
    };
    const IconComponent = iconMap[iconType] || Users;
    return <IconComponent className="w-6 h-6" />;
  };

  // If custom props are provided (for admin widgets), use them
  if (title && icon && color) {
    data = {
      title: title,
      isMoney: isCurrency,
      link: subtitle || "",
      iconColor: color,
      iconElement: typeof icon === 'string' ? getIcon(icon) : icon,
      value: count || 0,
    };
  } else {
    // Default widget types for regular dashboard
    const widgetConfig = {
      user: {
        title: getTranslation(homeTranslations, 'users') || 'Users',
        isMoney: false,
        link: getTranslation(widgetTranslations, 'seeAllUsers') || 'See all users',
        iconColor: '#f97316',
        iconElement: <Users className="w-6 h-6" />,
        value: count,
      },
      order: {
        title: getTranslation(homeTranslations, 'orders') || 'Orders',
        isMoney: false,
        link: getTranslation(widgetTranslations, 'viewAllOrders') || 'View all orders',
        iconColor: '#3b82f6',
        iconElement: <Package className="w-6 h-6" />,
        value: count,
      },
      earning: {
        title: getTranslation(homeTranslations, 'earnings') || 'Earnings',
        isMoney: true,
        link: getTranslation(widgetTranslations, 'viewNetEarnings') || 'View net earnings',
        iconColor: '#22c55e',
        iconElement: <DollarSign className="w-6 h-6" />,
        value: count,
      },
      gigs: {
        title: getTranslation(homeTranslations, 'gigs') || 'Gigs',
        isMoney: false,
        link: getTranslation(widgetTranslations, 'seeAllGigs') || 'See all gigs',
        iconColor: '#8b5cf6',
        iconElement: <Briefcase className="w-6 h-6" />,
        value: count,
      },
      adminUsers: {
        title: title || 'Total Users',
        isMoney: false,
        link: subtitle || 'User management',
        iconColor: '#4285f4',
        iconElement: <Users className="w-6 h-6" />,
        value: count,
      },
      adminOrders: {
        title: title || 'Total Orders',
        isMoney: false,
        link: subtitle || 'Order management',
        iconColor: '#34a853',
        iconElement: <Package className="w-6 h-6" />,
        value: count,
      },
      adminRevenue: {
        title: title || 'Total Revenue',
        isMoney: true,
        link: subtitle || 'Financial overview',
        iconColor: '#fbbc04',
        iconElement: <DollarSign className="w-6 h-6" />,
        value: count,
      },
      adminJobs: {
        title: title || 'Active Jobs',
        isMoney: false,
        link: subtitle || 'Job management',
        iconColor: '#ea4335',
        iconElement: <Briefcase className="w-6 h-6" />,
        value: count,
      },
    };

    data = widgetConfig[type] || {
      title: 'Unknown',
      isMoney: false,
      link: '',
      iconColor: '#6b7280',
      iconElement: <Bell className="w-6 h-6" />,
      value: 0,
    };
  }

  const iconBgColor = data.iconColor + '20'; // 20% opacity

  return (
    <div className={`rounded-2xl p-6 transition-colors ${
      darkMode 
        ? 'bg-[#1a1a2e]/80 border border-white/10 hover:border-white/20' 
        : 'bg-white border border-gray-100 hover:border-gray-200 shadow-sm'
    }`}>
      <div className="flex justify-between items-start">
        {/* Left Content */}
        <div className="flex flex-col gap-3">
          <span className={`text-xs font-semibold uppercase tracking-wider ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {data.title}
          </span>
          
          <span className={`text-3xl font-bold ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {data.isMoney && '$'}
            {typeof data.value === 'number' ? data.value.toLocaleString() : data.value}
          </span>
          
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 text-xs font-medium ${
              trend === 'up' ? 'text-orange-500' : 'text-red-500'
            }`}>
              {trend === 'up' ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>{trendValue}%</span>
            </div>
            <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {data.link}
            </span>
          </div>
        </div>
        
        {/* Right Icon */}
        <div 
          className="p-3 rounded-xl"
          style={{ 
            backgroundColor: iconBgColor,
            color: data.iconColor 
          }}
        >
          {data.iconElement}
        </div>
      </div>
    </div>
  );
};

export default Widget;
