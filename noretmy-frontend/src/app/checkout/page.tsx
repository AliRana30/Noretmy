'use client';

import PaymentPage from '@/components/shared/checkout';
import { StoreProvider } from '@/store/StoreProvider';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Suspense } from "react";
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import axios from 'axios';

const CheckoutContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const user = useSelector((state: any) => state?.auth?.user);
  const isLoggedIn = !!user;

  const [title, setTitle] = useState<string | null>(null);
  const [price, setPrice] = useState<string | null>(null);
  const [deliveryTime, setDeliveryTime] = useState<string | null>(null);
  const [gigId, setGigId] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentType, setPaymentType] = useState<string | null>(null);
  const [promotionalPlan, setPromotionalPlan] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check authentication
    if (!isLoggedIn) {
      toast.error('Please sign in to complete your purchase', {
        position: 'top-center',
        autoClose: 3000,
      });
      router.push('/login');
      return;
    }
    setIsChecking(false);
  }, [isLoggedIn, router]);

  // Check for active promotion if this is a promotional purchase
  useEffect(() => {
    const checkActivePromotion = async () => {
      const type = searchParams.get('payment_type');
      if (type === 'monthly_promotional' && isLoggedIn) {
        try {
          const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;
          const response = await axios.get(`${BACKEND_URL}/subscription/user/active`, {
            withCredentials: true
          });

          if (response.data?.activePromotions?.length > 0) {
            toast.error('You already have an active promotion. Please wait for it to expire before purchasing a new one.', {
              position: 'top-center',
              autoClose: 5000,
            });
            router.push('/promote-gigs');
            return;
          }
        } catch (error) {
          console.error('Error checking active promotion:', error);
        }
      }
    };

    if (!isChecking && isLoggedIn) {
      checkActivePromotion();
    }
  }, [isChecking, isLoggedIn, searchParams, router]);

  useEffect(() => {
    setTitle(searchParams.get('title'));
    setPrice(searchParams.get('price'));
    setDeliveryTime(searchParams.get('deliveryTime'));
    setGigId(searchParams.get('gigId'));
    setPaymentType(searchParams.get('payment_type'));
    setPromotionalPlan(searchParams.get('promotionalPlan'));
    setOrderId(searchParams.get('orderId'));
  }, [searchParams]);

  // Show loading while checking auth
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <div className="text-gray-700 font-light tracking-wider">Verifying...</div>
        </div>
      </div>
    );
  }

  const plan = { title, price, deliveryTime };
  const orderData = { gigId, price, promotionalPlan, orderId };

  return (
    <main className="overflow-x-hidden">
      <PaymentPage
        plan={plan}
        paymentType={paymentType}
        orderData={orderData}
      />
    </main>
  );
};

const Checkout = () => {
  return (
    <StoreProvider>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="w-12 h-12 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }>
        <CheckoutContent />
      </Suspense>
    </StoreProvider>
  );
};

export default Checkout;
