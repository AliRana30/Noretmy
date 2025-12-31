"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2, ArrowRight, RefreshCw, MessageCircle } from 'lucide-react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function EmailVerificationPage() {
  const router = useRouter();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');
  const [isHovered, setIsHovered] = useState<string | null>(null);

  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const verifyEmail = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      const email = params.get('email');

      if (!token || !email) {
        setVerificationStatus('error');
        setMessage('Missing verification parameters. Please check your verification link.');
        return;
      }

      try {
        const response = await axios.get(`${BACKEND_URL}/auth/verify-email?token=${token}&email=${email}`);
        
        if (response.status === 200) {
          setVerificationStatus('success');
          setMessage('Your email has been successfully verified!');
        } else {
          setVerificationStatus('error');
          setMessage(response.data.message || 'Email verification failed. Please try again.');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setVerificationStatus('error');
        setMessage('An error occurred during verification. Please try again later.');
      }
    };

    verifyEmail();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-white p-4">
      <div className="w-full max-w-md bg-white p-6 md:p-8 rounded-xl shadow-lg border border-gray-100">
        {/* Top accent bar */}
        <div className="h-1 bg-gradient-to-r from-teal-400 to-blue-500 rounded-full -mt-6 md:-mt-8 mb-8"></div>
        
        {verificationStatus === 'loading' && (
          <div className="flex flex-col items-center gap-6 py-4">
            <div className="w-20 h-20 rounded-full bg-teal-50 flex items-center justify-center">
              <Loader2 className="h-10 w-10 text-teal-500 animate-spin" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Verifying Your Account</h1>
              <p className="text-gray-600 text-lg">Please wait while we verify your email address...</p>
            </div>
          </div>
        )}

        {verificationStatus === 'success' && (
          <div className="flex flex-col items-center gap-6 py-4">
            <div className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-orange-500" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Email Verified!</h1>
              <p className="text-gray-600 text-lg">{message}</p>
              <p className="text-gray-500 mt-2">You can now log in to your account and explore our services.</p>
            </div>
            <div className="mt-4 flex flex-col gap-3 w-full">
              <Link 
                href="/login" 
                className={`w-full py-3 px-6 flex items-center justify-center font-medium rounded-xl transition-all duration-300 text-white ${
                  isHovered === 'login' 
                    ? 'bg-gradient-to-r from-teal-600 to-blue-600 shadow-md transform scale-102' 
                    : 'bg-gradient-to-r from-teal-500 to-blue-500'
                }`}
                onMouseEnter={() => setIsHovered('login')}
                onMouseLeave={() => setIsHovered(null)}
              >
                Log in to your account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link 
                href="/" 
                className={`w-full py-3 px-6 flex items-center justify-center font-medium rounded-xl transition-all duration-300 ${
                  isHovered === 'home' 
                    ? 'bg-gray-100 text-gray-800' 
                    : 'bg-white text-gray-700 border border-gray-200'
                }`}
                onMouseEnter={() => setIsHovered('home')}
                onMouseLeave={() => setIsHovered(null)}
              >
                Return to homepage
              </Link>
            </div>
          </div>
        )}

        {verificationStatus === 'error' && (
          <div className="flex flex-col items-center gap-6 py-4">
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
              <XCircle className="h-10 w-10 text-red-500" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Verification Failed</h1>
              <p className="text-gray-600 text-lg">{message}</p>
            </div>
            <div className="mt-4 flex flex-col gap-3 w-full">
              <Link 
                href="/register" 
                className={`w-full py-3 px-6 flex items-center justify-center font-medium rounded-xl transition-all duration-300 text-white ${
                  isHovered === 'resend' 
                    ? 'bg-gradient-to-r from-teal-600 to-blue-600 shadow-md transform scale-102' 
                    : 'bg-gradient-to-r from-teal-500 to-blue-500'
                }`}
                onMouseEnter={() => setIsHovered('resend')}
                onMouseLeave={() => setIsHovered(null)}
              >
                <RefreshCw className="mr-2 h-5 w-5" />
                Resend verification email through Signup
              </Link>
              <Link 
                href="/contact-us" 
                className={`w-full py-3 px-6 flex items-center justify-center font-medium rounded-xl transition-all duration-300 ${
                  isHovered === 'support' 
                    ? 'bg-gray-100 text-gray-800' 
                    : 'bg-white text-gray-700 border border-gray-200'
                }`}
                onMouseEnter={() => setIsHovered('support')}
                onMouseLeave={() => setIsHovered(null)}
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Contact support
              </Link>
              <Link 
                href="/" 
                className={`text-center py-2 text-teal-500 hover:text-teal-600 font-medium transition-colors duration-200 flex items-center justify-center`}
              >
                Return to homepage
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
        
        {/* Bottom decorative element */}
        <div className="mt-8 flex justify-center">
          <div className="w-16 h-1 bg-gray-100 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}