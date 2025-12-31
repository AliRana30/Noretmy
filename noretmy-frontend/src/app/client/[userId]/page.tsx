'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  User, 
  MapPin, 
  Calendar, 
  Star, 
  ShoppingBag, 
  CheckCircle,
  Clock,
  ArrowLeft,
  Mail,
  Building2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface ClientProfile {
  _id: string;
  fullName: string;
  username: string;
  email: string;
  profilePicture?: string;
  country?: string;
  createdAt: string;
  isVerified: boolean;
  isCompany?: boolean;
  totalOrdersPlaced?: number;
  totalSpent?: number;
}

const ClientProfilePage = ({ params }: { params: { userId: string } }) => {
  const { userId } = params;
  const router = useRouter();
  const [client, setClient] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const fetchClientProfile = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${BACKEND_URL}/users/client/${userId}`,
          { withCredentials: true }
        );
        setClient(response.data);
      } catch (err: any) {
        console.error('Error fetching client profile:', err);
        setError(err.response?.data?.message || 'Failed to load client profile');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchClientProfile();
    }
  }, [userId, BACKEND_URL]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">Loading client profile...</p>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Client Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'Unable to load client profile'}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const memberSince = new Date(client.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        {/* Main Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header Banner */}
          <div className="h-32 bg-gradient-to-r from-orange-400 to-orange-600" />
          
          {/* Profile Content */}
          <div className="px-8 pb-8">
            {/* Avatar */}
            <div className="relative -mt-16 mb-4">
              <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden bg-white shadow-lg">
                {client.profilePicture ? (
                  <Image
                    src={client.profilePicture}
                    alt={client.fullName}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-orange-100 flex items-center justify-center">
                    <User className="w-12 h-12 text-orange-500" />
                  </div>
                )}
              </div>
              {client.isVerified && (
                <div className="absolute bottom-2 right-2 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center border-2 border-white">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              )}
            </div>

            {/* Name and Username */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">{client.fullName}</h1>
                {client.isCompany && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    Business
                  </span>
                )}
              </div>
              <p className="text-gray-500">@{client.username}</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-full mx-auto mb-2">
                  <ShoppingBag className="w-5 h-5 text-orange-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{client.totalOrdersPlaced || 0}</p>
                <p className="text-sm text-gray-500">Orders Placed</p>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-full mx-auto mb-2">
                  <CheckCircle className="w-5 h-5 text-orange-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  ${(client.totalSpent || 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">Total Spent</p>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full mx-auto mb-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-sm font-bold text-gray-900">{memberSince}</p>
                <p className="text-sm text-gray-500">Member Since</p>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-full mx-auto mb-2">
                  <MapPin className="w-5 h-5 text-purple-500" />
                </div>
                <p className="text-sm font-bold text-gray-900">{client.country || 'Not specified'}</p>
                <p className="text-sm text-gray-500">Location</p>
              </div>
            </div>

            {/* Verification Status */}
            <div className={`p-4 rounded-xl ${client.isVerified ? 'bg-orange-50 border border-orange-200' : 'bg-yellow-50 border border-yellow-200'}`}>
              <div className="flex items-center gap-3">
                {client.isVerified ? (
                  <>
                    <CheckCircle className="w-6 h-6 text-orange-500" />
                    <div>
                      <p className="font-medium text-orange-800">Verified Client</p>
                      <p className="text-sm text-orange-600">This client's identity has been verified</p>
                    </div>
                  </>
                ) : (
                  <>
                    <Clock className="w-6 h-6 text-yellow-500" />
                    <div>
                      <p className="font-medium text-yellow-800">Unverified Client</p>
                      <p className="text-sm text-yellow-600">This client has not completed verification</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientProfilePage;
