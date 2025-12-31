'use client';

import React, { useState } from 'react';
import { CreditCard, Shield, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';
import { toast } from 'react-toastify';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

interface PaymentAfterCompletionProps {
    orderId: string;
    amount: number;
    gigTitle: string;
    sellerName: string;
    onPaymentComplete?: () => void;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

const PaymentFormContent: React.FC<{
    orderId: string;
    clientSecret: string;
    amount: number;
    onPaymentComplete?: () => void;
}> = ({ orderId, clientSecret, amount, onPaymentComplete }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentError, setPaymentError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsProcessing(true);
        setPaymentError(null);

        try {
            const { error, paymentIntent } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}/orders/${orderId}?payment=success`,
                },
                redirect: 'if_required',
            });

            if (error) {
                setPaymentError(error.message || 'Payment failed');
                toast.error(error.message || 'Payment failed');
            } else if (paymentIntent && paymentIntent.status === 'succeeded') {
                toast.success('Payment successful! Thank you for your order.');
                onPaymentComplete?.();
            }
        } catch (err: any) {
            setPaymentError(err.message || 'An error occurred');
            toast.error('An error occurred during payment');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <PaymentElement className="mb-4" />

            {paymentError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm">{paymentError}</span>
                </div>
            )}

            <button
                type="submit"
                disabled={isProcessing || !stripe}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
                {isProcessing ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                    <>
                        <Lock className="w-5 h-5" />
                        Pay ${(amount / 100).toFixed(2)}
                    </>
                )}
            </button>
        </form>
    );
};

const PaymentAfterCompletion: React.FC<PaymentAfterCompletionProps> = ({
    orderId,
    amount,
    gigTitle,
    sellerName,
    onPaymentComplete,
}) => {
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [calculatedAmount, setCalculatedAmount] = useState<number>(0);

    const initiatePayment = async () => {
        setIsLoading(true);
        try {
            const response = await axios.post(
                `${BACKEND_URL}/orders/complete-payment`,
                { orderId },
                { withCredentials: true }
            );

            setClientSecret(response.data.client_secret);
            setCalculatedAmount(response.data.amount);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to initiate payment');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
                <div className="flex items-center gap-3">
                    <CreditCard className="w-8 h-8" />
                    <div>
                        <h3 className="text-xl font-bold">Complete Payment</h3>
                        <p className="text-orange-100 text-sm">
                            Project completed successfully - proceed to payment
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-6">
                {/* Order Summary */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Order Summary</h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Service</span>
                            <span className="text-gray-900 font-medium">{gigTitle}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Freelancer</span>
                            <span className="text-gray-900 font-medium">{sellerName}</span>
                        </div>
                        <hr className="my-2" />
                        <div className="flex justify-between text-lg">
                            <span className="font-semibold text-gray-900">Total</span>
                            <span className="font-bold text-orange-600">
                                ${(calculatedAmount || amount).toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Security Badges */}
                <div className="flex items-center justify-center gap-4 mb-6">
                    <div className="flex items-center gap-1 text-gray-500 text-xs">
                        <Shield className="w-4 h-4" />
                        <span>Secure Payment</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500 text-xs">
                        <Lock className="w-4 h-4" />
                        <span>SSL Encrypted</span>
                    </div>
                </div>

                {!clientSecret ? (
                    <button
                        onClick={initiatePayment}
                        disabled={isLoading}
                        className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <CreditCard className="w-5 h-5" />
                                Proceed to Payment
                            </>
                        )}
                    </button>
                ) : (
                    <Elements
                        stripe={stripePromise}
                        options={{
                            clientSecret,
                            appearance: {
                                theme: 'stripe',
                                variables: {
                                    colorPrimary: '#22c55e',
                                    borderRadius: '12px',
                                },
                            },
                        }}
                    >
                        <PaymentFormContent
                            orderId={orderId}
                            clientSecret={clientSecret}
                            amount={calculatedAmount}
                            onPaymentComplete={onPaymentComplete}
                        />
                    </Elements>
                )}

                {/* Satisfaction Guarantee */}
                <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                    <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                        <div>
                            <p className="font-medium text-blue-700">Satisfaction Guaranteed</p>
                            <p className="text-sm text-blue-600">
                                Your payment is held securely until you confirm satisfaction with the delivered work.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentAfterCompletion;
