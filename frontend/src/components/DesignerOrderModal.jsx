import React from "react";
import { X, Mail, Phone, MapPin, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
// useDialog removed - not currently used

const currency = (n) =>
  `Rs ${Number(n || 0).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;

const getImageUrl = (path) => {
  if (!path) return "/placeholder.svg";
  if (
    path.startsWith("http") ||
    path.startsWith("data:") ||
    path.startsWith("blob:")
  )
    return path;
  const p = path.replace(/\\/g, "/");
  if (p.startsWith("/uploads") || p.startsWith("uploads")) {
    return `http://localhost:5000${p.startsWith("/") ? "" : "/"}${p}`;
  }
  return p.startsWith("/") ? p : `/${p}`;
};

export default function DesignerOrderModal({ order, onClose, sellerId }) {
  // Calculate earnings if sellerId is provided
  const earnings = React.useMemo(() => {
    if (!order || !sellerId) return null;
    const allItems = order.items || [];
    const myItems = allItems.filter(
      (item) =>
        item.sellerId === sellerId ||
        (item.sellerId && sellerId && item.sellerId.toString() === sellerId.toString())
    );
    // If no items match, return null to skip display
    if (myItems.length === 0) return null;

    const myItemTotal = myItems.reduce((sum, item) => sum + (item.lineTotal || 0), 0);
    const totalGrossItems = allItems.reduce((sum, i) => sum + (i.lineTotal || 0), 0);
    const shipping = Number(order.totals?.shipping || 0);

    // Proportional shipping share
    const myShippingShare = totalGrossItems > 0 ? (myItemTotal / totalGrossItems) * shipping : 0;

    // Always calculate net: 90% of items + proportional shipping share
    const myNet = (myItemTotal * 0.9) + myShippingShare;

    // Determine payout status
    const myTransfer = order.escrow?.transfers?.find(t => t.sellerId && t.sellerId.toString() === sellerId.toString());
    const isReleased = order.escrow?.status === "released" || (myTransfer && myTransfer.status === "completed") || order.status === "RELEASED";

    return { myItemTotal, myNet, myShippingShare, isReleased };
  }, [order, sellerId]);

  if (!order) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-gray-50 border-b flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              Order Details #{order._id?.slice(-8)}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-6">
            {/* Buyer Info */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
                Buyer Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <UserIcon className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">
                    {order.shippingAddress?.fullName || order.buyerEmail}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>
                    {order.shippingAddress?.city},{" "}
                    {order.shippingAddress?.addressLine}
                  </span>
                </div>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                Order Items
              </h3>
              {order.items?.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-white"
                >
                  <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                    <img
                      src={getImageUrl(item.image || item.imageUrls?.[0])}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      Qty: {item.quantity} × {currency(item.unitPrice)}
                      {item.isRent && (
                        <span className="ml-2 font-semibold text-indigo-600">
                          ({item.rentDays} Days Rent)
                        </span>
                      )}
                    </p>
                    <p className="text-sm font-bold text-gray-900 mt-1">
                      Total: {currency(item.lineTotal)}
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
                <div className="flex justify-between text-gray-600 text-sm">
                  <span>Shipping</span>
                  <span>{currency(order.totals?.shipping)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg text-gray-900 pt-2 border-t">
                  <span>Grand Total</span>
                  <span>{currency(order.totals?.grandTotal)}</span>
                </div>

                {earnings && (
                  <div className="mt-4 pt-4 border-t border-dashed border-gray-200 space-y-2">
                    <div className="flex justify-between text-red-500 text-sm font-medium">
                      <span>Company Deduction (10%)</span>
                      <span>-{currency(earnings.myItemTotal * 0.1)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 text-base font-bold bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100 mt-1">
                      <span>Your Total Share</span>
                      <span>{currency(earnings.myNet)}</span>
                    </div>
                    <div className="flex justify-end pt-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${earnings.isReleased ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                        Payment {earnings.isReleased ? "Released" : "In Escrow"}
                      </span>
                    </div>
                  </div>
                )}
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
