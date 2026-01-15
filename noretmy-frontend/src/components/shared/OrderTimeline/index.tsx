'use client';

import React, { useState } from 'react';
import {
    CheckCircle,
    Clock,
    PlayCircle,
    Truck,
    CreditCard,
    Star,
    AlertCircle,
    XCircle,
    MessageSquare,
    FileCheck,
    CircleDot,
    FileText,
    X
} from 'lucide-react';

interface TimelineEvent {
    event: string;
    description?: string;
    timestamp: string;
    actor: 'buyer' | 'seller' | 'system';
}

interface OrderTimelineProps {
    status: string;
    timeline: TimelineEvent[];
    isPaid?: boolean;
    orderDate?: string;
    deliveryDate?: string;
    orderCompletionDate?: string;
    isUserSeller?: boolean;
    isUserBuyer?: boolean;
    orderId?: string;
    onApproveProgress?: (milestone: string) => void;
    onApproveDelivery?: () => void;
    onApprovePayment?: () => void;
    onAdvanceStatus?: (targetStatus: string) => void;
}

const mainSteps = [
    {
        key: 'created',
        label: 'Order Placed',
        description: 'Order created, pending freelancer acceptance',
        icon: FileText,
        includedStatuses: ['pending', 'created']
    },
    {
        key: 'accepted',
        label: 'Accepted',
        description: 'Freelancer accepted, ready for payment',
        icon: CheckCircle,
        includedStatuses: ['accepted']
    },
    {
        key: 'started',
        label: 'In Escrow',
        description: 'Payment secured, project started',
        icon: PlayCircle,
        includedStatuses: ['requirementsSubmitted', 'started', 'halfwayDone']
    },
    {
        key: 'delivered',
        label: 'Delivered',
        description: 'Freelancer submitted work for review',
        icon: Truck,
        includedStatuses: ['delivered', 'requestedRevision']
    },
    {
        key: 'approved',
        label: 'Reviewed',
        description: 'Client is reviewing the deliverables',
        icon: Star,
        includedStatuses: ['waitingReview']
    },
    {
        key: 'completed',
        label: 'Completed',
        description: 'Order finished and funds released',
        icon: CreditCard,
        includedStatuses: ['completed']
    },
];

const getStepFromStatus = (status: string): number => {
    const stepIndex = mainSteps.findIndex(step =>
        step.includedStatuses.includes(status)
    );
    return stepIndex >= 0 ? stepIndex : 0;
};

