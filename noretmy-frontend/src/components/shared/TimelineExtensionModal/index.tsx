'use client';

import React, { useState } from 'react';
import { X, Clock, DollarSign, Calendar } from 'lucide-react';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { toast } from 'react-hot-toast';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface TimelineExtensionModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string;
    currentDeadline: Date;
    onSuccess?: () => void;
}

const EXTENSION_OPTIONS = [
    { days: 3, price: 15, label: '3 Days' },
    { days: 7, price: 30, label: '7 Days' },
    { days: 14, price: 50, label: '14 Days' },
    { days: 30, price: 80, label: '30 Days' }
];

const TimelineExtensionModal: React.FC<TimelineExtensionModalProps> = ({
    isOpen,
    onClose,
    orderId,
    currentDeadline,
    onSuccess
}) => {
    const [selectedDays, setSelectedDays] = useState<number>(7);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const selectedOption = EXTENSION_OPTIONS.find(opt => opt.days === selectedDays);
    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

    const calculateNewDeadline = (days: number) => {
        const deadline = new Date(currentDeadline);
        deadline.setDate(deadline.getDate() + days);
        return deadline;
    };

    const handleConfirm = () => {
        setShowConfirmation(true);
    };

    const handlePayment = async () => {
        if (!selectedOption) return;

        setIsProcessing(true);

        try {
            const response = await axios.post(
                `${BACKEND_URL}/timeline-extension/create-payment`,
                {
                    orderId,
                    extensionDays: selectedDays
                },
                { withCredentials: true }
            );

            const { client_secret, newDeadline } = response.data;

            if (!client_secret) {
                throw new Error('Failed to initialize payment');
            }

            const stripe = await stripePromise;
            if (!stripe) {
                throw new Error('Stripe failed to load');
            }

            const { error, paymentIntent } = await stripe.confirmCardPayment(client_secret);

            if (error) {
                toast.error(error.message || 'Payment failed');
                return;
            }

            if (paymentIntent && paymentIntent.status === 'succeeded') {
                toast.success(
                    `Timeline extended by ${selectedDays} days! New deadline: ${new Date(newDeadline).toLocaleDateString()}`,
                    { duration: 5000 }
                );

                if (onSuccess) {
                    onSuccess();
                }

                onClose();
            }
        } catch (error: any) {
            console.error('Timeline extension error:', error);
            toast.error(
                error.response?.data?.message || 'Failed to extend timeline. Please try again.'
            );
        } finally {
            setIsProcessing(false);
            setShowConfirmation(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Clock className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Extend Timeline</h2>
                            <p className="text-sm text-gray-500">Add more time to complete this order</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        disabled={isProcessing}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {!showConfirmation ? (
                    <div className="p-6 space-y-6">
                        {/* Current Deadline */}
                        <div className="bg-gray-50 p-4 rounded-xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Current Deadline</p>
                                    <p className="text-lg font-semibold text-gray-900">
                                        {new Date(currentDeadline).toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                                <Calendar className="w-8 h-8 text-gray-400" />
                            </div>
                        </div>

                        {/* Extension Options */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Select Extension Duration
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {EXTENSION_OPTIONS.map((option) => (
                                    <button
                                        key={option.days}
                                        onClick={() => setSelectedDays(option.days)}
                                        className={`p-4 rounded-xl border-2 transition-all ${selectedDays === option.days
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-blue-200'
                                            }`}
                                    >
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-gray-900">{option.label}</p>
                                            <p className="text-sm text-gray-500 mt-1">+{option.days} days</p>
                                            <div className="mt-2 flex items-center justify-center gap-1">
                                                <DollarSign className="w-4 h-4 text-orange-600" />
                                                <span className="text-lg font-semibold text-orange-600">
                                                    {option.price}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* New Deadline Preview */}
                        {selectedOption && (
                            <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-orange-700 font-medium">New Deadline</p>
                                        <p className="text-lg font-semibold text-orange-900">
                                            {calculateNewDeadline(selectedDays).toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                    <Calendar className="w-8 h-8 text-orange-600" />
                                </div>
                            </div>
                        )}

                        {/* Price Summary */}
                        {selectedOption && (
                            <div className="bg-gray-50 p-4 rounded-xl">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-gray-600">Extension Fee</span>
                                    <span className="font-semibold text-gray-900">${selectedOption.price}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm text-gray-500">
                                    <span>Processing Fee (included)</span>
                                    <span>Included</span>
                                </div>
                                <div className="border-t border-gray-200 mt-3 pt-3 flex items-center justify-between">
                                    <span className="font-semibold text-gray-900">Total</span>
                                    <span className="text-2xl font-bold text-blue-600">${selectedOption.price}</span>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                                disabled={isProcessing}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                                disabled={isProcessing}
                            >
                                Continue to Payment
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-6 space-y-6">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Clock className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Extension</h3>
                            <p className="text-gray-600">
                                You're about to extend the timeline by <strong>{selectedDays} days</strong>
                            </p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Extension Duration</span>
                                <span className="font-semibold">{selectedDays} days</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">New Deadline</span>
                                <span className="font-semibold">
                                    {calculateNewDeadline(selectedDays).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-gray-200">
                                <span className="font-semibold text-gray-900">Total Payment</span>
                                <span className="font-bold text-blue-600 text-xl">
                                    ${selectedOption?.price}
                                </span>
                            </div>
                        </div>

                        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                            <p className="text-sm text-yellow-800">
                                <strong>Note:</strong> This payment is non-refundable. The freelancer will receive 80% of the extension fee.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirmation(false)}
                                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                                disabled={isProcessing}
                            >
                                Back
                            </button>
                            <button
                                onClick={handlePayment}
                                className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                disabled={isProcessing}
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <DollarSign className="w-5 h-5" />
                                        Confirm & Pay ${selectedOption?.price}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TimelineExtensionModal;
