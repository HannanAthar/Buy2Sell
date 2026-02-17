import { useEffect, useRef } from "react";
import { CheckCircle2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ConfirmationModal({
  isOpen,
  onClose,
  title = "Success",
  message,
  autoCloseDuration = 3000,
}) {
  const modalRef = useRef(null);

  // Auto-dismiss
  useEffect(() => {
    if (isOpen && autoCloseDuration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDuration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoCloseDuration, onClose]);

  // Focus trap and keyboard nav
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
      if (e.key === "Enter") onClose();
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      modalRef.current?.focus();
    }

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        onClick={onClose} // Close on overlay click
      >
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          onClick={(e) => e.stopPropagation()} // Prevent close on modal click
          className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden focus:outline-none"
          tabIndex="-1"
        >
          {/* Header & Close Button */}
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-8 flex flex-col items-center text-center">
            {/* Icon */}
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            {/* Content */}
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600 mb-8 leading-relaxed">{message}</p>

            {/* Action Button */}
            <button
              onClick={onClose}
              className="w-full py-3 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-emerald-600 hover:to-teal-600 transform hover:-translate-y-0.5 transition-all focus:ring-4 focus:ring-emerald-100 outline-none"
            >
              OK
            </button>
          </div>

          {/* Progress bar (Visual flair for auto-dismiss) */}
          {autoCloseDuration > 0 && (
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{
                duration: autoCloseDuration / 1000,
                ease: "linear",
              }}
              className="h-1 bg-emerald-500/20 absolute bottom-0 left-0"
            />
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
