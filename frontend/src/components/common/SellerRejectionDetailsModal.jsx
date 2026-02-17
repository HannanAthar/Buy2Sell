import React from "react";
import { X, AlertCircle } from "lucide-react";

/**
 * SellerRejectionDetailsModal - Displays rejection details to sellers
 * @param {boolean} open - Whether modal is open
 * @param {object} product - Rejected product data
 * @param {function} onClose - Callback to close modal
 */
export default function SellerRejectionDetailsModal({
  open,
  product,
  onClose,
}) {
  if (!open || !product) return null;

  const getImageUrl = (path) => {
    if (!path) return "/placeholder.svg";
    if (
      path.startsWith("http") ||
      path.startsWith("data:") ||
      path.startsWith("blob:")
    )
      return path;
    const cleanPath = path.replace(/\\/g, "/");
    if (cleanPath.startsWith("/uploads") || cleanPath.startsWith("uploads")) {
      return `http://localhost:5000${
        cleanPath.startsWith("/") ? cleanPath : "/" + cleanPath
      }`;
    }
    return cleanPath;
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="rejection-details-title"
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-red-50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2
                id="rejection-details-title"
                className="text-xl font-bold text-red-900"
              >
                Product Rejection Details
              </h2>
              <p className="text-sm text-red-700 mt-0.5">
                Your product submission was not approved
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-red-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-red-600" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Product Info */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
              <img
                src={getImageUrl(product.images?.[0] || product.image)}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 truncate">
                {product.name}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Rejected on {formatDate(product.rejectionDate)}
              </p>
            </div>
          </div>

          {/* Rejection Reason */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Reason for Rejection:
            </label>
            <div className="p-5 bg-red-50 border-2 border-red-200 rounded-xl">
              <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                {product.rejectionReason || "No reason provided"}
              </p>
            </div>
          </div>

          {/* Action Guidance */}
          <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl">
            <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Next Steps
            </h4>
            <p className="text-sm text-amber-800 leading-relaxed">
              Please collect your product from the warehouse or update and
              resubmit.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-8 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors shadow-lg hover:shadow-emerald-200"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
}
