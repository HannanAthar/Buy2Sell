// DesignerDashboard.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { orderAPI } from "../utils/api";
// Removed: readStorage, writeStorage (unused)
import Header from "./Header";
import Footer from "./Footer";
import MyOrders from "./MyOrders";
import ConfirmModal from "./common/ConfirmModal";
import SellerRejectionDetailsModal from "./common/SellerRejectionDetailsModal";
import {
  LayoutGrid,
  Package,
  ShoppingCart,
  Heart,
  ListChecks,
  LogOut,
  PlusCircle,
  Pencil,
  Trash2,
  Save,
  X,
  TrendingUp,
  Palette,
  ShoppingBag,
  Sparkles,
  Check,
  Eye,
  CreditCard,
  Wallet,
} from "lucide-react";
// motion is used below in JSX for animations
import { motion } from "framer-motion"; // Used in JSX
import { ToastContainer, useToast } from "./Toast";
import DesignerOrderModal from "./DesignerOrderModal";
import OrderDetailsModal from "./OrderDetailsModal";
import DesignerReviews from "./DesignerReviews";
import RentalBadge from "./RentalBadge";
import RentalHistoryModal from "./RentalHistoryModal";
import SellerWalletView from "./common/SellerWalletView";

/** helpers */
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

  // Fix windows paths
  const cleanPath = path.replace(/\\/g, "/");

  // Case 1: Already has uploads prefix
  if (cleanPath.startsWith("/uploads") || cleanPath.startsWith("uploads")) {
    const finalPath = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
    return `http://localhost:5000${finalPath}`;
  }

  // Case 2: Just a filename with extension (e.g. "image.png") -> assume backend upload
  if (
    !cleanPath.startsWith("/") &&
    /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(cleanPath)
  ) {
    return `http://localhost:5000/uploads/${cleanPath}`;
  }

  // Case 3: Absolute local path or other -> serve as is (ensure leading slash)
  return cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
};

