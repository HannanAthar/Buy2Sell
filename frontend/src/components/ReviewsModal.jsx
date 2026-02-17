import React, { useEffect } from "react";
import { X } from "lucide-react";
import ReviewsList from "./ReviewsList";

/**
 * ReviewsModal Component
 * Mobile-optimized modal for displaying product reviews
 *
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Close handler
 * @param {string} productId - Product ID for fetching reviews
 * @param {string} productName - Product name for display
 */
const ReviewsModal = ({
  isOpen,
  onClose,
  productId,
  _productName = "Product",
}) => {
  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reviews-modal-title"
    >
      <div
        className="bg-white w-full h-[90vh] sm:h-auto sm:max-h-[80vh] sm:max-w-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/50 shrink-0">
          <h2
            id="reviews-modal-title"
            className="text-lg font-bold text-gray-900"
          >
            Customer Reviews
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Close reviews"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <ReviewsList productId={productId} autoLoad={true} />
        </div>
      </div>
    </div>
  );
};

export default ReviewsModal;
