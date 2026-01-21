import Datatable from "../../components/datatable/Datatable";
import { useState, useEffect } from "react";
import { getWithdrawalRequestsColumns } from "../../datatablesource";
import { approveWithdrawal, rejectWithdrawal } from "../../utils/adminApi";
import { getAdminWithdrawals } from "../../utils/adminApi";
import { useLocalization } from "../../context/LocalizationContext.jsx";
import listTranslations from "../../localization/list.json";
import commonTranslations from "../../localization/common.json";
import { Link } from "react-router-dom";
import { LoadingSpinner, ErrorMessage } from "../../components/ui";
import toast from "react-hot-toast";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Tooltip, IconButton } from "@mui/material";
import { Eye, Check, X } from 'lucide-react';

const ListWithdrawlRequests = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState(null); // 'approve' | 'reject'
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminNote, setAdminNote] = useState('Approved by admin');
  const [rejectReason, setRejectReason] = useState('');
  const { getTranslation } = useLocalization();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminWithdrawals({ status: 'all', limit: 100 });
      setData(Array.isArray(res) ? res : (res?.data || []));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openActionModal = (type, request) => {
    const withdrawalId = request?._id || request?.requestId;
    if (!withdrawalId) {
      toast.error('Invalid withdrawal request ID');
      return;
    }

    setSelectedRequest(request);
    setActionType(type);
    if (type === 'approve') {
      setAdminNote('Approved by admin');
    } else {
      setRejectReason('');
    }
    setActionModalOpen(true);
  };

  const closeActionModal = () => {
    if (processingId) return;
    setActionModalOpen(false);
    setActionType(null);
    setSelectedRequest(null);
  };

  const confirmAction = async () => {
    const withdrawalId = selectedRequest?._id || selectedRequest?.requestId;
    if (!withdrawalId || !actionType) {
      toast.error('Invalid withdrawal request');
      return;
    }

    if (actionType === 'reject' && !rejectReason.trim()) {
      toast.error('Please enter a rejection reason');
      return;
    }

    setProcessingId(withdrawalId);
    try {
      if (actionType === 'approve') {
        await approveWithdrawal(withdrawalId, adminNote?.trim() || 'Approved by admin');
        setData(prevData =>
          prevData.map(item =>
            (item._id === withdrawalId || item.requestId === withdrawalId)
              ? { ...item, status: 'approved' }
              : item
          )
        );
        toast.success('Withdrawal request approved successfully');
      } else {
        await rejectWithdrawal(withdrawalId, rejectReason.trim());
        setData(prevData =>
          prevData.map(item =>
            (item._id === withdrawalId || item.requestId === withdrawalId)
              ? { ...item, status: 'rejected' }
              : item
          )
        );
        toast.success('Withdrawal request rejected');
      }
      setActionModalOpen(false);
      setActionType(null);
      setSelectedRequest(null);
    } catch (error) {
      const errorMsg = error?.response?.data?.message || error?.message || `Failed to ${actionType} withdrawal`;
      const blockingReason = error?.response?.data?.blockingReason;
      
      if (blockingReason) {
        const reasonMessages = {
          'stripe_not_connected': 'Freelancer has not connected their Stripe account yet.',
          'stripe_payouts_disabled': 'Stripe payouts are not enabled for this freelancer.',
          'stripe_onboarding_incomplete': 'Freelancer must complete Stripe onboarding first.',
          'stripe_verification_failed': 'Unable to verify Stripe account status.'
        };
        toast.error(reasonMessages[blockingReason] || errorMsg);
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setProcessingId(null);
    }
  };

  const actionColumn = [
    {
      field: "action",
      headerName: getTranslation(commonTranslations, "actions"),
      width: 200,
      renderCell: (params) => {
        const isPending = params.row.status === 'pending' || !params.row.status;
        const isProcessing = processingId === (params.row._id || params.row.requestId);
        const isStripe = params.row.withdrawalMethod === 'stripe';
        
        return (
          <div className="flex items-center gap-1">
            <Tooltip title="View Details">
              <Link
                to={`/admin/withdrawals/${params.row._id || params.row.requestId}`}
                state={{ requestData: params.row }}
              >
                <IconButton size="small" className="text-blue-600 hover:bg-blue-50">
                  <Eye className="w-4 h-4" />
                </IconButton>
              </Link>
            </Tooltip>
            {isPending ? (
              <>
                <Tooltip title={isStripe ? "Approve (will validate Stripe account)" : "Approve withdrawal"}>
                  <span>
                    <IconButton
                      size="small"
                      className="text-green-600 hover:bg-green-50"
                      onClick={() => openActionModal('approve', params.row)}
                      disabled={isProcessing}
                    >
                      <Check className="w-4 h-4" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Reject withdrawal">
                  <span>
                    <IconButton
                      size="small"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => openActionModal('reject', params.row)}
                      disabled={isProcessing}
                    >
                      <X className="w-4 h-4" />
                    </IconButton>
                  </span>
                </Tooltip>
              </>
            ) : (
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                params.row.status === 'approved' ? 'bg-green-100 text-green-700' :
                params.row.status === 'rejected' ? 'bg-red-100 text-red-700' :
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
          <Datatable
            data={data}
            columns={getWithdrawalRequestsColumns(getTranslation).concat(actionColumn)}
            title="allWithdrawlRequests"
            showAddButton={false}
          />
        )}

        <Dialog open={actionModalOpen} onClose={closeActionModal} maxWidth="sm" fullWidth>
          <DialogTitle>
            {actionType === 'approve' ? 'Approve Withdrawal' : 'Reject Withdrawal'}
          </DialogTitle>
          <DialogContent>
            <div className="mt-2 space-y-3">
              <div className="text-sm text-gray-600">
                Request: <span className="font-medium">{selectedRequest?._id || selectedRequest?.requestId || 'N/A'}</span>
                {' '}• Amount: <span className="font-medium">${Number(selectedRequest?.amount || 0).toFixed(2)}</span>
              </div>
              {actionType === 'approve' ? (
                <TextField
                  label="Admin note (optional)"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  fullWidth
                  multiline
                  minRows={2}
                />
              ) : (
                <TextField
                  label="Rejection reason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  fullWidth
                  multiline
                  minRows={3}
                  required
                />
              )}
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeActionModal} disabled={Boolean(processingId)}>
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              variant="contained"
              color={actionType === 'approve' ? 'primary' : 'error'}
              disabled={Boolean(processingId)}
            >
              {processingId ? 'Processing...' : (actionType === 'approve' ? 'Approve' : 'Reject')}
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </div>
  );
};

export default ListWithdrawlRequests;
