import Chart from "../../components/chart/Chart";
import List from "../../components/table/Table";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAdminUserDetail } from "../../utils/adminApi";
import { LoadingSpinner, ErrorMessage } from "../../components/ui";
import { useLocalization } from "../../context/LocalizationContext.jsx";
import singleTranslations from "../../localization/single.json";
import commonTranslations from "../../localization/common.json";
import { 
  User, 
  Mail, 
  MapPin, 
  Calendar, 
  CheckCircle, 
  Shield, 
  Briefcase, 
  DollarSign, 
  Star, 
  ShoppingCart,
  Phone,
  Building,
  Target
} from "lucide-react";
import "./single.css";

const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23f97316'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";

const Single = () => {
  const { userId } = useParams();
  const [userData, setUserData] = useState({});
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { getTranslation, currentLanguage } = useLocalization();
  
  const t = (key) => getTranslation(singleTranslations, key);
  const tc = (key) => getTranslation(commonTranslations, key);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getAdminUserDetail(userId);
        if (response?.data?.user) {
          setUserData({
            ...response.data.user,
            stats: response.data.stats,
            recentActivity: response.data.recentActivity
          });
          setChartData(response.data.chartData || []);
        } else if (response?.data) {
          setUserData(response.data);
          setChartData(response.data.chartData || []);
        } else {
          setUserData(response);
        }
      } catch (err) {
        console.error("Error loading user data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (userId) {
      loadUserData();
    }
  }, [userId]);

  if (loading) return <LoadingSpinner message={t("loadingUserProfile")} />;
  if (error) return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;

  const isFreelancer = userData.role === 'freelancer' || userData.isSeller;
  const isClient = userData.role === 'client' && !userData.isSeller;
  const isAdmin = userData.role === 'admin';
  
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString(currentLanguage === 'es' ? 'es-ES' : 'en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="single-container p-4 md:p-6 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* User Profile Card */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative user-card">


          <header className="flex flex-col items-center text-center mb-8">
            <div className="relative mb-4">
              <img
                src={userData.img || userData.profilePicture || DEFAULT_AVATAR}
                alt={userData.username}
                className="w-28 h-28 rounded-2xl object-cover border-4 border-white shadow-md"
                onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_AVATAR; }}
              />
              <div className={`absolute -bottom-2 -right-2 p-1.5 rounded-lg shadow-sm border-2 border-white ${
                userData.isVerified ? 'bg-orange-500' : 'bg-gray-400'
              }`}>
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              {userData.fullName || userData.username || "Anonymous User"}
            </h1>
            <p className="text-gray-500 text-sm mt-1 font-medium">@{userData.username}</p>
            
            <div className="flex gap-2 mt-4">
              <span className={`role-badge text-[10px] rounded-full flex items-center gap-1 ${
                isAdmin ? 'bg-purple-100 text-purple-700' :
                isFreelancer ? 'bg-orange-100 text-orange-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {isAdmin ? <Shield size={12}/> : isFreelancer ? <Briefcase size={12}/> : <User size={12}/>}
                {userData.role}
              </span>
              <span className={`role-badge text-[10px] rounded-full flex items-center gap-1 ${
                userData.isBlocked ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {userData.isBlocked ? t("suspended") : t("active")}
              </span>
            </div>
          </header>

          <div className="space-y-4">
            <h3 className="section-title">{t("personalDetails")}</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-50 rounded-lg text-gray-500"><Mail size={16}/></div>
                <div className="overflow-hidden">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase">{t("email")}</p>
                  <p className="text-sm font-medium text-gray-800 truncate">{userData.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-50 rounded-lg text-gray-500"><MapPin size={16}/></div>
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase">{t("location")}</p>
                  <p className="text-sm font-medium text-gray-800">
                    {userData.city && userData.country 
                      ? `${userData.city}, ${userData.country}` 
                      : userData.country || userData.city || userData.location || "Unknown location"}
                  </p>
                </div>
              </div>
              {userData.phone && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg text-gray-500"><Phone size={16}/></div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase">{t("phone")}</p>
                    <p className="text-sm font-medium text-gray-800">{userData.phone}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-50 rounded-lg text-gray-500"><Calendar size={16}/></div>
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase">{t("joinedPlatform")}</p>
                  <p className="text-sm font-medium text-gray-800">
                    {userData.createdAt ? formatDate(userData.createdAt) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Role Specific Analytics */}
            <div className="pt-6 border-t border-gray-100">
              <h3 className="section-title">{t("performanceMetrics")}</h3>
              <div className="grid grid-cols-2 gap-4">
                {isFreelancer ? (
                  <>
                    <div className="stat-item">
                      <p className="stat-value">${userData.stats?.totalEarned?.toFixed(0) || 0}</p>
                      <p className="stat-label">{t("totalEarned")}</p>
                    </div>
                    <div className="stat-item">
                      <p className="stat-value">{userData.stats?.completedOrders || 0}</p>
                      <p className="stat-label">{t("completed")}</p>
                    </div>
                    <div className="stat-item col-span-2 flex items-center justify-center gap-2">
                       <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                       <span className="stat-value">{userData.stats?.averageRating?.toFixed(1) || "5.0"}</span>
                       <span className="stat-label">{t("avgRating")}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="stat-item">
                      <p className="stat-value">${userData.stats?.totalSpent?.toFixed(0) || 0}</p>
                      <p className="stat-label">{t("totalSpent")}</p>
                    </div>
                    <div className="stat-item">
                      <p className="stat-value">{userData.stats?.totalOrdersPlaced || 0}</p>
                      <p className="stat-label">{t("projects")}</p>
                    </div>
                  </>
                )}
                {userData.isCompany && (
                   <div className="stat-item col-span-2 bg-blue-50 border-blue-100">
                      <div className="flex items-center justify-center gap-2">
                        <Building className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-bold text-blue-900">{t("corporateAccount")}</span>
                      </div>
                   </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Financial Chart Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full">
            <Chart 
              aspect={2.1 / 1} 
              title={isFreelancer ? "Earnings Overview (Last 6 Months)" : "Spending Overview (Last 6 Months)"}
              data={chartData}
            />
          </div>
        </div>
      </div>

      {/* Activity Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Target className="w-5 h-5 text-orange-500" />
            {isFreelancer ? "Active Service Gigs" : "Recent Orders"}
          </h2>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Showing {userData.recentActivity?.jobs?.length || userData.recentActivity?.orders?.length || 0} records
          </span>
        </div>
        <div className="p-2">
          {(userData.recentActivity?.jobs?.length > 0 || userData.recentActivity?.orders?.length > 0) ? (
            <List jobsData={userData.recentActivity?.jobs || userData.recentActivity?.orders || []}/>
          ) : (
            <div className="p-8 text-center">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-500">
                {isFreelancer ? "No active gigs yet" : "No orders yet"}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {isFreelancer ? "This user hasn't created any services" : "This user hasn't placed any orders"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Single;
