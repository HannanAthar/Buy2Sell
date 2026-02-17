import { useState, useEffect } from "react";
import api from "../api/axios";
import RatingStars from "./RatingStars";
import { Loader2, Star, MessageSquare } from "lucide-react";

const ResellerReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResellerReviews();
  }, []);

  const fetchResellerReviews = async () => {
    try {
      const { data } = await api.get("/reviews/reseller/my-reviews");
      if (data.success) {
        setReviews(data.reviews);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Customer Reviews
        </h2>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-50 rounded-lg">
                <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Number(stats.averageRating || 0).toFixed(1)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 rounded-lg">
                <Star className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Ratings</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalRatings || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Written Reviews</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalReviews || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Recent Feedback</h3>
          </div>

          <div className="divide-y divide-gray-100">
            {reviews.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                No reviews yet.
              </div>
            ) : (
              reviews.map((review) => (
                <div
                  key={review._id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <RatingStars
                        rating={review.rating}
                        interactive={false}
                        size={16}
                      />
                      <span className="font-medium text-gray-900 ml-2">
                        {review.reviewerName ||
                          review.user?.fullName ||
                          "Unknown User"}
                      </span>
                      {/* Role Badge */}
                      {(review.reviewerRole || review.user?.role) && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            (review.reviewerRole || review.user?.role) ===
                            "designer"
                              ? "bg-blue-100 text-blue-700"
                              : (review.reviewerRole || review.user?.role) ===
                                "reseller"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {(review.reviewerRole || review.user?.role) ===
                          "designer"
                            ? "Designer"
                            : (review.reviewerRole || review.user?.role) ===
                              "reseller"
                            ? "Reseller"
                            : "Buyer"}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {review.comment && (
                    <p className="text-gray-600 mt-2 mb-3 bg-gray-50 p-3 rounded-lg text-sm">
                      "{review.comment}"
                    </p>
                  )}

                  <div className="flex items-center gap-2 mt-2">
                    <img
                      src={
                        review.product?.images?.[0]
                          ? `http://localhost:5000${review.product.images[0]}`
                          : "/placeholder.svg"
                      }
                      alt=""
                      className="w-8 h-8 rounded object-cover border border-gray-200"
                    />
                    <span className="text-xs text-gray-500">
                      Product:{" "}
                      <span className="font-medium text-gray-700">
                        {review.product?.name || "Unknown Product"}
                      </span>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResellerReviews;
