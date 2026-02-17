import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  PackageSearch,
  Package,
  MapPin,
  Mail,
  Phone,
  Trash2,
  Save,
  Store,
  Star,
  Eye,
  CreditCard,
  Home,
} from "lucide-react";
import api from "../../api/axios";
import SlideOver from "./SlideOver";
import ConfirmModal from "../../components/common/ConfirmModal";
import AdminReviewsModal from "./AdminReviewsModal";

const getImageUrl = (path) => {
  if (!path || !path.trim()) return null;
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  return `http://localhost:5000${path.startsWith("/") ? "" : "/"}${path}`;
};

function MiniProduct({ p, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-all cursor-pointer hover:bg-gray-100"
    >
      <img
        src={getImageUrl(p.images?.[0])}
        alt=""
        className="w-16 h-16 rounded-lg object-cover border-2 border-white shadow-sm"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-sm text-gray-900">{p.name}</p>
        <p className="text-xs text-gray-500 capitalize mt-1">
          <span className="font-medium">{p.listingType}</span> • Rs{" "}
          {p.price?.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

function AvatarWithFallback({
  src,
  name,
  email,
  bgColor = "bg-emerald-100",
  textColor = "text-emerald-700",
  size = "w-12 h-12",
}) {
  const [hasError, setHasError] = React.useState(false);
  const imageUrl = getImageUrl(src);

  if (!imageUrl || hasError) {
    return (
      <div
        className={`${size} ${bgColor} flex items-center justify-center font-bold ${textColor}`}
      >
        {name?.[0]?.toUpperCase() || email?.[0]?.toUpperCase() || "?"}
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={name}
      className={`${size} object-cover`}
      onError={() => setHasError(true)}
    />
  );
}

export default function AdminResellerManagement() {
  console.log("Rendering AdminResellerManagement");
  const [resellers, setResellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState(null);
  const [recent, setRecent] = useState([]);
  const navigate = useNavigate();

  // New State for Reviews & Sorting
  const [reviewModal, setReviewModal] = useState({
    open: false,
    sellerId: null,
    sellerName: "",
  });
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "desc",
  });

  // CRUD state
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    paymentMethod: "",
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [deleteModal, setDeleteModal] = useState({ open: false });

  const loadResellers = async () => {
    setLoading(true);
    setErr("");
    try {
      const { data } = await api.get("/admin/resellers");
      setResellers(Array.isArray(data) ? data : data?.resellers || []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load resellers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResellers();
  }, []);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return resellers;
    return resellers.filter(
      (r) =>
        r.fullName?.toLowerCase().includes(s) ||
        r.email?.toLowerCase().includes(s) ||
        r.location?.toLowerCase().includes(s)
    );
  }, [q, resellers]);

  const sorted = useMemo(() => {
    let sortableItems = [...filtered];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === "averageRating") {
          aValue = Number(aValue || 0);
          bValue = Number(bValue || 0);
        }

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filtered, sortConfig]);

  const openDetails = async (r) => {
    setFocus(r);
    setFormErr("");

    // Flatten payout details
    const payout = r.paymentDetails || {};

    setFormData({
      fullName: r.fullName || "",
      email: r.email || "",
      phone: r.phone || "",
      location: r.location || "",
      address: r.address || "",
      bio: r.bio || "",
      paymentMethod: r.paymentMethod || "",
      isActive: r.isActive ?? true,
      payoutStatus: r.payoutStatus || "pending",
      payoutRejectionReason: r.payoutRejectionReason || "",

      // Flattened Payout Fields
      payout_accountName: payout.accountName || "",
      payout_accountNumber: payout.accountNumber || "",
      payout_bankName: payout.bankName || "",
      payout_bankAccountTitle: payout.bankAccountTitle || "",
      payout_bankAccountNumber: payout.bankAccountNumber || "",
      payout_bankIban: payout.bankIban || "",
    });
    setOpen(true);

    try {
      const { data } = await api.get("/admin/products", {
        params: {
          sellerType: "Reseller",
          sellerId: r._id,
          sellerName: r.fullName,
          page: 1,
          limit: 50,
        },
      });
      setRecent(data.products || data.items || []);
    } catch {
      setRecent([]);
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async () => {
    if (!focus) return;
    setSaving(true);
    setFormErr("");
    try {
      if (!formData.fullName || !formData.email) {
        setFormErr("Name and email are required.");
        setSaving(false);
        return;
      }

      // Reconstruct paymentDetails
      const paymentDetails = {};
      const method = formData.paymentMethod;

      if (method === "JazzCash" || method === "EasyPaisa") {
        paymentDetails.accountName = formData.payout_accountName;
        paymentDetails.accountNumber = formData.payout_accountNumber;
      } else {
        // Default to bank fields if not wallet, or specific bank check
        paymentDetails.bankName = formData.payout_bankName;
        paymentDetails.bankAccountTitle = formData.payout_bankAccountTitle;
        paymentDetails.bankAccountNumber = formData.payout_bankAccountNumber;
        paymentDetails.bankIban = formData.payout_bankIban;
      }

      const payload = {
        ...formData,
        paymentDetails,
      };

      await api.put(`/admin/resellers/${focus._id}`, payload);
      await loadResellers();

      const updated = resellers.find((r) => r._id === focus._id);
      setFocus(updated || focus);
    } catch (e) {
      setFormErr(
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        "Failed to update reseller"
      );
    } finally {
      setSaving(false);
    }
  };

  const _handleToggleActive = async () => {
    if (!focus) return;
    const next = !formData.isActive;
    setSaving(true);
    setFormErr("");
    try {
      await api.put(`/admin/resellers/${focus._id}`, {
        ...formData,
        isActive: next,
      });
      await loadResellers();
      const updated = resellers.find((r) => r._id === focus._id);
      setFormData((prev) => ({ ...prev, isActive: next }));
      setFocus(updated || focus);
    } catch (e) {
      setFormErr(
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        "Failed to update status"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!focus) return;
    setDeleteModal({ open: true });
  };

  const confirmDeleteReseller = async () => {
    if (!focus) return;
    setDeleting(true);
    setFormErr("");
    try {
      await api.delete(`/admin/resellers/${focus._id}`);
      setOpen(false);
      setFocus(null);
      await loadResellers();
      setDeleteModal({ open: false });
    } catch (e) {
      setFormErr(
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        "Failed to delete reseller"
      );
      setDeleteModal({ open: false });
    } finally {
      setDeleting(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-gray-200"></div>
            <div className="w-16 h-16 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading resellers…</p>
        </div>
      </div>
    );

  if (err)
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 rounded-3xl p-8 shadow-xl text-white">
          <h1 className="text-3xl font-bold">Resellers</h1>
        </div>
        <div className="p-6 bg-gradient-to-br from-red-50 to-red-100 text-red-800 rounded-2xl border-2 border-red-200 shadow-lg">
          <p className="font-bold text-lg">⚠️ {err}</p>
        </div>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 rounded-3xl p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-3">
              <Store className="w-5 h-5" />
              <span className="text-sm font-semibold">Reseller Management</span>
            </div>
            <h1 className="text-4xl font-bold mb-2 text-white">
              Platform Resellers
            </h1>
            <p className="text-green-50 opacity-90">
              Monitor and manage all resellers distributing on your platform
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/70" />
            <input
              className="pl-12 pr-4 py-3 rounded-xl border-2 border-white/30 bg-white/10 backdrop-blur-md text-white placeholder-white/60 focus:outline-none focus:ring-4 focus:ring-white/40 focus:bg-white/20 focus:border-white/50 transition-all w-80 shadow-lg"
              placeholder="Search name, email, city…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Total Resellers */}
        <div className="group relative overflow-hidden bg-white rounded-3xl shadow-xl border border-gray-100/50 hover:shadow-2xl transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 opacity-5 group-hover:opacity-10 transition-opacity"></div>
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500"></div>

          <div className="relative p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 mb-4">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs font-bold text-green-700 uppercase tracking-wider">
                    Total Count
                  </span>
                </div>
                <p className="text-5xl font-black bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
                  {resellers.length}
                </p>
                <p className="text-sm font-semibold text-gray-600">
                  Registered Resellers
                </p>
              </div>

              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <div className="relative p-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <Store className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Total Products */}
        <div className="group relative overflow-hidden bg-white rounded-3xl shadow-xl border border-gray-100/50 hover:shadow-2xl transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 opacity-5 group-hover:opacity-10 transition-opacity"></div>
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"></div>

          <div className="relative p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 mb-4">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                    Inventory
                  </span>
                </div>
                <p className="text-5xl font-black bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                  {resellers.reduce(
                    (sum, r) => sum + (r.totalProducts || 0),
                    0
                  )}
                </p>
                <p className="text-sm font-semibold text-gray-600">
                  Reseller Products
                </p>
              </div>

              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <div className="relative p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <Package className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 w-1/4">
                Reseller
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 w-1/3">
                Contact
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 w-1/6">
                Location
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 w-24">
                Products
              </th>
              <th
                className="px-4 py-3 text-left font-semibold text-gray-700 w-32 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort("averageRating")}
              >
                <div className="flex items-center gap-1">
                  Rating
                  {sortConfig.key === "averageRating" && (
                    <span className="text-xs text-emerald-500">
                      {sortConfig.direction === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700 w-auto">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.map((r) => (
              <tr
                key={r._id}
                className="hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 transition-all"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border border-gray-200">
                      <AvatarWithFallback
                        src={r.logo}
                        name={r.fullName}
                        email={r.email}
                        bgColor="bg-emerald-100"
                        textColor="text-emerald-700"
                        size="w-12 h-12"
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {r.fullName}
                      </p>
                      <p className="text-xs text-gray-500">
                        ID: {r._id.slice(-8)}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{r.email}</span>
                    </div>
                    {r.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{r.phone}</span>
                      </div>
                    )}
                    {r.paymentMethod && (
                      <p className="text-xs text-gray-500">
                        Payment: {r.paymentMethod}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{r.location || "—"}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 text-emerald-700 font-bold">
                    {r.totalProducts ?? 0}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setReviewModal({
                        open: true,
                        sellerId: r._id,
                        sellerName: r.fullName,
                      });
                    }}
                    className="flex items-center gap-1.5 cursor-pointer group p-1.5 -ml-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
                    title="View Reviews"
                  >
                    <span className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                      {Number(r.averageRating || 0).toFixed(1)}
                    </span>
                    <Star className="w-4 h-4 text-emerald-500 fill-emerald-500" />
                    <span className="text-xs text-gray-500 group-hover:text-emerald-600 transition-colors">
                      ({r.ratingCount || 0})
                    </span>
                    <Eye className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-all ml-1" />
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => openDetails(r)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium hover:from-green-600 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    Manage
                  </button>
                </td>
              </tr>
            ))}
            {!sorted.length && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-3 text-gray-500">
                    <Store className="w-12 h-12 text-gray-300" />
                    <p className="font-medium">No resellers found.</p>
                    <p className="text-sm">
                      Try adjusting your search criteria.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <SlideOver
        open={open}
        onClose={() => {
          if (!saving && !deleting) {
            setOpen(false);
            setFocus(null);
            setFormErr("");
          }
        }}
        title={focus ? focus.fullName : "Reseller Details"}
        footer={
          <div className="flex justify-between items-center gap-3 flex-wrap">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-red-200 text-red-700 hover:bg-red-500 hover:text-white hover:border-transparent transition-all font-medium disabled:opacity-60"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Delete
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-medium hover:shadow-lg transition-all inline-flex items-center gap-2 disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Changes
            </button>
          </div>
        }
      >
        {focus && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border border-emerald-200">
              <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 border-2 border-white shadow-lg bg-white">
                <AvatarWithFallback
                  src={focus.logo}
                  name={focus.fullName}
                  email={focus.email}
                  bgColor="bg-emerald-100"
                  textColor="text-emerald-500"
                  size="w-20 h-20 text-3xl"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-lg text-gray-900">
                  {formData.fullName}
                </p>
                <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                  <Mail className="w-3 h-3" /> {formData.email}
                </p>
                <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {formData.phone}
                </p>

                <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                  <Home className="h-3 w-3" /> <strong>Address:</strong> {formData.address || "Not Provided"}
                </p>
                <div className="text-sm text-gray-500 mt-2 italic">
                  <strong>Bio:</strong> {formData.bio ? `"${formData.bio}"` : "Not Provided"}
                </div>
                {formData.paymentMethod && (
                  <p className="text-sm text-gray-600 mt-1">
                    Payment: {formData.paymentMethod}
                  </p>
                )}
              </div>
            </div>

            {formErr && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                {formErr}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleFormChange}
                  className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                  className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Full Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleFormChange}
                  placeholder="Full residential address"
                  rows={2}
                  className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 resize-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleFormChange}
                  placeholder="Tell us about the reseller..."
                  rows={3}
                  className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 resize-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleFormChange}
                  className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white"
                >
                  <option value="">Select Method</option>
                  <option value="Bank Account">Bank Account</option>
                  <option value="EasyPaisa">EasyPaisa</option>
                  <option value="JazzCash">JazzCash</option>
                </select>
              </div>
            </div>

            {/* Payout Details Section */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Payout Information
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Current Status</p>
                    <div className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${formData.payoutStatus === 'verified' ? 'bg-green-100 text-green-800' :
                        formData.payoutStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                      }`}>
                      {formData.payoutStatus === 'verified' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                      {formData.payoutStatus === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                      {formData.payoutStatus.charAt(0).toUpperCase() + formData.payoutStatus.slice(1)}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {formData.payoutStatus !== 'verified' && (
                      <button
                        onClick={() => {
                          setFormData(prev => ({ ...prev, payoutStatus: 'verified', payoutRejectionReason: '' }));
                        }}
                        className="px-3 py-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg text-xs font-bold transition-colors"
                      >
                        Verify
                      </button>
                    )}
                    {formData.payoutStatus !== 'rejected' && (
                      <button
                        onClick={() => {
                          setFormData(prev => ({ ...prev, payoutStatus: 'rejected' }));
                        }}
                        className="px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-xs font-bold transition-colors"
                      >
                        Reject
                      </button>
                    )}
                  </div>
                </div>

                {formData.payoutStatus === "rejected" && (
                  <div className="animate-in fade-in slide-in-from-top-2">
                    <label className="block text-xs font-semibold text-red-600 mb-1">
                      Reason for Rejection (Required)
                    </label>
                    <input
                      value={formData.payoutRejectionReason}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          payoutRejectionReason: e.target.value,
                        })
                      }
                      placeholder="e.g. Invalid bank account title..."
                      className="w-full text-sm border border-red-200 rounded-lg px-3 py-2 text-red-700 placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-red-200 bg-red-50"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-3">
                  <div className="col-span-2">
                    <p className="text-xs font-semibold text-gray-500 mb-1">Payment Method</p>
                    <p className="text-sm font-medium text-gray-900">{formData.paymentMethod || "Not Provided"}</p>
                  </div>

                  {formData.paymentMethod === 'JazzCash' || formData.paymentMethod === 'EasyPaisa' ? (
                    <>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1">Account Name</p>
                        <input
                          readOnly
                          value={formData.payout_accountName}
                          className="w-full bg-gray-100 border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-600 outline-none select-all"
                        />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1">Account Number</p>
                        <input
                          readOnly
                          value={formData.payout_accountNumber}
                          className="w-full bg-gray-100 border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-600 outline-none select-all"
                        />
                      </div>
                    </>
                  ) : formData.paymentMethod === 'Bank Account' || formData.paymentMethod === 'Bank Transfer' ? (
                    <>
                      <div className="col-span-2">
                        <p className="text-xs font-semibold text-gray-500 mb-1">Bank Name</p>
                        <input
                          readOnly
                          value={formData.payout_bankName}
                          className="w-full bg-gray-100 border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-600 outline-none select-all"
                        />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1">Account Title</p>
                        <input
                          readOnly
                          value={formData.payout_bankAccountTitle}
                          className="w-full bg-gray-100 border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-600 outline-none select-all"
                        />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1">Account Number</p>
                        <input
                          readOnly
                          value={formData.payout_bankAccountNumber}
                          className="w-full bg-gray-100 border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-600 outline-none select-all"
                        />
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs font-semibold text-gray-500 mb-1">IBAN</p>
                        <input
                          readOnly
                          value={formData.payout_bankIban}
                          className="w-full bg-gray-100 border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-600 outline-none select-all"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="col-span-2 py-2">
                      <p className="text-sm text-gray-400 italic">No payout details provided.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
              {/* Restored Account Status Section */}
              <div>
                <p className="text-sm font-bold text-gray-900">
                  Account Status
                </p>
                <p className="text-xs text-gray-500">
                  Deactivating will hide all products.
                </p>
              </div>
              <button
                onClick={_handleToggleActive}
                disabled={saving}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${formData.isActive
                    ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200"
                    : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                  }`}
              >
                {saving ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : formData.isActive ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <XCircle className="w-3 h-3" />
                )}
                {formData.isActive ? "Active" : "Inactive"}
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <PackageSearch className="w-5 h-5 text-emerald-600" />
                <p className="text-sm font-bold text-gray-900">
                  Recent Products
                </p>
              </div>
              <div className="space-y-3">
                {recent.map((p) => (
                  <MiniProduct
                    key={p._id}
                    p={p}
                    onClick={() =>
                      navigate("/admin/products", {
                        state: { editProductId: p._id, from: "Resellers" },
                      })
                    }
                  />
                ))}
                {!recent.length && (
                  <div className="text-center py-8 text-gray-500">
                    <PackageSearch className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm">No products yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </SlideOver>

      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false })}
        onConfirm={confirmDeleteReseller}
        title="Delete Reseller"
        message={`Are you sure you want to delete reseller "${focus?.fullName || "this reseller"
          }"? This cannot be undone.`}
        confirmText="Delete Reseller"
        isDestructive={true}
        isLoading={deleting}
      />

      <AdminReviewsModal
        isOpen={reviewModal.open}
        onClose={() => setReviewModal({ ...reviewModal, open: false })}
        sellerId={reviewModal.sellerId}
        sellerName={reviewModal.sellerName}
        sellerType="Reseller"
      />
    </div>
  );
}
