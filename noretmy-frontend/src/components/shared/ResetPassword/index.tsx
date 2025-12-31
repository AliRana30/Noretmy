'use client';

import React, { useState, useEffect, Suspense } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';

const ResetPasswordScreen: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

 const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(searchParams.get('token'));
  }, [searchParams]);

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<number>(0);
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;


  useEffect(() => {
    if (!token) {
      setError(
        'Invalid or missing reset token. Please request a new password reset link.',
      );
    }
  }, [token]);

  const checkPasswordStrength = (password: string) => {
    let strength = 0;

    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    return strength;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'password') {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const validateForm = () => {
    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      return false;
    }

    // Check password length
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    // Check password strength
    if (passwordStrength < 3) {
      setError(
        'Password is too weak. Include uppercase, lowercase, numbers, and special characters',
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setIsSubmitting(true);

    console.log(token);

    try {
      // Replace with your actual API endpoint
      const response = await axios.post(
        `${BACKEND_URL}/auth/reset-password`,
        {
          token,
          password: formData.password,
        },
      );

      console.log(response);
      setIsSubmitted(true);
    } catch (err) {
      setError(
        'Something went wrong. Please try again or request a new reset link.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const strengthColors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-blue-500',
    'bg-orange-500',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4 font-sans">
      <Suspense >
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
                Password Reset Successful
              </h2>
              <p className="text-gray-600 mb-8 text-lg">
                Your password has been updated successfully. You can now log in
                with your new password.
              </p>
              <button
                onClick={() => router.push('/login')}
                className="w-full py-4 px-6 bg-blue-600 rounded-xl font-medium text-white hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
              >
                Go to Login
                <ArrowRight size={18} className="ml-2 inline" />
              </button>
            </div>
          ) : (
            /* Reset form */
            <div>
              <div className="p-10 pb-6">
                <h2 className="text-3xl font-bold text-gray-800 mb-3">
                  Reset Password
                </h2>
                <p className="text-gray-600 mb-8 text-lg">
                  Create a new strong password for your account
                </p>

                <form onSubmit={handleSubmit}>
                  {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start">
                      <AlertCircle
                        size={20}
                        className="text-red-500 mt-0.5 mr-3 flex-shrink-0"
                      />
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  )}

                  {/* Password field */}
                  <div className="mb-6">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock size={18} className="text-gray-400" />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter new password"
                        className="w-full pl-12 pr-12 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm text-lg"
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-4 flex items-center"
                        onClick={togglePasswordVisibility}
                      >
                        {showPassword ? (
                          <EyeOff
                            size={18}
                            className="text-gray-400 hover:text-gray-600"
                          />
                        ) : (
                          <Eye
                            size={18}
                            className="text-gray-400 hover:text-gray-600"
                          />
                        )}
                      </button>
                    </div>

                    {/* Password strength meter */}
                    {formData.password && (
                      <div className="mt-3">
                        <div className="text-xs font-medium text-gray-600 mb-1">
                          Password strength:{' '}
                          <span
                            className={
                              passwordStrength === 0
                                ? 'text-red-500'
                                : passwordStrength === 1
                                  ? 'text-red-500'
                                  : passwordStrength === 2
                                    ? 'text-orange-500'
                                    : passwordStrength === 3
                                      ? 'text-yellow-500'
                                      : passwordStrength === 4
                                        ? 'text-blue-500'
                                        : 'text-orange-500'
                            }
                          >
                            {passwordStrength === 0
                              ? 'Very Weak'
                              : passwordStrength === 1
                                ? 'Weak'
                                : passwordStrength === 2
                                  ? 'Moderate'
                                  : passwordStrength === 3
                                    ? 'Strong'
                                    : 'Very Strong'}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-2 ${strengthColors[passwordStrength - 1] || 'bg-transparent'}`}
                            style={{ width: `${passwordStrength * 20}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password field */}
                  <div className="mb-8">
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock size={18} className="text-gray-400" />
                      </div>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm your password"
                        className={`w-full pl-12 pr-12 py-4 rounded-xl border ${
                          formData.password &&
                          formData.confirmPassword &&
                          formData.password !== formData.confirmPassword
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-200'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm text-lg`}
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-4 flex items-center"
                        onClick={toggleConfirmPasswordVisibility}
                      >
                        {showConfirmPassword ? (
                          <EyeOff
                            size={18}
                            className="text-gray-400 hover:text-gray-600"
                          />
                        ) : (
                          <Eye
                            size={18}
                            className="text-gray-400 hover:text-gray-600"
                          />
                        )}
                      </button>
                    </div>
                    {formData.password &&
                      formData.confirmPassword &&
                      formData.password !== formData.confirmPassword && (
                        <div className="mt-2 flex items-center text-sm text-red-600">
                          <AlertCircle size={14} className="mr-2" />
                          Passwords don&apos;t match
                        </div>
                      )}
                  </div>

                  <button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      !formData.password ||
                      !formData.confirmPassword ||
                      !token
                    }
                    className={`w-full py-4 px-6 flex items-center justify-center rounded-xl font-medium text-white text-lg
                      ${
                        isSubmitting ||
                        !formData.password ||
                        !formData.confirmPassword ||
                        !token
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
                        Updating...
                      </>
                    ) : (
                      <>
                        Reset Password
                        <ArrowRight size={20} className="ml-2" />
                      </>
                    )}
                  </button>
                </form>
              </div>

              <div className="px-10 py-5 border-t border-gray-100 bg-gray-50">
                <button
                  onClick={() => router.push('/login')}
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
      </Suspense>
    </div>
  );
};

export default ResetPasswordScreen;
