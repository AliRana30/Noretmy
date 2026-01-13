import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DarkModeContext } from '../../context/darkModeContext.jsx';
import toast from 'react-hot-toast';
import { createAdminWithdrawalRequest } from '../../utils/adminApi';

const NewWithdrawalRequest = () => {
  const navigate = useNavigate();
  const { darkMode } = useContext(DarkModeContext);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    userEmail: '',
    userId: '',
    amount: '',
    paymentMethod: 'paypal',
    paypalEmail: '',
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    routingNumber: '',
    notes: ''
  });

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.userId && !form.userEmail) {
      toast.error('Enter userId or user email');
      return;
    }

    const amount = Number(form.amount);
    if (!amount || Number.isNaN(amount) || amount < 10) {
      toast.error('Minimum amount is $10');
      return;
    }

    const accountDetails = {};
    if (form.paymentMethod === 'paypal') {
      if (!form.paypalEmail) {
        toast.error('PayPal email is required');
        return;
      }
      accountDetails.paypalEmail = form.paypalEmail;
    }

    if (form.paymentMethod === 'bank_transfer') {
      if (!form.accountHolderName || !form.bankName || !form.accountNumber) {
        toast.error('Bank holder, bank name, and account number are required');
        return;
      }
      accountDetails.accountHolderName = form.accountHolderName;
      accountDetails.bankName = form.bankName;
      accountDetails.accountNumber = form.accountNumber;
      if (form.routingNumber) accountDetails.routingNumber = form.routingNumber;
    }

    setIsSubmitting(true);
    try {
      const res = await createAdminWithdrawalRequest({
        userId: form.userId || undefined,
        userEmail: form.userEmail || undefined,
        amount,
        paymentMethod: form.paymentMethod,
        accountDetails,
        notes: form.notes || undefined
      });

      const createdId = res?.data?._id || res?.data?.id;
      toast.success('Withdrawal request created');
      navigate(createdId ? `/admin/withdrawals/${createdId}` : '/admin/withdrawals');
    } catch (err) {
      toast.error(err?.message || 'Failed to create withdrawal request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="single">
      <div className="singleContainer">
        <div className="top">
          <div className="left">
            <h1 className={`title ${darkMode ? 'text-white' : ''}`}>Add New Withdrawal</h1>
            <p className={`subtitle ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Create a withdrawal request for a user (manual)
            </p>
          </div>
        </div>

        <div className="bottom">
          <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">User Email (optional)</label>
                <input
                  value={form.userEmail}
                  onChange={(e) => update('userEmail', e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium">User ID (optional)</label>
                <input
                  value={form.userId}
                  onChange={(e) => update('userId', e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200"
                  placeholder="Mongo ObjectId"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Amount</label>
                <input
                  value={form.amount}
                  onChange={(e) => update('amount', e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200"
                  placeholder="10"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Payment Method</label>
                <select
                  value={form.paymentMethod}
                  onChange={(e) => update('paymentMethod', e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200"
                >
                  <option value="paypal">PayPal</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {form.paymentMethod === 'paypal' && (
              <div>
                <label className="text-sm font-medium">PayPal Email</label>
                <input
                  value={form.paypalEmail}
                  onChange={(e) => update('paypalEmail', e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200"
                  placeholder="paypal@example.com"
                />
              </div>
            )}

            {form.paymentMethod === 'bank_transfer' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Account Holder Name</label>
                  <input
                    value={form.accountHolderName}
                    onChange={(e) => update('accountHolderName', e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Bank Name</label>
                  <input
                    value={form.bankName}
                    onChange={(e) => update('bankName', e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Account Number</label>
                  <input
                    value={form.accountNumber}
                    onChange={(e) => update('accountNumber', e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Routing Number (optional)</label>
                  <input
                    value={form.routingNumber}
                    onChange={(e) => update('routingNumber', e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Notes (optional)</label>
              <textarea
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200"
                rows={3}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Withdrawal'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewWithdrawalRequest;
