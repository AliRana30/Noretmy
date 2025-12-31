import React, { useState } from 'react';

interface ReviewFormProps {
  onSubmit: (rating: number, text: string) => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');

  const handleStarClick = (index: number) => {
    setRating(index + 1); // Star rating is 1-based
  };

  const handleSubmit = () => {
    if (rating === 0 || reviewText.trim() === '') {
      alert('Please provide a rating and a review.');
      return;
    }
    onSubmit(rating, reviewText);
    setRating(0);
    setReviewText('');
  };

  return (
    <div>
      <h3 className="text-xl font-semibold mb-2">Leave a Review</h3>
      {/* Star Rating */}
      <div className="flex mb-4">
        {[...Array(5)].map((_, index) => (
          <button
            key={index}
            className={`text-2xl ${
              index < rating ? 'text-yellow-500' : 'text-gray-300'
            }`}
            onClick={() => handleStarClick(index)}
          >
            ★
          </button>
        ))}
      </div>

      {/* Review Textarea */}
      <textarea
        className="w-full h-40 p-4 border border-gray-300 rounded mb-2"
        placeholder="Write your review"
        value={reviewText}
        onChange={(e) => setReviewText(e.target.value)}
      />

      {/* Submit Button */}
      <button
        className="mt-2 bg-light-customorange text-white py-2 px-4 rounded"
        onClick={handleSubmit}
      >
        Submit Review
      </button>
    </div>
  );
};

export default ReviewForm;
