import { useState, useEffect, useContext } from "react";
import { getSensitiveMessages } from "../../datatablesource";
import { useLocalization } from "../../context/LocalizationContext.jsx";
import { DarkModeContext } from "../../context/darkModeContext.jsx";
import commonTranslations from "../../localization/common.json";
import listTranslations from "../../localization/list.json";
import datatableColumnsTranslations from "../../localization/datatableColumns.json";
import { LoadingSpinner, ErrorMessage } from "../../components/ui";
import { AlertTriangle, Search, Filter, AlertCircle, Ban, RefreshCw, ChevronLeft, ChevronRight, X } from "lucide-react";
import axios from "axios";
import { API_CONFIG } from "../../config/api";
import toast from "react-hot-toast";

const ListSensitive = () => {
  const { darkMode } = useContext(DarkModeContext);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState(null);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockUserId, setBlockUserId] = useState(null);
  const [blockReason, setBlockReason] = useState('');
  const itemsPerPage = 10;
  const { getTranslation } = useLocalization();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const messages = await getSensitiveMessages();
      setData(messages || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWarn = async (userId) => {
    if (!userId) {
      toast.error('No user ID found');
      return;
    }
    
    try {
      setActionLoading(userId + '-warn');
      const response = await axios.put(
        `${API_CONFIG.BASE_URL}/api/users/warn/${userId}`,
        {},
        { withCredentials: true }
      );
      toast.success('User warned successfully!');
      loadData();
    } catch (error) {
      console.error('Error warning the user:', error);
      toast.error('Failed to warn user: ' + (error.response?.data?.message || error.message));
    } finally {
      setActionLoading(null);
    }
  };

  const handleBlock = async (userId) => {
    if (!userId) {
      toast.error('No user ID found');
      return;
    }
    
    setBlockUserId(userId);
    setBlockReason('');
    setBlockModalOpen(true);
  };

  const confirmBlock = async () => {
    if (!blockReason.trim()) {
      toast.error('Please enter a reason for blocking');
      return;
    }

    try {
      setActionLoading(blockUserId + '-block');
      await axios.put(
        `${API_CONFIG.BASE_URL}/api/users/block/${blockUserId}`,
        { reason: blockReason },
        { withCredentials: true }
      );
      toast.success('User blocked successfully!');
      setBlockModalOpen(false);
      setBlockUserId(null);
      setBlockReason('');
      loadData();
    } catch (error) {
      console.error('Error blocking the user:', error);
      toast.error('Failed to block user: ' + (error.response?.data?.message || error.message));
    } finally {
      setActionLoading(null);
    }
  };

  const filteredData = data.filter(msg => {
    const matchesSearch = 
      msg.desc?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.userId?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return <LoadingSpinner message={getTranslation(commonTranslations, "loading")} />;
  }

  if (error) {
    return (
      <ErrorMessage 
        message={`${getTranslation(commonTranslations, "error")}: ${error}`}
        onRetry={loadData}
        retryText={getTranslation(commonTranslations, "retry")}
      />
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {getTranslation(listTranslations, "sensitiveMessages")}
          </h1>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {getTranslation(listTranslations, "sensitiveSubtitle")}
          </p>
        </div>
        <button
          onClick={loadData}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
            darkMode 
              ? 'bg-white/10 text-white hover:bg-white/20' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          {getTranslation(listTranslations, "refresh")}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {[
          { label: getTranslation(listTranslations, "totalFlagged"), value: data.length, color: '#ef4444' },
          { label: getTranslation(listTranslations, "pendingReview"), value: data.filter(m => !m.reviewed).length, color: '#f59e0b' },
          { label: getTranslation(listTranslations, "reviewed"), value: data.filter(m => m.reviewed).length, color: '#22c55e' },
        ].map(({ label, value, color }) => (
          <div 
            key={label}
            className={`p-4 rounded-xl ${
              darkMode ? 'bg-[#1a1a2e]/80 border border-white/10' : 'bg-white border border-gray-100 shadow-lg'
            }`}
          >
            <div className="flex items-center gap-3">
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: color + '20', color }}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{value}</p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className={`p-4 rounded-2xl mb-6 ${
        darkMode ? 'bg-[#1a1a2e]/80 border border-white/10' : 'bg-white border border-gray-100 shadow-lg'
      }`}>
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder={getTranslation(listTranslations, "searchMessages")}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl transition-all outline-none ${
              darkMode 
                ? 'bg-gray-800 border border-gray-700 text-white placeholder-gray-500' 
                : 'bg-gray-50 border border-gray-200 text-gray-900'
            } focus:border-orange-500`}
          />
        </div>
      </div>

      {/* Messages Table */}
      <div className={`rounded-2xl overflow-hidden ${
        darkMode ? 'bg-[#1a1a2e]/80 border border-white/10' : 'bg-white border border-gray-100 shadow-lg'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${darkMode ? 'border-white/10 bg-white/5' : 'border-gray-100 bg-gray-50'}`}>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>{getTranslation(commonTranslations, "userId")}</th>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>{getTranslation(datatableColumnsTranslations, "message")}</th>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>{getTranslation(commonTranslations, "actions")}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((msg, index) => (
                <tr 
                  key={msg._id || index}
                  className={`border-b last:border-b-0 transition-colors ${
                    darkMode 
                      ? 'border-white/5 hover:bg-white/5' 
                      : 'border-gray-50 hover:bg-gray-50'
                  }`}
                >
                  <td className={`px-6 py-4 text-sm font-mono ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {msg.userId?.substring(0, 15)}...
                  </td>
                  <td className={`px-6 py-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    <p className="max-w-md truncate">{msg.desc}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleWarn(msg.userId)}
                        disabled={actionLoading === msg.userId + '-warn'}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        <AlertCircle className="w-3 h-3" />
                        {actionLoading === msg.userId + '-warn' ? getTranslation(listTranslations, "warning") : getTranslation(listTranslations, "warn")}
                      </button>
                      <button
                        onClick={() => handleBlock(msg.userId)}
                        disabled={actionLoading === msg.userId + '-block'}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        <Ban className="w-3 h-3" />
                        {actionLoading === msg.userId + '-block' ? getTranslation(listTranslations, "blocking") : getTranslation(listTranslations, "block")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {paginatedData.length === 0 && (
          <div className="p-12 text-center">
            <AlertTriangle className={`w-12 h-12 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
            <p className={`text-lg font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {getTranslation(listTranslations, "noData")}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
             {getTranslation(listTranslations, "showing")} {((currentPage - 1) * itemsPerPage) + 1} {getTranslation(commonTranslations, "to")} {Math.min(currentPage * itemsPerPage, filteredData.length)} {getTranslation(listTranslations, "of")} {filteredData.length} {getTranslation(listTranslations, "messages")}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg transition-all disabled:opacity-50 ${
                darkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 rounded-lg font-medium transition-all ${
                  currentPage === page
                    ? 'bg-orange-500 text-white'
                    : darkMode 
                      ? 'bg-white/10 text-white hover:bg-white/20' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg transition-all disabled:opacity-50 ${
                darkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Block User Modal */}
      {blockModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-2xl p-6 ${
            darkMode ? 'bg-[#1a1a2e]' : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {getTranslation(listTranslations, "blockUser")}
              </h3>
              <button 
                onClick={() => { setBlockModalOpen(false); setBlockUserId(null); setBlockReason(''); }}
                className={`p-2 rounded-xl transition-colors ${
                  darkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <div className={`p-4 rounded-xl mb-4 ${darkMode ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-100'}`}>
                <p className={`text-sm ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                  <strong>{getTranslation(commonTranslations, "error")}:</strong> {getTranslation(listTranslations, "blockUserWarning")}
                </p>
              </div>
              
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {getTranslation(listTranslations, "reasonForBlocking")}
              </label>
              <textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder={getTranslation(listTranslations, "enterBlockingReason")}
                rows={4}
                className={`w-full px-4 py-3 rounded-xl text-sm transition-all outline-none resize-none ${
                  darkMode
                    ? 'bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-red-500/50'
                    : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-red-500'
                }`}
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => { setBlockModalOpen(false); setBlockUserId(null); setBlockReason(''); }}
                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors ${
                  darkMode 
                    ? 'bg-white/10 text-white hover:bg-white/20' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {getTranslation(commonTranslations, "cancel")}
              </button>
              <button
                onClick={confirmBlock}
                disabled={!blockReason.trim() || actionLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
              >
                {actionLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Ban className="w-5 h-5" />
                    {getTranslation(listTranslations, "blockUser")}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListSensitive;
