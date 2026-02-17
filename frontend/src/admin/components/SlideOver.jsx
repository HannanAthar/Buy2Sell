import { X } from "lucide-react";

export default function SlideOver({ open, onClose, title, children, footer }) {
  return (
    <div
      className={`${
        open ? "visible" : "invisible"
      } fixed inset-0 z-50 transition-all duration-300`}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-gradient-to-br from-black/60 to-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl transition-transform duration-300 flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex-none px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-green-50 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl hover:bg-white/80 text-gray-500 hover:text-gray-700 transition-all flex items-center justify-center shadow-sm border border-gray-200"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-white to-gray-50">
          {children}
        </div>

        {/* Footer */}
        <div className="flex-none px-6 py-4 border-t border-gray-200 bg-white shadow-lg z-10">
          {footer}
        </div>
      </div>
    </div>
  );
}