const OrderTimeline: React.FC<OrderTimelineProps> = ({
    status,
    timeline,
    isPaid = false,
    orderDate,
    deliveryDate,
    orderCompletionDate,
    isUserSeller,
    isUserBuyer,
    orderId,
    onApproveProgress,
    onApproveDelivery,
    onApprovePayment,
    onAdvanceStatus,
}) => {
    const currentStep = getStepFromStatus(status);
    const progress = Math.min(100, ((currentStep + 1) / mainSteps.length) * 100);

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingStep, setPendingStep] = useState<{ key: string; label: string } | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const getStepClickability = (stepKey: string, stepIndex: number) => {
        const isNextStep = stepIndex === currentStep + 1;
        if (!isNextStep) return { canClick: false, reason: '' };

        const stepRoles: { [key: string]: 'seller' | 'buyer' } = {
            'accepted': 'seller',
            'started': 'buyer',   // Buyer pays to start
            'delivered': 'seller',
            'approved': 'buyer',
            'completed': 'buyer',
        };

        const requiredRole = stepRoles[stepKey];
        if (!requiredRole) return { canClick: false, reason: '' };

        if (requiredRole === 'seller' && isUserSeller) {
            return { canClick: true, reason: 'Click to advance status' };
        }
        if (requiredRole === 'buyer' && isUserBuyer) {
            if (stepKey === 'started') {
                return { canClick: true, reason: 'Proceed to Payment' };
            }
            if (stepKey === 'completed') {
                return { canClick: true, reason: 'Final Approval & Release Funds' };
            }
            return { canClick: true, reason: 'Click to approve' };
        }

        return {
            canClick: false,
            reason: requiredRole === 'seller' ? 'Waiting for freelancer' : 'Waiting for client'
        };
    };

    const stepToStatus: { [key: string]: string } = {
        'accepted': 'accepted',
        'started': 'pay', // Special key for payment
        'delivered': 'delivered',
        'approved': 'waitingReview',
        'completed': 'completed',
    };

    const handleStepClick = (stepKey: string, stepLabel: string) => {
        if (stepKey === 'started' && isUserBuyer) {
            window.location.href = `/checkout?payment_type=order_payment&orderId=${orderId}`;
            return;
        }
        setPendingStep({ key: stepKey, label: stepLabel });
        setShowConfirmModal(true);
    };

    const handleConfirmAdvance = async () => {
        if (!pendingStep) return;

        setIsProcessing(true);
        const targetStatus = stepToStatus[pendingStep.key];

        if (targetStatus && onAdvanceStatus) {
            await onAdvanceStatus(targetStatus);
        }

        setIsProcessing(false);
        setShowConfirmModal(false);
        setPendingStep(null);
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return '';
        }
    };

    const getActorBadge = (actor: string) => {
        switch (actor) {
            case 'buyer':
                return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Client</span>;
            case 'seller':
                return <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">Freelancer</span>;
            default:
                return <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">System</span>;
        }
    };

    const getTimelineEventForStep = (stepKey: string) => {
        const step = mainSteps.find(s => s.key === stepKey);
        if (!step) return null;

        const event = timeline?.find(t =>
            step.includedStatuses.some(s => t.event.toLowerCase().includes(s.toLowerCase()))
        );
        return event;
    };

    return (
        <>
            {/* Confirmation Modal */}
            {showConfirmModal && pendingStep && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-gray-900">Confirm Action</h3>
                                <button
                                    onClick={() => {
                                        setShowConfirmModal(false);
                                        setPendingStep(null);
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                                        <CheckCircle className="w-6 h-6 text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">
                                            Move to "{pendingStep.label}"
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            This action cannot be undone
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <p className="text-gray-600 mb-6">
                                Are you sure you want to advance this order to the next stage?
                                {pendingStep.key === 'approved' && ' This will mark the delivery as approved.'}
                                {pendingStep.key === 'completed' && ' This will complete the order and release payment.'}
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowConfirmModal(false);
                                        setPendingStep(null);
                                    }}
                                    disabled={isProcessing}
                                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmAdvance}
                                    disabled={isProcessing}
                                    className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            Confirm
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                {/* Header with Progress */}
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-6 border-b border-orange-200">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Order Progress</h3>
                            <p className="text-gray-500 text-sm mt-1">
                                Track your order from start to finish
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-orange-500">{Math.round(progress)}%</div>
                            <div className="text-gray-500 text-sm">Complete</div>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-700"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    {/* Due Date */}
                    {deliveryDate && (
                        <div className="mt-3 text-sm text-gray-600">
                            Due Date: <span className="font-medium text-gray-900">{formatDate(deliveryDate).split(',')[0]}</span>
                        </div>
                    )}
                </div>

                {/* Vertical Timeline - Always vertical */}
                <div className="p-6">
                    <div className="relative">
                        {mainSteps.map((step, index) => {
                            const isCompleted = index < currentStep;
                            const isCurrent = index === currentStep;
                            const isPending = index > currentStep;
                            const StepIcon = step.icon;
                            const isLast = index === mainSteps.length - 1;
                            const timelineEvent = getTimelineEventForStep(step.key);
                            const clickability = getStepClickability(step.key, index);

                            return (
                                <div key={step.key} className="relative flex items-start pb-8 last:pb-0">
                                    {/* Vertical Line */}
                                    {!isLast && (
                                        <div
                                            className={`absolute left-6 top-14 w-0.5 h-[calc(100%-3.5rem)] transition-colors duration-300 ${isCompleted ? 'bg-orange-500' : 'bg-gray-200'
                                                }`}
                                        />
                                    )}

                                    {/* Circle/Icon */}
                                    <div
                                        onClick={() => clickability.canClick && handleStepClick(step.key, step.label)}
                                        className={`
                                            relative z-10 w-12 h-12 rounded-full flex items-center justify-center border-4 flex-shrink-0 transition-all duration-300
                                            ${isCompleted
                                                ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-200'
                                                : isCurrent
                                                    ? 'bg-white border-orange-500 text-orange-500 shadow-lg shadow-orange-100 ring-4 ring-orange-50'
                                                    : 'bg-gray-50 border-gray-200 text-gray-400'
                                            }
                                            ${clickability.canClick
                                                ? 'cursor-pointer hover:scale-110 hover:shadow-xl hover:border-orange-500 hover:bg-orange-50 hover:text-orange-600 ring-2 ring-orange-100 ring-offset-2'
                                                : ''
                                            }
                                        `}
                                    >
                                        {isCompleted ? (
                                            <CheckCircle className="w-6 h-6" />
                                        ) : (
                                            <StepIcon className="w-5 h-5" />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="ml-4 flex-1 pt-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`font-semibold text-base ${isCompleted ? 'text-orange-700' : isCurrent ? 'text-gray-900' : 'text-gray-400'
                                                }`}>
                                                {step.label}
                                            </span>
                                            {isCurrent && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                                                    <CircleDot className="w-3 h-3 mr-1 animate-pulse" />
                                                    Current
                                                </span>
                                            )}
                                            {isCompleted && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                    Done
                                                </span>
                                            )}
                                        </div>

                                        <p className={`text-sm mt-1 ${isCompleted || isCurrent ? 'text-gray-600' : 'text-gray-400'
                                            }`}>
                                            {step.description}
                                        </p>

                                        {(isCompleted || isCurrent) && timelineEvent && (
                                            <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatDate(timelineEvent.timestamp)}
                                            </div>
                                        )}

                                        {clickability.canClick && (
                                            <button
                                                onClick={() => handleStepClick(step.key, step.label)}
                                                className="mt-3 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                Click to advance
                                            </button>
                                        )}

                                        {!clickability.canClick && clickability.reason && isPending && (
                                            <p className="text-xs text-gray-400 mt-2 italic">
                                                {clickability.reason}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Client Approval Actions */}
                {isUserBuyer && ['halfwayDone', 'delivered', 'waitingReview', 'readyForPayment'].includes(status) && (
                    <div className="px-6 py-4 bg-gradient-to-r from-orange-50 to-amber-50 border-t border-orange-100">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-orange-500" />
                            Actions Required
                        </h4>
                        <div className="flex flex-wrap gap-3">
                            {status === 'halfwayDone' && onApproveProgress && (
                                <button
                                    onClick={() => onApproveProgress('halfway')}
                                    className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    Approve 50% Progress
                                </button>
                            )}

                            {(status === 'delivered' || status === 'waitingReview') && onApproveDelivery && (
                                <button
                                    onClick={onApproveDelivery}
                                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    Approve & Complete Order
                                </button>
                            )}

                            {status === 'readyForPayment' && onApprovePayment && (
                                <button
                                    onClick={onApprovePayment}
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                                >
                                    <CreditCard className="w-4 h-4" />
                                    Release Payment
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default OrderTimeline;
