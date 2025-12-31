import React, { useState, useEffect, useContext } from 'react';
import { useLocalization } from "../../context/LocalizationContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { DarkModeContext } from "../../context/darkModeContext.jsx";
import { 
  getAdminBadges, 
  getAdminBadgeStats, 
  getAdminSellerBadgeDetail,
  overrideSellerBadge,
  removeSellerBadgeOverride,
  freezeSellerBadge,
  unfreezeSellerBadge,
  reEvaluateSellerBadge,
  batchReEvaluateBadges,
  getAdminBadgeAuditLog
} from "../../utils/adminApi";
import { 
  Award, 
  Star, 
  Shield, 
  Zap, 
  Search, 
  Filter, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Lock, 
  Unlock,
  Edit2,
  RotateCcw,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  X,
  History
} from 'lucide-react';
import { ErrorMessage } from '../../components/ui';
import toast from 'react-hot-toast';

const badgeLevelConfig = {
  new: {
    label: 'New Seller',
    emoji: '🆕',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-300',
  },
  level_1: {
    label: 'Level 1',
    emoji: '🥉',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-300',
  },
  level_2: {
    label: 'Level 2',
    emoji: '🥈',
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-700',
    borderColor: 'border-slate-400',
  },
  top_rated: {
    label: 'Top Rated',
    emoji: '⭐',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-400',
  },
};

const BadgeLevelBadge = ({ level }) => {
  const config = badgeLevelConfig[level] || badgeLevelConfig.new;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.textColor} border ${config.borderColor}`}>
      <span>{config.emoji}</span>
      <span>{config.label}</span>
    </span>
  );
};

const TrustScoreBar = ({ score }) => {
  const getColor = (score) => {
    if (score >= 90) return 'bg-orange-500';
    if (score >= 70) return 'bg-amber-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-slate-500';
  };

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getColor(score)} transition-all duration-300`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-sm font-medium text-gray-600">{score}%</span>
    </div>
  );
};

