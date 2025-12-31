'use client'
import OrderRequestScreen from '@/components/shared/CustomOrderRequest';
import { useTranslations } from '@/hooks/useTranslations';

const OrderRequest = () => {
  const { t } = useTranslations();
  return (
    <main className="overflow-x-hidden p-6 bg-gray-50">
      <OrderRequestScreen />
    </main>
  );
};

export default OrderRequest;
