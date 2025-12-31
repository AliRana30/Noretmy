import React from 'react';
import { FaCheck, FaClock, FaTasks } from 'react-icons/fa'; // Example icons from react-icons

interface OrderStatusPageProps {
  currentStatus: string;
}

const statuses = [
  'Order Created',
  'Requirements Submitted',
  'In Progress',
  'Completed',
  'Delivered',
];

const OrderStatusSection: React.FC<OrderStatusPageProps> = ({
  currentStatus,
}) => {
  const currentIndex = statuses.indexOf(currentStatus);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-center">Order Status</h1>
      <div className="relative mb-6">
        {/* Progress Bar */}
        <div className="h-2 bg-gray-200 rounded-full">
          <div
            className="h-2 bg-orange-500 rounded-full transition-all"
            style={{
              width: `${(currentIndex / (statuses.length - 1)) * 100}%`,
            }}
          ></div>
        </div>
      </div>
      <div className="flex flex-col items-center space-y-6">
        {statuses.map((status, index) => (
          <div key={index} className="flex items-center space-x-4">
            {/* Vertical Line (Stepper) */}
            {index > 0 && (
              <div
                className={`w-1 h-12 ${
                  index <= currentIndex ? 'bg-orange-500' : 'bg-gray-300'
                }`}
              ></div>
            )}

            {/* Status Card */}
            <div
              className={`flex items-center space-x-4 p-4 rounded-lg shadow-md w-full max-w-md transform transition-all 
                ${
                  index <= currentIndex
                    ? 'bg-orange-100 hover:scale-105'
                    : 'bg-gray-100 hover:scale-100'
                }`}
            >
              {/* Icon */}
              <div
                className={`w-10 h-10 flex items-center justify-center rounded-full 
                  ${index <= currentIndex ? 'bg-orange-500 text-white' : 'bg-gray-300 text-gray-600'}`}
              >
                {index < currentIndex ? (
                  <FaCheck /> // Checkmark for completed steps
                ) : index === currentIndex ? (
                  <FaTasks /> // Task icon for current step
                ) : (
                  <FaClock /> // Clock icon for upcoming steps
                )}
              </div>

              {/* Status Text */}
              <div className="text-left">
                <p
                  className={`text-lg font-semibold 
                    ${index <= currentIndex ? 'text-orange-700' : 'text-gray-500'}`}
                >
                  {status}
                </p>
                {index === currentIndex && (
                  <p className="text-sm text-orange-600 font-medium">
                    Current Status
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderStatusSection;
