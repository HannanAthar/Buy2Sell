import { useEffect, useRef } from "react";
import { AlertCircle, CheckCircle, Info, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function MessageModal({
  isOpen,
  onClose,
  title,
  message,
  buttonText = "OK",
  type = "info", // "info" | "success" | "error" | "warning"
}) {
  const modalRef = useRef(null);
  const buttonRef = useRef(null);

  // Focus trap and keyboard nav
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      setTimeout(() => buttonRef.current?.focus(), 50);
    }

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "error":
        return <AlertCircle className="w-8 h-8" />;
      case "success":
        return <CheckCircle className="w-8 h-8" />;
      case "warning":
        return <AlertCircle className="w-8 h-8" />;
      default:
        return <Info className="w-8 h-8" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case "error":
        return {
          bg: "bg-red-100",
          text: "text-red-600",
          button:
            "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 focus:ring-red-100",
        };
      case "success":
        return {
          bg: "bg-emerald-100",
          text: "text-emerald-600",
          button:
            "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 focus:ring-emerald-100",
        };
      case "warning":
        return {
          bg: "bg-amber-100",
          text: "text-amber-600",
          button:
            "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 focus:ring-amber-100",
        };
      default:
        return {
          bg: "bg-blue-100",
          text: "text-blue-600",
          button:
            "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 focus:ring-blue-100",
        };
    }
  };

  const colors = getColors();

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        onClick={onClose}
      >
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden focus:outline-none"
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
              className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${colors.bg} ${colors.text}`}
            >
              {getIcon()}
            </div>

            {/* Content */}
            <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600 mb-8 leading-relaxed text-sm">
              {message}
            </p>

            {/* Action Button */}
            <button
              ref={buttonRef}
              onClick={onClose}
              className={`w-full py-3 px-6 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl focus:ring-4 transition-all transform hover:-translate-y-0.5 ${colors.button}`}
            >
              {buttonText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
