import React from 'react';
import { Calendar, Clock, DollarSign } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useTranslations } from '@/hooks/useTranslations';

interface OrderCardProps {
  orderId: string;
  gigTitle: string;
  sellerImage?: string;
  sellerUsername: string;
  orderPrice: number;
  createdAt?: string | Date;
  dueDate?: string | Date;
}

const OrderCard: React.FC<OrderCardProps> = ({
  orderId,
  gigTitle,
  sellerImage,
  sellerUsername,
  orderPrice,
  createdAt,
  dueDate,
}) => {
  const { t } = useTranslations();

  // Format date helper with better error handling
  const formatDate = (date?: string | Date) => {
    if (!date) return null;
    try {
      const d = new Date(date);
      // Check if date is valid
      if (isNaN(d.getTime())) return null;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return null;
    }
  };

  const formattedCreatedAt = formatDate(createdAt);
  const formattedDueDate = formatDate(dueDate);

  return (
    <div className="flex items-center gap-4">
      <Avatar className="w-14 h-14 border-2 border-gray-100">
        <AvatarImage
          src={sellerImage || '/placeholder-avatar.png'}
          alt={sellerUsername}
        />
        <AvatarFallback className="bg-orange-100 text-orange-600 text-lg font-semibold">
          {sellerUsername?.charAt(0).toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <h1 className="text-xl font-bold text-gray-900 line-clamp-2">{gigTitle}</h1>
        <p className="text-sm text-gray-500">{sellerUsername}</p>
      </div>
      <div className="hidden sm:flex items-center gap-6 text-sm text-gray-600">
        {formattedCreatedAt && (
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>{formattedCreatedAt}</span>
          </div>
        )}
        {formattedDueDate && (
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-gray-400" />
            <span>Due: {formattedDueDate}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 font-semibold text-gray-900">
          <DollarSign className="w-4 h-4 text-orange-500" />
          <span>${orderPrice}</span>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