const CountUp = ({ value, prefix = "", suffix = "" }) => {
  const [count, setCount] = useState(0);
  const numericValue = parseInt(String(value).replace(/[^0-9]/g, ""), 10) || 0;

  useEffect(() => {
    const duration = 2000;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(ease * numericValue));
      if (progress < 1) requestAnimationFrame(animate);
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

const Stat = ({ icon: _StatIcon, label, value, tone = "emerald" }) => {
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
            <_StatIcon className="h-6 w-6" />
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

const getCurrentUser = () => {
  const read = (k) => {
    try {
      return JSON.parse(localStorage.getItem(k) || "null");
    } catch {
      return null;
    }
  };
  const role = localStorage.getItem("role") || "designer";
  const designer = read("designer") || {};
  const profile = read("userProfile") || read("profile") || read("user") || {};

  const email = profile.email || localStorage.getItem("email") || "";
  const base =
    designer.id ||
    profile.id ||
    profile.uid ||
    (email.includes("@")
      ? email.split("@")[0]
      : localStorage.getItem("token") || "guest");

  const uid = String(base).replace(/[^a-zA-Z0-9_-]/g, "_");

  const displayName =
    designer.brandName ||
    profile.displayName ||
    profile.fullName ||
    profile.name ||
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
    (email && email.split("@")[0]) ||
    "Designer";

  return { uid, role, displayName };
};

export default function DesignerDashboard() {
  const navigate = useNavigate();
  const [isReady, setIsReady] = useState(false);
  const [{ uid, displayName }, setUser] = useState({
    uid: "",
    role: "",
    displayName: "",
  });

  const { toasts, addToast, removeToast } = useToast();

  // Data
  const [myDesigns, setMyDesigns] = useState([]);
  const [sales, setSales] = useState([]); // Seller orders
  const [purchases, setPurchases] = useState([]); // Buyer orders
  const [_cartItems, _setCartItems] = useState([]);
  const [_wishlistItems, _setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);

  // States
  const [active, setActive] = useState("overview");
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    type: null,
    id: null,
    title: "",
    message: "",
  });
  const [deleting, setDeleting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [rejectionDetailsModal, setRejectionDetailsModal] = useState({
    open: false,
    product: null,
  });
  const [_orderModalOpen, _setOrderModalOpen] = useState(false);
  const [_orderDetailsModalOpen, _setOrderDetailsModalOpen] = useState(false);

  // Rental management state
  const [showRentalHistory, setShowRentalHistory] = useState(false);
  const [selectedRentalProduct, setSelectedRentalProduct] = useState(null);
  // Rental Management
  const [_rentalHistoryModal, _setRentalHistoryModal] = useState({
    open: false,
    rental: null,
  });

  // Editing // Modals
  const [editingIndex, setEditingIndex] = useState(null);
  const [editDraft, setEditDraft] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    imageFile: null,
    imagePreview: null,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const r = (localStorage.getItem("role") || "").trim().toLowerCase();
    if (!token || r !== "designer") {
      console.warn("🔐 DesignerDashboard: Protection redirecting to login", {
        hasToken: !!token,
        role: r,
      });
      localStorage.setItem("redirectAfterLogin", "/designer/dashboard");
      navigate("/Login", { replace: true });
      return;
    }
    console.log("✅ DesignerDashboard: Auth check passed", { role: r });
    setUser(getCurrentUser());
    setIsReady(true);

    // Check hash for direct tab navigation
    const checkHash = () => {
      if (window.location.hash) {
        const tab = window.location.hash.replace("#", "");
        if (
          [
            "overview",
            "manage",
            "sales",
            "purchases",
            "reviews",
            "wallet",
          ].includes(tab)
        ) {
          setActive(tab);
        }
      }
    };
    checkHash();
    window.addEventListener("hashchange", checkHash);
    return () => window.removeEventListener("hashchange", checkHash);
  }, [navigate]);

  useEffect(() => {
    if (!uid) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Profile
        try {
          const { data } = await api.get("/designer/profile");
          if (data.success) setProfileData(data.designer);
        } catch (e) {
          console.warn("Fetch profile error", e);
        }

        // Products
        try {
          const { data } = await api.get("/products/my/products");
          if (data.success) setMyDesigns(data.products || []);
        } catch (e) {
          console.warn("Fetch products error", e);
        }

        // Sales
        try {
          // Fixed: use api.get directly for seller orders
          const salesRes = await api.get("/orders/sales");
          setSales(salesRes.data?.orders || []);
        } catch (e) {
          console.warn("Fetch sales error", e);
        }

        // Purchases
        try {
          const purchaseRes = await orderAPI.getMyOrders();
          setPurchases(purchaseRes.orders || []);
        } catch (e) {
          console.warn("Fetch purchases error", e);
        }
      } catch (err) {
        console.error("DesignerDashboard data error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [uid]);

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/Login";
  };

  const startEdit = (i) => {
    const p = myDesigns[i];
    setEditingIndex(i);
    setEditDraft({
      name: p.name || "",
      description: p.description || "",
      price: p.price || "",
      stock: p.stock || p.stockQty || 0,
      imageFile: null,
      imagePreview: null,
    });
  };

  const cancelEdit = () => {
    if (editDraft.imagePreview && editDraft.imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(editDraft.imagePreview);
    }
    setEditingIndex(null);
    setEditDraft({
      name: "",
      description: "",
      price: "",
      stock: "",
      imageFile: null,
      imagePreview: null,
    });
  };

  const saveEdit = async (i) => {
    const p = myDesigns[i];
    try {
      let updatedProduct;

      // ALWAYS Use FormData to ensure compatibility with backend multer middleware
      const formData = new FormData();
      formData.append("name", editDraft.name);
      formData.append("description", editDraft.description);
      formData.append("price", editDraft.price);
      formData.append("stock", editDraft.stock);

      if (editDraft.imageFile) {
        formData.append("images", editDraft.imageFile);
      }

      const res = await api.put(`/products/${p._id || p.id}`, formData);
      updatedProduct = res.data?.product || res.data;

      const updated = [...myDesigns];
      updated[i] = { ...updated[i], ...updatedProduct };
      setMyDesigns(updated);

      setMyDesigns(updated);

      setShowSuccessModal(true);
      cancelEdit();
      addToast("Design updated successfully", "success");
    } catch (e) {
      console.error("Update failed", e);
      addToast("Failed to update design", "error");
    }
  };

  const removeProduct = (i) => {
    const p = myDesigns[i];
    setDeleteModal({
      open: true,
      type: "product",
      id: p._id,
      title: "Delete Design",
      message: `Are you sure you want to delete "${p.name}"? This action cannot be undone.`,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.id) return;
    setDeleting(true);

    try {
      if (deleteModal.type === "product") {
        await api.delete(`/products/${deleteModal.id}`);
        setMyDesigns((prev) => prev.filter((p) => p._id !== deleteModal.id));
      }
      setDeleteModal({ ...deleteModal, open: false });
    } catch (err) {
      console.error("Delete failed:", err);
      addToast("Failed to delete item", "error");
    } finally {
      setDeleting(false);
    }
  };

  // Sales Status Update - kept for future use
  const _handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      setSales((prev) =>
        prev.map((o) =>
          (o._id || o.id) === orderId ? { ...o, status: newStatus } : o
        )
      );
      addToast("Order status updated", "success");
    } catch (err) {
      console.error("Update status error:", err);
      addToast(err.response?.data?.error || "Failed to update status", "error");
    }
  };

  // Rental Management Handlers
  const handleRelist = async (productId) => {
    try {
      const res = await api.post(`/products/${productId}/mark-available`);

      // Update local state immediately to reflect changes
      if (res.data.success) {
        setMyDesigns((prev) =>
          prev.map((p) => {
            if ((p._id || p.id) === productId) {
              // If backend returned the updated product, use it (merged with current)
              // otherwise use optimistic values
              const updated = res.data.product || {};
              return {
                ...p,
                ...updated,
                stock: 1, // Force these important fields
                stockQty: 1,
                isActive: true,
                rentalStatus: "available",
              };
            }
            return p;
          })
        );
        addToast("Product relisted successfully", "success");
      }
    } catch (err) {
      console.error("Relist error:", err);
      addToast(
        err.response?.data?.error || "Failed to relist product",
        "error"
      );
    }
  };

  const handleViewRentalHistory = (product) => {
    setSelectedRentalProduct(product);
    setShowRentalHistory(true);
  };

  // Payout setup - kept for future wallet integration
  const _setupPayouts = async () => {
    try {
      const { data } = await api.post("/payments/connect/onboarding");
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Setup payouts error:", err);
      addToast("Failed to start payout setup", "error");
    }
  };
  const stats = useMemo(() => {
    let grossSales = 0;
    let netEarnings = 0;

    sales.forEach((o) => {
      // Calculate my share of the sales
      const myShare = o.items.reduce((acc, item) => {
        if (
          item.sellerId &&
          uid &&
          item.sellerId.toString() === uid.toString()
        ) {
          return acc + (item.lineTotal || 0);
        }
        return acc;
      }, 0);

      grossSales += myShare;

      // Calculate Net Earnings (released/completed only)
      const isReleased =
        (o.payment?.method === "card" &&
          (o.escrow?.status === "released" || o.status === "RELEASED")) ||
        (o.payment?.method === "cod" && o.status === "completed") ||
        (o.payment?.method === "wallet" && o.status === "completed") ||
        o.status === "completed" ||
        o.status === "DELIVERED";

      if (isReleased) {
        netEarnings += myShare * 0.9;
      }
    });

    return {
      totalDesigns: myDesigns.length,
      totalSales: sales.length,
      totalPurchases: purchases.length,
      grossSales,
      netEarnings,
    };
  }, [myDesigns, sales, purchases, uid]);

  if (!isReady) return null;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 to-green-800 text-white shadow-2xl mb-10">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-emerald-400 opacity-10 rounded-full blur-3xl"></div>

          <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                  <Palette className="w-8 h-8 text-emerald-300" />
                </div>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
                  Designer Studio
                </h1>
              </div>
              <p className="text-emerald-100 text-lg max-w-xl leading-relaxed opacity-90">
                Hi <b>{displayName}</b>! Manage your collections and orders in
                one place.
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

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 pb-1">
          {[
            ["overview", "Overview"],
            ["manage", "My Designs"],
            ["sales", "Client Orders"],
            ["purchases", "My Orders"],
            ["reviews", "Reviews"],
            ["wallet", "Wallet"],
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

          {!loading && active === "overview" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <h2 className="text-2xl font-bold text-gray-800">Overview</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <Stat
                  icon={LayoutGrid}
                  label="Total Designs"
                  value={stats.totalDesigns}
                  tone="emerald"
                />
                <Stat
                  icon={ListChecks}
                  label="Orders Received"
                  value={stats.totalSales}
                  tone="amber"
                />
                <Stat
                  icon={TrendingUp}
                  label="Total Sales (Gross)"
                  value={currency(stats.grossSales)}
                  tone="blue"
                />
                <Stat
                  icon={CreditCard}
                  label="Net Earnings (Paid)"
                  value={currency(stats.netEarnings)}
                  tone="emerald"
                />
                <Stat
                  icon={ShoppingBag}
                  label="My Purchases"
                  value={stats.totalPurchases}
                  tone="purple"
                />
              </div>
            </motion.div>
          )}

          {/* REVIEWS */}
          {!loading && active === "reviews" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <DesignerReviews />
            </motion.div>
          )}

          {/* WALLET */}
          {!loading && active === "wallet" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <SellerWalletView role="designer" profile={profileData} />
            </motion.div>
          )}

          {/* MANAGE DESIGNS */}
          {!loading && active === "manage" && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900">My Designs</h2>
                <button
                  onClick={() => (window.location.href = "/designer-upload")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-all shadow-lg hover:shadow-emerald-200"
                >
                  <PlusCircle className="w-5 h-5" />
                  New Design
                </button>
              </div>

              {myDesigns.length === 0 ? (
                <div className="bg-white rounded-3xl p-16 border-2 border-dashed border-gray-200 text-center">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No designs yet
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Create your first custom clothing design!
                  </p>
                  <button
                    onClick={() => (window.location.href = "/designer-upload")}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-all shadow-lg"
                  >
                    <PlusCircle className="w-5 h-5" />
                    Start Creating
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {myDesigns.map((p, i) => (
                    <ManageCard
                      key={p._id || i}
                      product={p}
                      i={i}
                      isEditing={editingIndex === i}
                      onEdit={() => startEdit(i)}
                      onDelete={() => removeProduct(i)}
                      cancelEdit={cancelEdit}
                      saveEdit={() => saveEdit(i)}
                      editDraft={editDraft}
                      setEditDraft={setEditDraft}
                      onViewRejection={(product) =>
                        setRejectionDetailsModal({ open: true, product })
                      }
                      onRelist={handleRelist}
                      onViewHistory={handleViewRentalHistory}
                    />
                  ))}
                </div>
              )}
            </motion.section>
          )}

          {!loading && active === "sales" && (
            <section className="animate-in fade-in duration-500">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Client Orders
              </h2>
              {sales.length === 0 ? (
                <p className="text-gray-500">No orders received yet.</p>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 font-semibold text-gray-600">
                      <tr>
                        <th className="px-6 py-4">Order #</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Client Info</th>
                        <th className="px-6 py-4">Product Details</th>
                        <th className="px-6 py-4">Total</th>
                        <th className="px-6 py-4">My Earnings</th>
                        <th className="px-6 py-4">Escrow</th>
                        <th className="px-6 py-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {sales.map((order) => (
                        <tr
                          key={order._id || order.id}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 font-mono text-gray-500">
                            #{(order._id || order.id).slice(-6)}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                ["completed", "delivered", "RELEASED"].includes(
                                  order.status
                                )
                                  ? "bg-green-100 text-green-700"
                                  : ["cancelled", "rejected"].includes(
                                      order.status
                                    )
                                  ? "bg-red-100 text-red-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {order.status === "PAID_HELD"
                                ? "PLACED"
                                : (order.status === "RELEASED"
                                    ? "COMPLETED"
                                    : order.status || "PLACED"
                                  ).toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col text-sm">
                              <span className="font-medium text-gray-900">
                                {order.shippingAddress?.fullName || "Guest"}
                              </span>
                              <span className="text-gray-500 text-xs">
                                {order.shippingAddress?.city},{" "}
                                {order.shippingAddress?.addressLine}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-3 min-w-[200px]">
                              {order.items
                                .filter(
                                  (item) =>
                                    item.sellerId === uid ||
                                    (item.sellerId &&
                                      uid &&
                                      item.sellerId.toString() ===
                                        uid.toString())
                                )
                                .map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-3"
                                  >
                                    <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                                      <img
                                        src={getImageUrl(
                                          item.image || item.imageUrls?.[0]
                                        )}
                                        alt={item.name}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p
                                        className="font-medium text-gray-900 text-xs line-clamp-1"
                                        title={item.name}
                                      >
                                        {item.name}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        Qty: {item.quantity} ×{" "}
                                        {currency(item.unitPrice)}
                                        {item.isRent && (
                                          <span className="ml-2 font-semibold text-indigo-600">
                                            ({item.rentDays} Days Rent)
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-bold">
                            {currency(order.totals?.grandTotal || order.total)}
                          </td>
                          <td className="px-6 py-4">
                            {(() => {
                              const myItems = order.items.filter(
                                (item) =>
                                  item.sellerId === uid ||
                                  (item.sellerId &&
                                    uid &&
                                    item.sellerId.toString() === uid.toString())
                              );
                              const myItemTotal = myItems.reduce(
                                (sum, item) => sum + (item.lineTotal || 0),
                                0
                              );

                              const totalGrossItems = order.items.reduce(
                                (sum, i) => sum + (i.lineTotal || 0),
                                0
                              );
                              const shipping = Number(
                                order.totals?.shipping || 0
                              );
                              const myShippingShare =
                                totalGrossItems > 0
                                  ? (myItemTotal / totalGrossItems) * shipping
                                  : 0;

                              // Always calculate net: 90% of items + shipping share
                              const myNet = myItemTotal * 0.9 + myShippingShare;

                              return (
                                <div className="flex flex-col text-xs">
                                  <span className="text-gray-600">
                                    Gross: {currency(myItemTotal)}
                                  </span>
                                  <span className="text-emerald-700 font-bold">
                                    Net: {currency(myNet)}
                                  </span>
                                </div>
                              );
                            })()}
                          </td>
                          <td className="px-6 py-4">
                            {(() => {
                              const myTransfer = order.escrow?.transfers?.find(
                                (t) =>
                                  t.sellerId &&
                                  t.sellerId.toString() === uid?.toString()
                              );
                              const isReleased =
                                order.escrow?.status === "released" ||
                                (myTransfer &&
                                  myTransfer.status === "completed") ||
                                order.status === "RELEASED";

                              return (
                                <span
                                  className={`px-2 py-1 rounded text-[10px] font-bold ${
                                    isReleased
                                      ? "bg-green-100 text-green-700"
                                      : "bg-amber-100 text-amber-700"
                                  }`}
                                >
                                  {isReleased ? "RELEASED" : "HELD"}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="ml-2 p-1 text-gray-500 hover:text-emerald-600 transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {!loading && active === "purchases" && (
            <div className="animate-in fade-in duration-500">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                My Orders
              </h2>
              {purchases.length === 0 ? (
                <p className="text-gray-500">No purchases found.</p>
              ) : (
                <div className="grid gap-6">
                  {purchases.map((order, idx) => {
                    const orderId = order._id || order.id || "";
                    return (
                      <motion.div
                        key={orderId || idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-all"
                      >
                        <div className="flex items-start justify-between flex-wrap gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-sm font-bold text-emerald-600">
                                Order #{orderId ? orderId.slice(-8) : idx + 1}
                              </span>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                  ["completed"].includes(
                                    String(order.status).toLowerCase()
                                  )
                                    ? "bg-green-100 text-green-700"
                                    : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {order.status === "PAID_HELD"
                                  ? "placed"
                                  : order.status || "placed"}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 mb-4">
                              Placed on{" "}
                              {order.createdAt
                                ? new Date(order.createdAt).toLocaleDateString()
                                : "N/A"}
                            </p>

                            <ul className="space-y-2">
                              {(order.items || []).map((it, i) => (
                                <li
                                  key={i}
                                  className="flex justify-between text-sm text-gray-700 border-b border-gray-50 pb-2 last:border-0"
                                >
                                  <span>
                                    {it.name}{" "}
                                    <span className="text-gray-400">
                                      × {it.quantity}
                                    </span>
                                  </span>
                                  <span className="font-medium">
                                    {currency(
                                      it.lineTotal ||
                                        (it.price || it.unitPrice) * it.quantity
                                    )}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="text-right pl-4 border-l border-gray-100 flex flex-col items-end gap-2">
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide">
                                Total Amount
                              </p>
                              <p className="text-2xl font-bold text-gray-900 mt-1">
                                {currency(
                                  order.totals?.grandTotal || order.total
                                )}
                              </p>
                            </div>
                            {/* Add Eye Icon Button */}
                            <button
                              onClick={() => setSelectedPurchase(order)}
                              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors font-medium text-sm"
                              aria-label="View order details"
                            >
                              <Eye className="w-4 h-4" />
                              View Details
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
      <Footer />
      {/* RENTAL HISTORY MODAL */}
      {showRentalHistory && selectedRentalProduct && (
        <RentalHistoryModal
          productId={selectedRentalProduct._id || selectedRentalProduct.id}
          productName={
            selectedRentalProduct.name || selectedRentalProduct.title
          }
          isOpen={showRentalHistory}
          onClose={() => {
            setShowRentalHistory(false);
            setSelectedRentalProduct(null);
          }}
        />
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ ...deleteModal, open: false })}
        onConfirm={handleConfirmDelete}
        title={deleteModal.title}
        message={deleteModal.message}
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={deleting}
      />
      {/* Success Modal */}
      <Modal
        open={showSuccessModal}
        title="Success"
        footer={
          <button
            onClick={() => setShowSuccessModal(false)}
            className="px-6 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 hover:shadow-lg transition-all"
          >
            OK
          </button>
        }
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8" />
          </div>
          <p className="text-lg text-gray-800 font-medium">
            Design updated successfully.
          </p>
        </div>
      </Modal>
      <DesignerOrderModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        sellerId={uid}
      />
      {selectedPurchase && (
        <OrderDetailsModal
          order={selectedPurchase}
          onClose={() => setSelectedPurchase(null)}
        />
      )}

      {/* Rejection Details Modal */}
      <SellerRejectionDetailsModal
        open={rejectionDetailsModal.open}
        product={rejectionDetailsModal.product}
        onClose={() => setRejectionDetailsModal({ open: false, product: null })}
      />

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

const Modal = ({ open, title, children, footer }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all scale-100">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4">
          <h3 className="text-lg font-bold">{title}</h3>
        </div>
        <div className="p-6 max-h-[60vh] overflow-y-auto">{children}</div>
        <div className="px-6 py-4 bg-gray-50 flex items-center justify-center gap-3">
          {footer}
        </div>
      </div>
    </div>
  );
};

/** Card used in Manage tab */
function ManageCard({
  product,
  i,
  isEditing,
  onEdit,
  onDelete,
  cancelEdit,
  saveEdit,
  editDraft,
  setEditDraft,
  onViewRejection, // NEW: callback to view rejection details
  onRelist, // NEW: Relist rental handler
  onViewHistory, // NEW: View history handler
}) {
  const statusColors = {
    pending: "bg-amber-100 text-amber-800",
    approved: "bg-emerald-100 text-emerald-800",
    rejected: "bg-red-100 text-red-800",
  };
  const status = product.status || "pending";
  // Check if product is currently rented out (listingType='rent' AND stock=0)
  const isRentedOut =
    product.listingType === "rent" &&
    (product.stock === 0 || product.stockQty === 0);

  const displayImage = (() => {
    if (isEditing && editDraft?.imagePreview) return editDraft.imagePreview;
    const raw =
      product.imageUrls?.[0] ||
      product.images?.[0] ||
      product.image ||
      product.imageUrl;
    if (!raw) return "/placeholder.svg";
    if (
      raw.startsWith("http") ||
      raw.startsWith("data:") ||
      raw.startsWith("blob:")
    )
      return raw;
    return getImageUrl(raw);
  })();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditDraft((prev) => ({
        ...prev,
        imageFile: file,
        imagePreview: URL.createObjectURL(file),
      }));
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl transition-all group">
      <div className="relative h-48 bg-gray-100">
        <img
          src={displayImage}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* RENTAL BADGE for Manage Card */}
        <RentalBadge product={product} />

        <div className="absolute top-2 right-2 flex gap-2">
          <span
            onClick={
              status === "rejected"
                ? () => onViewRejection?.(product)
                : undefined
            }
            className={`px-2 py-1 text-xs font-bold rounded capitalize ${
              statusColors[status] || "bg-gray-100"
            } ${
              status === "rejected"
                ? "cursor-pointer hover:ring-2 hover:ring-red-400 transition-all"
                : ""
            }`}
            title={
              status === "rejected" ? "Click to view rejection reason" : ""
            }
          >
            {status}
          </span>
        </div>
        {isEditing && (
          <label className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
            <div className="bg-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg flex items-center gap-2">
              <Pencil className="w-4 h-4" /> Change Photo
            </div>
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleFileChange}
            />
          </label>
        )}
      </div>
      <div className="p-5">
        {!isEditing ? (
          <>
            <div className="flex justify-between items-center gap-2 mb-2 flex-nowrap">
              <h3
                className="font-bold text-gray-900 truncate min-w-0 flex-1"
                title={product.name}
              >
                {product.name}
              </h3>
              <span className="font-bold text-emerald-600 flex-shrink-0 whitespace-nowrap">
                {currency(product.price)}
              </span>
            </div>
            <p className="text-xs text-gray-500 line-clamp-2 mb-4 h-8 overflow-hidden">
              {product.description}
            </p>

            <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
              <button
                onClick={() => onEdit(i)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gray-50 text-gray-700 font-medium hover:bg-gray-100 transition-all text-sm"
              >
                <Pencil className="w-4 h-4" /> Edit
              </button>

              {/* RENTAL ACTIONS DROPDOWN or BUTTONS for Rented Items */}
              {isRentedOut ? (
                <div className="relative group">
                  <button className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 py-2 px-3 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1">
                    Actions
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      ></path>
                    </svg>
                  </button>
                  <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-50 hidden group-hover:block">
                    <button
                      onClick={() => onRelist(product._id || product.id)}
                      className="w-full text-left px-4 py-2 hover:bg-emerald-50 text-emerald-600 text-sm font-medium border-b border-gray-50 flex items-center gap-2"
                    >
                      <Sparkles className="w-3 h-3" /> Relist Product
                    </button>
                    <button
                      onClick={() => onViewHistory(product)}
                      className="w-full text-left px-4 py-2 hover:bg-blue-50 text-blue-600 text-sm font-medium border-b border-gray-50 flex items-center gap-2"
                    >
                      <ListChecks className="w-3 h-3" /> Rental History
                    </button>
                    <button
                      onClick={() => onDelete(i)}
                      className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 text-sm font-medium flex items-center gap-2"
                    >
                      <Trash2 className="w-3 h-3" /> Delete Product
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => onDelete(i)}
                  className="bg-red-50 hover:bg-red-100 text-red-600 py-2 px-3 rounded-lg transition-colors"
                  title="Delete Product"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">
                Product Name
              </label>
              <input
                type="text"
                className="w-full border rounded-lg p-2 text-sm mt-1 focus:ring-2 focus:ring-emerald-500 outline-none"
                value={editDraft.name}
                onChange={(e) =>
                  setEditDraft((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">
                Description
              </label>
              <textarea
                className="w-full border rounded-lg p-2 text-sm mt-1 focus:ring-2 focus:ring-emerald-500 outline-none"
                rows={2}
                value={editDraft.description}
                onChange={(e) =>
                  setEditDraft((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Price
                </label>
                <input
                  type="number"
                  className="w-full border rounded-lg p-2 text-sm mt-1 focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={editDraft.price}
                  onChange={(e) =>
                    setEditDraft((prev) => ({ ...prev, price: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Stock
                </label>
                <input
                  type="number"
                  className="w-full border rounded-lg p-2 text-sm mt-1 focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={editDraft.stock}
                  onChange={(e) =>
                    setEditDraft((prev) => ({ ...prev, stock: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={saveEdit}
                className="bg-emerald-600 text-white px-3 py-2 rounded-lg font-bold flex-1 hover:bg-emerald-700 shadow-sm"
              >
                Save Changes
              </button>
              <button
                onClick={cancelEdit}
                className="border bg-gray-50 px-3 py-2 rounded-lg font-bold flex-1 text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
