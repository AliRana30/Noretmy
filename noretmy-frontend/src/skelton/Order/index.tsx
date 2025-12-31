import React from 'react';
import { Calendar, DollarSign, ExternalLink } from 'lucide-react';

const OrderCardSkeleton: React.FC = () => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md animate-pulse">
      {/* Order Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className="h-16 w-16 rounded-lg bg-gray-300" />
          <div>
            <div className="h-5 w-32 bg-gray-300 rounded-md" />
            <div className="mt-2 flex items-center space-x-2">
              <div className="h-6 w-6 rounded-full bg-gray-300" />
              <div className="h-4 w-24 bg-gray-300 rounded-md" />
            </div>
          </div>
        </div>
        <div className="h-6 w-20 rounded-full bg-gray-300" />
      </div>

      {/* Order Details */}
      <div className="mb-4 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-gray-400">
          <Calendar size={16} />
          <div className="h-4 w-28 bg-gray-300 rounded-md" />
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <DollarSign size={16} />
          <div className="h-4 w-16 bg-gray-300 rounded-md" />
        </div>
      </div>

      {/* Action Button */}
      <div className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-200 py-2">
        <div className="h-5 w-20 bg-gray-300 rounded-md" />
        <ExternalLink size={16} className="text-gray-400" />
      </div>
    </div>
  );
};

export default OrderCardSkeleton;
