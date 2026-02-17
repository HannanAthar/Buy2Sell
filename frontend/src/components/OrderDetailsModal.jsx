import React from "react";
import { X, Download, ShieldCheck, MapPin, User, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion"; // eslint-disable-line no-unused-vars
// import { useDialog } from "../context/DialogContext";

const currency = (n) =>
  `Rs ${Number(n || 0).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;

import CloudinaryImage from "./common/CloudinaryImage";




export default function OrderDetailsModal({ order, onClose }) {
  // const dialog = useDialog();
  if (!order) return null;



  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col relative"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-gray-50 border-b flex items-center justify-between sticky top-0 z-10">
            <h2 className="text-xl font-bold text-gray-900" id="modal-title">
              Order Details #{order._id?.slice(-8) || order.id?.slice(-8)}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-6">


            {/* Shipping Info */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Shipping Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">
                    {order.shippingAddress?.fullName ||
                      order.buyerEmail ||
                      "Guest"}
                  </span>
                </div>
                <div className="text-gray-600 pl-6">
                  <p>{order.shippingAddress?.addressLine}</p>
                  <p>
                    {order.shippingAddress?.city},{" "}
                    {order.shippingAddress?.postalCode}
                  </p>
                  <p>{order.shippingAddress?.country}</p>
                  <p className="mt-1">{order.shippingAddress?.phone}</p>
                </div>
              </div>
            </div>

            {/* Rental Agreement Section */}
            {order.rentalAgreement && (
              <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-200 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-indigo-900">
                      Rental Agreement
                    </h3>
                    <p className="text-xs text-indigo-700">
                      Verified User & Security Deposit
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                      CNIC Number
                    </p>
                    <p className="font-mono text-lg font-bold text-gray-900 bg-white px-3 py-1 rounded border border-gray-200 inline-block">
                      {order.rentalAgreement.cnic}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                      Deposit Amount
                    </p>
                    <p className="text-lg font-bold text-emerald-600">
                      {currency(order.rentalAgreement.depositAmount)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Paid via {order.rentalAgreement.paymentMethod}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Items List */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                <Package className="w-4 h-4" /> Order Items
              </h3>
              {order.items?.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:shadow-sm transition-shadow"
                >
                  <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                    <CloudinaryImage
                      src={
                        item.image || item.imageUrls?.[0] || item.customPreview
                      }
                      alt={item.name}
                      className="w-full h-full object-cover"
                      sizes="64px"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">{item.name}</p>
                    {item.isCustom && (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 mb-1">
                        Custom Design
                      </span>
                    )}
                    <p className="text-sm text-gray-500">
                      Qty: {item.quantity} × {currency(item.unitPrice)}
                      {item.isRent && (
                        <span className="ml-2 font-semibold text-indigo-600">
                          ({item.rentDays} Days Rent)
                        </span>
                      )}
                    </p>
                    <p className="text-sm font-bold text-gray-900 mt-1">
                      Total:{" "}
                      {currency(
                        item.lineTotal || item.unitPrice * item.quantity
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="flex justify-end pt-4 border-t">
              <div className="w-full max-w-xs space-y-2 text-right">
                <div className="flex justify-between text-gray-600 text-sm">
                  <span>Subtotal</span>
                  <span>{currency(order.totals?.subtotal)}</span>
                </div>
                {order.totals?.shipping > 0 && (
                  <div className="flex justify-between text-gray-600 text-sm">
                    <span>Shipping</span>
                    <span>{currency(order.totals.shipping)}</span>
                  </div>
                )}
                {order.totals?.discount > 0 && (
                  <div className="flex justify-between text-green-600 text-sm">
                    <span>Discount</span>
                    <span>-{currency(order.totals.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg text-gray-900 pt-2 border-t border-gray-200 mt-2">
                  <span>Grand Total</span>
                  <span>
                    {currency(order.totals?.grandTotal || order.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function UserIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
