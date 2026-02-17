import React, { useEffect, useState } from "react";
import { Loader2, User, Calendar } from "lucide-react";
import RatingStars from "./RatingStars";
import api from "../api/axios";

/**
 * ReviewsList Component
 * Displays a list of product reviews with lazy loading
 *
 * @param {string} productId - Product ID to fetch reviews for
 * @param {boolean} autoLoad - If true, loads reviews immediately
 */
const ReviewsList = ({ productId, autoLoad = true }) => {
  const [reviews, setReviews] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);

  useEffect(() => {
    if (autoLoad && productId) {
      fetchReviews();
    }
  }, [productId, autoLoad]);

  const fetchReviews = async () => {
    if (!productId) return;

    setLoading(true);
    setError(null);

    try {
      const { data } = await api.get(`/reviews/product/${productId}`);
      setReviews(data.reviews || []);
      setAverageRating(data.averageRating || 0);
      setRatingCount(data.ratingCount || 0);
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
      setError("Failed to load reviews. Please try again.");
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  // Format date helper
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Unknown date";
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        <span className="ml-2 text-sm text-gray-500">Loading reviews...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={fetchReviews}
          className="mt-2 text-sm text-emerald-600 hover:text-emerald-700 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  // Empty state
  if (reviews && reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-2">
          <MessageSquare className="w-12 h-12 mx-auto mb-2" />
        </div>
        <p className="text-sm text-gray-500">
          No comments yet — be the first to review.
        </p>
      </div>
    );
  }

  // Reviews list
  return (
    <div className="space-y-4">
      {/* Header with average rating */}
      {ratingCount > 0 && (
        <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
          <RatingStars rating={averageRating} interactive={false} size={16} />
          <span className="text-sm font-semibold text-gray-900">
            {averageRating.toFixed(1)}
          </span>
          <span className="text-xs text-gray-500">
            ({ratingCount} {ratingCount === 1 ? "review" : "reviews"})
          </span>
        </div>
      )}

      {/* Reviews */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {reviews &&
          reviews.map((review) => (
            <div
              key={review._id}
              className="bg-gray-50 p-4 rounded-lg border border-gray-100"
            >
              {/* Review Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <RatingStars
                    rating={review.rating}
                    interactive={false}
                    size={14}
                  />
                  <span className="text-xs font-semibold text-gray-900">
                    {review.rating}.0
                  </span>
                </div>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(review.createdAt)}
                </span>
              </div>

              {/* Comment */}
              {review.comment && review.comment.trim() && (
                <p className="text-sm text-gray-700 mb-3 whitespace-pre-wrap leading-relaxed">
                  {review.comment}
                </p>
              )}

              {/* Reviewer */}
              <div className="flex items-center gap-2 text-xs">
                <User className="w-3 h-3 text-gray-400" />
                <span className="text-gray-700 font-medium">
                  {review.reviewerName ||
                    review.user?.fullName ||
                    "Unknown User"}
                </span>
                {/* Role Badge */}
                {(review.reviewerRole || review.user?.role) && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      (review.reviewerRole || review.user?.role) === "designer"
                        ? "bg-blue-100 text-blue-700"
                        : (review.reviewerRole || review.user?.role) ===
                          "reseller"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {(review.reviewerRole || review.user?.role) === "designer"
                      ? "Designer"
                      : (review.reviewerRole || review.user?.role) ===
                        "reseller"
                      ? "Reseller"
                      : "Buyer"}
                  </span>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

// Import MessageSquare for empty state
import { MessageSquare } from "lucide-react";

export default ReviewsList;
