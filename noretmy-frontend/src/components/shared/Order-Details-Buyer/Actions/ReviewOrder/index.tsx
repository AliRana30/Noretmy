'use client';

import React, { useState } from 'react';

interface ReviewFormProps {
  onSubmit: (review: { rating: number; text: string }) => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ onSubmit }) => {
  const [rating, setRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState<string>('');

  const handleStarClick = (index: number) => {
    setRating(index + 1);
  };

  const handleSubmit = () => {
    if (rating === 0 || reviewText.trim() === '') {
      alert('Please provide a rating and a review.');
      return;
    }
    onSubmit({ rating, text: reviewText });
    setRating(0);
    setReviewText('');
  };

  return (
    <div className="p-4 bg-white rounded shadow-md">
      <h2 className="text-xl font-bold mb-4">Leave a Review</h2>

      <div className="flex mb-4">
        {[...Array(5)].map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => handleStarClick(index)}
            className="text-3xl mx-1 focus:outline-none"
          >
            <span
              className={index < rating ? 'text-yellow-400' : 'text-gray-300'}
            >
              ★
            </span>
          </button>
        ))}
      </div>

      <textarea
        className="w-full border border-gray-300 rounded p-2 mb-4 focus:outline-none focus:border-orange-600"
        placeholder="Write your review"
        value={reviewText}
        onChange={(e) => setReviewText(e.target.value)}
        rows={4}
      />

      <button
        onClick={handleSubmit}
        className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded"
      >
        Submit Review
      </button>
    </div>
  );
};

export default ReviewForm;
