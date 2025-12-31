'use client';

import React, { useState } from 'react';
import { Star, Send, MessageSquare, ThumbsUp, Clock, Sparkles } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

interface ReviewFormProps {
    orderId: string;
    sellerName: string;
    onReviewSubmitted?: () => void;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

const ReviewForm: React.FC<ReviewFormProps> = ({
    orderId,
    sellerName,
    onReviewSubmitted,
}) => {
    const [rating, setRating] = useState(5);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [review, setReview] = useState('');
    const [communicationRating, setCommunicationRating] = useState(5);
    const [qualityRating, setQualityRating] = useState(5);
    const [deliveryRating, setDeliveryRating] = useState(5);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDetailedRatings, setShowDetailedRatings] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.error('Please select a rating');
            return;
        }

        if (review.trim().length < 10) {
            toast.error('Please write a review (at least 10 characters)');
            return;
        }

        setIsSubmitting(true);
        try {
            await axios.post(
                `${BACKEND_URL}/orders/review`,
                {
                    orderId,
                    rating,
                    review,
                    communicationRating,
                    qualityRating,
                    deliveryRating,
                },
                { withCredentials: true }
            );

            toast.success('Review submitted successfully! Thank you for your feedback.');
            onReviewSubmitted?.();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to submit review');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getRatingLabel = (r: number) => {
        const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
        return labels[r] || '';
    };

    const StarRating = ({
        value,
        onChange,
        onHover,
        hoveredValue,
        size = 'lg'
    }: {
        value: number;
        onChange: (v: number) => void;
        onHover?: (v: number) => void;
        hoveredValue?: number;
        size?: 'sm' | 'lg';
    }) => (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onChange(star)}
                    onMouseEnter={() => onHover?.(star)}
                    onMouseLeave={() => onHover?.(0)}
                    className="transition-transform hover:scale-110"
                >
                    <Star
                        className={`${size === 'lg' ? 'w-8 h-8' : 'w-5 h-5'} transition-colors ${star <= (hoveredValue || value)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                    />
                </button>
            ))}
        </div>
    );

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
                <div className="flex items-center gap-3">
                    <Sparkles className="w-8 h-8" />
                    <div>
                        <h3 className="text-xl font-bold">Rate Your Experience</h3>
                        <p className="text-orange-100 text-sm">
                            Share your feedback about working with {sellerName}
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Main Rating */}
                <div className="text-center">
                    <p className="text-lg font-medium text-gray-700 mb-3">Overall Rating</p>
                    <StarRating
                        value={rating}
                        onChange={setRating}
                        onHover={setHoveredRating}
                        hoveredValue={hoveredRating}
                        size="lg"
                    />
                    <p className={`mt-2 text-lg font-semibold transition-colors ${rating >= 4 ? 'text-orange-600' : rating >= 2 ? 'text-amber-600' : rating > 0 ? 'text-red-500' : 'text-gray-400'
                        }`}>
                        {getRatingLabel(hoveredRating || rating)}
                    </p>
                </div>

                {/* Detailed Ratings Toggle */}
                <button
                    type="button"
                    onClick={() => setShowDetailedRatings(!showDetailedRatings)}
                    className="w-full py-2 text-sm text-orange-600 hover:text-orange-700 font-medium"
                >
                    {showDetailedRatings ? 'Hide' : 'Show'} Detailed Ratings
                </button>

                {/* Detailed Ratings */}
                {showDetailedRatings && (
                    <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-blue-500" />
                                <span className="text-sm font-medium text-gray-700">Communication</span>
                            </div>
                            <StarRating
                                value={communicationRating}
                                onChange={setCommunicationRating}
                                size="sm"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ThumbsUp className="w-5 h-5 text-orange-500" />
                                <span className="text-sm font-medium text-gray-700">Quality of Work</span>
                            </div>
                            <StarRating
                                value={qualityRating}
                                onChange={setQualityRating}
                                size="sm"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-purple-500" />
                                <span className="text-sm font-medium text-gray-700">Delivery Time</span>
                            </div>
                            <StarRating
                                value={deliveryRating}
                                onChange={setDeliveryRating}
                                size="sm"
                            />
                        </div>
                    </div>
                )}

                {/* Review Text */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Review
                    </label>
                    <textarea
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        placeholder="Share your experience working with this freelancer. What went well? Would you recommend them?"
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                        {review.length}/500 characters
                    </p>
                </div>

                {/* Submit Button */}
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || rating === 0 || review.length < 10}
                    className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <>
                            <Send className="w-5 h-5" />
                            Submit Review
                        </>
                    )}
                </button>

                {/* Privacy Note */}
                <p className="text-xs text-gray-400 text-center">
                    Your review will be visible on the freelancer's profile and helps other clients make informed decisions.
                </p>
            </div>
        </div>
    );
};

export default ReviewForm;
