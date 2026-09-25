import { useEffect, useState } from "react";
import {
  ShoppingBag,
  Search,
  Filter,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
  CreditCard,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Package,
  Download,
  Image as ImageIcon,
  ShieldCheck,
  ShieldAlert,
  Wallet,
  Building,
  Home,
} from "lucide-react";
import api from "../../api/axios";
import SlideOver from "./SlideOver";
import { useDialog } from "../../context/DialogContext";

// Helper to convert image paths to full URLs
import CloudinaryImage from "../../components/common/CloudinaryImage";
import { getOptimizedImageUrl } from "../../utils/cloudinaryUtils";

// Helper to convert image paths to full URLs
const getImageUrl = getOptimizedImageUrl;

// helper for money
const currency = (n) =>
  `Rs ${Number(n || 0).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;

export default function AdminOrderManagement() {
  const dialog = useDialog();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [_statsLoading, setStatsLoading] = useState(true);
  const [err, setErr] = useState("");

  // Pagination & Filtering
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState(null);
  const [savingStatus, setSavingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [releasing, setReleasing] = useState(false);
  const [confirmingCOD, setConfirmingCOD] = useState(false);

  // Cache seller info: { [id]: { fullName, paymentMethod, ... } }
  const [sellerDetails, setSellerDetails] = useState({});

  // ... stats state ... (removed for brevity of replacement, assuming user keeps lines 62-70)

  // Fetch batch details when opening order
  const fetchSellerDetailsForOrder = async (order) => {
    const sellersToFetch = [];
    const seen = new Set();

    // Identify needed sellers
    (order.items || []).forEach(item => {
      if (item.sellerId && !seen.has(String(item.sellerId))) {
        seen.add(String(item.sellerId));
        // Check if we already have this seller in cache (optional optimization, but fresh is better for payment info)
        sellersToFetch.push({ id: item.sellerId, type: item.sellerType });
      }
    });

    if (sellersToFetch.length === 0) return;

    try {
      const { data } = await api.post('/admin/sellers/batch', { sellers: sellersToFetch });
      setSellerDetails(prev => ({ ...prev, ...data }));
    } catch (error) {
      console.error("Failed to fetch seller details for order breakdown", error);
    }
  };

  const openDetails = (order) => {
    setFocus(order);
    setFormErr("");
    setOpen(true);
    fetchSellerDetailsForOrder(order);
  };
  // load all orders for admin
  const [stats, setStats] = useState({
    totalOrders: 0,
    completed: 0,
    pending: 0,
    cancelled: 0,
    revenue: 0,
  });

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const { data } = await api.get("/admin/orders/stats");
      setStats({
        totalOrders: data.totalOrders || 0,
        completed: data.completed || 0,
        pending: (data.placed || 0) + (data.confirmed || 0) + (data.shipped || 0) + (data.held || 0),
        cancelled: data.cancelled || 0,
        revenue: data.totalRevenue || 0,
      });
    } catch (error) {
      console.error("Failed to load stats", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadOrders = async () => {
    setLoading(true);
    setErr("");
    try {
      const params = {
        page,
        limit,
        status: statusFilter,
      };
      if (q.trim()) params.search = q.trim();

      const { data } = await api.get("/admin/orders", { params });

      setOrders(data.orders || []);
      setTotalPages(data.pages || 1);
      setTotalOrders(data.total || 0);
      setPage(data.page || 1);
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        "Failed to load orders";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1); // Reset to page 1 on search/filter change
      loadOrders();
    }, 500);
    return () => clearTimeout(timer);
  }, [q, statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [page]);

  const resetFilters = () => {
    setQ("");
    setStatusFilter("all");
  };

  const hasFilters = q || statusFilter !== "all";



  // update status (admin)
  const handleStatusChange = async (orderId, newStatus) => {
    setSavingStatus(true);
    setFormErr("");
    try {
      await api.patch(`/admin/orders/${orderId}/status`, { status: newStatus });

      setOrders((prev) =>
        prev.map((o) =>
          (o._id || o.id) === orderId ? { ...o, status: newStatus } : o
        )
      );

      if (focus && (focus._id || focus.id) === orderId) {
        setFocus((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        "Failed to update status";
      setFormErr(msg);
    } finally {
      setSavingStatus(false);
    }
  };

  const handleReleaseEscrow = async (orderId) => {
    const isConfirmed = await dialog.confirm(
      "Are you sure you want to release funds to the seller(s)? This action cannot be reversed.",
      {
        title: "Release Funds",
        confirmText: "Release Funds",
      }
    );

    if (!isConfirmed) return;

    setReleasing(true);
    setFormErr("");
    try {
      const { data } = await api.post(`/admin/escrow/release/${orderId}`);

      setOrders((prev) =>
        prev.map((o) =>
          (o._id || o.id) === orderId ? { ...o, ...data.order } : o
        )
      );

      if (focus && (focus._id || focus.id) === orderId) {
        setFocus({ ...focus, ...data.order });
      }

      const title = data.message?.toLowerCase().includes("failed") ? "Warning" : "Success";
      dialog.alert(data.message || "Funds released successfully", { title });
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        "Failed to release funds";
      setFormErr(msg);
      dialog.alert(msg, { title: "Error" });
    } finally {
      setReleasing(false);
    }
  };

  const handleConfirmCODPayment = async (orderId) => {
    const isConfirmed = await dialog.confirm(
      "Confirm that cash has been received for this COD order. This will initialize the escrow system for sellers.",
      {
        title: "Confirm COD Payment",
        confirmText: "Confirm Received",
      }
    );

    if (!isConfirmed) return;

    setConfirmingCOD(true);
    setFormErr("");
    try {
      const { data } = await api.post(`/admin/orders/cod/${orderId}/confirm`);

      setOrders((prev) =>
        prev.map((o) =>
          (o._id || o.id) === orderId ? { ...o, ...data.order } : o
        )
      );

      if (focus && (focus._id || focus.id) === orderId) {
        setFocus({ ...focus, ...data.order });
      }

      dialog.alert("COD Payment confirmed. Funds are now held in escrow.", { title: "Success" });
    } catch (e) {
      const msg = e?.response?.data?.message || e?.response?.data?.error || "Failed to confirm COD payment";
      setFormErr(msg);
      dialog.alert(msg, { title: "Error" });
    } finally {
      setConfirmingCOD(false);
    }
  };

  const handleDelete = async (orderId) => {
    const isConfirmed = await dialog.confirm(
      "Are you sure you want to delete this order? This action cannot be undone.",
      {
        title: "Delete Order",
        confirmText: "Delete Order",
        isDestructive: true,
      }
    );

    if (!isConfirmed) return;

    setDeleting(true);
    setFormErr("");
    try {
      await api.delete(`/admin/orders/${orderId}`);
      setOrders((prev) => prev.filter((o) => (o._id || o.id) !== orderId));
      if (focus && (focus._id || focus.id) === orderId) {
        setOpen(false);
        setFocus(null);
      }
      dialog.alert("Order deleted successfully.", { title: "Success" });
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        "Failed to delete order";
      setFormErr(msg);
      dialog.alert(msg, { title: "Error" });
    } finally {
      setDeleting(false);
    }
  };

  // Download custom design images
  const downloadDesign = async (imageData, itemName, side = "") => {
    try {
      const fileName = `${itemName.replace(
        /[^a-z0-9]/gi,
        "_"
      )}_${side}_${Date.now()}.png`;

      // For cross-origin images (like Cloudinary), we need to fetch as blob
      const response = await fetch(imageData);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL after a short delay
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } catch (err) {
      console.error("Download failed:", err);
      dialog.alert("Failed to download image. Please try again.", { title: "Error" });
    }
  };

  if (loading)
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-gray-200" />
            <div className="w-16 h-16 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin absolute top-0 left-0" />
          </div>
          <p className="text-gray-600 font-medium">Loading orders…</p>
        </div>
      </div>
    );

  if (err)
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 rounded-3xl p-8 shadow-xl text-white">
          <h1 className="text-3xl font-bold">Orders</h1>
        </div>
        <div className="p-6 bg-red-50 border-2 border-red-200 rounded-2xl text-red-700">
          <p className="font-bold text-lg">{err}</p>
        </div>
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 rounded-3xl p-8 shadow-xl text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <ShoppingBag className="w-8 h-8" />
              <h1 className="text-3xl font-bold">Orders Management</h1>
            </div>
            <p className="text-emerald-50 opacity-90">
              View and manage all buyer orders across designers & resellers
            </p>
          </div>

          {/* Search bar */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-200" />
              <input
                className="pl-12 pr-4 py-3 rounded-xl border-2 border-white/30 bg-white/10 text-white placeholder-white/70 focus:ring-4 focus:ring-white/30 focus:bg-white/20 transition-all w-72"
                placeholder="Search email, order #, product…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl border-2 border-white/40 bg-white/10 text-white text-sm focus:outline-none focus:ring-4 focus:ring-white/30"
            >
              <option value="all">All statuses</option>
              <option value="placed">Placed</option>
              <option value="confirmed">Confirmed</option>
              <option value="shipped">Shipped</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {hasFilters && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-white/40 text-white text-sm hover:bg-white/15 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-lg">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalOrders}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-sky-500 flex items-center justify-center text-white shadow-lg">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.completed}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center text-white shadow-lg">
              <Filter className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.pending}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-red-500 flex items-center justify-center text-white shadow-lg">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {currency(stats.revenue)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Orders table */}
      <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-lg">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left font-semibold text-gray-700">
                Order
              </th>
              <th className="px-6 py-4 text-left font-semibold text-gray-700">
                Buyer
              </th>
              <th className="px-6 py-4 text-left font-semibold text-gray-700">
                Date
              </th>
              <th className="px-6 py-4 text-left font-semibold text-gray-700">
                Total
              </th>
              <th className="px-6 py-4 text-left font-semibold text-gray-700">
                Payment
              </th>
              <th className="px-6 py-4 text-left font-semibold text-gray-700">
                Status
              </th>
              <th className="px-6 py-4 text-right font-semibold text-gray-700">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {/* Show local filtered if you kept local filter, but here we use server 'orders' directly */}
            {orders.map((o) => {
              const id = o._id || o.id || "";
              const shortId = id ? id.slice(-8) : "—";

              const payMethod = (o.payment?.method || "N/A").toUpperCase();
              const payStatus = (o.payment?.status || "pending").toLowerCase();



              const paymentColor =
                payStatus === "paid"
                  ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                  : "bg-gray-100 text-gray-700 border-gray-200";

              return (
                <tr
                  key={id}
                  className="hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 transition-all"
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900">
                        #{shortId}
                      </span>
                      <span className="text-xs text-gray-500">
                        {o.items?.length || 0} item(s)
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-gray-800">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="truncate max-w-[220px]">
                          {o.buyerEmail || "—"}
                        </span>
                      </div>
                      {o.shippingAddress?.phone && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{o.shippingAddress.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-gray-700">
                    {o.createdAt ? (
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(o.createdAt).toLocaleString()}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td className="px-6 py-4 font-semibold text-gray-900">
                    {currency(o.totals?.grandTotal)}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${paymentColor}`}
                    >
                      <CreditCard className="w-4 h-4" />
                      {payMethod} • {payStatus}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <select
                      value={o.status === "PAID_HELD" ? "placed" : (o.status === "RELEASED" ? "completed" : (o.status || "placed"))}
                      onChange={(e) => handleStatusChange(id, e.target.value)}
                      className="text-xs rounded-xl border-2 border-gray-200 px-2 py-1.5 bg-white"
                    >
                      <option value="placed">Placed</option>
                      <option value="processing">Processing</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="shipped">Shipped</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openDetails(o)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium hover:from-green-600 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              );
            })}

            {orders.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-gray-500">
                    <Package className="w-14 h-14 text-gray-300" />
                    <p className="font-semibold text-lg">No orders found.</p>
                    <p className="text-sm">
                      Try changing filters or search query.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between mt-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <p className="text-sm text-gray-500">
          Showing page <span className="font-bold">{page}</span> of{" "}
          <span className="font-bold">{totalPages}</span> ({totalOrders} orders)
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Previous
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            Next
          </button>
        </div>
      </div>

      {/* SlideOver for order details */}
      <SlideOver
        open={open}
        onClose={() => {
          if (!savingStatus && !deleting) {
            setOpen(false);
            setFocus(null);
            setFormErr("");
          }
        }}
        title={
          focus
            ? `Order #${(focus._id || focus.id || "").toString().slice(-8)}`
            : "Order Details"
        }
        footer={
          focus && (
            <div className="flex justify-between items-center gap-3 flex-wrap">
              <button
                onClick={() => handleDelete(focus._id || focus.id)}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-red-200 text-red-700 hover:bg-red-500 hover:text-white transition-all disabled:opacity-60 text-sm font-medium"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete Order
              </button>

              <div className="flex items-center gap-3">
                <select
                  value={(focus.status || "placed").toLowerCase()}
                  onChange={(e) =>
                    handleStatusChange(focus._id || focus.id, e.target.value)
                  }
                  disabled={savingStatus}
                  className="text-sm rounded-xl border-2 border-gray-200 px-3 py-2 bg-white"
                >
                  <option value="placed">Placed</option>
                  <option value="processing">Processing</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="shipped">Shipped</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <span className="text-xs text-gray-500">
                  Changing the dropdown updates status immediately.
                </span>
              </div>
            </div>
          )
        }
      >
        {focus && (
          <div className="space-y-6">
            {formErr && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                {formErr}
              </div>
            )}
            {/* Buyer / shipping info */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                  {(focus.shippingAddress?.fullName ||
                    focus.buyerEmail ||
                    "?")[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900">
                    {focus.shippingAddress?.fullName || "Buyer"}
                  </p>
                  {focus.buyerEmail && (
                    <p className="text-sm text-gray-700 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {focus.buyerEmail}
                    </p>
                  )}
                  {focus.shippingAddress?.phone && (
                    <p className="text-sm text-gray-700 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {focus.shippingAddress.phone}
                    </p>
                  )}
                  {focus.shippingAddress?.address && (
                    <p className="text-sm text-gray-700 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {focus.shippingAddress.address}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Items */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-3">
                Items in this order
              </h3>
              <div className="space-y-3">
                {(focus.items || []).map((it, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-white border-2 border-gray-200"
                  >
                    <div className="flex justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-gray-900">
                          {it.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Seller: {it.sellerName || it.sellerType || "—"}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Qty: {it.quantity} × {currency(it.unitPrice)}
                          {it.isRent && (
                            <span className="ml-2 font-semibold text-indigo-600">
                              ({it.rentDays || it.rentDuration || 1} Days Rent)
                            </span>
                          )}
                        </p>
                        {(it.size || it.meta?.size || it.productMeta?.size) && (
                          <p className="text-xs text-gray-700 mt-0.5 font-medium">
                            Size:{" "}
                            {it.size || it.meta?.size || it.productMeta?.size}
                          </p>
                        )}
                        {it.isCustom && (
                          <span className="inline-block mt-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                            🎨 Custom Design
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-gray-900">
                          {currency(it.lineTotal)}
                        </p>
                      </div>
                    </div>

                    {/* Custom Design Preview & Download */}
                    {it.isCustom && (
                      <div className="mt-4 space-y-4 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 p-4 rounded-xl border-2 border-purple-300 shadow-lg">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-purple-900 flex items-center gap-2">
                            <ImageIcon className="w-5 h-5" />
                            Custom Design Preview
                          </p>
                          <span className="px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full shadow-md">
                            CUSTOM
                          </span>
                        </div>

                        {/* Main Preview Image */}
                        {it.customPreview && (
                          <div className="space-y-3">
                            <div className="bg-white p-3 rounded-lg border-2 border-purple-300 shadow-md">
                              <CloudinaryImage
                                src={it.customPreview}
                                alt="Custom Design"
                                className="w-full h-auto max-h-64 object-contain rounded-lg"
                                sizes="(max-width: 640px) 100vw, 600px"
                                style={{ objectFit: 'contain' }}
                              />
                            </div>
                            <button
                              onClick={() =>
                                downloadDesign(
                                  getImageUrl(it.customPreview),
                                  it.name,
                                  "preview"
                                )
                              }
                              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all text-sm font-bold shadow-lg hover:shadow-xl"
                            >
                              <Download className="w-5 h-5" />
                              Download Main Preview
                            </button>
                          </div>
                        )}

                        {/* All Image URLs */}
                        {it.imageUrls && it.imageUrls.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-bold text-purple-900">
                                All Design Images
                              </p>
                              <span className="px-2 py-1 bg-purple-200 text-purple-800 text-xs font-semibold rounded-full">
                                {it.imageUrls.length}{" "}
                                {it.imageUrls.length === 1 ? "Image" : "Images"}
                              </span>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                              {it.imageUrls.map((url, i) => (
                                <div
                                  key={i}
                                  className="aspect-square bg-white rounded-lg border border-purple-200 shadow-sm overflow-hidden relative group cursor-pointer"
                                  onClick={() =>
                                    downloadDesign(
                                      getImageUrl(url),
                                      it.name,
                                      `view_${i}`
                                    )
                                  }
                                >
                                  <CloudinaryImage
                                    src={url}
                                    alt={`View ${i + 1}`}
                                    className="w-full h-full object-contain"
                                    style={{ objectFit: 'contain' }}
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                                    <Download className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Design Data Info */}
                        {it.designData && (
                          <div className="mt-3 p-3 bg-white/80 rounded-lg border-2 border-purple-200 shadow-sm">
                            <p className="text-xs font-bold text-purple-900 mb-2 flex items-center gap-1">
                              <Package className="w-4 h-4" />
                              Design Details:
                            </p>
                            <div className="space-y-1 text-xs text-gray-700">
                              {it.productMeta?.color && (
                                <p className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                  <span className="font-medium">Color:</span>{" "}
                                  {it.productMeta.colorLabel ||
                                    it.productMeta.color}
                                </p>
                              )}
                              {it.designData.front && (
                                <p className="flex items-start gap-2">
                                  <span className="w-2 h-2 rounded-full bg-purple-500 mt-1"></span>
                                  <span>
                                    <span className="font-medium">
                                      Front Design:
                                    </span>
                                    {it.designData.front.text?.value &&
                                      ` Text: "${it.designData.front.text.value}"`}
                                    {it.designData.front.image?.src &&
                                      ` • Image ✓`}
                                    {it.designData.front.shapes?.length > 0 &&
                                      ` • Shapes(${it.designData.front.shapes.length})`}
                                    {it.designData.front.decals?.length > 0 &&
                                      ` • Templates(${it.designData.front.decals.length})`}
                                  </span>
                                </p>
                              )}
                              {it.designData.back && (
                                <p className="flex items-start gap-2">
                                  <span className="w-2 h-2 rounded-full bg-purple-500 mt-1"></span>
                                  <span>
                                    <span className="font-medium">
                                      Back Design:
                                    </span>
                                    {it.designData.back.text?.value &&
                                      ` Text: "${it.designData.back.text.value}"`}
                                    {it.designData.back.image?.src &&
                                      ` • Image ✓`}
                                    {it.designData.back.shapes?.length > 0 &&
                                      ` • Shapes(${it.designData.back.shapes.length})`}
                                    {it.designData.back.decals?.length > 0 &&
                                      ` • Templates(${it.designData.back.decals.length})`}
                                  </span>
                                </p>
                              )}
                              {it.designData.capturedAt && (
                                <p className="flex items-center gap-2 text-gray-500">
                                  <Calendar className="w-3 h-3" />
                                  <span className="font-medium">
                                    Created:
                                  </span>{" "}
                                  {new Date(
                                    it.designData.capturedAt
                                  ).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Warning if no images */}
                        {!it.customPreview &&
                          (!it.imageUrls || it.imageUrls.length === 0) && (
                            <div className="p-3 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                              <p className="text-xs text-yellow-800 font-semibold">
                                ⚠️ No custom design images available for this
                                item
                              </p>
                            </div>
                          )}
                      </div>
                    )}

                    {/* Regular Product Image */}
                    {!it.isCustom && it.image && (
                      <div className="mt-3">
                        <CloudinaryImage
                          src={it.image}
                          alt={it.name}
                          width={400}
                          priority={true}
                          className="w-full h-auto max-h-64 object-contain rounded-lg border border-gray-200 bg-white"
                          sizes="(max-width: 640px) 100vw, 400px"
                          style={{ objectFit: 'contain' }}
                        />
                      </div>
                    )}
                  </div>
                ))}

                {(!focus.items || !focus.items.length) && (
                  <p className="text-sm text-gray-500">
                    No items data available.
                  </p>
                )}
              </div>
            </div>



            {/* Rental Information */}
            {focus.rentalAgreement && (
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Rental Agreement & Security Deposit
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* CNIC Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-gray-500 uppercase">
                        CNIC Number
                      </p>
                      <p className="font-mono font-medium text-gray-900">
                        {focus.rentalAgreement.cnic}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-gray-500 uppercase">
                        Agreement Accepted
                      </p>
                      <p className="font-medium text-gray-900">
                        {new Date(
                          focus.rentalAgreement.acceptedAt
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Financials */}
                  <div className="bg-white p-3 rounded-xl border border-indigo-100 flex flex-wrap gap-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">
                        Product Value (Base)
                      </p>
                      <p className="font-bold text-gray-900">
                        {currency(focus.rentalAgreement.depositBaseTotal)}
                      </p>
                    </div>
                    <div className="w-px bg-gray-200"></div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">
                        Security Deposit (30%)
                      </p>
                      <p className="font-bold text-indigo-700">
                        {currency(focus.rentalAgreement.depositAmount)}
                      </p>
                    </div>
                    <div className="w-px bg-gray-200"></div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">
                        Payment Method
                      </p>
                      <p className="font-medium text-gray-900 capitalize">
                        {focus.rentalAgreement.paymentMethod}
                      </p>
                    </div>
                  </div>

                  {/* Images Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* CNIC Front */}
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-gray-700">
                        CNIC Front
                      </p>
                      <div className="relative group">
                        <CloudinaryImage
                          src={focus.rentalAgreement.frontImage}
                          alt="CNIC Front"
                          className="w-full h-32 object-cover rounded-lg border border-gray-200 bg-white"
                          sizes="(max-width: 640px) 100vw, 300px"
                        />
                        <button
                          onClick={() =>
                            downloadDesign(
                              getImageUrl(focus.rentalAgreement.frontImage),
                              `CNIC_Front_${focus.rentalAgreement.cnic}`,
                              "front"
                            )
                          }
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity rounded-lg font-medium text-sm"
                        >
                          <Download className="w-4 h-4 mr-1" /> Download
                        </button>
                      </div>
                    </div>

                    {/* CNIC Back */}
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-gray-700">
                        CNIC Back
                      </p>
                      <div className="relative group">
                        <CloudinaryImage
                          src={focus.rentalAgreement.backImage}
                          alt="CNIC Back"
                          className="w-full h-32 object-cover rounded-lg border border-gray-200 bg-white"
                          sizes="(max-width: 640px) 100vw, 300px"
                        />
                        <button
                          onClick={() =>
                            downloadDesign(
                              getImageUrl(focus.rentalAgreement.backImage),
                              `CNIC_Back_${focus.rentalAgreement.cnic}`,
                              "back"
                            )
                          }
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity rounded-lg font-medium text-sm"
                        >
                          <Download className="w-4 h-4 mr-1" /> Download
                        </button>
                      </div>
                    </div>

                    {/* Deposit Receipt */}
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-gray-700">
                        Payment Receipt
                      </p>
                      <div className="relative group">
                        <CloudinaryImage
                          src={focus.rentalAgreement.depositReceipt}
                          alt="Deposit Receipt"
                          className="w-full h-32 object-cover rounded-lg border border-gray-200 bg-white"
                          sizes="(max-width: 640px) 100vw, 300px"
                        />
                        <button
                          onClick={() =>
                            downloadDesign(
                              getImageUrl(focus.rentalAgreement.depositReceipt),
                              `Deposit_Receipt_${focus._id}`,
                              "receipt"
                            )
                          }
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity rounded-lg font-medium text-sm"
                        >
                          <Download className="w-4 h-4 mr-1" /> Download
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Escrow Status (Card, Wallet & Confirmed COD) */}
            {(focus.payment?.method === "card" || focus.payment?.method === "wallet" || (focus.payment?.method === "cod" && focus.payment?.status === "paid")) && (
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    <h3 className="text-sm font-bold text-gray-900">Escrow Status</h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${focus.escrow?.status === 'released' ? 'bg-green-100 text-green-700' :
                    focus.escrow?.status === 'failed' ? 'bg-red-100 text-red-700' :
                      focus.escrow?.status === 'held' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                    }`}>
                    {focus.escrow?.status || 'held'}
                  </span>
                </div>

                {(focus.escrow?.status === 'held' || !focus.escrow) && (
                  <div className="space-y-3">
                    <p className="text-xs text-blue-800">
                      Funds are currently held by the platform. You can release them to sellers once the order is delivered/completed.
                    </p>
                    <button
                      onClick={() => handleReleaseEscrow(focus._id || focus.id)}
                      disabled={releasing || !["completed", "delivered", "DELIVERED"].includes(focus.status)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all text-sm font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {releasing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                      Release Funds to Seller(s)
                    </button>
                    {!["completed", "delivered", "DELIVERED"].includes(focus.status) && (
                      <p className="text-[10px] text-amber-600 font-medium italic">
                        * Set status to DELIVERED or Completed to enable release.
                      </p>
                    )}
                  </div>
                )}

                {focus.escrow?.status === 'released' && (
                  <div className="space-y-2">
                    <p className="text-xs text-green-700 font-medium">
                      ✓ Funds have been successfully released to all connected seller accounts.
                    </p>
                    {focus.escrow.transfers?.map((t, i) => (
                      <div key={i} className="text-[10px] text-gray-500 border-t border-blue-100 pt-1">
                        Seller {t.sellerType}: {currency(t.amount / 100)} - {t.status}
                      </div>
                    ))}
                  </div>
                )}

                {focus.escrow?.status === 'failed' && (
                  <div className="space-y-2">
                    <p className="text-xs text-red-700 font-medium">
                      ⚠ Some transfers failed. Check seller account status.
                    </p>
                    {focus.escrow?.transfers?.filter(t => t.status === 'failed').map((t, i) => (
                      <div key={i} className="text-[10px] text-red-600 border-l-2 border-red-300 pl-2 bg-red-50 p-1 rounded">
                        <span className="font-bold">Seller ({t.sellerType}):</span> {t.failureMessage || "Unknown error"}
                      </div>
                    ))}
                    <button
                      onClick={() => handleReleaseEscrow(focus._id || focus.id)}
                      className="text-xs font-bold text-blue-600 hover:underline"
                    >
                      Retry Transfers
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* COD Payment Received Confirmation */}
            {focus.payment?.method === "cod" && focus.payment?.status !== "paid" && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="w-5 h-5 text-amber-600" />
                  <h3 className="text-sm font-bold text-gray-900">COD Payment</h3>
                </div>
                <p className="text-xs text-amber-800 mb-4">
                  Once you confirm that the cash payment has been received (e.g., from the courier), the funds will enter the escrow system for release to sellers.
                </p>
                <button
                  onClick={() => handleConfirmCODPayment(focus._id || focus.id)}
                  disabled={confirmingCOD || !["completed", "delivered", "DELIVERED"].includes(focus.status)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-all text-sm font-bold shadow-lg disabled:opacity-50"
                >
                  {confirmingCOD ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  Confirm Payment Received
                </button>
                {!["completed", "delivered", "DELIVERED"].includes(focus.status) && (
                  <p className="text-[10px] text-amber-600 mt-2 font-medium italic">
                    * Set status to DELIVERED or Completed to confirm payment.
                  </p>
                )}
              </div>
            )}

            {/* Totals & payment */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">
                  {currency(focus.totals?.subTotal || focus.totals?.subtotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium text-gray-900">
                  {currency(focus.totals?.shipping || 0)}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 mt-1">
                <span className="font-semibold text-gray-900">Grand Total</span>
                <span className="font-bold text-gray-900">
                  {currency(focus.totals?.grandTotal)}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2 text-gray-700">
                <CreditCard className="w-4 h-4 text-gray-500" />
                <span className="text-xs">
                  Payment: {(focus.payment?.method || "N/A").toUpperCase()} •{" "}
                  {focus.payment?.status || "pending"}
                </span>
              </div>
            </div>
          </div>
        )}
      </SlideOver>
      {/* Confirm Modal */}
    </div>
  );
}
