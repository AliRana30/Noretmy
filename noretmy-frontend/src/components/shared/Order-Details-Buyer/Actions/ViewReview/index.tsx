import React from 'react';
import { FaStar } from 'react-icons/fa';

interface ViewReviewProps {
  rating: number;
  desc: string;
}

const ViewReview: React.FC<ViewReviewProps> = ({ rating, desc }) => {
  return (
    <div className="p-4 ">
      {/* Title */}
      <h2 className="text-lg font-bold mb-2">Review</h2>

      {/* Star Rating */}
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, index) => (
          <FaStar
            key={index}
            className={index < rating ? 'text-yellow-500' : 'text-gray-300'}
          />
        ))}
      </div>

      {/* Review Description */}
      <p className="text-gray-700 text-base leading-relaxed">{desc}</p>
    </div>
  );
};

export default ViewReview;
