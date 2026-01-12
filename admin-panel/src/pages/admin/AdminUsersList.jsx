import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { useLocalization } from "../../context/LocalizationContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { DarkModeContext } from "../../context/darkModeContext.jsx";
import { getAdminUsers, blockUser, unblockUser, updateUserRole, bulkUserAction, warnUser, deleteUser } from "../../utils/adminApi";
import { fetchData } from "../../datatablesource";
import datatableColumnsTranslations from "../../localization/datatableColumns.json";
import { Users, Shield, Lock, Unlock, Search, Filter, RefreshCw, ChevronLeft, ChevronRight, Eye, UserCog, AlertTriangle, Trash2, Plus, X } from 'lucide-react';
import { ErrorMessage } from '../../components/ui';
import toast from 'react-hot-toast';

const AdminUsersList = () => {
  const { darkMode } = useContext(DarkModeContext);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showRoleModal, setShowRoleModal] = useState(null);
  const [showBlockModal, setShowBlockModal] = useState(null);
  const [showWarnModal, setShowWarnModal] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [actionReason, setActionReason] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  const itemsPerPage = 10;

  const { getTranslation } = useLocalization();
  const { hasPermission, ROLES } = useAuth();

  useEffect(() => {
    loadUsers();
  }, []);

  const normalizeUser = (u) => {
    const statusText = (u?.status ?? u?.accountStatus ?? '').toString().toLowerCase();

    const normalizeBool = (v) => {
      if (typeof v === 'boolean') return v;
      if (typeof v === 'string') return v.toLowerCase() === 'true';
      return undefined;
    };

    const isVerifiedNormalized =
      normalizeBool(u?.isVerified) ??
      normalizeBool(u?.verified) ??
      normalizeBool(u?.emailVerified) ??
      (statusText === 'active' || statusText === 'verified');

    const isBlockedNormalized =
      normalizeBool(u?.isBlocked) ??
      (statusText === 'blocked');

    const id = u?._id || u?.id;

    return {
      ...u,
      _id: id,
      id: u?.id || id,
      isVerified: !!isVerifiedNormalized,
      isBlocked: !!isBlockedNormalized,
      role: u?.role || (u?.isSeller ? 'freelancer' : 'client'),
      status:
        u?.status ||
        (isBlockedNormalized ? 'blocked' : isVerifiedNormalized ? 'active' : 'unverified'),
    };
  };

  const extractUsersArray = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.users)) return response.data.users;
    if (Array.isArray(response?.users)) return response.users;
    if (Array.isArray(response?.result)) return response.result;
    return null;
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try admin API first, fallback to regular fetch
      try {
        const response = await getAdminUsers({});
        const usersArray = extractUsersArray(response);
        if (!usersArray) throw new Error('No users array in response');
        setData(usersArray.map(normalizeUser));
      } catch (adminErr) {
        const users = await fetchData();
        const usersArray = extractUsersArray(users) || [];
        setData(usersArray.map(normalizeUser));
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async (userId, reason) => {
    if (!reason?.trim()) {
      toast.error('Please provide a reason for blocking');
      return;
    }
    
    setProcessingAction(true);
    const oldData = [...data];
    
    // Optimistic update
    setData(prevData => 
      prevData.map(user => 
        user._id === userId 
          ? { ...user, isBlocked: true, status: 'blocked' }
          : user
      )
    );
    
    try {
      await blockUser(userId, reason);
      toast.success('User blocked successfully');
      setShowBlockModal(null);
      setActionReason('');
    } catch (error) {
      console.error("Error blocking user:", error);
      setData(oldData);
      toast.error(`Error blocking user: ${error.message}`);
    } finally {
      setProcessingAction(false);
    }
  };

  const handleWarn = async (userId, reason) => {
    if (!reason?.trim()) {
      toast.error('Please provide a reason for warning');
      return;
    }
    
    setProcessingAction(true);
    const oldData = [...data];
    
    // Optimistic update
    setData(prevData => 
      prevData.map(user => 
        user._id === userId 
          ? { ...user, isWarned: true }
          : user
      )
    );
    
    try {
      await warnUser(userId, reason);
      toast.success('User warned successfully');
      setShowWarnModal(null);
      setActionReason('');
    } catch (error) {
      console.error("Error warning user:", error);
      setData(oldData);
      toast.error(`Error warning user: ${error.message}`);
    } finally {
      setProcessingAction(false);
    }
  };

  const handleDelete = async (userId, reason) => {
    if (!reason?.trim()) {
      toast.error('Please provide a reason for deletion');
      return;
    }
    
    setProcessingAction(true);
    
    try {
      await deleteUser(userId, reason);
      setData(prevData => prevData.filter(user => user._id !== userId));
      toast.success('User deleted successfully');
      setShowDeleteModal(null);
      setActionReason('');
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error(`Error deleting user: ${error.message}`);
    } finally {
      setProcessingAction(false);
    }
  };

  const handleUnblock = async (userId) => {
    const oldData = [...data];
    
    // Optimistic update
    setData(prevData => 
      prevData.map(user => 
        user._id === userId 
          ? { ...user, isBlocked: false, status: user.isVerified ? 'active' : 'unverified' }
          : user
      )
    );
    
    try {
      await unblockUser(userId);
      toast.success('User unblocked successfully');
    } catch (error) {
      console.error("Error unblocking user:", error);
      setData(oldData);
      toast.error(`Error unblocking user: ${error.message}`);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    // Store old data for rollback
    const oldData = [...data];
    
    // Optimistic update - immediately update local state
    setData(prevData => 
      prevData.map(user => 
        user._id === userId 
          ? { ...user, role: newRole, isSeller: newRole === 'freelancer' }
          : user
      )
    );
    setShowRoleModal(null);
    
    try {
      await updateUserRole(userId, newRole);
      toast.success(`Role updated to ${newRole}`);
    } catch (error) {
      console.error("Error updating role:", error);
      // Rollback on error
      setData(oldData);
      toast.error(`Error updating role: ${error.message}`);
    }
  };

  // Filter data
  const filteredData = data.filter(user => {
    const matchesSearch = 
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.fullName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'blocked' && user.isBlocked) ||
      (statusFilter === 'active' && !user.isBlocked) ||
      (statusFilter === 'verified' && user.isVerified) ||
      (statusFilter === 'unverified' && !user.isVerified);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getRoleBadge = (role) => {
    const config = {
      admin: { bg: 'bg-purple-500/20', text: 'text-purple-500' },
      freelancer: { bg: 'bg-orange-500/20', text: 'text-orange-500' },
      client: { bg: 'bg-blue-500/20', text: 'text-blue-500' },
    };
    return config[role] || config.client;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage 
        message={error}
        onRetry={loadUsers}
        retryText="Try Again"
      />
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            User Management
          </h1>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Manage all platform users, roles, and permissions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/users/new"
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-all"
          >
            <Plus className="w-4 h-4" />
            Add User
          </Link>
          <button
            onClick={loadUsers}
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
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Total', value: data.length, icon: Users, color: '#6366f1' },
          { label: 'Admins', value: data.filter(u => u.role === 'admin').length, icon: Shield, color: '#8b5cf6' },
          { label: 'Freelancers', value: data.filter(u => u.role === 'freelancer').length, icon: UserCog, color: '#f97316' },
          { label: 'Clients', value: data.filter(u => u.role === 'client').length, icon: Users, color: '#3b82f6' },
          { label: 'Blocked', value: data.filter(u => u.isBlocked).length, icon: Lock, color: '#ef4444' },
        ].map(({ label, value, icon: Icon, color }) => (
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
                <Icon className="w-5 h-5" />
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
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl transition-all ${
              darkMode 
                ? 'bg-white/5 border border-white/10 text-white placeholder-gray-500' 
                : 'bg-gray-50 border border-gray-200 text-gray-900'
            } focus:border-orange-500 focus:outline-none`}
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
            className={`px-4 py-2.5 rounded-xl transition-all ${
              darkMode 
                ? 'bg-white/5 border border-white/10 text-white' 
                : 'bg-gray-50 border border-gray-200 text-gray-900'
            } focus:border-orange-500 focus:outline-none`}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="freelancer">Freelancer</option>
            <option value="client">Client</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className={`px-4 py-2.5 rounded-xl transition-all ${
              darkMode 
                ? 'bg-white/5 border border-white/10 text-white' 
                : 'bg-gray-50 border border-gray-200 text-gray-900'
            } focus:border-orange-500 focus:outline-none`}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
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
                }`}>Role</th>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Status</th>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((user) => {
                const roleBadge = getRoleBadge(user.role);
                return (
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
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${roleBadge.bg} ${roleBadge.text}`}>
                        {user.role || 'client'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {user.isBlocked ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/20 text-slate-500">
                            Blocked
                          </span>
                        ) : user.isVerified ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-500">
                            Verified
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-500">
                            Unverified
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/admin/users/${user._id}`}
                          state={{ userData: user }}
                          className="p-2 rounded-lg bg-blue-500/20 text-blue-500 hover:bg-blue-500/30 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        {hasPermission('user_management') && (
                          <>
                            <button
                              onClick={() => setShowRoleModal(user._id)}
                              className="p-2 rounded-lg bg-purple-500/20 text-purple-500 hover:bg-purple-500/30 transition-colors"
                              title="Change Role"
                            >
                              <UserCog className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => { setShowWarnModal(user._id); setActionReason(''); }}
                              className="p-2 rounded-lg bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 transition-colors"
                              title="Warn User"
                            >
                              <AlertTriangle className="w-4 h-4" />
                            </button>

                            {user.isBlocked ? (
                              <button
                                onClick={() => handleUnblock(user._id)}
                                className="p-2 rounded-lg bg-orange-500/20 text-orange-500 hover:bg-orange-500/30 transition-colors"
                                title="Unblock"
                              >
                                <Unlock className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => { setShowBlockModal(user._id); setActionReason(''); }}
                                className="p-2 rounded-lg bg-slate-500/20 text-slate-500 hover:bg-slate-500/30 transition-colors"
                                title="Block"
                              >
                                <Lock className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              onClick={() => { setShowDeleteModal(user._id); setActionReason(''); }}
                              className="p-2 rounded-lg bg-gray-500/20 text-gray-500 hover:bg-slate-500/30 hover:text-slate-500 transition-colors"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>

                      {/* Role Change Modal */}
                      {showRoleModal === user._id && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowRoleModal(null)}>
                          <div 
                            className={`p-6 rounded-2xl max-w-sm w-full mx-4 ${
                              darkMode ? 'bg-[#1a1a2e] border border-white/10' : 'bg-white'
                            }`}
                            onClick={e => e.stopPropagation()}
                          >
                            <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              Change Role for {user.username}
                            </h3>
                            <div className="space-y-2">
                              {['client', 'freelancer', 'admin'].map(role => (
                                <button
                                  key={role}
                                  onClick={() => handleRoleChange(user._id, role)}
                                  className={`w-full p-3 rounded-xl text-left capitalize transition-all ${
                                    user.role === role
                                      ? 'bg-orange-500 text-white'
                                      : darkMode 
                                        ? 'bg-white/5 text-white hover:bg-white/10' 
                                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                  }`}
                                >
                                  {role}
                                </button>
                              ))}
                            </div>
                            <button
                              onClick={() => setShowRoleModal(null)}
                              className={`w-full mt-4 p-3 rounded-xl font-medium ${
                                darkMode ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Block User Modal */}
                      {showBlockModal === user._id && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowBlockModal(null)}>
                          <div 
                            className={`p-6 rounded-2xl max-w-md w-full mx-4 ${
                              darkMode ? 'bg-[#1a1a2e] border border-white/10' : 'bg-white'
                            }`}
                            onClick={e => e.stopPropagation()}
                          >
                            <div className="flex items-center gap-3 mb-4">
                              <div className="p-3 rounded-full bg-red-500/20">
                                <Lock className="w-6 h-6 text-red-500" />
                              </div>
                              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Block {user.username}
                              </h3>
                            </div>
                            <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              This will prevent the user from accessing the platform. Please provide a reason.
                            </p>
                            <textarea
                              value={actionReason}
                              onChange={(e) => setActionReason(e.target.value)}
                              placeholder="Enter reason for blocking..."
                              className={`w-full p-3 rounded-xl border resize-none h-24 ${
                                darkMode 
                                  ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' 
                                  : 'bg-gray-50 border-gray-200 text-gray-900'
                              }`}
                            />
                            <div className="flex gap-3 mt-4">
                              <button
                                onClick={() => setShowBlockModal(null)}
                                className={`flex-1 p-3 rounded-xl font-medium ${
                                  darkMode ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleBlock(user._id, actionReason)}
                                disabled={processingAction || !actionReason.trim()}
                                className="flex-1 p-3 rounded-xl font-medium bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                              >
                                {processingAction ? 'Blocking...' : 'Block User'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Warn User Modal */}
                      {showWarnModal === user._id && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowWarnModal(null)}>
                          <div 
                            className={`p-6 rounded-2xl max-w-md w-full mx-4 ${
                              darkMode ? 'bg-[#1a1a2e] border border-white/10' : 'bg-white'
                            }`}
                            onClick={e => e.stopPropagation()}
                          >
                            <div className="flex items-center gap-3 mb-4">
                              <div className="p-3 rounded-full bg-amber-500/20">
                                <AlertTriangle className="w-6 h-6 text-amber-500" />
                              </div>
                              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Warn {user.username}
                              </h3>
                            </div>
                            <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              Send a warning notification to this user. Please provide a reason.
                            </p>
                            <textarea
                              value={actionReason}
                              onChange={(e) => setActionReason(e.target.value)}
                              placeholder="Enter warning message..."
                              className={`w-full p-3 rounded-xl border resize-none h-24 ${
                                darkMode 
                                  ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' 
                                  : 'bg-gray-50 border-gray-200 text-gray-900'
                              }`}
                            />
                            <div className="flex gap-3 mt-4">
                              <button
                                onClick={() => setShowWarnModal(null)}
                                className={`flex-1 p-3 rounded-xl font-medium ${
                                  darkMode ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleWarn(user._id, actionReason)}
                                disabled={processingAction || !actionReason.trim()}
                                className="flex-1 p-3 rounded-xl font-medium bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50"
                              >
                                {processingAction ? 'Sending...' : 'Send Warning'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Delete User Modal */}
                      {showDeleteModal === user._id && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDeleteModal(null)}>
                          <div 
                            className={`p-6 rounded-2xl max-w-md w-full mx-4 ${
                              darkMode ? 'bg-[#1a1a2e] border border-white/10' : 'bg-white'
                            }`}
                            onClick={e => e.stopPropagation()}
                          >
                            <div className="flex items-center gap-3 mb-4">
                              <div className="p-3 rounded-full bg-red-500/20">
                                <Trash2 className="w-6 h-6 text-red-500" />
                              </div>
                              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Delete {user.username}
                              </h3>
                            </div>
                            <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              <strong className="text-red-500">Warning:</strong> This action cannot be undone. All user data will be permanently deleted.
                            </p>
                            <textarea
                              value={actionReason}
                              onChange={(e) => setActionReason(e.target.value)}
                              placeholder="Enter reason for deletion..."
                              className={`w-full p-3 rounded-xl border resize-none h-24 ${
                                darkMode 
                                  ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' 
                                  : 'bg-gray-50 border-gray-200 text-gray-900'
                              }`}
                            />
                            <div className="flex gap-3 mt-4">
                              <button
                                onClick={() => setShowDeleteModal(null)}
                                className={`flex-1 p-3 rounded-xl font-medium ${
                                  darkMode ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleDelete(user._id, actionReason)}
                                disabled={processingAction || !actionReason.trim()}
                                className="flex-1 p-3 rounded-xl font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                              >
                                {processingAction ? 'Deleting...' : 'Delete User'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {paginatedData.length === 0 && (
          <div className="p-12 text-center">
            <Users className={`w-12 h-12 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
            <p className={`text-lg font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No users found
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} users
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
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
              if (page > totalPages) return null;
              return (
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
              );
            })}
            
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
    </div>
  );
};

export default AdminUsersList;