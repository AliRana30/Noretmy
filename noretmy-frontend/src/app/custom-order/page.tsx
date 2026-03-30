"use client";
import CreateOrderScreen from '@/components/shared/Milestone';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, Suspense } from 'react';

const MilestonePageContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const buyerId = searchParams.get('buyerId'); 

  useEffect(() => {
    const query = new URLSearchParams({
      payment_type: 'order_payment',
    }).toString();

  }, []); 

  return (
    <main className="overflow-x-hidden">
      <CreateOrderScreen buyerId={buyerId} /> 
    </main>
  );
};

const MilestonePage = () => {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <MilestonePageContent />
    </Suspense>
  );
};

export default MilestonePage;
