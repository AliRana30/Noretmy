'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PayoutAccountsComponent from '@/components/shared/PayoutAccountDetails';
import { toast } from 'react-hot-toast';

interface PayoutAccount {
  id: string;
  withdrawalMethod: 'stripe' | 'paypal';
  email: string;
  onboardingStatus: string;
  dateAdded?: string;
}

interface PayoutAccountData {
  withdrawalMethod: 'stripe' | 'paypal';
  email: string;
}

interface OnboardingData {
  link: string;
  message: string;
}

const WithdrawalPage = () => {
  const [balance, setBalance] = useState(0);
  const [withdrawalMethod, setWithdrawalMethod] = useState('stripe');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [recentWithdrawals, setRecentWithdrawals] = useState([]);
  const [account, setAccount] = useState<PayoutAccount | null>(null);
  const [accountAddSuccess, setAccountAddSuccess] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

  const apiBase = (BACKEND_URL || '').replace(/\/$/, '');
  const apiRoot = apiBase.endsWith('/api') ? apiBase : `${apiBase}/api`;

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        if (!apiBase) {
          const msg = 'API URL is not configured. Please set NEXT_PUBLIC_API_URL.';
          setError(msg);
          toast.error(msg);
          setLoading(false);
          return;
        }
        setLoading(true);
        const response = await axios.get(
          `${apiRoot}/withdraw/request/user`,
          {
            withCredentials: true,
          },
        );
        setRecentWithdrawals(response.data.withdrawRequests); // Directly setting the API response
        setBalance(response.data.accountDetails.availableBalance)
        setAccount(response.data.accountDetails)
        setWithdrawalMethod(response.data.accountDetails.withdrawalMethod)
        setEmail(response.data.accountDetails.email)

        setLoading(false);
      } catch (err) {
        toast.error('Failed to fetch your balance. Please try again later.');
        setLoading(false);
      }
    };

    fetchBalance();
  }, [apiBase, apiRoot]);

  const handleWithdrawalMethodChange = (e: any) => {
    setWithdrawalMethod(e.target.value);
  };

  const handleAmountChange = (e: any) => {
    setWithdrawalAmount(e.target.value);
  };

  const handleMaxAmount = () => {
    setWithdrawalAmount(balance.toString());
  };

  const handleEmailChange = (e: any) => {
    setEmail(e.target.value);
  };

  const handleAddAccount = async (accountData: PayoutAccountData): Promise<void> => {

    try {
      const response = await axios.post(`${apiRoot}/withdraw/account`, accountData, {
        withCredentials: true
      });

      if (response.data?.freelancer) {
        setAccount({
          id: response.data.freelancer._id,
          withdrawalMethod: response.data.freelancer.withdrawalMethod,
          email: response.data.freelancer.email,
          onboardingStatus: response.data.freelancer.onboardingStatus,
        });
        setOnboardingData(null);
        toast.success(response.data?.message || 'Your account updated successfully!');
      } else {
        setOnboardingData(response.data);
        toast(response.data?.message || 'Please complete onboarding.', {
          icon: 'ℹ️',
          duration: 4000,
        });
      }
    } catch (error: any) {
      console.error('Error adding account:', error);
      toast.error(error?.response?.data?.message || 'Failed to update payout account.');
      throw error;
    }
  };

  const handleEditAccount = async (accountData: PayoutAccount): Promise<void> => {
    try {
      const response = await axios.post(
        `${apiRoot}/withdraw/account`,
        {
          withdrawalMethod: accountData.withdrawalMethod,
          email: accountData.email,
        },
        { withCredentials: true },
      );
      if (response.data?.freelancer) {
        setAccount({
          id: response.data.freelancer._id,
          withdrawalMethod: response.data.freelancer.withdrawalMethod,
          email: response.data.freelancer.email,
          onboardingStatus: response.data.freelancer.onboardingStatus,
        });
        setOnboardingData(null);
        toast.success(response.data?.message || 'Your account updated successfully!');
      } else {
        setOnboardingData(response.data);
        toast(response.data?.message || 'Please complete onboarding.', {
          icon: 'ℹ️',
          duration: 4000,
        });
      }
    } catch (error: any) {
      console.error('Error updating account:', error);
      toast.error(error?.response?.data?.message || 'Failed to update payout account.');
      throw error;
    }
  };

  const handleDeleteAccount = async (accountId: string): Promise<void> => {
    try {
      const response = await axios.delete(`/api/payout-account/${accountId}`);
      setAccount(null);
    } catch (error: any) {
      console.error('Error deleting account:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError('');

    const amount = parseFloat(withdrawalAmount);

    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }

    if (amount > balance) {
      toast.error('Withdrawal amount cannot exceed your available balance.');
      return;
    }

    if (amount < 20) {
      toast.error('Minimum withdrawal amount is $20.');
      return;
    }

    try {
      setProcessing(true);
      const response = await axios.post(
        `${apiRoot}/withdraw`,
        {
          amount

        },
        { withCredentials: true },
      );

      toast.success(
        'Withdrawal request submitted successfully! It will be processed within 1-3 business days.',
      );
      setWithdrawalAmount('');


      const newWithdrawal = {
        id: `w${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        amount: amount,
        method: withdrawalMethod,
        status: 'pending',
      };
      setRecentWithdrawals([newWithdrawal, ...recentWithdrawals]);

      setProcessing(false);
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ||
        'Failed to process withdrawal. Please try again later.',
      );
      setProcessing(false);
    }
  };

  type StatusType = 'completed' | 'processing' | 'pending' | 'failed';

  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      completed: 'bg-orange-100 text-orange-800 border-orange-300',
      processing: 'bg-blue-100 text-blue-800 border-blue-300',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      failed: 'bg-red-100 text-red-800 border-red-300',
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full border ${statusStyles[status]}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Column - Balance and Form */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">
              Withdraw Funds
            </h1>

            {/* Balance Card */}
            <div className="bg-white rounded-2xl p-6 mb-8 shadow-lg border border-gray-100">
              <div>
                <h2 className="text-lg font-medium mb-2 text-gray-600">
                  Available Balance
                </h2>
                {loading ? (
                  <div className="animate-pulse h-12 bg-gray-200 rounded w-1/3 mb-2"></div>
                ) : (
                  <p className="text-5xl font-bold text-gray-800 mb-2">
                    ${balance?.toFixed(2)}
                  </p>
                )}
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    Minimum withdrawal: $20.00
                  </p>
                </div>
              </div>
            </div>

            {/* Error and Success Messages */}
            {error && (
              <div className="bg-white border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg shadow-sm flex items-start">
                <svg
                  className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <p>{error}</p>
              </div>
            )}

            {/* Withdrawal Form */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h2 className="text-xl font-semibold mb-6 text-gray-800">
                Request Withdrawal
              </h2>

              <form onSubmit={handleSubmit}>
                {/* Withdrawal Method */}
                {/* <div className="mb-6">
                    <label className="block text-gray-700 mb-3 font-medium">
                      Payment Method
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div
                        className={`flex items-center justify-center border rounded-xl p-4 cursor-pointer transition duration-200 ${withdrawalMethod === 'stripe'
                            ? 'border-orange-500 bg-orange-50 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300'
                          }`}
                        onClick={() => setWithdrawalMethod('stripe')}
                      >
                        <input
                          type="radio"
                          name="withdrawalMethod"
                          value="stripe"
                          checked={withdrawalMethod === 'stripe'}
                          onChange={handleWithdrawalMethodChange}
                          className="mr-3 h-4 w-4 text-orange-500 focus:ring-orange-500 cursor-pointer"
                        />
                        <div className="flex items-center">
                          <span className="font-medium text-gray-800">
                            Stripe
                          </span>
                        </div>
                      </div>

                      <div
                        className={`flex items-center justify-center border rounded-xl p-4 cursor-pointer transition duration-200 ${withdrawalMethod === 'paypal'
                            ? 'border-orange-500 bg-orange-50 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300'
                          }`}
                        onClick={() => setWithdrawalMethod('paypal')}
                      >
                        <input
                          type="radio"
                          name="withdrawalMethod"
                          value="paypal"
                          checked={withdrawalMethod === 'paypal'}
                          onChange={handleWithdrawalMethodChange}
                          className="mr-3 h-4 w-4 text-orange-500 focus:ring-orange-500 cursor-pointer"
                        />
                        <div className="flex items-center">
                          <span className="font-medium text-gray-800">
                            PayPal
                          </span>
                        </div>
                      </div>
                    </div>
                  </div> */}

                {/* Amount Input */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-3">
                    <label
                      htmlFor="amount"
                      className="block text-gray-700 font-medium"
                    >
                      Amount to Withdraw
                    </label>
                    <button
                      type="button"
                      onClick={handleMaxAmount}
                      className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                      disabled={balance < 20 || loading}
                    >
                      Max Amount
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                      <span className="text-gray-500 text-lg">$</span>
                    </div>
                    <input
                      type="number"
                      id="amount"
                      min="20"
                      max={balance}
                      step="0.01"
                      value={withdrawalAmount}
                      onChange={handleAmountChange}
                      className="pl-10 w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 text-gray-800 text-lg transition duration-200"
                      placeholder="0.00"
                      disabled={balance < 20 || loading}
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Available: ${balance?.toFixed(2)}
                  </p>

                  {/* <label
                    htmlFor='email'
                    className="block text-gray-700 font-medium mb-3 mt-3">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={handleEmailChange}
                      className="pl-10 w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 text-gray-800 text-lg transition duration-200"
                      required
                    /> */}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={processing || balance < 20 || loading}
                  className={`w-full py-4 px-6 rounded-xl text-white font-medium transition duration-200 text-lg ${balance >= 20 && !processing && !loading
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
                    : 'bg-gray-300 cursor-not-allowed'
                    }`}
                >
                  {processing ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    'Withdraw Funds'
                  )}
                </button>

                {balance < 20 && !loading && (
                  <div className="mt-4 bg-gray-100 p-4 rounded-lg border border-gray-200 text-center">
                    <p className="text-gray-600">
                      You need a minimum balance of{' '}
                      <span className="font-bold">$20</span> to request a
                      withdrawal.
                    </p>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Right Column - Recent Activity */}
          <div className="md:w-96">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 sticky top-6">
              <PayoutAccountsComponent
                account={account}
                loading={loading}
                onAddAccount={handleAddAccount}
                onEditAccount={handleEditAccount}
                onDeleteAccount={handleDeleteAccount}
                onboardingData={onboardingData}
              />

              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                Recent Withdrawals
              </h2>

              {recentWithdrawals.length > 0 ? (
                <div className="space-y-4">
                  {recentWithdrawals.map((withdrawal) => (
                    <div
                      key={withdrawal._id}
                      className="border-b border-gray-100 pb-4 last:border-0"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-medium text-gray-800">
                          ${withdrawal?.amount?.toFixed(2)}
                        </p>
                        {getStatusBadge(withdrawal.status)}
                      </div>
                      <div className="flex justify-between text-sm">
                        <p className="text-gray-500">
                          {new Date(withdrawal.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>                        <p className="text-gray-500 capitalize">
                          {withdrawal.withdrawalMethod}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500">No recent withdrawals</p>
                </div>
              )}

              <div className="mt-6 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg border border-gray-100">
                <h3 className="font-medium text-gray-700 mb-2">
                  Processing Time
                </h3>
                <p className="mb-2">
                  Withdrawal requests are typically processed within 3-5
                  business days.
                </p>
                <p>
                  For any issues, contact our support at{' '}
                  <a
                    href="mailto:info@noretmy.com"
                    className="text-orange-600 hover:underline"
                  >
                    info@noretmy.com
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WithdrawalPage;
