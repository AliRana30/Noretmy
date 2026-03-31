import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { getSensitiveMessages } from "../../datatablesource";
import { getAdminUsers, warnUser, deleteSensitiveMessage } from "../../utils/adminApi";
import { useLocalization } from "../../context/LocalizationContext.jsx";
import { DarkModeContext } from "../../context/darkModeContext.jsx";
import commonTranslations from "../../localization/common.json";
import listTranslations from "../../localization/list.json";
import datatableColumnsTranslations from "../../localization/datatableColumns.json";
import { LoadingSpinner, ErrorMessage } from "../../components/ui";
import { AlertTriangle, Search, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, X, Eye, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

const ListSensitive = () => {
  const { darkMode } = useContext(DarkModeContext);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState(null);
  const [warnModalOpen, setWarnModalOpen] = useState(false);
  const [warnUserId, setWarnUserId] = useState(null);
  const [warnTarget, setWarnTarget] = useState(null);
  const [warnReason, setWarnReason] = useState('');
  const [userMap, setUserMap] = useState({});
  const itemsPerPage = 10;
  const { getTranslation } = useLocalization();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const messages = await getSensitiveMessages();
      const usersRes = await getAdminUsers({ limit: 5000 });
      const usersArray = Array.isArray(usersRes?.data)
        ? usersRes.data
        : Array.isArray(usersRes?.data?.data)
        ? usersRes.data.data
        : Array.isArray(usersRes)
        ? usersRes
        : [];
      const map = {};
      const emailToId = {};
      const usernameToId = {};
      usersArray.forEach((u) => {
        const resolvedId = String(u._id || u.id);
        map[resolvedId] = u;
        if (u.email) emailToId[String(u.email).toLowerCase()] = resolvedId;
        if (u.username) usernameToId[String(u.username).toLowerCase()] = resolvedId;
      });

      const normalized = (messages || []).map((msg) => {
        const directId = msg.userId || msg.senderId || msg.sender?._id || null;
        const emailKey = (msg.senderEmail || msg.sender?.email || '').toLowerCase();
        const usernameKey = (msg.senderUsername || msg.sender?.username || '').toLowerCase();
        const resolvedUserId =
          directId ||
          emailToId[emailKey] ||
          usernameToId[usernameKey] ||
          null;

        return {
          ...msg,
          userId: resolvedUserId,
        };
      });

      setData(normalized);
      setUserMap(map);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openWarnModal = (msg) => {
    const hasLookupData = !!(msg?.userId || msg?.senderEmail || msg?.senderUsername);
    const resolvedUserId = msg?.userId || '__lookup__';
    if (!hasLookupData) {
      toast.error('No user ID found');
      return;
    }
    setWarnUserId(resolvedUserId);
    setWarnTarget({
      userId: msg?.userId,
      email: msg?.senderEmail,
      username: msg?.senderUsername,
    });
    setWarnReason('');
    setWarnModalOpen(true);
  };

  const handleWarn = async () => {
    if (!warnUserId) {
      toast.error('No user ID found');
      return;
    }
    if (!warnReason.trim()) {
      toast.error('Please enter a warning reason');
      return;
    }

    try {
      setActionLoading(warnUserId + '-warn');
      await warnUser(warnUserId, warnReason.trim(), {
        email: warnTarget?.email,
        username: warnTarget?.username,
      });
      toast.success('User warned successfully!');
      setWarnModalOpen(false);
      setWarnUserId(null);
      setWarnTarget(null);
      setWarnReason('');
      loadData();
    } catch (error) {
      console.error('Error warning the user:', error);
      toast.error('Failed to warn user: ' + (error.response?.data?.message || error.message));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      setActionLoading(messageId + '-delete');
      await deleteSensitiveMessage(messageId);
      setData((prev) => prev.filter((m) => m._id !== messageId));
    } catch (error) {
      console.error('Error deleting sensitive message:', error);
      toast.error('Failed to delete message: ' + (error.response?.data?.message || error.message));
    } finally {
      setActionLoading(null);
    }
  };

  const filteredData = data.filter(msg => {
    const matchesSearch = 
      msg.desc?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.userId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.senderName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.senderEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.senderUsername?.toLowerCase().includes(searchQuery.toLowerCase());
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className={`text-xl sm:text-2xl leading-tight font-bold wrap-break-word ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {getTranslation(listTranslations, "sensitiveMessages")}
          </h1>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {getTranslation(listTranslations, "sensitiveSubtitle")}
          </p>
        </div>
        <button
          onClick={loadData}
          className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
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
                  <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <div className="space-y-1">
                      <p className="font-medium">
                        {userMap[String(msg.userId)]?.fullName || userMap[String(msg.userId)]?.username || msg.senderName || msg.senderUsername || 'Unknown user'}
                      </p>
                      <p className="font-mono text-xs opacity-70">{msg.userId || 'N/A'}</p>
                    </div>
                  </td>
                  <td className={`px-6 py-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    <p className="max-w-md truncate">{msg.desc}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => openWarnModal(msg)}
                        disabled={(!msg.userId && !msg.senderEmail && !msg.senderUsername) || actionLoading === (msg.userId || '__lookup__') + '-warn'}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        <AlertCircle className="w-3 h-3" />
                        {actionLoading === (msg.userId || '__lookup__') + '-warn' ? getTranslation(listTranslations, "warning") : getTranslation(listTranslations, "warn")}
                      </button>
                      <button
                        onClick={() => handleDeleteMessage(msg._id)}
                        disabled={actionLoading === msg._id + '-delete'}
                        className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                        title={getTranslation(commonTranslations, "delete")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {msg.userId && userMap[String(msg.userId)] && (
                        <Link
                          to={`/admin/users/${msg.userId}`}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          View User
                        </Link>
                      )}
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-6">
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
             {getTranslation(listTranslations, "showing")} {((currentPage - 1) * itemsPerPage) + 1} {getTranslation(commonTranslations, "to")} {Math.min(currentPage * itemsPerPage, filteredData.length)} {getTranslation(listTranslations, "of")} {filteredData.length} {getTranslation(listTranslations, "messages")}
          </p>
          <div className="flex items-center gap-2 self-start sm:self-auto">
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

      {/* Warn User Modal */}
      {warnModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-2xl p-6 ${
            darkMode ? 'bg-[#1a1a2e]' : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Warn User
              </h3>
              <button
                onClick={() => { setWarnModalOpen(false); setWarnUserId(null); setWarnTarget(null); setWarnReason(''); }}
                className={`p-2 rounded-xl transition-colors ${
                  darkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Warning reason
              </label>
              <textarea
                value={warnReason}
                onChange={(e) => setWarnReason(e.target.value)}
                placeholder="Enter warning reason"
                rows={4}
                className={`w-full px-4 py-3 rounded-xl text-sm transition-all outline-none resize-none ${
                  darkMode
                    ? 'bg-gray-800 border border-gray-700 text-white placeholder-gray-500'
                    : 'bg-gray-50 border border-gray-200 text-gray-900'
                } focus:border-orange-500`}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => { setWarnModalOpen(false); setWarnUserId(null); setWarnTarget(null); setWarnReason(''); }}
                className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-colors ${
                  darkMode ? 'bg-white/10 text-gray-300 hover:bg-white/20' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleWarn}
                disabled={!warnReason.trim() || actionLoading === warnUserId + '-warn'}
                className="flex-1 px-4 py-2.5 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
              >
                {actionLoading === warnUserId + '-warn' ? 'Warning...' : 'Warn User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListSensitive;
