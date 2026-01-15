'use client';
import React, { useEffect, useState } from 'react';

interface PayoutAccount {
  id: string;
  withdrawalMethod?: 'stripe' | 'paypal';
  email?: string;
  onboardingStatus? : string;
  dateAdded: string;
}

interface PayoutAccountData {
  withdrawalMethod: 'stripe' | 'paypal';
  email: string;
}

interface OnboardingData {
  link  : string;
  message:  string;
}

interface PayoutAccountsComponentProps {
  account: PayoutAccount | null;
  loading: boolean;
  onAddAccount: (accountData: PayoutAccountData) => Promise<void>;
  onEditAccount: (accountData: PayoutAccount) => Promise<void>;
  onDeleteAccount: (accountId: string) => Promise<void>;
  onboardingData : OnboardingData | null;
}

const PayoutAccountsComponent: React.FC<PayoutAccountsComponentProps> = ({ 
  account, 
  loading, 
  onAddAccount, 
  onEditAccount, 
  onDeleteAccount ,
  onboardingData
}) => {
  const [showForm, setShowForm] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [withdrawalMethod, setwithdrawalMethod] = useState<'stripe' | 'paypal'>(() => {
    const existing = account?.withdrawalMethod;
    return existing === 'stripe' || existing === 'paypal' ? existing : 'paypal';
  });
  const [email, setEmail] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [processing, setProcessing] = useState<boolean>(false);

  useEffect(() => {
    const existing = account?.withdrawalMethod;
    if (existing === 'stripe' || existing === 'paypal') {
      setwithdrawalMethod(existing);
    }
  }, [account?.withdrawalMethod]);

  const handlewithdrawalMethodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setwithdrawalMethod(e.target.value as 'stripe' | 'paypal');
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      setProcessing(true);
      
      const accountData: PayoutAccountData = {
        withdrawalMethod,
        email
      };
      
      if (isEditing && account) {
        await onEditAccount({ ...accountData, id: account.id, dateAdded: account.dateAdded });
        setSuccess('Payout account updated successfully!');
      } 
      else {

        await onAddAccount(accountData);
        if(account){
          setSuccess('Payout account added successfully!');
        }
        
      }
      
      setEmail('');
      setShowForm(false);
      setIsEditing(false);
      setProcessing(false);
    } catch (err) {
      setError(isEditing ? 'Failed to update payout account. Please try again later.' : 'Failed to add payout account. Please try again later.');
      setProcessing(false);
    }
  };

  const handleEdit = () => {
    if (account) {
      const existing = account.withdrawalMethod;
      setwithdrawalMethod(existing === 'stripe' || existing === 'paypal' ? existing : 'paypal');
      setEmail(account.email || '');
      setIsEditing(true);
      setShowForm(true);
    }
  };

  const handleDelete = async () => {
    try {
      if (!account) return;
      
      setProcessing(true);
      await onDeleteAccount(account.id);
      setSuccess('Payout account removed successfully.');
      setProcessing(false);
    } catch (err) {
      setError('Failed to remove payout account. Please try again later.');
      setProcessing(false);
    }
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          Payout Account
        </h2>
        {!showForm && !account && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg shadow-sm hover:shadow transition duration-200 transform hover:-translate-y-0.5 text-sm font-medium"
          >
            Add Account
          </button>
        )}
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

      {success && (
        <div className="bg-white border-l-4 border-orange-500 text-orange-700 p-4 mb-6 rounded-lg shadow-sm flex items-start">
          <svg
            className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <p>{success}</p>
        </div>
      )}

{onboardingData && (
  <div className="bg-white border-l-4 border-orange-500 text-orange-700 p-4 mb-6 rounded-lg shadow-sm flex items-start">
    <svg
      className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
    <div>
      <p className="mb-1">{onboardingData.message}</p>
      {onboardingData.link && (
        <a
          href={onboardingData.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-orange-600 hover:text-orange-700 font-medium underline"
        >
          View Details
        </a>
      )}
    </div>
  </div>
)}

      {/* Add/Edit Account Form */}
      {showForm && (
        <div className="bg-gray-50 rounded-xl p-5 mb-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-gray-800">{isEditing ? 'Edit Payout Account' : 'Add Payout Account'}</h3>
            <button 
              onClick={() => {
                setShowForm(false);
                setIsEditing(false);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            {/* Account Type */}
            <div className="mb-4">
              <label className="block text-gray-700 mb-3 font-medium">
                Account Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  className={`flex items-center justify-center border rounded-xl p-4 cursor-pointer transition duration-200 ${
                    withdrawalMethod === 'stripe'
                      ? 'border-orange-500 bg-orange-50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setwithdrawalMethod('stripe')}
                >
                  <input
                    type="radio"
                    name="withdrawalMethod"
                    value="stripe"
                    checked={withdrawalMethod === 'stripe'}
                    onChange={handlewithdrawalMethodChange}
                    className="mr-3 h-4 w-4 text-orange-500 focus:ring-orange-500 cursor-pointer"
                  />
                  <div className="flex items-center">
                    <span className="font-medium text-gray-800">
                      Stripe
                    </span>
                  </div>
                </div>

                <div
                  className={`flex items-center justify-center border rounded-xl p-4 cursor-pointer transition duration-200 ${
                    withdrawalMethod === 'paypal'
                      ? 'border-orange-500 bg-orange-50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setwithdrawalMethod('paypal')}
                >
                  <input
                    type="radio"
                    name="withdrawalMethod"
                    value="paypal"
                    checked={withdrawalMethod === 'paypal'}
                    onChange={handlewithdrawalMethodChange}
                    className="mr-3 h-4 w-4 text-orange-500 focus:ring-orange-500 cursor-pointer"
                  />
                  <div className="flex items-center">
                    <span className="font-medium text-gray-800">
                      PayPal
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Email Input */}
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-gray-700 font-medium mb-2"
              >
                {withdrawalMethod === 'stripe' ? 'Stripe Account Email' : 'PayPal Email'}
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="Enter your email address"
                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-gray-800 transition duration-200"
                required
              />
              <p className="mt-2 text-xs text-gray-500">
                We'll use this email to process your payouts
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                type="submit"
                disabled={processing}
                className={`flex-1 py-3 px-4 rounded-xl text-white font-medium transition duration-200 ${
                  !processing
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
                  isEditing ? 'Update Account' : 'Add Account'
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setIsEditing(false);
                }}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Account Display */}
      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-14 bg-gray-200 rounded"></div>
        </div>
      ) : account ? (
        <div className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
          <div className="flex flex-col">
            <div>
              <div className="flex items-center flex-wrap gap-2 mb-1">
                <div className="bg-orange-100 text-orange-800 capitalize font-medium text-xs px-2 py-1 rounded-full">
                  {account.withdrawalMethod}
                </div>
                <p className="font-medium text-gray-800">{account.email}</p>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {/* Added on {new Date(account.dateAdded).toLocaleDateString()} */}
              </p>
            </div>
            <div className="flex mt-3">
              <button
                onClick={handleEdit}
                className="text-gray-400 hover:text-blue-500 p-1 mr-2"
                title="Edit account"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
              </button>
              {/* <button
                onClick={handleDelete}
                className="text-gray-400 hover:text-red-500 p-1"
                title="Remove account"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button> */}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 border border-dashed border-gray-200 rounded-lg">
          <p className="text-gray-500 mb-2">No payout account added yet</p>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="text-orange-600 font-medium hover:text-orange-700"
            >
              Add your first account
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PayoutAccountsComponent;