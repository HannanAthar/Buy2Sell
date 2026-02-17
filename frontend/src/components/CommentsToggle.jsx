import React from "react";
import { ChevronDown, ChevronUp, MessageSquare } from "lucide-react";

/**
 * CommentsToggle Component
 * Reusable toggle button for expanding/collapsing product reviews
 *
 * @param {boolean} isExpanded - Current expansion state
 * @param {function} onToggle - Click handler
 * @param {number} reviewCount - Number of reviews (optional, for display)
 * @param {string} productId - Product ID for ARIA controls
 * @param {string} productName - Product name for accessibility label
 */
const CommentsToggle = ({
  isExpanded = false,
  onToggle,
  reviewCount = 0,
  productId,
  productName = "product",
}) => {
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      aria-expanded={isExpanded}
      aria-controls={`reviews-panel-${productId}`}
      aria-label={`${isExpanded ? "Hide" : "Show"} comments for ${productName}`}
      className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 pointer-events-auto z-20 relative"
      type="button"
    >
      <MessageSquare className="w-4 h-4" />
      <span className="whitespace-nowrap">
        {isExpanded ? "Hide comments" : "Comments"}
        {reviewCount > 0 && !isExpanded && (
          <span className="ml-1 text-xs text-gray-500">({reviewCount})</span>
        )}
      </span>
      {isExpanded ? (
        <ChevronUp className="w-3.5 h-3.5" />
      ) : (
        <ChevronDown className="w-3.5 h-3.5" />
      )}
    </button>
  );
};

export default CommentsToggle;
