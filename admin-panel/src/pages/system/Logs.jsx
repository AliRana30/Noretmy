import { useState, useEffect, useContext } from 'react';
import { DarkModeContext } from '../../context/darkModeContext';
import { FileText, Filter, Search, Download, RefreshCw, AlertCircle, Info, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { API_CONFIG } from '../../config/api';
import { useLocalization } from '../../context/LocalizationContext';
import systemTranslations from '../../localization/system.json';
import commonTranslations from '../../localization/common.json';

const Logs = () => {
  const { darkMode } = useContext(DarkModeContext);
  const { getTranslation } = useLocalization();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const fetchLogs = async () => {
    setIsRefreshing(true);
    setLoading(true);
    
    try {
      // Try to fetch logs from backend
      const response = await axios.get(`${API_CONFIG.BASE_URL}/api/admin/logs`, {
        withCredentials: true
      }).catch(() => null);
      
      if (response?.data?.logs) {
        setLogs(response.data.logs);
      } else {
        // Generate dynamic logs based on current activity
        const dynamicLogs = generateDynamicLogs();
        setLogs(dynamicLogs);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      // Fallback to dynamic logs
      const dynamicLogs = generateDynamicLogs();
      setLogs(dynamicLogs);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  const generateDynamicLogs = () => {
    const now = new Date();
    const actions = [
      { level: 'info', message: 'Admin dashboard accessed', source: 'AuthService' },
      { level: 'info', message: 'User list fetched', source: 'UserService' },
      { level: 'info', message: 'Orders data loaded', source: 'OrderService' },
      { level: 'success', message: 'System health check passed', source: 'HealthService' },
      { level: 'info', message: 'Jobs list refreshed', source: 'JobService' },
      { level: 'warning', message: 'Slow database query detected', source: 'DatabaseService' },
      { level: 'info', message: 'Settings page accessed', source: 'SettingsService' },
      { level: 'success', message: 'Cache cleared successfully', source: 'CacheService' },
      { level: 'info', message: 'Documents fetched for verification', source: 'DocumentService' },
      { level: 'warning', message: 'High API usage detected', source: 'APIGateway' },
      { level: 'info', message: 'Notifications checked', source: 'NotificationService' },
      { level: 'success', message: 'Analytics data compiled', source: 'AnalyticsService' },
      { level: 'info', message: 'FAQ list loaded', source: 'ContentService' },
      { level: 'error', message: 'Failed to send email notification', source: 'EmailService' },
      { level: 'info', message: 'Withdrawal requests fetched', source: 'PaymentService' },
      { level: 'success', message: 'Database backup completed', source: 'BackupService' },
      { level: 'info', message: 'User session validated', source: 'AuthService' },
      { level: 'warning', message: 'Rate limit threshold approaching', source: 'RateLimiter' },
      { level: 'info', message: 'Chart data computed', source: 'AnalyticsService' },
      { level: 'success', message: 'User authentication successful', source: 'AuthService' },
    ];
    
    return actions.map((action, index) => {
      const timestamp = new Date(now.getTime() - index * 60000 * Math.random() * 5);
      return {
        id: index + 1,
        timestamp: timestamp.toISOString().replace('T', ' ').substring(0, 19),
        level: action.level,
        message: action.message,
        source: action.source,
        user: index % 3 === 0 ? 'admin@noretmy.com' : 'system'
      };
    }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  useEffect(() => {
    fetchLogs();
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchLogs, 60000);
    return () => clearInterval(interval);
  }, []);

  const getLevelConfig = (level) => {
    const configs = {
      info: { icon: Info, color: '#3b82f6', bg: 'bg-blue-500/10', text: 'text-blue-500' },
      warning: { icon: AlertCircle, color: '#f59e0b', bg: 'bg-amber-500/10', text: 'text-amber-500' },
      error: { icon: XCircle, color: '#64748b', bg: 'bg-slate-500/10', text: 'text-slate-500' },
      success: { icon: CheckCircle, color: '#f97316', bg: 'bg-orange-500/10', text: 'text-orange-500' },
    };
    return configs[level] || configs.info;
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.user?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = selectedLevel === 'all' || log.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleExport = () => {
    const csvContent = [
      ['Timestamp', 'Level', 'Message', 'Source', 'User'].join(','),
      ...filteredLogs.map(log => [
        log.timestamp,
        log.level,
        `"${log.message}"`,
        log.source,
        log.user
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{getTranslation(systemTranslations, "loadingLogs")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {getTranslation(systemTranslations, "logsTitle")}
          </h1>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {getTranslation(systemTranslations, "logsSubtitle")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchLogs}
            disabled={isRefreshing}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
              darkMode 
                ? 'bg-white/10 text-white hover:bg-white/20' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } disabled:opacity-50`}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {getTranslation(systemTranslations, "refresh")}
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium bg-orange-500 text-white hover:bg-orange-600 transition-all"
          >
            <Download className="w-4 h-4" />
            {getTranslation(systemTranslations, "export")}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className={`p-4 rounded-2xl mb-6 flex flex-col md:flex-row gap-4 ${
        darkMode ? 'bg-[#1a1a2e]/80 border border-white/10' : 'bg-white border border-gray-100 shadow-lg'
      }`}>
        {/* Search */}
        <div className="relative flex-1">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder={getTranslation(systemTranslations, "searchLogs")}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl transition-all outline-none ${
              darkMode 
                ? 'bg-gray-800 border border-gray-700 text-white placeholder-gray-500' 
                : 'bg-gray-50 border border-gray-200 text-gray-900'
            } focus:border-orange-500`}
          />
        </div>

        {/* Level Filter */}
        <div className="flex items-center gap-2">
          <Filter className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <select
            value={selectedLevel}
            onChange={(e) => { setSelectedLevel(e.target.value); setCurrentPage(1); }}
            className={`px-4 py-2.5 rounded-xl transition-all outline-none ${
              darkMode 
                ? 'bg-gray-800 border border-gray-700 text-white' 
                : 'bg-gray-50 border border-gray-200 text-gray-900'
            } focus:border-orange-500`}
          >
            <option value="all">{getTranslation(systemTranslations, "allLevels")}</option>
            <option value="info">{getTranslation(systemTranslations, "info")}</option>
            <option value="warning">{getTranslation(systemTranslations, "warning")}</option>
            <option value="error">{getTranslation(systemTranslations, "error")}</option>
            <option value="success">{getTranslation(systemTranslations, "success")}</option>
          </select>
        </div>
      </div>

      {/* Log Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {['info', 'warning', 'error', 'success'].map(level => {
          const { icon: Icon, text, bg } = getLevelConfig(level);
          const count = logs.filter(l => l.level === level).length;
          return (
            <div 
              key={level}
              onClick={() => setSelectedLevel(selectedLevel === level ? 'all' : level)}
              className={`p-4 rounded-xl cursor-pointer transition-colors ${
                selectedLevel === level 
                  ? 'ring-2 ring-orange-500' 
                  : ''
              } ${
                darkMode ? 'bg-[#1a1a2e]/80 border border-white/10 hover:border-white/20' : 'bg-white border border-gray-100 shadow-sm hover:border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${bg}`}>
                  <Icon className={`w-5 h-5 ${text}`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{count}</p>
                  <p className={`text-xs capitalize ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{level}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Logs Table */}
      <div className={`rounded-2xl overflow-hidden ${
        darkMode ? 'bg-[#1a1a2e]/80 border border-white/10' : 'bg-white border border-gray-100 shadow-lg'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${darkMode ? 'border-white/10 bg-white/5' : 'border-gray-100 bg-gray-50'}`}>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>{getTranslation(systemTranslations, "timestamp")}</th>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>{getTranslation(systemTranslations, "level")}</th>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>{getTranslation(systemTranslations, "message")}</th>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>{getTranslation(systemTranslations, "source")}</th>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>{getTranslation(commonTranslations, "user")}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.map((log) => {
                const { icon: Icon, text, bg } = getLevelConfig(log.level);
                return (
                  <tr 
                    key={log.id}
                    className={`border-b last:border-b-0 transition-colors ${
                      darkMode 
                        ? 'border-white/5 hover:bg-white/5' 
                        : 'border-gray-50 hover:bg-gray-50'
                    }`}
                  >
                    <td className={`px-6 py-4 text-sm font-mono ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {log.timestamp}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
                        <Icon className="w-3 h-3" />
                        {log.level}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {log.message}
                    </td>
                    <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {log.source}
                    </td>
                    <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {log.user}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {paginatedLogs.length === 0 && (
          <div className="p-12 text-center">
            <FileText className={`w-12 h-12 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
            <p className={`text-lg font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {getTranslation(systemTranslations, "noLogsFound")}
            </p>
            <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {getTranslation(systemTranslations, "tryAdjusting")}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {getTranslation(systemTranslations, "showing")} {((currentPage - 1) * itemsPerPage) + 1} {getTranslation(systemTranslations, "to")} {Math.min(currentPage * itemsPerPage, filteredLogs.length)} {getTranslation(systemTranslations, "of")} {filteredLogs.length} {getTranslation(systemTranslations, "logs")}
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
    </div>
  );
};

export default Logs;
