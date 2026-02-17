import React from "react";
import { Star } from "lucide-react";

/**
 * RatingStars Component
 * @param {number} rating - Current rating (0-5)
 * @param {boolean} interactive - Whether user can click to change
 * @param {function} onChange - Callback (rating) => {} when clicked
 * @param {number} size - Size of stars in px/classes (default 16)
 */
export default function RatingStars({
  rating = 0,
  interactive = false,
  onChange,
  size = 16,
  className = "",
}) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {stars.map((star) => {
        const isFull = rating >= star;

        return (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange && onChange(star)}
            className={`transition-all ${
              interactive
                ? "cursor-pointer hover:scale-110 active:scale-95"
                : "cursor-default"
            }`}
          >
            <Star
              size={size}
              className={`${
                isFull
                  ? "fill-amber-400 text-amber-400"
                  : "fill-gray-100 text-gray-300"
              }`}
              style={{
                filter: isFull
                  ? "drop-shadow(0 0 1px rgba(251, 191, 36, 0.5))"
                  : "none",
              }}
            />
          </button>
        );
      })}
    </div>
  );
}
