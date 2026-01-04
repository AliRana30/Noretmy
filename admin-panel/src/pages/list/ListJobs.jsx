import { useState, useEffect, useContext } from "react";
import { getJobs } from "../../datatablesource";
import { deleteJob } from "../../utils/adminApi";
import { useLocalization } from "../../context/LocalizationContext.jsx";
import { DarkModeContext } from "../../context/darkModeContext.jsx";
import { API_CONFIG } from "../../config/api";
import commonTranslations from "../../localization/common.json";
import { LoadingSpinner, ErrorMessage } from "../../components/ui";
import { Briefcase, Search, Filter, Eye, Trash2, RefreshCw, ChevronLeft, ChevronRight, X } from "lucide-react";
import toast from "react-hot-toast";

const ListJobs = () => {
  const { darkMode } = useContext(DarkModeContext);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);
  const itemsPerPage = 10;
  const { getTranslation } = useLocalization();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const jobs = await getJobs();
      setData(jobs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (job) => {
    setJobToDelete(job);
    setDeleteReason('');
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!jobToDelete) return;
    
    try {
      setDeleting(true);
      await deleteJob(jobToDelete._id, deleteReason || 'Removed by admin');
      setData((prevData) => prevData.filter((item) => item._id !== jobToDelete._id));
      toast.success('Job deleted successfully');
      setDeleteModalOpen(false);
      setJobToDelete(null);
      setDeleteReason('');
    } catch (error) {
      console.error('Error deleting job:', error);
      toast.error('Failed to delete job: ' + (error.message || 'Unknown error'));
    } finally {
      setDeleting(false);
    }
  };

  // Filter data
  const filteredData = data.filter(job => {
    const matchesSearch = 
      job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.sellerId?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.jobStatus?.toLowerCase() === statusFilter;
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
      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className={`w-full max-w-md p-6 rounded-2xl shadow-xl ${
            darkMode ? 'bg-gray-900 border border-white/10' : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Delete Job
              </h3>
              <button
                onClick={() => setDeleteModalOpen(false)}
                className={`p-1 rounded-lg ${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Are you sure you want to delete "{jobToDelete?.title}"? This action cannot be undone.
            </p>
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Reason (optional)
              </label>
              <input
                type="text"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Enter reason for deletion..."
                className={`w-full px-4 py-2 rounded-lg ${
                  darkMode 
                    ? 'bg-gray-800 border border-gray-700 text-white placeholder-gray-500' 
                    : 'bg-gray-50 border border-gray-200 text-gray-900'
                } focus:outline-none focus:border-orange-500`}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className={`flex-1 px-4 py-2 rounded-lg font-medium ${
                  darkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 rounded-lg font-medium bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Jobs Management
          </h1>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            View and manage all job listings
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Jobs', value: data.length, color: '#6366f1' },
          { label: 'Active', value: data.filter(j => j.jobStatus?.toLowerCase() === 'active').length, color: '#22c55e' },
          { label: 'Inactive', value: data.filter(j => j.jobStatus?.toLowerCase() !== 'active').length, color: '#f59e0b' },
          { label: 'Featured', value: data.filter(j => j.upgradeOption && j.upgradeOption !== 'Free').length, color: '#8b5cf6' },
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
                <Briefcase className="w-5 h-5" />
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
            placeholder="Search jobs..."
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl transition-all outline-none ${
              darkMode 
                ? 'bg-gray-800 border border-gray-700 text-white placeholder-gray-500' 
                : 'bg-gray-50 border border-gray-200 text-gray-900'
            } focus:border-orange-500`}
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
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
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Jobs Table */}
      <div className={`rounded-2xl overflow-hidden ${
        darkMode ? 'bg-[#1a1a2e]/80 border border-white/10' : 'bg-white border border-gray-100 shadow-lg'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${darkMode ? 'border-white/10 bg-white/5' : 'border-gray-100 bg-gray-50'}`}>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Job</th>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Seller</th>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Status</th>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Category</th>

                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Plan</th>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Date</th>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((job) => (
                <tr 
                  key={job._id}
                  className={`border-b last:border-b-0 transition-colors ${
                    darkMode 
                      ? 'border-white/5 hover:bg-white/5' 
                      : 'border-gray-50 hover:bg-gray-50'
                  }`}
                >
                  <td className={`px-6 py-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    <p className="font-medium truncate max-w-[200px]">{job.title}</p>
                  </td>
                  <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {job.sellerId?.substring(0, 10)}...
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      job.jobStatus?.toLowerCase() === 'active'
                        ? 'bg-orange-500/20 text-orange-500'
                        : 'bg-amber-500/20 text-amber-500'
                    }`}>
                      {job.jobStatus || 'Active'}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {job.location || 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      job.upgradeOption && job.upgradeOption !== 'Free'
                        ? 'bg-purple-500/20 text-purple-500'
                        : darkMode ? 'bg-white/10 text-gray-400' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {job.upgradeOption || 'Free'}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {job.date}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => window.open(`${API_CONFIG.FRONTEND_URL}/gig/${job._id}`, '_blank')}
                        className="p-2 rounded-lg bg-orange-500/20 text-orange-500 hover:bg-orange-500/30 transition-colors"
                        title="View on Frontend"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(job)}
                        className="p-2 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
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
            <Briefcase className={`w-12 h-12 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
            <p className={`text-lg font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No jobs found
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} jobs
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

export default ListJobs;
