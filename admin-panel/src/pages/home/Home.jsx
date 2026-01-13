import React, { useEffect, useState, useContext } from "react";
import Widget from "../../components/widget/Widget";
import Featured from "../../components/featured/Featured";
import Chart from "../../components/chart/Chart";
import { getOrders, fetchData, getJobs } from "../../datatablesource";
import { useLocalization } from "../../context/LocalizationContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { DarkModeContext } from "../../context/darkModeContext.jsx";
import { ErrorMessage } from "../../components/ui";
import homeTranslations from "../../localization/home.json";
import datatableColumnsTranslations from "../../localization/datatableColumns.json";
import { getMonthName } from "../../utils/translationUtils";
import { getAdminDashboardStats } from "../../utils/adminApi";
import { Users, Package, DollarSign, Briefcase, TrendingUp, Activity, Clock, CheckCircle } from "lucide-react";
import { SkeletonDashboard } from "../../components/Skeletons";

const Home = () => {
  const { darkMode } = useContext(DarkModeContext);
  const [dashboardData, setDashboardData] = useState({
    totalSalesToday: 0,
    totalSales: 0,
    salesLastWeek: 0,
    salesLastMonth: 0,
    chartData: [],
    adminStats: null,
    loading: true,
    error: null,
    // Additional stats
    totalUsers: 0,
    totalOrders: 0,
    totalJobs: 0,
    pendingOrders: 0,
    completedOrders: 0,
  });

  const { getTranslation, currentLanguage } = useLocalization();
  const { isAdmin, hasPermission, user } = useAuth();

  const {
    totalSalesToday,
    totalSales,
    salesLastWeek,
    salesLastMonth,
    chartData,
    adminStats,
    loading,
    error,
    totalUsers,
    totalOrders,
    totalJobs,
    pendingOrders,
    completedOrders,
  } = dashboardData;

  const updateDashboardData = (updates) => {
    setDashboardData(prev => ({ ...prev, ...updates }));
  };

  // Load dashboard data from local endpoints
  const loadLocalDashboard = async () => {
    try {
      // Fetch users
      const users = await fetchData();
      
      // Fetch orders
      const orders = await getOrders();
      
      // Fetch jobs
      const jobs = await getJobs();

      const today = new Date().setHours(0, 0, 0, 0);
      const startOfLastWeek = new Date(today - 7 * 24 * 60 * 60 * 1000).setHours(0, 0, 0, 0);
      const startOfLastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).setHours(0, 0, 0, 0);

      let totalToday = 0;
      let total = 0;
      let lastWeek = 0;
      let lastMonth = 0;
      let completed = 0;
      let pending = 0;

      const revenueData = [];
      const currentDate = new Date();

      for (let i = 0; i < 6; i++) {
        const month = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        revenueData.push({ name: getMonthName(month.getMonth(), currentLanguage), Total: 0 });
      }
      revenueData.reverse();

      orders.forEach(order => {
        const orderDate = new Date(order.createdAt).setHours(0, 0, 0, 0);
        if (order.isCompleted) {
          completed++;
          total += order.price || 0;
          if (orderDate === today) totalToday += order.price || 0;
          if (orderDate >= startOfLastWeek) lastWeek += order.price || 0;
          if (orderDate >= startOfLastMonth) lastMonth += order.price || 0;

          const orderMonthIndex = currentDate.getMonth() - new Date(order.createdAt).getMonth() +
            (12 * (currentDate.getFullYear() - new Date(order.createdAt).getFullYear()));
          if (orderMonthIndex >= 0 && orderMonthIndex < 6) {
            revenueData[5 - orderMonthIndex].Total += order.price || 0;
          }
        } else {
          pending++;
        }
      });

      updateDashboardData({
        totalSalesToday: totalToday,
        totalSales: total,
        salesLastWeek: lastWeek,
        salesLastMonth: lastMonth,
        chartData: revenueData,
        totalUsers: users.length,
        totalOrders: orders.length,
        totalJobs: jobs.length,
        completedOrders: completed,
        pendingOrders: pending,
      });
    } catch (error) {
      console.error('Error loading local dashboard:', error);
      throw error;
    }
  };

  // Load admin dashboard stats
  const loadAdminDashboard = async () => {
    try {
      const adminResponse = await getAdminDashboardStats();
      const adminData = adminResponse?.data || adminResponse;
      
      updateDashboardData({
        adminStats: adminData,
        totalUsers: adminData?.users?.total || 0,
        totalOrders: adminData?.business?.totalOrders || 0,
        totalJobs: adminData?.business?.totalJobs || 0,
        totalSales: adminData?.business?.totalRevenue || 0,
        totalSalesToday: adminData?.business?.dailyRevenue || 0,
        salesLastWeek: adminData?.business?.weeklyRevenue || 0,
        salesLastMonth: adminData?.business?.monthlyRevenue || 0,
        pendingOrders: adminData?.business?.pendingOrders || 0,
        completedOrders: adminData?.business?.completedOrders || 0,
      });

      if (adminData?.insights?.monthlyRevenue) {
        const revenueData = adminData.insights.monthlyRevenue.map(item => ({
          name: getMonthName(new Date(item.month).getMonth(), currentLanguage),
          Total: item.revenue
        }));
        updateDashboardData({ chartData: revenueData });
      }
    } catch (adminError) {
      await loadLocalDashboard();
    }
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        updateDashboardData({ loading: true, error: null });
        
        if (isAdmin()) {
          await loadAdminDashboard();
        } else {
          // Only load local data if not an admin or if admin stats failed
          await loadLocalDashboard();
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        updateDashboardData({ error: error.message });
      } finally {
        updateDashboardData({ loading: false });
      }
    };

    loadDashboardData();
  }, [isAdmin, currentLanguage]);

  // Quick Stats Cards
  const QuickStats = () => {
    const stats = [
      { label: getTranslation(homeTranslations, "pendingOrders"), value: pendingOrders, icon: Clock, color: '#f59e0b' },
      { label: getTranslation(homeTranslations, "completedOrders"), value: completedOrders, icon: CheckCircle, color: '#22c55e' },
      { label: getTranslation(homeTranslations, "activeJobs"), value: totalJobs, icon: Briefcase, color: '#3b82f6' },
      { label: getTranslation(homeTranslations, "growth"), value: '+12%', icon: TrendingUp, color: '#8b5cf6' },
    ];

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div 
            key={label}
            className={`p-4 rounded-xl ${
              darkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: color + '20', color }}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
                <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Admin Analytics Cards
  const AdminAnalyticsSection = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* User Breakdown */}
      <div className={`p-6 rounded-2xl ${
        darkMode ? 'bg-[#1a1a2e]/80 border border-white/10' : 'bg-white border border-gray-100 shadow-lg'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {getTranslation(homeTranslations, "userOverview")}
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: getTranslation(homeTranslations, "freelancers"), value: adminStats?.users?.freelancers || 0, color: '#f97316' },
            { label: getTranslation(homeTranslations, "clients"), value: adminStats?.users?.clients || 0, color: '#3b82f6' },
            { label: getTranslation(homeTranslations, "admins"), value: adminStats?.users?.admins || 0, color: '#8b5cf6' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`p-4 rounded-xl text-center ${
              darkMode ? 'bg-white/5' : 'bg-gray-50'
            }`}>
              <p className={`text-2xl font-bold`} style={{ color }}>{value}</p>
              <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Order Status */}
      <div className={`p-6 rounded-2xl ${
        darkMode ? 'bg-[#1a1a2e]/80 border border-white/10' : 'bg-white border border-gray-100 shadow-lg'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {getTranslation(homeTranslations, "orderStatus")}
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: getTranslation(homeTranslations, "pendingOrders"), value: pendingOrders, color: '#f59e0b' },
            { label: getTranslation(homeTranslations, "completedOrders"), value: completedOrders, color: '#22c55e' },
            { label: getTranslation(homeTranslations, "totalSales"), value: totalOrders, color: '#6366f1' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`p-4 rounded-xl text-center ${
              darkMode ? 'bg-white/5' : 'bg-gray-50'
            }`}>
              <p className={`text-2xl font-bold`} style={{ color }}>{value}</p>
              <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Quick Actions
  const QuickActions = () => {
    const actions = [
      { href: '/admin/users', icon: <Users className="w-6 h-6 text-orange-500" />, title: getTranslation(homeTranslations, "manageUsers"), subtitle: `${totalUsers} ${getTranslation(homeTranslations, "users")}`, permission: 'user_management' },
      { href: '/admin/orders', icon: <Package className="w-6 h-6 text-blue-500" />, title: getTranslation(homeTranslations, "viewOrders"), subtitle: `${pendingOrders} ${getTranslation(homeTranslations, "pendingOrders")}`, permission: 'order_management' },
      { href: '/admin/withdrawals', icon: <DollarSign className="w-6 h-6 text-purple-500" />, title: getTranslation(homeTranslations, "withdrawals"), subtitle: getTranslation(homeTranslations, "processRequests"), permission: 'payment_management' },
      { href: '/admin/jobs', icon: <Briefcase className="w-6 h-6 text-slate-500" />, title: getTranslation(homeTranslations, "manageJobs"), subtitle: `${totalJobs} ${getTranslation(homeTranslations, "activeLabel")}`, permission: 'content_moderation' },
    ];

    return (
      <div className="mb-6">
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {getTranslation(homeTranslations, "quickActions")}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {actions.filter(a => hasPermission(a.permission)).map(({ href, icon, title, subtitle }) => (
            <div 
              key={href}
              onClick={() => window.location.href = href}
              className={`p-4 rounded-xl cursor-pointer transition-colors ${
                darkMode 
                  ? 'bg-[#1a1a2e]/80 border border-white/10 hover:border-white/20' 
                  : 'bg-white border border-gray-100 hover:border-gray-200 shadow-sm'
              }`}
            >
              <div className="mb-3">{icon}</div>
              <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</p>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{subtitle}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Loading State
  if (loading) {
    return (
      <div className="w-full">
        <div className="mb-8">
          <div className="skeleton h-8 w-64 mb-2" />
          <div className="skeleton h-5 w-96" />
        </div>
        <SkeletonDashboard />
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <ErrorMessage 
        message={error}
        onRetry={() => window.location.reload()}
        retryText="Refresh Dashboard"
      />
    );
  }

  return (
    <div className="w-full">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className={`text-2xl md:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {getTranslation(homeTranslations, "welcomeBack")} <span className="text-orange-500">{user?.fullName?.split(' ')[0] || 'Admin'}</span>! 👋
        </h1>
        <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {getTranslation(homeTranslations, "platformStatus")}
        </p>
      </div>

      {/* Main Stats Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Widget 
          type="adminUsers" 
          count={totalUsers} 
          title={getTranslation(homeTranslations, "totalUsers")}
          subtitle={getTranslation(homeTranslations, "userManagement")}
          icon="👥"
          color="#4285f4"
          trend="up"
          trendValue={8}
        />
        <Widget 
          type="adminOrders" 
          count={totalOrders} 
          title={getTranslation(homeTranslations, "totalOrders")}
          subtitle={`${completedOrders} ${getTranslation(homeTranslations, "completedOrders")}`}
          icon="📦"
          color="#34a853"
          trend="up"
          trendValue={15}
        />
        <Widget 
          type="adminRevenue" 
          count={totalSales} 
          title={getTranslation(homeTranslations, "totalRevenue")}
          subtitle={`$${salesLastMonth} ${getTranslation(homeTranslations, "thisMonth")}`}
          icon="💰"
          color="#fbbc04"
          isCurrency={true}
          trend="up"
          trendValue={22}
        />
        <Widget 
          type="adminJobs" 
          count={totalJobs} 
          title={getTranslation(homeTranslations, "activeJobs")}
          subtitle={getTranslation(homeTranslations, "jobListings")}
          icon="💼"
          color="#ea4335"
          trend="up"
          trendValue={5}
        />
      </div>

      {/* Quick Stats */}
      <QuickStats />

      {/* Admin Analytics */}
      {isAdmin() && <AdminAnalyticsSection />}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className={`p-6 rounded-2xl ${
          darkMode ? 'bg-[#1a1a2e]/80 border border-white/10' : 'bg-white border border-gray-100 shadow-lg'
        }`}>
          <Featured 
            title={getTranslation(homeTranslations, "financialOverview")}
            totalSalesToday={totalSalesToday} 
            salesLastWeek={salesLastWeek} 
            salesLastMonth={salesLastMonth}
            darkMode={darkMode}
          />
        </div>
        <div className={`p-6 rounded-2xl ${
          darkMode ? 'bg-[#1a1a2e]/80 border border-white/10' : 'bg-white border border-gray-100 shadow-lg'
        }`}>
          <Chart 
            title={getTranslation(homeTranslations, "last6MonthsRevenue") || "Last 6 Months Revenue"} 
            aspect={2 / 1} 
            data={chartData}
            darkMode={darkMode}
          />
        </div>
      </div>

      {/* Quick Actions */}
      {isAdmin() && <QuickActions />}

      {/* System Status */}
      {isAdmin() && (
        <div className={`p-6 rounded-2xl ${
          darkMode ? 'bg-[#1a1a2e]/80 border border-white/10' : 'bg-white border border-gray-100 shadow-lg'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {getTranslation(homeTranslations, "systemStatus")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: getTranslation(homeTranslations, "apiStatus"), status: getTranslation(homeTranslations, "operational"), color: '#22c55e' },
              { label: getTranslation(homeTranslations, "database"), status: getTranslation(homeTranslations, "connected"), color: '#22c55e' },
              { label: getTranslation(homeTranslations, "paymentGateway"), status: getTranslation(homeTranslations, "active"), color: '#22c55e' },
            ].map(({ label, status, color }) => (
              <div key={label} className={`p-4 rounded-xl flex items-center justify-between ${
                darkMode ? 'bg-white/5' : 'bg-gray-50'
              }`}>
                <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{label}</span>
                <span 
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: color + '20', color }}
                >
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
