import { Bell } from 'lucide-react';

const NotificationSkeleton: React.FC = () => {
  return (
    <div className="relative rounded-xl border shadow-sm p-4 animate-pulse bg-gray-100">
      <div className="flex items-start gap-4">
        {/* Icon Placeholder */}
        <div className="flex-shrink-0">
          <div className="w-5 h-5 bg-gray-300 rounded-full"></div>
        </div>

        <div className="flex-grow min-w-0">
          {/* Title Placeholder */}
          <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>

          {/* Message Placeholder */}
          <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>

          {/* Timestamp Placeholder */}
          <div className="flex items-center gap-2 mt-2">
            <Bell className="w-4 h-4 text-gray-300" />
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSkeleton;
