import Datatable from "../../components/datatable/Datatable";
import { useState, useEffect } from "react";
import { getAllWithdrawalRequests, getWithdrawalRequestsColumns } from "../../datatablesource";
import { approveWithdrawal, rejectWithdrawal } from "../../utils/adminApi";
import { useLocalization } from "../../context/LocalizationContext.jsx";
import listTranslations from "../../localization/list.json";
import commonTranslations from "../../localization/common.json";
import { Link } from "react-router-dom";
import { LoadingSpinner, ErrorMessage } from "../../components/ui";
import toast from "react-hot-toast";

const ListWithdrawlRequests = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const { getTranslation } = useLocalization();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllWithdrawalRequests();
      setData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request) => {
    const withdrawalId = request._id || request.requestId;
    if (!withdrawalId) {
      toast.error('Invalid withdrawal request ID');
      return;
    }
    
    if (!window.confirm(`Are you sure you want to approve this withdrawal request for $${request.amount}?`)) {
      return;
    }
    
    setProcessingId(withdrawalId);
    try {
      await approveWithdrawal(withdrawalId, 'Approved by admin');
      // Update local state
      setData(prevData => 
        prevData.map(item => 
          (item._id === withdrawalId || item.requestId === withdrawalId)
            ? { ...item, status: 'approved' }
            : item
        )
      );
      toast.success('Withdrawal request approved successfully');
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      toast.error(error.message || 'Failed to approve withdrawal');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (request) => {
    const withdrawalId = request._id || request.requestId;
    if (!withdrawalId) {
      toast.error('Invalid withdrawal request ID');
      return;
    }
    
    const reason = prompt('Enter reason for rejection:');
    if (!reason) return;
    
    setProcessingId(withdrawalId);
    try {
      await rejectWithdrawal(withdrawalId, reason);
      // Update local state
      setData(prevData => 
        prevData.map(item => 
          (item._id === withdrawalId || item.requestId === withdrawalId)
            ? { ...item, status: 'rejected' }
            : item
        )
      );
      toast.success('Withdrawal request rejected');
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      toast.error(error.message || 'Failed to reject withdrawal');
    } finally {
      setProcessingId(null);
    }
  };

  const actionColumn = [
    {
      field: "action",
      headerName: getTranslation(commonTranslations, "actions"),
      width: 400,
      renderCell: (params) => {
        const isPending = params.row.status === 'pending' || !params.row.status;
        const isProcessing = processingId === (params.row._id || params.row.requestId);
        
        return (
          <div className="flex items-center gap-2">
            <Link
              to={`/withdrawl-requests/${params.row._id || params.row.requestId}`}
              state={{ requestData: params.row }}
              className="px-3 py-1 bg-gradient-to-r from-amber-400 to-pink-500 hover:from-amber-500 hover:to-pink-600 text-white rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
            >
              View Request
            </Link>
            {isPending ? (
              <>
                <button 
                  className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md disabled:opacity-50"
                  onClick={() => handleApprove(params.row)}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Approve'}
                </button>
                <button 
                  className="px-3 py-1 bg-slate-500 hover:bg-slate-600 text-white rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md disabled:opacity-50"
                  onClick={() => handleReject(params.row)}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Reject'}
                </button>
              </>
            ) : (
              <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                params.row.status === 'approved' ? 'bg-orange-100 text-orange-700' :
                params.row.status === 'rejected' ? 'bg-slate-100 text-slate-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {params.row.status?.charAt(0).toUpperCase() + params.row.status?.slice(1)}
              </span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="w-full">
      <div className="w-full">
        
        {/* Loading State */}
        {loading && (
          <LoadingSpinner message={getTranslation(commonTranslations, "loading")} />
        )}

        {/* Error State */}
        {error && (
          <ErrorMessage 
            message={`${getTranslation(commonTranslations, "error")}: ${error}`}
            onRetry={() => window.location.reload()}
            retryText="Retry"
          />
        )}

        {/* Main Content - Only show when not loading and no error */}
        {!loading && !error && (
          <Datatable data={data} columns={getWithdrawalRequestsColumns(getTranslation).concat(actionColumn)} title="allWithdrawlRequests" />
        )}
      </div>
    </div>
  );
};

export default ListWithdrawlRequests;
