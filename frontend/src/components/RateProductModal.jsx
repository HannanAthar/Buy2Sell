import React, { useState, useEffect } from "react";
import { X, Check, Loader2, AlertCircle } from "lucide-react";
import api from "../api/axios";
import RatingStars from "./RatingStars";

// State Machine Constants
const STATE = {
  INITIAL: "INITIAL",
  LOADING: "LOADING",
  SUCCESS: "SUCCESS",
  ERROR: "ERROR",
};

export default function RateProductModal({
  isOpen,
  onClose,
  product, // The product object (must have _id or id, name, image)
  onSuccess,
}) {
  const [uiState, setUiState] = useState(STATE.INITIAL);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setUiState(STATE.INITIAL);
      setRating(0);
      setComment("");
      setErrorMsg("");
    }
  }, [isOpen, product]);

  const handleSubmit = async () => {
    // Validation
    if (!rating) {
      setErrorMsg("Please select a star rating.");
      return;
    }

    // 1. Transition to LOADING
    setUiState(STATE.LOADING);
    setErrorMsg("");

    // Safety timeout wrapper - maximum 35 seconds total
    const safetyTimeout = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("Operation timed out. Please try again."));
      }, 35000); // 35 seconds safety limit
    });

    try {
      // Wrap retry logic with safety timeout
      await Promise.race([
        (async () => {
          // Retry logic with exponential backoff
          const maxAttempts = 3;
          let attempt = 0;

          while (attempt < maxAttempts) {
            attempt++;
            console.log(
              `🔄 Rating submission attempt ${attempt}/${maxAttempts}`
            );

            try {
              // 2. API Call with 30s timeout
              const response = await api.post(
                "/reviews/submit",
                {
                  productId: product._id || product.id,
                  rating,
                  comment,
                  source: "product_page",
                },
                {
                  timeout: 30000,
                }
              );

              console.log("✅ Rating submission successful:", response.data);

              // 3. Handle Success
              if (response.data.success) {
                setUiState(STATE.SUCCESS);
                if (onSuccess) onSuccess(response.data);

                // Auto-close after 1.5s
                setTimeout(() => {
                  onClose();
                  window.dispatchEvent(new Event("ratingUpdated"));
                }, 1500);
                return; // Exit retry loop on success
              } else {
                throw new Error(
                  response.data.message || "Submission failed unexpectedly."
                );
              }
            } catch (err) {
              console.error(
                `❌ Rating Submission Error (Attempt ${attempt}/${maxAttempts}):`,
                err
              );

              // If this was the last attempt, throw error
              if (attempt >= maxAttempts) {
                throw err; // Re-throw to outer catch
              }

              // Wait before retry (exponential backoff: 1s, 2s)
              const delay = attempt * 1000;
              console.log(`⏳ Waiting ${delay}ms before retry...`);
              await new Promise((resolve) => setTimeout(resolve, delay));
              // Continue to next retry attempt
            }
          }
        })(),
        safetyTimeout,
      ]);
    } catch (err) {
      console.error("❌ Final rating submission error:", err);

      // Handle error and exit loading state
      let msg = "Failed to submit rating. Please try again.";

      if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
        msg = "Request timed out. Please check your connection and try again.";
      } else if (err.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err.response?.data?.error) {
        msg = err.response.data.error;
      } else if (err.message) {
        msg = err.message;
      }

      setErrorMsg(msg);
      setUiState(STATE.ERROR);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
        {/* Header */}
        <div
          className={`px-6 py-4 flex justify-between items-center text-white transition-colors duration-300 ${
            uiState === STATE.SUCCESS
              ? "bg-green-600"
              : uiState === STATE.ERROR
              ? "bg-red-600"
              : "bg-gradient-to-r from-emerald-600 to-green-600"
          }`}
        >
          <h3 className="text-lg font-bold flex items-center gap-2">
            {uiState === STATE.SUCCESS && <Check size={20} />}
            {uiState === STATE.ERROR && <AlertCircle size={20} />}
            {uiState === STATE.SUCCESS ? "Thank You!" : "Rate Product"}
          </h3>
          <button
            onClick={onClose}
            disabled={uiState === STATE.LOADING} // Prevent closing while loading
            className="text-white/80 hover:text-white transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* SUCCESS VIEW */}
          {uiState === STATE.SUCCESS ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <Check size={40} strokeWidth={3} />
              </div>
              <h4 className="text-xl font-bold text-gray-900">
                Rating Submitted!
              </h4>
              <p className="text-gray-500 mt-2">Thanks for your feedback.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Product Info */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-200">
                  <img
                    src={
                      product?.image ||
                      product?.imageUrls?.[0] ||
                      "/placeholder.svg"
                    }
                    alt={product?.name}
                    d="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 line-clamp-1">
                    {product?.name}
                  </h4>
                  <p className="text-sm text-gray-500">
                    Share your experience with others
                  </p>
                </div>
              </div>

              {/* Error Banner */}
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg flex items-start gap-2 animate-in slide-in-from-top-2">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Star Input */}
              <div className="flex flex-col items-center gap-2 py-2">
                <RatingStars
                  rating={rating}
                  interactive={uiState !== STATE.LOADING} // Disable interaction when loading
                  onChange={setRating}
                  size={36}
                />
                <span
                  className={`text-sm font-medium transition-colors ${
                    rating > 0 ? "text-emerald-600" : "text-gray-400"
                  }`}
                >
                  {rating > 0 ? `${rating} Stars` : "Tap stars to rate"}
                </span>
              </div>

              {/* Comment Input */}
              <div>
                <textarea
                  disabled={uiState === STATE.LOADING}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all resize-none bg-gray-50 focus:bg-white"
                  rows={3}
                  placeholder="Write a review (optional)..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                ></textarea>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSubmit}
                  disabled={uiState === STATE.LOADING}
                  className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2
                      ${
                        uiState === STATE.LOADING
                          ? "bg-emerald-400 cursor-not-allowed"
                          : "bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-200/50"
                      }`}
                >
                  {uiState === STATE.LOADING ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Processing...
                    </>
                  ) : uiState === STATE.ERROR ? (
                    "Retry Submission"
                  ) : (
                    "Submit Review"
                  )}
                </button>

                <button
                  onClick={onClose}
                  disabled={uiState === STATE.LOADING}
                  className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
