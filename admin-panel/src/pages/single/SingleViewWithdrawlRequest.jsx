import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useContext, useEffect, useMemo, useState } from "react";
import { getAdminWithdrawalDetail } from "../../utils/adminApi";
import { LoadingSpinner, ErrorMessage } from "../../components/ui";
import { DarkModeContext } from "../../context/darkModeContext";
import { ArrowLeft, Clock, DollarSign, Mail, User, Wallet2, BadgeCheck, XCircle, AlertCircle } from "lucide-react";

const ViewWithdrawalRequest = () => {
  const { withdrawalId, requestId } = useParams();
  const resolvedId = withdrawalId || requestId;
  const location = useLocation();
  const navigate = useNavigate();
  const { darkMode } = useContext(DarkModeContext);
  const [requestData, setRequestData] = useState(location.state?.requestData || null);
  const [loading, setLoading] = useState(!location.state?.requestData);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (location.state?.requestData) return;
      try {
        setLoading(true);
        setError(null);
        const res = await getAdminWithdrawalDetail(resolvedId);
        console.log('[Withdrawal Detail] API Response:', res);
        setRequestData(res || null);
      } catch (err) {
        setError(err?.message || 'Failed to load withdrawal request');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [resolvedId]);

  if (loading) {
    return <LoadingSpinner message="Loading withdrawal request..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={() => window.location.reload()} retryText="Retry" />;
  }

  if (!requestData) {
    return <ErrorMessage message="Withdrawal request not found" onRetry={() => window.location.reload()} retryText="Retry" />;
  }

  const detail = requestData;
  
  const populatedUser = requestData?.user || {
    _id: requestData?.userId,
    username: requestData?.username,
    fullName: requestData?.fullName,
    email: requestData?.email,
  };

  const normalized = useMemo(() => {
    const amount = typeof detail?.amount === 'number' ? detail.amount : Number(detail?.amount || 0);
    const status = detail?.status || 'pending';
    const createdAt = detail?.createdAt;
    const updatedAt = detail?.updatedAt;
    const method = detail?.withdrawalMethod || null;
    const payoutEmail = detail?.payoutEmail || null;

    console.log('[Withdrawal Detail] Normalized:', { method, payoutEmail, email: populatedUser?.email });

    return {
      id: detail?._id || resolvedId,
      amount,
      status,
      createdAt,
      updatedAt,
      method,
      payoutEmail,
      user: populatedUser || {},
    };
  }, [detail, populatedUser, resolvedId]);

  const formatMoney = (value) => {
    const n = typeof value === 'number' ? value : Number(value || 0);
    if (Number.isNaN(n)) return '$0.00';
    return `$${n.toFixed(2)}`;
  };

  const formatDateTime = (value) => {
    if (!value) return 'N/A';
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return 'N/A';
      return d.toLocaleString();
    } catch {
      return 'N/A';
    }
  };

  const getStatusColor = (status) => {
    switch (String(status || '').toLowerCase()) {
      case 'approved':
        return 'bg-slate-600/20 text-slate-600 border-slate-600/30';
      case 'rejected':
        return 'bg-slate-400/20 text-slate-500 border-slate-400/30';
      case 'pending':
        return 'bg-amber-500/20 text-amber-500 border-amber-500/30';
      default:
        return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
    }
  };

  const getStatusIcon = (status) => {
    switch (String(status || '').toLowerCase()) {
      case 'approved':
        return <BadgeCheck className="w-5 h-5" />;
      case 'rejected':
        return <XCircle className="w-5 h-5" />;
      case 'pending':
        return <Clock className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/admin/withdrawals')}
          className={`p-2 rounded-lg transition-all ${
            darkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
          aria-label="Back to withdrawals"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex-1">
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Withdrawal Request
          </h1>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Request ID: {normalized.id || 'N/A'}
          </p>
        </div>

        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border ${getStatusColor(normalized.status)}`}>
          {getStatusIcon(normalized.status)}
          <div>
            <p className="font-semibold capitalize">{String(normalized.status || 'pending')}</p>
            <p className="text-xs opacity-80">Current status</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className={`lg:col-span-2 p-6 rounded-2xl ${
          darkMode ? 'bg-[#1a1a2e]/80 border border-white/10' : 'bg-white border border-gray-100 shadow-lg'
        }`}>
          <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            <Wallet2 className="w-5 h-5 inline mr-2" />
            Summary
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <DollarSign className="w-4 h-4 inline mr-1" />
                Amount
              </p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                {formatMoney(normalized.amount)}
              </p>
            </div>

            <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Method
              </p>
              <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {normalized.method || 'N/A'}
              </p>
              <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Payout: {normalized.payoutEmail || 'N/A'}
              </p>
            </div>

            <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Created
              </p>
              <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {formatDateTime(normalized.createdAt)}
              </p>
            </div>

            <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Updated
              </p>
              <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {formatDateTime(normalized.updatedAt)}
              </p>
            </div>
          </div>

          {/* Raw IDs */}
          <h3 className={`text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Request Metadata
          </h3>
          <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Request ID</p>
                <p className={`text-sm font-medium break-all ${darkMode ? 'text-white' : 'text-gray-800'}`}>{normalized.id || 'N/A'}</p>
              </div>
              <div>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>User ID</p>
                <p className={`text-sm font-medium break-all ${darkMode ? 'text-white' : 'text-gray-800'}`}>{normalized.user?._id || detail?.userId || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className={`p-6 rounded-2xl ${
            darkMode ? 'bg-[#1a1a2e]/80 border border-white/10' : 'bg-white border border-gray-100 shadow-lg'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              <User className="w-5 h-5 inline mr-2" />
              User
            </h2>

            <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Name</p>
              <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {normalized.user?.username || normalized.user?.fullName || requestData?.username || 'N/A'}
              </p>
              <div className="mt-3">
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email
                </p>
                <p className={`font-medium break-all ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {normalized.user?.email || requestData?.email || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-2xl ${
            darkMode ? 'bg-[#1a1a2e]/80 border border-white/10' : 'bg-white border border-gray-100 shadow-lg'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              Payout
            </h2>
            <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Withdrawal Method</p>
              <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {normalized.method || 'N/A'}
              </p>
              <div className="mt-3">
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Payout Email</p>
                <p className={`font-medium break-all ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {normalized.payoutEmail || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewWithdrawalRequest;
