// components/RentalHistoryModal.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

const RentalHistoryModal = ({ productId, productName, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rentalData, setRentalData] = useState(null);

  useEffect(() => {
    fetchRentalHistory();
  }, [productId]);

  const fetchRentalHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:5000/api/products/${productId}/rental-history`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setRentalData(response.data);
    } catch (err) {
      console.error("Failed to fetch rental history:", err);
      setError(err.response?.data?.error || "Failed to load rental history");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Rental History</h2>
          <button className="close-button" onClick={onClose}>
            <svg
              className="close-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <h3 className="product-name">{productName || "Product"}</h3>

          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading rental history...</p>
            </div>
          )}

          {error && (
            <div className="error-state">
              <p>{error}</p>
              <button className="retry-button" onClick={fetchRentalHistory}>
                Retry
              </button>
            </div>
          )}

          {!loading && !error && rentalData && (
            <>
              {/* Current Rental */}
              {rentalData.currentRental &&
                rentalData.currentRental.status === "active" && (
                  <div className="current-rental-section">
                    <h4>Current Rental</h4>
                    <div className="rental-card active">
                      <div className="rental-info">
                        <span className="label">Start Date:</span>
                        <span className="value">
                          {formatDate(rentalData.currentRental.startDate)}
                        </span>
                      </div>
                      <div className="rental-info">
                        <span className="label">End Date:</span>
                        <span className="value">
                          {formatDate(rentalData.currentRental.endDate)}
                        </span>
                      </div>
                      <span className="status-badge active">Active</span>
                    </div>
                  </div>
                )}

              {/* Rental History */}
              <div className="history-section">
                <h4>Past Rentals</h4>
                {rentalData.rentalHistory &&
                rentalData.rentalHistory.length > 0 ? (
                  <div className="history-list">
                    {rentalData.rentalHistory.map((rental, index) => (
                      <div key={index} className="rental-card">
                        <div className="rental-info">
                          <span className="label">Start Date:</span>
                          <span className="value">
                            {formatDate(rental.startDate)}
                          </span>
                        </div>
                        <div className="rental-info">
                          <span className="label">End Date:</span>
                          <span className="value">
                            {formatDate(rental.endDate)}
                          </span>
                        </div>
                        {rental.returnedDate && (
                          <div className="rental-info">
                            <span className="label">Returned:</span>
                            <span className="value">
                              {formatDate(rental.returnedDate)}
                            </span>
                          </div>
                        )}
                        <span className={`status-badge ${rental.status}`}>
                          {rental.status === "completed"
                            ? "Completed"
                            : "Ongoing"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-state">No rental history available</p>
                )}
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="close-footer-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-container {
          background: white;
          border-radius: 12px;
          max-width: 600px;
          width: 100%;
          max-height: 80vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
            0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-header h2 {
          font-size: 20px;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }

        .close-button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          color: #6b7280;
          transition: color 0.2s;
        }

        .close-button:hover {
          color: #111827;
        }

        .close-icon {
          width: 24px;
          height: 24px;
        }

        .modal-body {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }

        .product-name {
          font-size: 16px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 2px solid #f3f4f6;
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px 20px;
          color: #6b7280;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f4f6;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 12px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .error-state {
          text-align: center;
          padding: 40px 20px;
        }

        .error-state p {
          color: #dc2626;
          margin-bottom: 16px;
        }

        .retry-button {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 8px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
        }

        .retry-button:hover {
          background: #2563eb;
        }

        .current-rental-section,
        .history-section {
          margin-bottom: 24px;
        }

        .current-rental-section h4,
        .history-section h4 {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 12px;
        }

        .rental-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 12px;
          position: relative;
        }

        .rental-card.active {
          background: #eff6ff;
          border-color: #3b82f6;
        }

        .rental-info {
          display: flex;
          justifycontent: space-between;
          margin-bottom: 8px;
        }

        .rental-info:last-of-type {
          margin-bottom: 0;
        }

        .label {
          font-weight: 500;
          color: #6b7280;
          font-size: 14px;
        }

        .value {
          font-weight: 500;
          color: #111827;
          font-size: 14px;
        }

        .status-badge {
          position: absolute;
          top: 16px;
          right: 16px;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .status-badge.active {
          background: #dcfce7;
          color: #166534;
        }

        .status-badge.completed {
          background: #e5e7eb;
          color: #374151;
        }

        .status-badge.ongoing {
          background: #fef3c7;
          color: #92400e;
        }

        .empty-state {
          text-align: center;
          color: #9ca3af;
          padding: 40px 20px;
          font-style: italic;
        }

        .history-list {
          max-height: 300px;
          overflow-y: auto;
        }

        .modal-footer {
          padding: 16px 24px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: flex-end;
        }

        .close-footer-button {
          background: #6b7280;
          color: white;
          border: none;
          padding: 10px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: background 0.2s;
        }

        .close-footer-button:hover {
          background: #4b5563;
        }
      `}</style>
    </div>
  );
};

export default RentalHistoryModal;
