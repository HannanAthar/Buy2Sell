// components/RentalBadge.jsx
import React from "react";

const RentalBadge = ({ product }) => {
  // IMPORTANT: Only show "ALREADY RENTED" when:
  // 1. Product is for rent (listingType === 'rent')
  // 2. Stock is 0 (no units available)
  const isRentalProduct = product?.listingType === "rent";
  const isOutOfStock = product?.stock === 0 || product?.stockQty === 0;

  if (!product || !isRentalProduct || !isOutOfStock) {
    return null;
  }

  return (
    <div className="rental-badge-overlay">
      <div className="rental-badge-content">
        <svg
          className="rental-badge-icon"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <span className="rental-badge-text">ALREADY RENTED</span>
      </div>

      <style jsx>{`
        .rental-badge-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.75);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          backdrop-filter: blur(2px);
          pointer-events: none;
        }

        .rental-badge-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          animation: fadeIn 0.3s ease-in;
        }

        .rental-badge-icon {
          width: 48px;
          height: 48px;
          color: #fff;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        }

        .rental-badge-text {
          color: #fff;
          font-size: 18px;
          font-weight: 700;
          letter-spacing: 1px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
          background: rgba(220, 38, 38, 0.9);
          padding: 8px 20px;
          border-radius: 4px;
          border: 2px solid #fff;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @media (max-width: 640px) {
          .rental-badge-icon {
            width: 36px;
            height: 36px;
          }

          .rental-badge-text {
            font-size: 14px;
            padding: 6px 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default RentalBadge;
