import { useEffect, useRef } from "react";
import { AlertCircle, X, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = false,
  isLoading = false,
  showCancel = true,
}) {
  const modalRef = useRef(null);
  const confirmButtonRef = useRef(null);

  // Focus trap and keyboard nav
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      // Focus the cancel button by default for safety, or confirm if desired.
      // Usually destructive actions focus Cancel.
      setTimeout(() => modalRef.current?.focus(), 50);
    }

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity duration-200"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <motion.div
        ref={modalRef}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden focus:outline-none"
        tabIndex="-1"
      >
        {/* Header */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8 flex flex-col items-center text-center">
          {/* Icon */}
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 
            ${
              isDestructive
                ? "bg-red-100 text-red-600"
                : "bg-emerald-100 text-emerald-600"
            }`}
          >
            {isDestructive ? (
              <Trash2 className="w-8 h-8" />
            ) : (
              <AlertCircle className="w-8 h-8" />
            )}
          </div>

          {/* Content */}
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 mb-8 leading-relaxed">{message}</p>

          {/* Action Buttons */}
          <div className="flex gap-3 w-full">
            {showCancel && (
              <button
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 py-3 px-4 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 focus:ring-4 focus:ring-gray-100 transition-all"
              >
                {cancelText}
              </button>
            )}
            <button
              ref={confirmButtonRef}
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 py-3 px-4 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl focus:ring-4 transition-all
                ${
                  isDestructive
                    ? "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 focus:ring-red-100"
                    : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 focus:ring-emerald-100"
                } ${
                isLoading
                  ? "opacity-70 cursor-not-allowed"
                  : "transform hover:-translate-y-0.5"
              }`}
            >
              {isLoading ? "Processing..." : confirmText}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
