"use client";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
// Removed unused api import
import { orderAPI } from "../utils/api";
import { readStorage, writeStorage } from "../utils/storage";
import Header from "./Header";
import Footer from "./Footer";
import OrderDetailsModal from "./OrderDetailsModal";
import {
  LayoutGrid,
  ShoppingBag,
  Heart,
  LogOut,
  Trash2,
  Eye,
  User,
  CreditCard,
  Package,
} from "lucide-react";
import { motion, Reorder } from "framer-motion";

/** Helpers */
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

  // Handle windows paths
  const cleanPath = path.replace(/\\/g, "/");
  if (cleanPath.startsWith("/uploads") || cleanPath.startsWith("uploads")) {
    return `http://localhost:5000${
      cleanPath.startsWith("/") ? cleanPath : "/" + cleanPath
    }`;
  }
  return cleanPath;
};

const getCurrentUser = () => {
  const read = (k) => {
    try {
      return JSON.parse(localStorage.getItem(k) || "null");
    } catch {
      return null;
    }
  };
  const profile = read("userProfile") || read("profile") || read("user") || {};
  const email = profile.email || localStorage.getItem("email") || "";

  const displayName =
    profile.displayName ||
    profile.fullName ||
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
    (email && email.split("@")[0]) ||
    "Buyer";

  return { displayName, email };
};

