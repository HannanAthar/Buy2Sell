import { useState, useEffect } from "react";
import {
  Package,
  Calendar,
  MapPin,
  CreditCard,
  Download,
  Eye,
} from "lucide-react";
import { orderAPI } from "../utils/api";
import api from "../api/axios";
import toast from "react-hot-toast";
import RatingStars from "./RatingStars";
import { motion, AnimatePresence } from "framer-motion";

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [ratingsMap, setRatingsMap] = useState({}); // { productId: rating }

  useEffect(() => {
    fetchOrders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await orderAPI.getMyOrders();
      const fetchedOrders = data.orders || [];
      setOrders(fetchedOrders);

      // Fetch ratings for these orders
      await fetchRatingsForOrders(fetchedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const fetchRatingsForOrders = async (ordersList) => {
    const productIdsToCheck = new Set();
    ordersList.forEach((order) => {
      if (
        ["delivered", "completed", "shipped"].includes(
          String(order.status).toLowerCase()
        )
      ) {
        (order.items || []).forEach((item) => {
          const pid = item.id || item._id || item.productId;
          if (pid) productIdsToCheck.add(pid);
        });
      }
    });

    if (productIdsToCheck.size === 0) return;

    // Use Promise.all to fetch ratings (MVP approach)
    // Ideally we would have a batch endpoint
    const newRatings = {};
    await Promise.all(
      Array.from(productIdsToCheck).map(async (pid) => {
        try {
          const { data } = await api.get(`/reviews/user/${pid}`);
          if (data.rated) {
            newRatings[pid] = data.rating;
          }
        } catch {
          // ignore 404/errors
        }
      })
    );

    setRatingsMap((prev) => ({ ...prev, ...newRatings }));
  };

  const handleRate = async (rating, item) => {
    const maxAttempts = 3;
    let attempt = 0;

    while (attempt < maxAttempts) {
      attempt++;

      try {
        const productId = item.id || item._id || item.productId;
        if (!productId) return;

        // Optimistic update
        setRatingsMap((prev) => ({ ...prev, [productId]: rating }));

        if (attempt === 1) {
          toast.success("Submitting rating...");
        } else {
          toast.loading(`Retrying... (${attempt}/${maxAttempts})`);
        }

        await api.post(
          "/reviews/submit",
          {
            productId,
            rating,
            source: "order_history",
          },
          {
            timeout: 30000,
          }
        );

        toast.dismiss();
        toast.success("Rating submitted!");
        return; // Exit on success
      } catch (error) {
        console.error(
          `Rating failed (Attempt ${attempt}/${maxAttempts}):`,
          error
        );

        if (attempt >= maxAttempts) {
          toast.dismiss();
          toast.error(
            error.response?.data?.error ||
              "Failed to submit rating after multiple attempts"
          );
          // Revert optimistic update on final failure
          const productId = item.id || item._id || item.productId;
          setRatingsMap((prev) => {
            const updated = { ...prev };
            delete updated[productId];
            return updated;
          });
          return;
        }

        // Wait before retry (exponential backoff: 1s, 2s)
        const delay = attempt * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        // Continue to next attempt
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      processing: "bg-purple-100 text-purple-800",
      shipped: "bg-indigo-100 text-indigo-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      paid_held: "bg-amber-100 text-amber-800",
    };
    return colors[status?.toLowerCase()] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    return `Rs ${Number(amount || 0).toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No orders yet
        </h3>
        <p className="text-gray-500">
          When you place orders, they will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">My Orders</h2>
        <span className="text-sm text-gray-500">
          {orders.length} total orders
        </span>
      </div>

      <motion.div
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1,
            },
          },
        }}
        className="grid gap-4"
      >
        {orders.map((order) => (
          <motion.div
            key={order._id}
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: { opacity: 1, y: 0 },
            }}
            className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
          >
            {/* Order Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Order ID</p>
                    <p className="font-mono text-sm font-medium">
                      #{order._id.slice(-8)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    {formatDate(order.createdAt)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {order.status === "PAID_HELD"
                      ? "Placed"
                      : order.status || "Pending"}
                  </span>
                  <button
                    onClick={() =>
                      setSelectedOrder(
                        selectedOrder?._id === order._id ? null : order
                      )
                    }
                    className="text-emerald-600 hover:text-emerald-700 font-medium text-sm flex items-center gap-1"
                  >
                    <Eye className="h-4 w-4" />
                    {selectedOrder?._id === order._id ? "Hide" : "View"} Details
                  </button>
                </div>
              </div>
            </div>

            {/* Order Items Preview */}
            <div className="p-4">
              <div className="flex items-center gap-4 mb-3">
                <Package className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">
                  {order.items?.length || 0} item(s)
                </span>
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                {order.items?.slice(0, 4).map((item, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={
                        item.imageUrls?.[0] ||
                        item.image ||
                        item.customPreview ||
                        "/placeholder.svg"
                      }
                      alt={item.name}
                      className="w-full h-24 object-cover rounded border border-gray-200"
                      onError={(e) =>
                        (e.currentTarget.src = "/placeholder.svg")
                      }
                    />
                    {item.isCustom && (
                      <span className="absolute top-1 right-1 bg-purple-600 text-white text-xs px-2 py-0.5 rounded">
                        Custom
                      </span>
                    )}
                  </div>
                ))}
                {order.items?.length > 4 && (
                  <div className="flex items-center justify-center h-24 bg-gray-100 rounded border border-gray-200">
                    <span className="text-sm font-medium text-gray-600">
                      +{order.items.length - 4} more
                    </span>
                  </div>
                )}
              </div>

              {/* Order Summary */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CreditCard className="h-4 w-4" />
                  <span className="capitalize">
                    {order.payment?.method || "N/A"}
                  </span>
                  <span
                    className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                      order.payment?.status === "paid"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {order.payment?.status || "Pending"}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(order.totals?.grandTotal)}
                  </p>
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {selectedOrder?._id === order._id && (
              <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-4">
                {/* Shipping Address */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Shipping Address
                  </h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p className="font-medium">
                      {order.shippingAddress?.fullName}
                    </p>
                    <p>{order.shippingAddress?.addressLine}</p>
                    <p>
                      {order.shippingAddress?.city},{" "}
                      {order.shippingAddress?.postalCode}
                    </p>
                    <p>{order.shippingAddress?.country}</p>
                    <p>Phone: {order.shippingAddress?.phone}</p>
                    <p>Email: {order.shippingAddress?.email}</p>
                  </div>
                </div>

                {/* Items List */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Order Items
                  </h4>
                  <div className="space-y-2">
                    {order.items?.map((item, idx) => {
                      const productId = item.id || item._id || item.productId;
                      const canRate = [
                        "delivered",
                        "completed",
                        "shipped",
                      ].includes(String(order.status).toLowerCase());
                      const currentRating = ratingsMap[productId] || 0;

                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-2 bg-white rounded border border-gray-200"
                        >
                          <img
                            src={
                              item.imageUrls?.[0] ||
                              item.image ||
                              item.customPreview ||
                              "/placeholder.svg"
                            }
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded"
                            onError={(e) =>
                              (e.currentTarget.src = "/placeholder.svg")
                            }
                          />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.name}</p>
                            {item.isCustom && (
                              <span className="text-xs text-purple-600 block">
                                🎨 Custom Design
                              </span>
                            )}
                            <p className="text-xs text-gray-500">
                              Qty: {item.quantity}
                              {item.isRent && (
                                <span className="ml-2 font-semibold text-indigo-600">
                                  ({item.rentDays} Days Rent)
                                </span>
                              )}
                            </p>
                            {canRate && !item.isCustom && (
                              <div className="mt-1">
                                <RatingStars
                                  rating={currentRating}
                                  interactive={true}
                                  onChange={(r) => handleRate(r, item)}
                                  size={16}
                                />
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {formatCurrency(item.unitPrice)}
                            </p>
                            <p className="text-xs text-gray-500">
                              Total:{" "}
                              {formatCurrency(
                                item.lineTotal || item.unitPrice * item.quantity
                              )}
                            </p>
                          </div>
                          {item.isCustom && item.imageUrls?.length > 0 && (
                            <button
                              onClick={() =>
                                window.open(item.imageUrls[0], "_blank")
                              }
                              className="text-emerald-600 hover:text-emerald-700"
                              title="View design"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="bg-white p-3 rounded border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Price Breakdown
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span>{formatCurrency(order.totals?.subtotal)}</span>
                    </div>
                    {order.totals?.shipping > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Shipping</span>
                        <span>{formatCurrency(order.totals.shipping)}</span>
                      </div>
                    )}
                    {order.totals?.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>-{formatCurrency(order.totals.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200">
                      <span>Total</span>
                      <span>{formatCurrency(order.totals?.grandTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default MyOrders;