const BadgeManagement = () => {
  const { darkMode } = useContext(DarkModeContext);
  const [badges, setBadges] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(null);
  const [showFreezeModal, setShowFreezeModal] = useState(null);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditLog, setAuditLog] = useState([]);
  const [overrideLevel, setOverrideLevel] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  const itemsPerPage = 15;

  const { getTranslation } = useLocalization();
  const { hasPermission } = useAuth();

  useEffect(() => {
    loadBadges();
    loadStats();
  }, [currentPage, levelFilter, statusFilter]);

  const loadBadges = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        sortBy: 'trustScore',
        sortOrder: 'desc'
      };
      
      if (levelFilter !== 'all') params.level = levelFilter;
      if (statusFilter === 'frozen') params.isFrozen = true;
      if (statusFilter === 'overridden') params.isOverridden = true;
      if (searchQuery) params.search = searchQuery;
      
      const response = await getAdminBadges(params);
      
      if (response?.data) {
        setBadges(response.data);
        setTotalPages(response.pagination?.pages || 1);
      }
    } catch (err) {
      console.error("Error fetching badges:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await getAdminBadgeStats();
      if (response?.data) {
        setStats(response.data);
      }
    } catch (err) {
      console.error("Error fetching badge stats:", err);
    }
  };

  const handleOverride = async () => {
    if (!overrideLevel || !actionReason.trim()) {
      toast.error('Please select a level and provide a reason');
      return;
    }
    
    setProcessingAction(true);
    try {
      await overrideSellerBadge(showOverrideModal, overrideLevel, actionReason);
      toast.success('Badge level overridden successfully');
      setShowOverrideModal(null);
      setOverrideLevel('');
      setActionReason('');
      loadBadges();
      loadStats();
    } catch (error) {
      console.error("Error overriding badge:", error);
      toast.error(`Error overriding badge: ${error.message}`);
    } finally {
      setProcessingAction(false);
    }
  };

  const handleRemoveOverride = async (sellerId) => {
    if (!window.confirm('Are you sure you want to remove the override? The badge will be re-evaluated automatically.')) {
      return;
    }
    
    try {
      await removeSellerBadgeOverride(sellerId);
      toast.success('Override removed successfully');
      loadBadges();
      loadStats();
    } catch (error) {
      console.error("Error removing override:", error);
      toast.error(`Error removing override: ${error.message}`);
    }
  };

  const handleFreeze = async () => {
    if (!actionReason.trim()) {
      toast.error('Please provide a reason for freezing');
      return;
    }
    
    setProcessingAction(true);
    try {
      await freezeSellerBadge(showFreezeModal, actionReason);
      toast.success('Badge frozen successfully');
      setShowFreezeModal(null);
      setActionReason('');
      loadBadges();
      loadStats();
    } catch (error) {
      console.error("Error freezing badge:", error);
      toast.error(`Error freezing badge: ${error.message}`);
    } finally {
      setProcessingAction(false);
    }
  };

  const handleUnfreeze = async (sellerId) => {
    if (!window.confirm('Are you sure you want to unfreeze this badge?')) {
      return;
    }
    
    try {
      await unfreezeSellerBadge(sellerId);
      toast.success('Badge unfrozen successfully');
      loadBadges();
      loadStats();
    } catch (error) {
      console.error("Error unfreezing badge:", error);
      toast.error(`Error unfreezing badge: ${error.message}`);
    }
  };

  const handleReEvaluate = async (sellerId) => {
    if (!window.confirm('Are you sure you want to re-evaluate this seller\'s badge?')) {
      return;
    }
    
    try {
      await reEvaluateSellerBadge(sellerId);
      toast.success('Badge re-evaluated successfully');
      loadBadges();
      loadStats();
    } catch (error) {
      console.error("Error re-evaluating badge:", error);
      toast.error(`Error re-evaluating badge: ${error.message}`);
    }
  };

  const handleBatchReEvaluate = async () => {
    if (!window.confirm('This will re-evaluate all seller badges. This may take a while. Continue?')) {
      return;
    }
    
    setProcessingAction(true);
    try {
      const response = await batchReEvaluateBadges();
      toast.success(response.message || 'Batch re-evaluation completed');
      loadBadges();
      loadStats();
    } catch (error) {
      console.error("Error in batch re-evaluation:", error);
      toast.error(`Error in batch re-evaluation: ${error.message}`);
    } finally {
      setProcessingAction(false);
    }
  };

  const handleViewAuditLog = async () => {
    try {
      const response = await getAdminBadgeAuditLog({ limit: 100 });
      if (response?.data) {
        setAuditLog(response.data);
        setShowAuditModal(true);
      }
    } catch (error) {
      console.error("Error fetching audit log:", error);
      toast.error('Error fetching audit log');
    }
  };

  const handleViewDetails = async (badge) => {
    try {
      const response = await getAdminSellerBadgeDetail(badge.userId._id || badge.userId);
      if (response?.data) {
        setSelectedBadge(response.data);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error("Error fetching badge details:", error);
      toast.error('Error fetching badge details');
    }
  };

  const filteredBadges = badges.filter(badge => {
    if (!searchQuery) return true;
    const user = badge.userId;
    if (!user) return false;
    const searchLower = searchQuery.toLowerCase();
    return (
      user.fullName?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.username?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className={`p-6 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            <Award className="inline-block w-6 h-6 mr-2" />
            Seller Badge Management
          </h1>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage seller badges, trust scores, and performance levels
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleViewAuditLog}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
              darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <History className="w-4 h-4" />
            Audit Log
          </button>
          <button
            onClick={handleBatchReEvaluate}
            disabled={processingAction}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            Re-evaluate All
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Sellers</p>
            <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.totalBadges}</p>
          </div>
          <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Top Rated</p>
            <p className="text-2xl font-bold text-yellow-500">{stats.levelDistribution?.top_rated || 0}</p>
          </div>
          <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Level 2</p>
            <p className="text-2xl font-bold text-slate-600">{stats.levelDistribution?.level_2 || 0}</p>
          </div>
          <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Level 1</p>
            <p className="text-2xl font-bold text-amber-600">{stats.levelDistribution?.level_1 || 0}</p>
          </div>
          <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Avg Trust Score</p>
            <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.avgTrustScore}%</p>
          </div>
          <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              <span className="text-orange-500 font-bold">{stats.last30Days?.promotions || 0}</span>
              <TrendingDown className="w-4 h-4 text-slate-500 ml-2" />
              <span className="text-slate-500 font-bold">{stats.last30Days?.demotions || 0}</span>
            </div>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Last 30 days</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className={`p-4 rounded-xl mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name, email, or username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
              />
            </div>
          </div>
          <select
            value={levelFilter}
            onChange={(e) => { setLevelFilter(e.target.value); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-lg border ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="all">All Levels</option>
            <option value="new">New Seller</option>
            <option value="level_1">Level 1</option>
            <option value="level_2">Level 2</option>
            <option value="top_rated">Top Rated</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-lg border ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="all">All Status</option>
            <option value="frozen">Frozen</option>
            <option value="overridden">Overridden</option>
          </select>
          <button
            onClick={() => { loadBadges(); loadStats(); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
              darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && <ErrorMessage message={error} onRetry={loadBadges} />}

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      ) : (
        <>
          {/* Badges Table */}
          <div className={`rounded-xl overflow-hidden border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={darkMode ? 'bg-gray-800' : 'bg-gray-50'}>
                  <tr>
                    <th className={`px-4 py-3 text-left text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Seller</th>
                    <th className={`px-4 py-3 text-left text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Badge Level</th>
                    <th className={`px-4 py-3 text-left text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Trust Score</th>
                    <th className={`px-4 py-3 text-left text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Orders</th>
                    <th className={`px-4 py-3 text-left text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Rating</th>
                    <th className={`px-4 py-3 text-left text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Status</th>
                    <th className={`px-4 py-3 text-right text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? 'divide-gray-700 bg-gray-900' : 'divide-gray-200 bg-white'}`}>
                  {filteredBadges.map((badge) => (
                    <tr key={badge._id} className={darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}>
                      <td className="px-4 py-3">
                        <div>
                          <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {badge.userId?.fullName || 'Unknown'}
                          </p>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {badge.userId?.email || ''}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <BadgeLevelBadge level={badge.currentLevel} />
                      </td>
                      <td className="px-4 py-3">
                        <TrustScoreBar score={badge.trustScore} />
                      </td>
                      <td className="px-4 py-3">
                        <span className={darkMode ? 'text-white' : 'text-gray-900'}>
                          {badge.metrics?.completedOrders || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className={darkMode ? 'text-white' : 'text-gray-900'}>
                            {(badge.metrics?.averageRating || 0).toFixed(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {badge.isFrozen && (
                            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                              Frozen
                            </span>
                          )}
                          {badge.adminOverride?.isOverridden && (
                            <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700">
                              Overridden
                            </span>
                          )}
                          {!badge.isFrozen && !badge.adminOverride?.isOverridden && (
                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                              Auto
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleViewDetails(badge)}
                            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4 text-gray-500" />
                          </button>
                          <button
                            onClick={() => setShowOverrideModal(badge.userId?._id || badge.userId)}
                            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                            title="Override Badge"
                          >
                            <Edit2 className="w-4 h-4 text-orange-500" />
                          </button>
                          {badge.isFrozen ? (
                            <button
                              onClick={() => handleUnfreeze(badge.userId?._id || badge.userId)}
                              className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                              title="Unfreeze Badge"
                            >
                              <Unlock className="w-4 h-4 text-orange-500" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setShowFreezeModal(badge.userId?._id || badge.userId)}
                              className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                              title="Freeze Badge"
                            >
                              <Lock className="w-4 h-4 text-blue-500" />
                            </button>
                          )}
                          {!badge.isFrozen && !badge.adminOverride?.isOverridden && (
                            <button
                              onClick={() => handleReEvaluate(badge.userId?._id || badge.userId)}
                              className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                              title="Re-evaluate"
                            >
                              <RotateCcw className="w-4 h-4 text-purple-500" />
                            </button>
                          )}
                          {badge.adminOverride?.isOverridden && (
                            <button
                              onClick={() => handleRemoveOverride(badge.userId?._id || badge.userId)}
                              className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                              title="Remove Override"
                            >
                              <X className="w-4 h-4 text-red-500" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg border ${
                  darkMode 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-50' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg border ${
                  darkMode 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-50' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50'
                }`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-full max-w-md p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Override Badge Level
            </h3>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  New Level
                </label>
                <select
                  value={overrideLevel}
                  onChange={(e) => setOverrideLevel(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="">Select Level</option>
                  <option value="new">New Seller</option>
                  <option value="level_1">Level 1</option>
                  <option value="level_2">Level 2</option>
                  <option value="top_rated">Top Rated</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Reason
                </label>
                <textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  rows={3}
                  placeholder="Enter reason for override..."
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => { setShowOverrideModal(null); setActionReason(''); setOverrideLevel(''); }}
                className={`px-4 py-2 rounded-lg border ${
                  darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleOverride}
                disabled={processingAction}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
              >
                {processingAction ? 'Processing...' : 'Override'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Freeze Modal */}
      {showFreezeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-full max-w-md p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Freeze Badge
            </h3>
            <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Freezing a badge prevents automatic level changes. The seller will keep their current level until unfrozen.
            </p>
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Reason
              </label>
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={3}
                placeholder="Enter reason for freezing..."
                className={`w-full px-4 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => { setShowFreezeModal(null); setActionReason(''); }}
                className={`px-4 py-2 rounded-lg border ${
                  darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleFreeze}
                disabled={processingAction}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {processingAction ? 'Processing...' : 'Freeze'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedBadge && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex justify-between items-start mb-4">
              <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Badge Details
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Seller Info */}
            <div className={`p-4 rounded-lg mb-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <h4 className={`font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {selectedBadge.badge?.userId?.fullName}
              </h4>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {selectedBadge.badge?.userId?.email}
              </p>
              <div className="mt-2">
                <BadgeLevelBadge level={selectedBadge.badge?.currentLevel} />
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Trust Score</p>
                <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {selectedBadge.badge?.trustScore}%
                </p>
              </div>
              <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Search Boost</p>
                <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {selectedBadge.badge?.searchBoost}x
                </p>
              </div>
              <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Completed Orders</p>
                <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {selectedBadge.badge?.metrics?.completedOrders || 0}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Average Rating</p>
                <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {(selectedBadge.badge?.metrics?.averageRating || 0).toFixed(1)}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>On-Time Rate</p>
                <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {selectedBadge.badge?.metrics?.onTimeDeliveryRate || 0}%
                </p>
              </div>
              <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Completion Rate</p>
                <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {selectedBadge.badge?.metrics?.completionRate || 0}%
                </p>
              </div>
            </div>

            {/* Badge History */}
            {selectedBadge.badge?.badgeHistory?.length > 0 && (
              <div>
                <h4 className={`font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Recent Badge History
                </h4>
                <div className={`rounded-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  {selectedBadge.badge.badgeHistory.slice(-5).reverse().map((entry, idx) => (
                    <div 
                      key={idx}
                      className={`p-3 ${idx !== 0 ? `border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}` : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        <BadgeLevelBadge level={entry.previousLevel} />
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>→</span>
                        <BadgeLevelBadge level={entry.newLevel} />
                      </div>
                      <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {entry.reason}
                      </p>
                      <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        {new Date(entry.changedAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audit Log Modal */}
      {showAuditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-full max-w-3xl max-h-[80vh] overflow-y-auto p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex justify-between items-start mb-4">
              <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Badge Audit Log
              </h3>
              <button
                onClick={() => setShowAuditModal(false)}
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className={`rounded-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              {auditLog.length === 0 ? (
                <p className={`p-4 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  No audit log entries found
                </p>
              ) : (
                auditLog.map((entry, idx) => (
                  <div 
                    key={idx}
                    className={`p-4 ${idx !== 0 ? `border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}` : ''}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {entry.sellerName}
                        </p>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {entry.sellerEmail}
                        </p>
                      </div>
                      <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        {new Date(entry.changedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <BadgeLevelBadge level={entry.previousLevel} />
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>→</span>
                      <BadgeLevelBadge level={entry.newLevel} />
                    </div>
                    <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {entry.reason}
                    </p>
                    {entry.changedBy && (
                      <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        By: {entry.changedBy.fullName || 'System'}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BadgeManagement;
