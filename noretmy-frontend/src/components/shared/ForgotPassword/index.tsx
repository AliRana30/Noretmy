'use client';

import React, { useState } from 'react';
import {
  Mail,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import axios from 'axios';

const ForgotPasswordScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic email validation
    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    try {
      //   await new Promise(resolve => setTimeout(resolve, 1500));
      const response = await axios.post(
        `${BACKEND_URL}/auth/forget-password`,
        { email },
      );
      console.log(response);
      setIsSubmitted(true);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white text-2xl font-bold mb-3 shadow-md transform hover:scale-105 transition-transform duration-300">
            N
          </div>
          <h1 className="text-2xl font-semibold text-gray-800">Noretmy</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 transform transition-all duration-300 hover:shadow-2xl">
          {isSubmitted ? (
            /* Success state */
            <div className="p-10 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-100 text-orange-600 mb-6 shadow-inner">
                <CheckCircle size={40} className="animate-pulse" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-3">
                Check your email
              </h2>
              <p className="text-gray-600 mb-8 text-lg">
                We've sent a password reset link to{' '}
                <span className="font-medium text-gray-800">{email}</span>
              </p>
              <p className="text-sm text-gray-500 mb-8">
                Didn&apos;t receive the email? Check your spam folder or try
                again with a different email address.
              </p>
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="w-full py-4 px-6 bg-white border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-all shadow-sm hover:shadow"
                >
                  Try a different email
                </button>
                <button
                  onClick={() => (window.location.href = '/login')}
                  className="w-full py-3 px-6 rounded-xl font-medium text-blue-600 hover:text-blue-700 transition-colors flex items-center justify-center"
                >
                  <ArrowLeft size={16} className="mr-2" />
                  Back to login
                </button>
              </div>
            </div>
          ) : (
            /* Request form */
            <div>
              <div className="p-10 pb-6">
                <h2 className="text-3xl font-bold text-gray-800 mb-3">
                  Forgot password?
                </h2>
                <p className="text-gray-600 mb-8 text-lg">
                  No worries, we'll send you reset instructions.
                </p>

                <form onSubmit={handleSubmit}>
                  <div className="mb-6">
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Email address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail size={18} className="text-gray-400" />
                      </div>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@company.com"
                        className={`w-full pl-12 pr-4 py-4 rounded-xl border ${
                          error ? 'border-red-300 bg-red-50' : 'border-gray-200'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm text-lg`}
                        required
                      />
                    </div>
                    {error && (
                      <div className="mt-2 flex items-center text-sm text-red-600">
                        <AlertCircle size={14} className="mr-2" />
                        {error}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !email}
                    className={`w-full py-4 px-6 flex items-center justify-center rounded-xl font-medium text-white text-lg
                      ${
                        isSubmitting || !email
                          ? 'bg-blue-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 transform hover:translate-y-px'
                      } transition-all shadow-md`}
                  >
                    {isSubmitting ? (
                      <>
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
                        Sending...
                      </>
                    ) : (
                      <>
                        Reset password
                        <ArrowRight size={20} className="ml-2" />
                      </>
                    )}
                  </button>
                </form>
              </div>

              <div className="px-10 py-5 border-t border-gray-100 bg-gray-50">
                <button
                  onClick={() => (window.location.href = '/login')}
                  className="w-full flex items-center justify-center font-medium text-gray-600 hover:text-gray-900 transition-colors py-2"
                >
                  <ArrowLeft size={18} className="mr-2" />
                  Back to login
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer links */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Need help?{' '}
            <a href="#" className="text-blue-600 hover:underline font-medium">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordScreen;
