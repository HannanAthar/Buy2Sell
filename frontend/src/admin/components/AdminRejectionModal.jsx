import React, { useState } from "react";
import { X, AlertTriangle } from "lucide-react";

/**
 * AdminRejectionModal - Modal for admin to provide rejection reason
 * @param {boolean} open - Whether modal is open
 * @param {object} product - Product being rejected
 * @param {function} onConfirm - Callback with rejection reason
 * @param {function} onCancel - Callback to close modal
 */
export default function AdminRejectionModal({
  open,
  product,
  onConfirm,
  onCancel,
}) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [error, setError] = useState("");

  if (!open) return null;

  const handleConfirm = () => {
    // Validation
    if (!rejectionReason.trim()) {
      setError("Rejection reason is required");
      return;
    }
    if (rejectionReason.trim().length < 10) {
      setError("Rejection reason must be at least 10 characters");
      return;
    }

    onConfirm(rejectionReason.trim());
    // Reset state
    setRejectionReason("");
    setError("");
  };

  const handleCancel = () => {
    setRejectionReason("");
    setError("");
    onCancel();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleCancel}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reject-modal-title"
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2
                id="reject-modal-title"
                className="text-xl font-bold text-gray-900"
              >
                Reject Product
              </h2>
              {product && (
                <p className="text-sm text-gray-500 mt-0.5">{product.name}</p>
              )}
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <label className="block mb-3">
            <span className="text-sm font-semibold text-gray-700 mb-2 block">
              Rejection Reason <span className="text-red-500">*</span>
            </span>
            <textarea
              value={rejectionReason}
              onChange={(e) => {
                setRejectionReason(e.target.value);
                setError("");
              }}
              placeholder="Please provide a clear reason for rejecting this product. This will be shown to the seller."
              className={`w-full px-4 py-3 border rounded-xl resize-none focus:outline-none focus:ring-2 transition-all ${
                error
                  ? "border-red-300 focus:ring-red-200"
                  : "border-gray-200 focus:ring-emerald-200 focus:border-emerald-500"
              }`}
              rows={5}
              autoFocus
            />
          </label>

          {/* Character count */}
          <div className="flex items-center justify-between text-xs mt-2">
            <span
              className={`${
                rejectionReason.length >= 10
                  ? "text-green-600"
                  : "text-gray-400"
              }`}
            >
              {rejectionReason.length} / 10 characters minimum
            </span>
            {error && <span className="text-red-600 font-medium">{error}</span>}
          </div>

          {/* Info message */}
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> The seller will receive this feedback and
              can use it to improve their submission.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <button
            onClick={handleCancel}
            className="px-6 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={
              !rejectionReason.trim() || rejectionReason.trim().length < 10
            }
            className={`px-6 py-2.5 rounded-xl font-semibold transition-all ${
              !rejectionReason.trim() || rejectionReason.trim().length < 10
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-red-600 text-white hover:bg-red-700 shadow-lg hover:shadow-red-200"
            }`}
          >
            Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  );
}