// Animation Components
const CountUp = ({ value, prefix = "", suffix = "" }) => {
  const [count, setCount] = useState(0);
  const numericValue = parseInt(String(value).replace(/[^0-9]/g, ""), 10) || 0;

  useEffect(() => {
    const duration = 2000; // 2 seconds animation
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out quart
      const ease = 1 - Math.pow(1 - progress, 4);

      setCount(Math.floor(ease * numericValue));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [numericValue]);

  return (
    <span>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
};

const Stat = ({ icon: StatIcon, label, value, tone = "emerald" }) => {
  const toneMap = {
    emerald: "from-emerald-600 to-green-600",
    blue: "from-blue-600 to-cyan-600",
    rose: "from-rose-600 to-pink-600",
    amber: "from-amber-500 to-orange-500",
    purple: "from-purple-600 to-fuchsia-600",
  };

  const isCurrency = String(value).includes("Rs");
  const numVal = isCurrency ? value : parseInt(value);

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-md hover:shadow-xl transition-all hover:-translate-y-1">
      <div
        className={`absolute inset-0 bg-gradient-to-br ${toneMap[tone]} opacity-[0.03] group-hover:opacity-[0.08] transition-opacity`}
      ></div>
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-4">
          <div
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${toneMap[tone]} flex items-center justify-center shadow-lg text-white group-hover:scale-110 transition-transform duration-300`}
          >
            <StatIcon className="h-6 w-6" />
          </div>
        </div>
        <div className="text-sm font-medium text-gray-500 mb-1">{label}</div>
        <div className="text-3xl font-bold text-gray-900">
          {isCurrency ? (
            <CountUp value={numVal} prefix="Rs " />
          ) : (
            <CountUp value={numVal} />
          )}
        </div>
      </div>
    </div>
  );
};

export default function BuyerDashboard() {
  const navigate = useNavigate();
  const [{ displayName }, setUser] = useState({ displayName: "" });
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState("overview");

  // Data
  const [orders, setOrders] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/Login", { replace: true });
      return;
    }
    setUser(getCurrentUser());

    // Check hash for active tab
    const handleHash = () => {
      if (window.location.hash) {
        const tab = window.location.hash.replace("#", "");
        if (["overview", "orders"].includes(tab)) setActive(tab);
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch Orders
        try {
          const res = await orderAPI.getMyOrders();
          setOrders(res.orders || []);
        } catch (e) {
          console.warn("Fetch orders error", e);
        }

        // Load Cart & Wishlist
        setCartItems(readStorage("cart"));
        setWishlistItems(readStorage("wishlist"));
      } catch (e) {
        console.error("Dashboard error", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Listen for storage updates
    const updateStorage = () => {
      setCartItems(readStorage("cart"));
      setWishlistItems(readStorage("wishlist"));
    };
    window.addEventListener("cartUpdated", updateStorage);
    window.addEventListener("wishlistUpdated", updateStorage);

    return () => {
      window.removeEventListener("hashchange", handleHash);
    };
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    window.location.href = "/Login";
  };

  // Reorder Handler - kept for future use
  const _handleReorderWishlist = (newOrder) => {
    setWishlistItems(newOrder);
    writeStorage("wishlist", newOrder);
  };

  // Remove handlers - kept for future use
  const _removeFromCart = (index) => {
    const newCart = [...cartItems];
    newCart.splice(index, 1);
    setCartItems(newCart);
    writeStorage("cart", newCart);
  };

  const _removeFromWishlist = (id, index) => {
    const newWish = [...wishlistItems];
    newWish.splice(index, 1);
    setWishlistItems(newWish);
    writeStorage("wishlist", newWish);
  };

  const stats = useMemo(() => {
    return {
      orders: orders.length,
      spent: orders.reduce(
        (acc, o) => acc + (o.totals?.grandTotal || o.total || 0),
        0
      ),
      wishlist: wishlistItems.length,
      cart: cartItems.length,
    };
  }, [orders, wishlistItems, cartItems]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* HERO HEADER */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 to-green-800 text-white shadow-2xl mb-10">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-emerald-400 opacity-10 rounded-full blur-3xl"></div>

          <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                  <User className="w-8 h-8 text-emerald-300" />
                </div>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
                  Buyer Hub
                </h1>
              </div>
              <p className="text-emerald-100 text-lg max-w-xl leading-relaxed opacity-90">
                Welcome back, <b>{displayName}</b>! Track your orders and manage
                your wishlist here.
              </p>
            </div>
            <button
              onClick={logout}
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm transition-all font-semibold flex items-center gap-2 group"
            >
              <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />{" "}
              Sign Out
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 pb-1">
          {[
            ["overview", "Overview"],
            ["orders", "My Orders"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActive(key)}
              className={`px-6 py-3 rounded-t-xl font-medium text-sm transition-all relative ${
                active === key
                  ? "bg-white text-emerald-900 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] border-t border-x border-gray-100 z-10"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100/50"
              }`}
            >
              {label}
              {active === key && (
                <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 rounded-t-full"></div>
              )}
            </button>
          ))}
        </div>

        <main className="min-h-[400px]">
          {loading && (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
            </div>
          )}

          {/* OVERVIEW */}
          {!loading && active === "overview" && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <h2 className="text-2xl font-bold text-gray-800">Overview</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <Stat
                  icon={ShoppingBag}
                  label="Total Orders"
                  value={stats.orders}
                  tone="emerald"
                />
                <Stat
                  icon={Heart}
                  label="Wishlist Items"
                  value={stats.wishlist}
                  tone="rose"
                />
                <Stat
                  icon={CreditCard}
                  label="Total Spent"
                  value={currency(stats.spent)}
                  tone="emerald"
                />
                <Stat
                  icon={Package}
                  label="In Cart"
                  value={stats.cart}
                  tone="amber"
                />
              </div>
            </div>
          )}

          {/* ORDERS */}
          {!loading && active === "orders" && (
            <div className="animate-in fade-in duration-500">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Order History
              </h2>
              {orders.length === 0 ? (
                <p className="text-gray-500">No orders found.</p>
              ) : (
                <div className="space-y-4">
                  {orders.map((order, i) => (
                    <motion.div
                      key={order._id || order.id || i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-mono text-sm text-gray-500">
                              #{order._id?.slice(-6).toUpperCase() || "ID"}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-700`}
                            >
                              {(order.status || "PLACED").toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-4">
                            Ordered on{" "}
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                          <div className="flex gap-2">
                            {order.items?.slice(0, 5).map((img, idx) => (
                              <img
                                key={idx}
                                src={getImageUrl(
                                  img.image || img.imageUrls?.[0]
                                )}
                                className="w-12 h-12 rounded border border-gray-200 object-cover"
                                alt="Item"
                              />
                            ))}
                            {(order.items?.length || 0) > 5 && (
                              <div className="w-12 h-12 rounded border border-gray-200 bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-500">
                                +{order.items.length - 5}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 uppercase">
                            Total
                          </p>
                          <p className="text-2xl font-bold text-gray-900">
                            {currency(order.totals?.grandTotal || order.total)}
                          </p>
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg font-medium transition-colors text-sm"
                          >
                            <Eye className="w-4 h-4" /> View Details
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <Footer />
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}
