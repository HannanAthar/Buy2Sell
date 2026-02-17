import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Star,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  User,
  Package,
} from "lucide-react";
import api from "../../api/axios";
import { useDialog } from "../../context/DialogContext";

const getImageUrl = (path) => {
  if (!path || !path.trim()) return null;
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  return `http://localhost:5000${path.startsWith("/") ? "" : "/"}${path}`;
};

const AdminReviewsModal = ({
  isOpen,
  onClose,
  // For seller reviews
  sellerId,
  sellerType,
  sellerName,
  // For product reviews (NEW)
  productId,
  productName,
  type = "seller", // "seller" | "product"
}) => {
  const dialog = useDialog();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sort, setSort] = useState("newest"); // newest, oldest, highest, lowest

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params =
        type === "product" ? { productId } : { sellerId, sellerType };

      const { data } = await api.get("/admin/reviews", { params });
      setReviews(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch reviews.");
    } finally {
      setLoading(false);
    }
  }, [productId, sellerId, sellerType, type]);

  useEffect(() => {
    if (isOpen && (sellerId || productId)) {
      fetchReviews();
    }
  }, [isOpen, sellerId, productId, fetchReviews]);

  const handleToggleVisibility = async (reviewId) => {
    try {
      await api.patch(`/admin/reviews/${reviewId}/status`);
      setReviews(
        reviews.map((r) =>
          r._id === reviewId ? { ...r, isVisible: !r.isVisible } : r
        )
      );
    } catch (err) {
      console.error(err);
      dialog.alert("Failed to update status", { title: "Error" });
    }
  };

  const handleDelete = async (reviewId) => {
    const isConfirmed = await dialog.confirm(
      "Are you sure you want to delete this review? This action cannot be undone.",
      {
        title: "Delete Review",
        confirmText: "Delete",
        isDestructive: true,
      }
    );

    if (!isConfirmed) return;

    try {
      await api.delete(`/admin/reviews/${reviewId}`);
      setReviews(reviews.filter((r) => r._id !== reviewId));
      dialog.alert("Review deleted successfully.", { title: "Success" });
    } catch (err) {
      console.error(err);
      dialog.alert("Failed to delete review. Please try again.", {
        title: "Error",
      });
    }
  };

  const sortedReviews = [...reviews].sort((a, b) => {
    if (sort === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
    if (sort === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
    if (sort === "highest") return b.rating - a.rating;
    if (sort === "lowest") return a.rating - b.rating;
    return 0;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Reviews for {type === "product" ? productName : sellerName}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Total Reviews: {reviews.length}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-4 border-b border-gray-100 flex gap-4 bg-white items-center">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
          </select>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-12">{error}</div>
          ) : reviews.length === 0 ? (
            <div className="text-center text-gray-500 py-12 flex flex-col items-center">
              <Star className="w-12 h-12 text-gray-300 mb-2" />
              <p>No reviews found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedReviews.map((review) => (
                <div
                  key={review._id}
                  className={`bg-white p-5 rounded-xl border ${
                    review.isVisible === false
                      ? "border-red-200 bg-red-50/10"
                      : "border-gray-200"
                  } shadow-sm hover:shadow-md transition-shadow`}
                >
                  {/* Review Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= review.rating
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-200"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {review.rating}.0
                      </span>
                      <span className="text-xs text-gray-400">
                        •{" "}
                        {new Date(review.createdAt).toLocaleDateString(
                          "en-US",
                          { year: "numeric", month: "short", day: "numeric" }
                        )}
                      </span>
                      {review.isVisible === false && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                          Hidden
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleToggleVisibility(review._id, review.isVisible)
                        }
                        title={
                          review.isVisible === false
                            ? "Show Review"
                            : "Hide Review"
                        }
                        className={`p-1.5 rounded-lg transition-colors ${
                          review.isVisible === false
                            ? "bg-red-100 text-red-600"
                            : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        }`}
                      >
                        {review.isVisible === false ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(review._id)}
                        title="Delete Review"
                        className="p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Comment */}
                  <p className="text-gray-700 mb-4 whitespace-pre-wrap">
                    {review.comment || (
                      <span className="text-gray-400 italic">
                        No comment provided.
                      </span>
                    )}
                  </p>

                  {/* Context Footer */}
                  <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-100 text-sm">
                    {/* Product - only show for seller reviews */}
                    {type !== "product" && review.product && (
                      <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-2 py-1 rounded-lg">
                        <a
                          href={`/product-detail?id=${review.product._id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0"
                        >
                          <img
                            src={getImageUrl(review.product.images?.[0])}
                            alt=""
                            className="w-8 h-8 rounded object-cover border border-gray-200 hover:opacity-80 transition-opacity"
                          />
                        </a>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Package className="w-3 h-3" /> Product
                          </span>
                          <a
                            href={`/product-detail?id=${review.product._id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-gray-900 truncate max-w-[150px] hover:text-blue-600 hover:underline"
                            title={review.product.name}
                          >
                            {review.product.name}
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Reviewer */}
                    <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                      <User className="w-3.5 h-3.5" />
                      <span className="font-medium">
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReviewsModal;
