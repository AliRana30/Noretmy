'use client';

import React, { useState } from 'react';
import { Star, X, Send } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  gigTitle: string;
  sellerName: string;
  onReviewSubmitted?: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  orderId,
  gigTitle,
  sellerName,
  onReviewSubmitted,
}) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (reviewText.trim().length < 10) {
      toast.error('Please write at least 10 characters for your review');
      return;
    }

    setIsSubmitting(true);

    try {
      await axios.post(
        `${BACKEND_URL}/reviews`,
        {
          orderId,
          star: rating,
          desc: reviewText,
        },
        { withCredentials: true }
      );

      toast.success('Review submitted successfully!');
      setRating(0);
      setReviewText('');
      onClose();
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Leave a Review</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Order Info */}
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-6">
          <p className="text-gray-500 text-sm mb-1">Order for:</p>
          <p className="text-gray-900 font-medium">{gigTitle}</p>
          <p className="text-gray-500 text-sm mt-1">by {sellerName}</p>
        </div>

        {/* Star Rating */}
        <div className="mb-6">
          <label className="text-gray-700 text-sm font-medium mb-3 block">Your Rating</label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform duration-200 hover:scale-110"
              >
                <Star
                  size={32}
                  className={`transition-colors duration-200 ${star <= (hoverRating || rating)
                      ? 'fill-orange-500 text-orange-500'
                      : 'text-gray-300'
                    }`}
                />
              </button>
            ))}
            <span className="text-gray-500 ml-2">
              {rating > 0 ? `${rating}/5` : 'Select rating'}
            </span>
          </div>
        </div>

        {/* Review Text */}
        <div className="mb-6">
          <label className="text-gray-700 text-sm font-medium mb-2 block">Your Review</label>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Share your experience with this service..."
            className="w-full h-32 bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
          />
          <p className="text-gray-400 text-xs mt-1">
            {reviewText.length}/500 characters (minimum 10)
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors duration-200 border border-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send size={18} />
                Submit Review
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
