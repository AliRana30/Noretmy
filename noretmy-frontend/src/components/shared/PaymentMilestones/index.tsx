'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  CheckCircle,
  Circle,
  Clock,
  Lock,
  DollarSign,
  Shield,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { toast } from 'react-toastify';

interface PaymentStage {
  id: string;
  label: string;
  percentage: number;
  status: 'completed' | 'current' | 'pending' | 'cancelled';
  description: string;
}

interface PaymentMilestone {
  id: string;
  stage: string;
  amount: number;
  displayAmount: string;
  percentage: number;
  status: string;
  createdAt: string;
  stripePaymentIntentId?: string;
}

interface PaymentTotals {
  orderTotal: number;
  authorized: number;
  inEscrow: number;
  pendingRelease: number;
  released: number;
  currentStage: string;
}

interface PaymentMilestonesProps {
  orderId: string;
  isSeller?: boolean;
  onMilestoneUpdate?: () => void;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

const PaymentMilestones: React.FC<PaymentMilestonesProps> = ({
  orderId,
  isSeller = false,
  onMilestoneUpdate
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stages, setStages] = useState<PaymentStage[]>([]);
  const [milestones, setMilestones] = useState<PaymentMilestone[]>([]);
  const [totals, setTotals] = useState<PaymentTotals | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [stripeInfo, setStripeInfo] = useState<{
    paymentIntentId?: string;
    chargeId?: string;
    transferId?: string;
  }>({});

  const fetchPaymentStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        `${BACKEND_URL}/payment-milestones/order/${orderId}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setStages(response.data.stages);
        setMilestones(response.data.milestones);
        setTotals(response.data.totals);
        setStripeInfo({
          paymentIntentId: response.data.order?.stripePaymentIntentId,
          chargeId: response.data.order?.stripeChargeId,
          transferId: response.data.order?.stripeTransferId
        });
      }
    } catch (err: any) {
      console.error('Error fetching payment status:', err);
      setError(err.response?.data?.error || 'Failed to load payment status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchPaymentStatus();
    }
  }, [orderId]);

  // Optional auto-refresh: if parent provides `onMilestoneUpdate`, keep polling until completed.
  useEffect(() => {
    if (!orderId) return;
    if (!onMilestoneUpdate) return;
    if (totals?.currentStage === 'completed') return;

    const refreshInterval = setInterval(() => {
      fetchPaymentStatus();
    }, 3000);

    return () => clearInterval(refreshInterval);
  }, [orderId, onMilestoneUpdate, totals?.currentStage]);

  const getStageIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-orange-500" />;
      case 'current':
        return <Clock className="w-6 h-6 text-orange-500 animate-pulse" />;
      case 'cancelled':
        return <AlertCircle className="w-6 h-6 text-slate-500" />;
      default:
        return <Circle className="w-6 h-6 text-gray-300" />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'held_in_escrow':
        return 'bg-blue-100 text-blue-700';
      case 'pending_release':
        return 'bg-amber-100 text-amber-700';
      case 'released':
        return 'bg-orange-100 text-orange-700';
      case 'refunded':
        return 'bg-slate-100 text-slate-700';
      case 'failed':
        return 'bg-slate-100 text-slate-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                <div className="flex-1 h-4 bg-gray-200 rounded"></div>
                <div className="w-16 h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 text-slate-600">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
          <button
            onClick={fetchPaymentStatus}
            className="ml-auto text-orange-500 hover:text-orange-600"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const currentStageIndex = stages.findIndex(s => s.status === 'current');
  const progressPercentage = currentStageIndex >= 0 
    ? ((currentStageIndex + 1) / stages.length) * 100 
    : 100;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Payment Protection</h3>
              <p className="text-slate-300 text-sm">Milestone-based escrow system</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white font-bold text-lg">
              ${totals?.orderTotal?.toFixed(2) || '0.00'}
            </p>
            <p className="text-slate-300 text-xs">Order Total</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 p-4 border-b border-gray-100">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-blue-600">
            <Lock className="w-4 h-4" />
            <span className="font-bold">${totals?.inEscrow?.toFixed(2) || '0.00'}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">In Escrow</p>
        </div>
        <div className="text-center border-x border-gray-100">
          <div className="flex items-center justify-center gap-1 text-amber-600">
            <Clock className="w-4 h-4" />
            <span className="font-bold">${totals?.pendingRelease?.toFixed(2) || '0.00'}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Pending Release</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-orange-600">
            <DollarSign className="w-4 h-4" />
            <span className="font-bold">${totals?.released?.toFixed(2) || '0.00'}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Released</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-6 py-4">
        <div className="relative">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Milestone Stages */}
      <div className="px-6 pb-4">
        <div className="space-y-4">
          {stages.map((stage, index) => (
            <div
              key={stage.id}
              className={`flex items-start gap-4 ${
                stage.status === 'pending' ? 'opacity-50' : ''
              }`}
            >
              {/* Connector Line */}
              <div className="relative flex flex-col items-center">
                {getStageIcon(stage.status)}
                {index < stages.length - 1 && (
                  <div 
                    className={`absolute top-8 w-0.5 h-8 ${
                      stage.status === 'completed' ? 'bg-orange-300' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>

              {/* Stage Content */}
              <div className="flex-1 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={`font-medium ${
                      stage.status === 'current' ? 'text-orange-600' : 'text-gray-800'
                    }`}>
                      {stage.label}
                      {stage.status === 'current' && (
                        <span className="ml-2 text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                          Current
                        </span>
                      )}
                    </h4>
                    <p className="text-sm text-gray-500">{stage.description}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-semibold ${
                      stage.status === 'completed' ? 'text-orange-600' : 'text-gray-400'
                    }`}>
                      {stage.percentage}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction Details Toggle */}
      <div className="border-t border-gray-100">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full px-6 py-3 flex items-center justify-between text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <span>Transaction Details</span>
          {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showDetails && (
          <div className="px-6 pb-4 space-y-4">
            {/* Stripe IDs */}
            {stripeInfo.paymentIntentId && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Payment Intent ID</p>
                <p className="text-sm font-mono text-gray-700 break-all">
                  {stripeInfo.paymentIntentId}
                </p>
              </div>
            )}

            {/* Transaction History */}
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-gray-700">Transaction History</h5>
              {milestones.length > 0 ? (
                <div className="space-y-2">
                  {milestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadgeColor(milestone.status)}`}>
                          {milestone.status.replace('_', ' ')}
                        </span>
                        <span className="text-sm text-gray-600 capitalize">
                          {milestone.stage.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-800">
                          {milestone.displayAmount}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDate(milestone.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No transactions yet
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center">
          🔒 Your payment is protected by our secure escrow system. Funds are only released when you approve the work.
        </p>
      </div>
    </div>
  );
};

export default PaymentMilestones;
