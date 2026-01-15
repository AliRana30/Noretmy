'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import SingleOrderPage from '@/components/shared/Order-Details-Buyer/Single';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SingleOrderSkeleton from '@/skelton/SingleOrder';
import MilestoneOrderDisplay from '@/components/shared/SingleOrder/MilestonesDisplay';
import { useTranslations } from '@/hooks/useTranslations';

interface OrderData {
  orderId: string;
  orderStatus: string;
  sellerName: string;
  sellerUsername: string;
  sellerImage: string;
  orderDetails: OrderDetails;
  userDetails: UserDetails;
  reviewDetails: Object;
  milestones: [];
}

interface UserDetails {
  userName: string;
  userUsername: string;
  userImage: string;
}

interface OrderDetails {
  orderType: string;
}

const OrderDetailsPage = ({ params }: { params: { orderId: string } }) => {
  const { orderId } = params;

  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [onOperationComplete, setOnOperationComplete] = useState(false);
  
  const { t, getCurrentLanguage } = useTranslations();
  const currentLanguage = getCurrentLanguage();
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const params = new URLSearchParams();
    if (currentLanguage) {
      params.append('lang', currentLanguage);
    }

    axios
      .get(`${BACKEND_URL}/orders/single/${orderId}?${params.toString()}`, {
        withCredentials: true,
      })
      .then((response) => {

        setOrderData(response.data);
        setLoading(false);
        setOnOperationComplete(false);
      })
      .catch((error) => {
        console.error('Error fetching order details:', error);
        setLoading(false);
      });
  }, [orderId, onOperationComplete, currentLanguage, BACKEND_URL]);

  if (loading) {
    return <SingleOrderSkeleton />;
  }

  if (!orderData) {
    return <p className="text-center mt-10">{t('orders:details.notFound')}</p>;
  }

  return (
    <main className="overflow-x-hidden">
      {/* <DiveDeeper /> */}
      {/* <OrderStatusSection currentStatus={orderData.orderStatus} /> */}
      {orderData.orderDetails.orderType === "milestone" ?
       <MilestoneOrderDisplay  
       sellerImage={orderData.userDetails.userImage}  
       sellerUsername={orderData.userDetails?.userName || "Waleed"}
       sellerName={orderData.userDetails?.userName || "Waleed"}
       orderDetails={orderData.orderDetails}
       reviewDetails={orderData.reviewDetails}
       milestones={orderData.milestones}
       operationComplete={() => setOnOperationComplete(true)}
       /> : 
       <SingleOrderPage
        sellerName={orderData.userDetails?.userName || 'dasdsa'}
        sellerUsername={orderData.userDetails?.userUsername || "Waleed"}
        sellerImage={orderData.userDetails?.userImage}
        orderDetails={orderData?.orderDetails}
        reviewDetails={orderData?.reviewDetails}
        onOperationComplete={() => setOnOperationComplete(true)}
      />}
      <ToastContainer />
    </main>
  );
};

export default OrderDetailsPage;
