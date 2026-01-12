import React, { useState } from 'react';

interface ReviewFormProps {
  onSubmit: (rating: number, text: string) => void;
  isSubmitting?: boolean;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ onSubmit, isSubmitting = false }) => {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');

  const [error, setError] = useState<string | null>(null);

  const handleStarClick = (index: number) => {
    setRating(index + 1);
    setError(null);
  };

  const handleSubmit = () => {
    if (rating === 0) {
      setError('Please provide a star rating.');
      return;
    }
    if (reviewText.trim().length < 10) {
      setError('Please write a review (at least 10 characters).');
      return;
    }

    setError(null);
    onSubmit(rating, reviewText);
    setRating(0);
    setReviewText('');
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm transition-all animate-shake">
          {error}
        </div>
      )}
      <h3 className="text-xl font-semibold mb-2">Leave a Review</h3>
      {/* Star Rating */}
      <div className="flex mb-4">
        {[...Array(5)].map((_, index) => (
          <button
            key={index}
            className={`text-2xl ${index < rating ? 'text-yellow-500' : 'text-gray-300'
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
        className={`mt-2 py-2 px-4 rounded font-semibold transition-all ${isSubmitting
          ? 'bg-gray-400 cursor-not-allowed text-gray-200'
          : 'bg-orange-500 hover:bg-orange-600 text-white shadow-md hover:shadow-lg'
          }`}
        onClick={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </div>
  );
};

export default ReviewForm;
