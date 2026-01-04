import { useState, useEffect, useContext } from "react";
import { fetchDocumentsData } from "../../datatablesource";
import { useLocalization } from "../../context/LocalizationContext.jsx";
import { DarkModeContext } from "../../context/darkModeContext.jsx";
import commonTranslations from "../../localization/common.json";
import { LoadingSpinner, ErrorMessage } from "../../components/ui";
import { FileCheck, Search, Eye, Ban, Unlock, RefreshCw, ChevronLeft, ChevronRight, X, Check, Download } from "lucide-react";
import axios from "axios";
import { API_CONFIG } from "../../config/api";
import toast from "react-hot-toast";

const ListDocuments = () => {
  const { darkMode } = useContext(DarkModeContext);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState(null);
  // Block modal state
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
      const users = await fetchDocumentsData();
      setData(users || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async (userId) => {
    if (!userId) {
      toast.error('No user ID found');
      return;
    }
    
    // Open the block modal instead of using prompt
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
      setActionLoading(blockUserId);
      await axios.put(
        `${API_CONFIG.BASE_URL}/api/admin/users/${blockUserId}/block`,
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

  const handleApprove = async (userId) => {
    if (!userId) {
      toast.error('No user ID found');
      return;
    }

    try {
      setActionLoading(userId + '-approve');
      await axios.put(
        `${API_CONFIG.BASE_URL}/api/admin/users/${userId}/verify`,
        {},
        { withCredentials: true }
      );
      toast.success('User verified successfully!');
      loadData();
    } catch (error) {
      console.error('Error verifying the user:', error);
      toast.error('Failed to verify user: ' + (error.response?.data?.message || error.message));
    } finally {
      setActionLoading(null);
    }
  };

  // Filter data
  const filteredData = data.filter(user => {
    const matchesSearch = 
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'verified' && user.isVerified) ||
      (statusFilter === 'pending' && !user.isVerified);
    return matchesSearch && matchesStatus;
  });

  // Pagination
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
        retryText="Retry"
      />
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Document Verification
          </h1>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Review and verify user documents
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
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Documents', value: data.length, color: '#6366f1' },
          { label: 'Pending Review', value: data.filter(u => !u.isVerified).length, color: '#f59e0b' },
          { label: 'Verified', value: data.filter(u => u.isVerified).length, color: '#22c55e' },
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
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{value}</p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className={`p-4 rounded-2xl mb-6 flex flex-col md:flex-row gap-4 ${
        darkMode ? 'bg-[#1a1a2e]/80 border border-white/10' : 'bg-white border border-gray-100 shadow-lg'
      }`}>
        <div className="relative flex-1">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder="Search users..."
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl transition-all outline-none ${
              darkMode 
                ? 'bg-gray-800 border border-gray-700 text-white placeholder-gray-500' 
                : 'bg-gray-50 border border-gray-200 text-gray-900'
            } focus:border-orange-500`}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className={`px-4 py-2.5 rounded-xl transition-all outline-none ${
            darkMode 
              ? 'bg-gray-800 border border-gray-700 text-white' 
              : 'bg-gray-50 border border-gray-200 text-gray-900'
          } focus:border-orange-500`}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
        </select>
      </div>

      {/* Documents Table */}
      <div className={`rounded-2xl overflow-hidden ${
        darkMode ? 'bg-[#1a1a2e]/80 border border-white/10' : 'bg-white border border-gray-100 shadow-lg'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${darkMode ? 'border-white/10 bg-white/5' : 'border-gray-100 bg-gray-50'}`}>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>User</th>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Email</th>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Status</th>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Document</th>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((user) => (
                <tr 
                  key={user._id}
                  className={`border-b last:border-b-0 transition-colors ${
                    darkMode 
                      ? 'border-white/5 hover:bg-white/5' 
                      : 'border-gray-50 hover:bg-gray-50'
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.img || user.profilePicture || 'https://via.placeholder.com/40'}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {user.fullName || user.username}
                        </p>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          @{user.username}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {user.email}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      user.isVerified
                        ? 'bg-orange-500/20 text-orange-500'
                        : 'bg-amber-500/20 text-amber-500'
                    }`}>
                      {user.isVerified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.documentUrl ? (
                      <a 
                        href={user.documentUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-orange-500 hover:text-orange-600"
                      >
                        <Download className="w-4 h-4" />
                        <span className="text-sm">View</span>
                      </a>
                    ) : (
                      <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        No document
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="p-2 rounded-lg bg-blue-500/20 text-blue-500 hover:bg-blue-500/30 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {!user.isVerified && (
                        <button
                          onClick={() => handleApprove(user._id)}
                          disabled={actionLoading === user._id + '-approve'}
                          className="p-2 rounded-lg bg-orange-500/20 text-orange-500 hover:bg-orange-500/30 transition-colors disabled:opacity-50"
                          title="Approve"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleBlock(user._id)}
                        disabled={actionLoading === user._id}
                        className="p-2 rounded-lg bg-slate-500/20 text-slate-500 hover:bg-slate-500/30 transition-colors disabled:opacity-50"
                        title="Block User"
                      >
                        <Ban className="w-4 h-4" />
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
            <FileCheck className={`w-12 h-12 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
            <p className={`text-lg font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No documents found
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length}
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

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedUser(null)}>
          <div 
            className={`p-6 rounded-2xl max-w-lg w-full mx-4 ${
              darkMode ? 'bg-[#1a1a2e] border border-white/10' : 'bg-white'
            }`}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                User Details
              </h3>
              <button
                onClick={() => setSelectedUser(null)}
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center gap-4 mb-6">
              <img
                src={selectedUser.img || selectedUser.profilePicture || 'https://via.placeholder.com/80'}
                alt=""
                className="w-20 h-20 rounded-full object-cover"
              />
              <div>
                <h4 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {selectedUser.fullName || selectedUser.username}
                </h4>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {selectedUser.email}
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className={`p-3 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Username</p>
                <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>@{selectedUser.username}</p>
              </div>
              <div className={`p-3 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Role</p>
                <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedUser.role || 'Client'}</p>
              </div>
              <div className={`p-3 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Verification Status</p>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  selectedUser.isVerified
                    ? 'bg-orange-500/20 text-orange-500'
                    : 'bg-amber-500/20 text-amber-500'
                }`}>
                  {selectedUser.isVerified ? 'Verified' : 'Pending'}
                </span>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              {!selectedUser.isVerified && (
                <button
                  onClick={() => { handleApprove(selectedUser._id); setSelectedUser(null); }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors"
                >
                  <Check className="w-5 h-5" />
                  Approve
                </button>
              )}
              <button
                onClick={() => { handleBlock(selectedUser._id); setSelectedUser(null); }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-500 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
              >
                <Ban className="w-5 h-5" />
                Block
              </button>
            </div>
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
                Block User
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
                  <strong>Warning:</strong> Blocking this user will prevent them from accessing their account and using the platform.
                </p>
              </div>
              
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Reason for blocking *
              </label>
              <textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Enter the reason for blocking this user..."
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
                Cancel
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
                    Block User
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

export default ListDocuments;
