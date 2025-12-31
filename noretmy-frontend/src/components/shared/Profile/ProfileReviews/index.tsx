'use client';

import React from 'react';
import { Star, Quote } from 'lucide-react';

interface Review {
  _id: string;
  userId: {
    username: string;
    profilePicture?: string;
  } | string;
  star: number;
  desc: string;
  createdAt: string;
  gigId?: {
    title: string;
  };
}

interface ProfileReviewsProps {
  reviews: Review[];
}

const ProfileReviews: React.FC<ProfileReviewsProps> = ({ reviews }) => {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-500/20 to-blue-500/20 rounded-full flex items-center justify-center">
          <Star className="w-8 h-8 text-slate-400" />
        </div>
        <p className="text-slate-400">No reviews yet</p>
        <p className="text-slate-500 text-sm mt-1">Reviews from clients will appear here</p>
      </div>
    );
  }

  const averageRating = reviews.reduce((sum, r) => sum + r.star, 0) / reviews.length;

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="flex items-center gap-6 p-4 bg-gradient-to-r from-orange-500/10 to-blue-500/10 rounded-xl border border-white/10">
        <div className="text-center">
          <div className="text-4xl font-bold text-white">{averageRating.toFixed(1)}</div>
          <div className="flex items-center gap-1 mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={16}
                className={star <= Math.round(averageRating) ? 'fill-orange-500 text-orange-500' : 'text-slate-500'}
              />
            ))}
          </div>
        </div>
        <div className="border-l border-white/10 pl-6">
          <div className="text-2xl font-semibold text-white">{reviews.length}</div>
          <div className="text-slate-400 text-sm">Total Reviews</div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => {
          const username = typeof review.userId === 'object' ? review.userId.username : 'Anonymous';
          const profilePic = typeof review.userId === 'object' ? review.userId.profilePicture : null;
          const gigTitle = typeof review.gigId === 'object' ? review.gigId.title : null;

          return (
            <div
              key={review._id}
              className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all duration-200"
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {profilePic ? (
                    <img
                      src={profilePic}
                      alt={username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                      {username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Review Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-white">{username}</h4>
                      {gigTitle && (
                        <p className="text-slate-500 text-xs">For: {gigTitle}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={14}
                          className={star <= review.star ? 'fill-orange-500 text-orange-500' : 'text-slate-600'}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Review Text */}
                  <div className="relative">
                    <Quote className="absolute -left-1 -top-1 w-4 h-4 text-orange-500/30" />
                    <p className="text-slate-300 text-sm pl-4 leading-relaxed">{review.desc}</p>
                  </div>

                  {/* Date */}
                  <p className="text-slate-500 text-xs mt-3">
                    {new Date(review.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProfileReviews;
