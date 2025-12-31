'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  Clock,
  DollarSign,
  Calendar,
  User,
  X,
  Check,
  Package,
  InboxIcon,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import OrderCardSkeleton from '@/skelton/CustomOrderSkelton';
import { useTranslations } from '@/hooks/useTranslations';

interface Milestone {
  title: string;
  description: string;
  deliveryDate: string;
  price: string;
}

interface Order {
  id: string;
  sellerName: string;
  sellerImage: string;
  type: 'custom' | 'milestone';
  title: string;
  deliveryDate: string;
  price: string;
  milestones?: Milestone[];
}

const OrderRequestScreen = () => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;
  const { t } = useTranslations();

  useEffect(() => {
    const fetchOrderRequests = async () => {
      try {
        const response = await axios.get(
          `${BACKEND_URL}/orders/requests`,
          {
            withCredentials: true,
          },
        );

        console.log('Custom Order Data', response.data);
        setOrders(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setIsLoading(false);
      }
    };

    fetchOrderRequests();
  }, []);

  const handleAccept = async () => {
    if (!selectedOrder) return;

    const query = new URLSearchParams({
      price: selectedOrder.price,
      title: selectedOrder.type,
      deliveryTime: selectedOrder.deliveryDate,
      orderId: selectedOrder.id,
      payment_type: 'custom_or_milestone',
    }).toString();

    router.push(`/checkout?${query}`);
    setIsModalOpen(false);
  };

  const handleDecline = () => {
    setIsModalOpen(false);
  };

  const OrderCard = ({ order }: { order: Order }) => (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => {
        setSelectedOrder(order);
        setIsModalOpen(true);
      }}
    >
      <CardContent className="pt-6">
        <div className="flex items-center space-x-4 mb-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={order.sellerImage} alt={order.sellerName} />
            <AvatarFallback>
              <User className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-medium">{order.sellerName}</h4>
            <Badge
              variant={order.type === 'milestone' ? 'secondary' : 'default'}
            >
              {t(`card.type.${order.type}`, { ns: 'order-request', defaultValue: order.type })}
            </Badge>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-2">{order.title}</p>

        <div className="flex items-center text-sm text-gray-500 mb-2">
          <Calendar className="h-4 w-4 mr-2" />
          {t('card.deliveryBy', { ns: 'order-request', defaultValue: 'Delivery by:' })} {order.deliveryDate}
        </div>

        <div className="flex items-center text-lg font-semibold">
          <DollarSign className="h-5 w-5 mr-1" />
          {order.price}
        </div>
      </CardContent>
    </Card>
  );

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="bg-orange-50 p-4 rounded-full mb-4">
        <InboxIcon className="h-12 w-12 text-orange-500" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{t('empty.title', { ns: 'order-request', defaultValue: 'No Order Requests Yet' })}</h3>
      <p className="text-gray-500 max-w-md mb-6">
        {t('empty.description', { ns: 'order-request', defaultValue: "You don't have any order requests at the moment. When clients send you custom or milestone order requests, they'll appear here." })}
      </p>
      <Button variant="outline" onClick={() => router.push('/orders')}>
        {t('button.return', { ns: 'order-request', defaultValue: 'Return to Orders Page' })}
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-700 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-6 w-6" />
              {t('card.title', { ns: 'order-request', defaultValue: 'Order Requests' })}
            </CardTitle>
            <CardDescription className="text-gray-200">
              {t('card.description', { ns: 'order-request', defaultValue: 'Manage your incoming order requests' })}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[1, 2, 3, 4].map((_, index) => (
                  <OrderCardSkeleton key={index} />
                ))}
              </div>
            ) : orders.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {orders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            ) : (
              <EmptyState />
            )}
          </CardContent>
        </Card>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedOrder?.type === 'milestone'
                  ? t('dialog.title.milestone', { ns: 'order-request', defaultValue: 'Milestone Order' })
                  : t('dialog.title.custom', { ns: 'order-request', defaultValue: 'Custom Order' })}
              </DialogTitle>
              <DialogDescription>
                {t('dialog.description', { ns: 'order-request', defaultValue: 'Review the order details before accepting' })}
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-4 p-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={selectedOrder?.sellerImage}
                      alt={selectedOrder?.sellerName}
                    />
                    <AvatarFallback>
                      <User className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium">{selectedOrder?.sellerName}</h4>
                    <Badge
                      variant={
                        selectedOrder?.type === 'milestone'
                          ? 'secondary'
                          : 'default'
                      }
                    >
                      {selectedOrder?.type && t(`card.type.${selectedOrder.type}`, { ns: 'order-request', defaultValue: selectedOrder?.type })}
                    </Badge>
                  </div>
                </div>

                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2">
                      {selectedOrder?.title}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <Calendar className="h-4 w-4 mr-2" />
                      {t('card.deliveryBy', { ns: 'order-request', defaultValue: 'Delivery by:' })} {selectedOrder?.deliveryDate}
                    </div>
                    <div className="flex items-center text-lg font-semibold">
                      <DollarSign className="h-5 w-5 mr-1" />
                      {selectedOrder?.price}
                    </div>
                  </CardContent>
                </Card>

                {selectedOrder?.type === 'milestone' &&
                  selectedOrder.milestones && (
                    <div className="space-y-4">
                      <h3 className="font-semibold">{t('milestones.title', { ns: 'order-request', defaultValue: 'Milestones' })}</h3>
                      {selectedOrder.milestones.map((milestone, index) => (
                        <Card key={index}>
                          <CardContent className="pt-6">
                            <h4 className="font-medium mb-2">
                              {milestone.title}
                            </h4>
                            <p className="text-sm text-gray-600 mb-2">
                              {milestone.description}
                            </p>
                            <div className="flex items-center justify-between text-sm">
                              <span className="flex items-center text-gray-500">
                                <Clock className="h-4 w-4 mr-1" />
                                {milestone.deliveryDate}
                              </span>
                              <span className="flex items-center font-medium">
                                <DollarSign className="h-4 w-4 mr-1" />
                                {milestone.price}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                <div className="flex justify-end space-x-4 pt-4">
                  <Button variant="destructive" onClick={handleDecline}>
                    <X className="h-4 w-4 mr-2" />
                    {t('button.decline', { ns: 'order-request', defaultValue: 'Decline' })}
                  </Button>
                  <Button onClick={handleAccept}>
                    <Check className="h-4 w-4 mr-2" />
                    {t('button.accept', { ns: 'order-request', defaultValue: 'Accept' })}
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default OrderRequestScreen;