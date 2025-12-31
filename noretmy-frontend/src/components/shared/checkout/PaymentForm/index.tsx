// PaymentForm.tsx
import React, { useState, useEffect } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';
import { CreditCard, Lock, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

interface PriceBreakdown {
  basePrice: number;
  platformFee: number;
  platformFeeRate: number;
  vatRate: number;
  vatRatePercentage: number;
  vatAmount: number;
  totalPrice: number;
  currency: string;
  clientCountry: string | null;
}

const PaymentForm: React.FC<{ paymentType: string; orderData: any }> = ({
  paymentType,
  orderData = { price: 0 },
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingBreakdown, setIsLoadingBreakdown] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(null);
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

  const [fetchedPrice, setFetchedPrice] = useState<number | null>(null);
  const [isFetchingOrder, setIsFetchingOrder] = useState(false);

  // Fetch order price if only orderId is provided
  useEffect(() => {
    if (orderData?.orderId && !orderData?.price && !fetchedPrice) {
      setIsFetchingOrder(true);
      axios.get(`${BACKEND_URL}/orders/single/${orderData.orderId}`, { withCredentials: true })
        .then(res => {
          // The API returns nested structure: { orderDetails: { orderPrice } }
          const orderDetails = res.data?.orderDetails || res.data;
          const price = orderDetails?.orderPrice || orderDetails?.price || res.data?.price;
          if (price) {
            setFetchedPrice(price);
          } else {
            console.error("No price found in order response:", res.data);
            setError("Could not retrieve order price. Please try again.");
          }
        })
        .catch(err => {
          console.error("Error fetching order detail:", err);
          setError("Could not retrieve order details. Please try again.");
        })
        .finally(() => setIsFetchingOrder(false));
    }
  }, [orderData?.orderId, orderData?.price, BACKEND_URL, fetchedPrice]);

  // Parse price - could be string from URL or number
  const parsedPrice = React.useMemo(() => {
    const price = fetchedPrice || orderData?.price;
    if (typeof price === 'number') return price;
    if (typeof price === 'string') {
      const parsed = parseFloat(price);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }, [orderData?.price, fetchedPrice]);

  // Fetch price breakdown from backend on mount
  useEffect(() => {
    const fetchPriceBreakdown = async () => {
      // Skip VAT calculation if price is 0 or invalid
      if (!parsedPrice || parsedPrice <= 0) {
        setPriceBreakdown({
          basePrice: 0,
          platformFee: 0,
          platformFeeRate: 0.05,
          vatRate: 0,
          vatRatePercentage: 0,
          vatAmount: 0,
          totalPrice: 0,
          currency: 'USD',
          clientCountry: null
        });
        setIsLoadingBreakdown(false);
        return;
      }

      setIsLoadingBreakdown(true);
      try {
        // Fetch breakdown for all payment types if we have a valid price
        const response = await axios.post(
          `${BACKEND_URL}/vat/calculate`,
          { basePrice: parsedPrice },
          { withCredentials: true }
        );

        if (response.data.success) {
          const bd = response.data.breakdown;
          // Map backend keys to frontend state keys
          setPriceBreakdown({
            ...bd,
            basePrice: bd.baseAmount || bd.basePrice || parsedPrice,
            totalPrice: bd.totalAmount || bd.totalPrice,
            platformFee: bd.platformFee || 0
          });
        } else {
          throw new Error("No success response");
        }
      } catch (err: any) {
        console.log('Using local price breakdown (fallback/error)', err.message);
        const platformFee = parsedPrice * 0.05;
        setPriceBreakdown({
          basePrice: parsedPrice,
          platformFee: platformFee,
          platformFeeRate: 0.05,
          vatRate: 0,
          vatRatePercentage: 0,
          vatAmount: 0,
          totalPrice: parsedPrice + platformFee,
          currency: 'USD',
          clientCountry: null
        });
      } finally {
        setIsLoadingBreakdown(false);
      }
    };

    fetchPriceBreakdown();
  }, [parsedPrice, BACKEND_URL]);

  const getPaymentApiData = () => {
    const { gigId, orderId, promotionalPlan } = orderData || {};

    console.log('Payment Context:', { paymentType, orderData });

    const endpoints = {
      order_payment: {
        data: orderId ? { orderId } : { gigId, price: parsedPrice },
        url: orderId ? `${BACKEND_URL}/orders/confirm` : `${BACKEND_URL}/orders`,
      },
      monthly_promotional: {
        data: { promotionPlan: promotionalPlan },
        url: `${BACKEND_URL}/subscription/monthly`,
      },
      gig_promotion: {
        data: { gigId, promotionPlan: promotionalPlan },
        url: `${BACKEND_URL}/subscription/gig/monthly`,
      },
      custom_or_milestone: {
        data: { orderId },
        url: `${BACKEND_URL}/orders/confirm`,
      },
    };

    const endpoint = endpoints[paymentType as keyof typeof endpoints];
    if (!endpoint) throw new Error('Invalid payment type');
    return endpoint;
  };

  const fetchClientSecret = async (): Promise<{ clientSecret: string | null }> => {
    try {
      const { data, url } = getPaymentApiData();
      console.log('Payment API Request:', { url, data });

      const response = await axios.post(url, data, { withCredentials: true });
      const clientSecret = response.data.client_secret;

      if (!clientSecret) {
        setError('Payment initialization failed. Please try again.');
        return { clientSecret: null };
      }

      return { clientSecret };
    } catch (err: any) {
      console.error('Payment initialization error:', err);
      const msg = err.response?.data?.message || 'Failed to initialize payment. Please try again.';
      setError(msg);
      return { clientSecret: null };
    }
  };

  const handlePayment = async () => {
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError(null);

    try {
      const { clientSecret } = await fetchClientSecret();
      if (!clientSecret) {
        setIsProcessing(false);
        return;
      }

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      });

      if (result.error) {
        setError(result.error.message || 'Payment failed');
      } else {
        setPaymentSuccess(true);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) return '$0.00';
    return `$${amount.toFixed(2)}`;
  };

  return (
    <div className="max-w-lg mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      {paymentSuccess ? (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 max-w-md w-full mx-4 transform transition-all animate-fadeIn">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-5">
                <ShieldCheck className="h-10 w-10 text-orange-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Payment Successful!
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Your transaction has been processed successfully.
              </p>
              <div className="border-t border-gray-200 dark:border-gray-700 w-full pt-5 mt-2">
                <button
                  onClick={() => (window.location.href = paymentType === 'order_payment' ? '/orders' : '/promote-gigs')}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all"
                >
                  {paymentType === 'order_payment' ? 'View Your Orders' : 'View Your Promotions'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="bg-blue-600 p-6 text-white text-center">
            <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
              <Lock className="w-6 h-6" /> Secure Payment
            </h2>
            <p className="mt-2 text-blue-100 italic">Trusted by thousands of freelancers worldwide</p>
          </div>

          <div className="p-6 space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h3 className="text-md font-bold text-gray-800 mb-3 border-b pb-2">Order Summary</h3>
              {isLoadingBreakdown ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin mr-2" />
                  <span className="text-gray-500 text-sm font-medium">Calculating the best rate for you...</span>
                </div>
              ) : priceBreakdown ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Subtotal</span>
                    <span className="text-gray-900 font-semibold">{formatCurrency(priceBreakdown.basePrice)}</span>
                  </div>
                  {priceBreakdown.platformFee > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-medium">Platform Fee ({(priceBreakdown.platformFeeRate * 100).toFixed(0)}%)</span>
                      <span className="text-gray-900 font-semibold">{formatCurrency(priceBreakdown.platformFee)}</span>
                    </div>
                  )}
                  {priceBreakdown.vatAmount > 0 && (
                    <div className="flex justify-between items-center text-orange-600 font-medium">
                      <span>VAT ({priceBreakdown.vatRatePercentage}%)</span>
                      <span>{formatCurrency(priceBreakdown.vatAmount)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 my-2 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">Total Price</span>
                      <span className="text-2xl font-black text-blue-600">
                        {formatCurrency(priceBreakdown.totalPrice)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center py-2">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-2xl font-black">${parsedPrice}</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-bold text-gray-700 uppercase tracking-tight">Credit or Debit Card</label>
              <div className="p-4 border-2 border-gray-100 rounded-xl bg-gray-50 focus-within:border-blue-500 transition-all">
                <CardElement options={CARD_ELEMENT_OPTIONS} />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-sm animate-shake">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <AlertCircle className="w-4 h-4" /> Oops! Payment Error
                </div>
                {error}
              </div>
            )}

            <button
              onClick={handlePayment}
              disabled={isProcessing || isLoadingBreakdown}
              className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all active:scale-95 ${isProcessing || isLoadingBreakdown
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-200'
                }`}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" /> Verifying...
                </div>
              ) : (
                `SECURELY PAY ${formatCurrency(priceBreakdown?.totalPrice || parsedPrice)}`
              )}
            </button>

            <div className="flex flex-wrap justify-center items-center gap-6 py-4 opacity-50 grayscale hover:grayscale-0 transition-all">
              <ShieldCheck className="h-8 w-8" />
              <Lock className="h-8 w-8" />
              <ShieldCheck className="h-8 w-8" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentForm;
