import { useEffect, useMemo, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Package,
  Filter,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  PackageSearch,
  CheckCircle2,
  XCircle,
  Save,
  Loader2,
  Image as ImageIcon,
  Star,
  Eye,
} from "lucide-react";
import AdminRejectionModal from "./AdminRejectionModal";
import AdminReviewsModal from "./AdminReviewsModal";
import SlideOver from "./SlideOver";
import { useDialog } from "../../context/DialogContext";
import api from "../../api/axios";

import CloudinaryImage from "../../components/common/CloudinaryImage";
import { getOptimizedImageUrl } from "../../utils/cloudinaryUtils";

const getImageUrl = getOptimizedImageUrl;

export default function AdminProductManagement() {
  console.log("Rendering AdminProductManagement");
  const dialog = useDialog();
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const location = useLocation();
  const navigate = useNavigate();

  // Auto-filter if ID passed
  useEffect(() => {
    if (location.state?.editProductId) {
      setQ(location.state.editProductId);
    }
  }, [location.state]);

  // Define openManage before useEffect that uses it
  const openManage = useCallback((p) => {
    console.log("🔧 Opening manage for:", p);
    setEditing(p);
    setFormErr("");
    setFormData({
      name: p.name || p.title || "",
      description: p.description || "",
      sellerType: p.sellerType || "Admin",
      sellerId: p.sellerId || "",
      sellerName: p.sellerName || "",
      listingType: p.listingType || "sale",
      price: p.price || "",
      rentPrice: p.rentPrice || "",
      stock: typeof p.stock === "number" ? p.stock : 0,
      category: p.category || "",
      isOnSale: !!p.isOnSale,
      salePrice: p.salePrice || "",
      originalPrice: p.originalPrice || "",
      sizes: Array.isArray(p.sizes)
        ? p.sizes.join(", ")
        : p.sizes || p.size || "",
      images: p.images || [],
    });
    setNewImages([]);
    setFormOpen(true);
  }, []);

  // Auto-open modal if item found
  useEffect(() => {
    if (!loading && items.length > 0 && location.state?.editProductId) {
      const match = items.find((i) => i._id === location.state.editProductId);
      if (match) {
        openManage(match);
        // Clear ID from state to prevent reopening loop
        navigate(location.pathname, {
          replace: true,
          state: { ...location.state, editProductId: null },
        });
      }
    }
  }, [items, loading, location.state, navigate, location.pathname, openManage]);

  // CRUD modal state
  /* ---------- CRUD handlers ------------ */

  const emptyForm = {
    name: "",
    description: "",
    sellerType: "Admin", // Admin only
    sellerId: "",
    sellerName: "",
    listingType: "sale", // sale / rent
    price: "",
    rentPrice: "",
    stock: 0,
    category: "",
    isOnSale: false,
    salePrice: "",
    originalPrice: "",
    sizes: "",
    images: [],
  };

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null); // product being edited
  const [formData, setFormData] = useState(emptyForm);
  const [newImages, setNewImages] = useState([]); // New file uploads
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState("");

  const [rejectionModal, setRejectionModal] = useState({
    open: false,
    product: null,
  });

  const [reviewModal, setReviewModal] = useState({
    open: false,
    productId: null,
    productName: "",
  });

  const filtersSummary = useMemo(
    () => ({ q, status, page }),
    [q, status, page]
  );

  const load = async (pageNum = 1) => {
    setLoading(true);
    setErr("");
    try {
      console.log("📡 Fetching products with params:", {
        pageNum,
        q,
        status,
      });

      const params = { page: pageNum, limit: 12, listingType: "custom" };

      if (q && q.trim()) params.q = q.trim();
      if (status !== "all") params.status = status;

      console.log("📤 API Request params:", params);

      const { data } = await api.get("/admin/products", { params });

      console.log("📥 API Response:", data);
      console.log("📥 API Response Keys:", Object.keys(data));

      const fetchedItems = data.products || data.items || [];
      setItems(fetchedItems);

      // Handle pagination structure (nested or flat)
      const pagination = data.pagination || {};
      setTotal(pagination.total || data.total || 0);
      setPages(pagination.pages || data.pages || 1);
      setPage(pagination.page || data.page || pageNum);

      console.log("✅ Products loaded:", fetchedItems.length);
    } catch (e) {
      console.error("❌ Load error:", e);
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        "Failed to load products";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("🔄 Filters changed, reloading...");
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filtersSummary.q,
    filtersSummary.status,
  ]);

  const resetFilters = () => {
    setQ("");
    setStatus("all");
    setPage(1);
  };

  const hasFilters = q || status !== "all";

  // Helper function to get display price
  const getDisplayPrice = (product) => {
    if (product.isOnSale && product.salePrice) {
      return product.salePrice;
    }
    return product.price;
  };

  /* ------------ CRUD handlers ------------ */

  const openCreate = () => {
    setEditing(null);
    setFormErr("");
    setFormData(emptyForm);
    setNewImages([]);
    setFormOpen(true);
  };



  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "stock" ||
            name === "price" ||
            name === "rentPrice" ||
            name === "salePrice" ||
            name === "originalPrice"
            ? value === ""
              ? ""
              : Number(value)
            : value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormErr("");

    try {
      // Simple required checks
      if (!formData.name || !formData.listingType || !formData.sellerType) {
        setFormErr("Name, listing type and seller type are required.");
        setSaving(false);
        return;
      }

      // Build FormData
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key === "images") {
          // Append existing images
          formData.images.forEach((img) => data.append("images", img));
        } else {
          data.append(key, formData[key]);
        }
      });

      // Append new files
      newImages.forEach((file) => {
        data.append("images", file);
      });

      if (editing) {
        // UPDATE
        await api.put(`/admin/products/${editing._id}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        console.log("✅ Product updated");
      } else {
        // CREATE
        await api.post("/admin/products", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        console.log("✅ Product created");
      }

      setFormOpen(false);
      setEditing(null);
      setFormData(emptyForm);
      setNewImages([]);
      // reload current page
      load(page);
    } catch (e) {
      console.error("❌ Save error:", e);
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        "Failed to save product";
      setFormErr(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editing) return;

    const isConfirmed = await dialog.confirm(
      `Are you sure you want to delete product "${editing.name || editing.title || "this product"
      }"? This action cannot be undone.`,
      {
        title: "Delete Product",
        confirmText: "Delete Product",
        isDestructive: true,
      }
    );

    if (!isConfirmed) return;

    try {
      await api.delete(`/admin/products/${editing._id}`);
      console.log("🗑 Product deleted");
      setFormOpen(false);
      setEditing(null);

      const newPage = items.length === 1 && page > 1 ? page - 1 : page;
      load(newPage);

      dialog.alert("Product deleted successfully.", { title: "Success" });
    } catch (e) {
      console.error("❌ Delete error:", e);
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        "Failed to delete product";
      dialog.alert(msg, { title: "Error" });
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!editing) return;

    // If rejecting, open rejection modal instead of immediate rejection
    if (newStatus === "rejected") {
      setRejectionModal({ open: true, product: editing });
      return;
    }

    console.log(
      `🔄 Requesting status update for ${editing._id} to ${newStatus}`
    );
    try {
      const res = await api.patch(`/admin/products/${editing._id}/status`, {
        status: newStatus,
      });
      console.log("✅ Status update response:", res.data);
      console.log(`✅ Product status updated to ${newStatus}`);

      // Update local state to reflect change immediately without reload
      setEditing((prev) => ({ ...prev, status: newStatus }));

      // 🔥 Force update items list locally
      setItems((prevItems) =>
        prevItems.map((item) =>
          item._id === editing._id ? { ...item, status: newStatus } : item
        )
      );

      // Trigger Success Modal
      dialog.alert(
        `Product status changed to ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)
        }`,
        { title: "Success" }
      );

      // Also reload list
      load(page);
    } catch (e) {
      console.error("❌ Status update error:", e);
      setErr("Failed to update status"); // Show in UI instead of alert
    }
  };

  const handleConfirmRejection = async (rejectionReason) => {
    if (!rejectionModal.product) return;

    console.log(
      `🔄 Rejecting product ${rejectionModal.product._id} with reason: ${rejectionReason}`
    );

    try {
      const res = await api.patch(
        `/admin/products/${rejectionModal.product._id}/status`,
        {
          status: "rejected",
          rejectionReason: rejectionReason,
        }
      );
      console.log("✅ Product rejected successfully:", res.data);

      // Update local state
      setEditing((prev) => ({
        ...prev,
        status: "rejected",
        rejectionReason: rejectionReason,
        rejectionDate: new Date(),
      }));

      // Update items list
      setItems((prevItems) =>
        prevItems.map((item) =>
          item._id === rejectionModal.product._id
            ? {
              ...item,
              status: "rejected",
              rejectionReason,
              rejectionDate: new Date(),
            }
            : item
        )
      );

      // Close rejection modal
      setRejectionModal({ open: false, product: null });

      // Show success message
      dialog.alert("Product rejected successfully with documented reason.", {
        title: "Success",
      });

      // Reload list
      load(page);
    } catch (e) {
      console.error("❌ Rejection error:", e);
      const msg = e?.response?.data?.error || "Failed to reject product";
      setErr(msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Create button */}
      <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 rounded-3xl p-8 shadow-xl text-white">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3">
              {location.state?.from && (
                <button
                  onClick={() => navigate(-1)}
                  className="p-2 -ml-2 rounded-full hover:bg-white/20 transition-all text-white"
                  title={`Back to ${location.state.from}`}
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}
              <Package className="w-8 h-8" />
              <div>
                <h1 className="text-3xl font-bold">Products Management</h1>
                <p className="text-emerald-50 opacity-90">
                  Browse and manage all products on your platform
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-emerald-600 font-semibold shadow-lg hover:shadow-xl hover:bg-emerald-50 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Seller Type Tabs Removed */}

      {/* Filters Section */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-emerald-600" />
          <h3 className="font-semibold text-gray-900">Filters</h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Search Input */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, description, category..."
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all"
            />
          </div>

          {/* Filters section simplified */}          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Reset Button */}
        {hasFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-gray-300 hover:bg-gray-50 transition-all font-medium text-gray-700"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Results Summary */}
      {!loading && !err && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-gray-600">
            Showing{" "}
            <span className="font-semibold text-gray-900">{items.length}</span>{" "}
            of <span className="font-semibold text-gray-900">{total}</span>{" "}
            products
          </p>
          {pages > 1 && (
            <p className="text-sm text-gray-600">
              Page <span className="font-semibold text-gray-900">{page}</span>{" "}
              of <span className="font-semibold text-gray-900">{pages}</span>
            </p>
          )}
        </div>
      )}

      {/* Products Table */}
      <div className="rounded-2xl border border-gray-200 overflow-x-auto bg-white shadow-lg">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
            <tr className="text-left">
              <th className="px-6 py-4 font-semibold text-gray-700">Image</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Product</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Price</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Stock</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Rating</th>
              <th className="px-6 py-4 font-semibold text-gray-700">
                Category
              </th>
              <th className="px-6 py-4 font-semibold text-gray-700 text-right">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full border-4 border-gray-200"></div>
                      <div className="w-12 h-12 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin absolute top-0 left-0"></div>
                    </div>
                    <p className="text-gray-600 font-medium">
                      Loading products…
                    </p>
                  </div>
                </td>
              </tr>
            )}

            {!loading && err && (
              <tr>
                <td colSpan={7} className="px-6 py-12">
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-6 py-4 bg-red-50 text-red-700 rounded-2xl border-2 border-red-200">
                      <span className="text-xl">⚠️</span>
                      <span className="font-medium">{err}</span>
                    </div>
                  </div>
                </td>
              </tr>
            )}

            {!loading && !err && items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-gray-500">
                    <Package className="w-16 h-16 text-gray-300" />
                    <p className="font-semibold text-lg text-gray-700">
                      No products found.
                    </p>
                    <p className="text-sm">
                      Try adjusting filters or search query.
                    </p>
                  </div>
                </td>
              </tr>
            )}

            {!loading &&
              !err &&
              items.map((p) => (
                <tr
                  key={p._id}
                  className="border-t border-gray-100 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 transition-all"
                >
                  <td className="px-6 py-4">
                    <CloudinaryImage
                      src={p.images?.[0]}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                      sizes="48px"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900">
                      {p.name || p.title}
                    </p>
                    {p.description && (
                      <p className="text-xs text-gray-500 line-clamp-1">
                        {p.description}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${p.status === "approved"
                        ? "bg-emerald-100 text-emerald-700"
                        : p.status === "rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                        }`}
                    >
                      {p.status || "pending"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900">
                      Rs {getDisplayPrice(p)?.toLocaleString() || "—"}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm ${(p.stock || 0) > 0
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                        }`}
                    >
                      {typeof p.stock === "number" ? p.stock : "-"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setReviewModal({
                          open: true,
                          productId: p._id,
                          productName: p.name || p.title,
                        });
                      }}
                      className="flex items-center gap-1.5 cursor-pointer group p-1.5 -ml-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
                      title="View Reviews"
                    >
                      <span className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                        {Number(p.averageRating || 0).toFixed(1)}
                      </span>
                      <Star className="w-4 h-4 text-emerald-500 fill-emerald-500" />
                      <span className="text-xs text-gray-500 group-hover:text-emerald-600 transition-colors">
                        ({p.ratingCount || 0})
                      </span>
                      <Eye className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-all ml-1" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-700">{p.category || "—"}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openManage(p)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium hover:from-green-600 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && !err && pages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            disabled={page <= 1}
            onClick={() => load(page - 1)}
            className="inline-flex items-center gap-2 px-5 py-3 border-2 border-gray-300 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gradient-to-r hover:from-emerald-500 hover:to-green-500 hover:text-white hover:border-transparent transition-all font-medium text-gray-700 disabled:hover:bg-transparent disabled:hover:text-gray-700"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="px-6 py-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border-2 border-emerald-200">
            <span className="font-semibold text-gray-900">
              Page {page} of {pages}
            </span>
            <span className="text-gray-600 text-sm ml-2">({total} items)</span>
          </div>

          <button
            disabled={page >= pages}
            onClick={() => load(page + 1)}
            className="inline-flex items-center gap-2 px-5 py-3 border-2 border-gray-300 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gradient-to-r hover:from-emerald-500 hover:to-green-500 hover:text-white hover:border-transparent transition-all font-medium text-gray-700 disabled:hover:bg-transparent disabled:hover:text-gray-700"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* CRUD SlideOver */}
      <SlideOver
        open={formOpen}
        onClose={() => {
          if (!saving) {
            setFormOpen(false);
            setEditing(null);
            setFormData(emptyForm);
            setFormErr("");
          }
        }}
        title={editing ? "Manage Product" : "Add Product"}
        footer={
          <div className="flex justify-between items-center w-full gap-2">
            {editing && (
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-red-200 text-red-700 hover:bg-red-500 hover:text-white hover:border-transparent transition-all font-medium"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}

            <div className="flex gap-2 ml-auto">
              {editing &&
                (editing.sellerType?.toLowerCase() === "reseller" ||
                  editing.sellerType?.toLowerCase() === "designer") && (
                  <>
                    {editing.status !== "approved" && (
                      <button
                        onClick={() => handleStatusChange("approved")}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-emerald-200 text-emerald-700 hover:bg-emerald-500 hover:text-white hover:border-transparent transition-all font-medium"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Approve
                      </button>
                    )}
                    {editing.status !== "rejected" && (
                      <button
                        onClick={() => handleStatusChange("rejected")}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-red-200 text-red-700 hover:bg-red-500 hover:text-white hover:border-transparent transition-all font-medium"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    )}
                  </>
                )}

              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium hover:shadow-lg transition-all inline-flex items-center gap-2 disabled:opacity-70"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {editing ? "Save" : "Create"}
              </button>
            </div>
          </div>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="mb-6">
            {/* Existing Images */}
            {formData.images && formData.images.length > 0 && (
              <div className="mb-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={getImageUrl(img)}
                        alt={`Product ${idx + 1}`}
                        className="w-full h-24 rounded-xl object-cover shadow-sm border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            images: prev.images.filter((_, i) => i !== idx),
                          }));
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Images */}
            {newImages.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-green-600 mb-2 font-medium">
                  New Images (Pending Upload)
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {newImages.map((file, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt="Preview"
                        className="w-full h-24 rounded-xl object-cover shadow-sm border-2 border-green-200"
                        onLoad={(e) => URL.revokeObjectURL(e.target.src)}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setNewImages((prev) =>
                            prev.filter((_, i) => i !== idx)
                          );
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Image Button */}
            <div className="mt-3">
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-gray-300 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-600 cursor-pointer transition-all text-sm font-medium text-gray-600">
                <Plus className="w-4 h-4" />
                Add Images
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      setNewImages((prev) => [
                        ...prev,
                        ...Array.from(e.target.files),
                      ]);
                    }
                  }}
                />
              </label>
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
                Name *
              </label>
              <input
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                placeholder="Product name"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Category
              </label>
              <input
                name="category"
                value={formData.category}
                onChange={handleFormChange}
                className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                placeholder="e.g. Shoes, Bags"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Sizes (comma-separated)
              </label>
              <input
                name="sizes"
                value={formData.sizes}
                onChange={handleFormChange}
                className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                placeholder="e.g. S, M, L, XL"
              />
            </div>



            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Seller Name (optional)
              </label>
              <input
                name="sellerName"
                value={formData.sellerName}
                onChange={handleFormChange}
                className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                placeholder="Shown in admin only"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Listing Type *
              </label>
              <select
                name="listingType"
                value={formData.listingType}
                onChange={handleFormChange}
                className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white"
              >
                <option value="sale">Sale</option>
                <option value="rent">Rent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Stock
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleFormChange}
                className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                min="0"
              />
            </div>

            {/* ORIGINAL PRICE / PRODUCT VALUE */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Original Price / Product Value
              </label>
              <input
                type="number"
                name="originalPrice"
                value={formData.originalPrice}
                onChange={handleFormChange}
                className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                min="0"
                placeholder="e.g. 25000"
              />
            </div>

            {/* BASE PRICE (Selling Price or Daily Rent) */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {formData.listingType === "rent"
                  ? "Daily Rent Price (Base)"
                  : "Selling Price"}
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleFormChange}
                className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                min="0"
              />
            </div>

            {/* Extra Rent Price field (if needed by schema separate from price) */}
            {formData.listingType === "rent" && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Rent Price (Secondary Field)
                </label>
                <input
                  type="number"
                  name="rentPrice"
                  value={formData.rentPrice}
                  onChange={handleFormChange}
                  className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  min="0"
                  placeholder="Same as Daily Rent"
                />
              </div>
            )}

            <div className="flex items-center gap-2 mt-2">
              <input
                id="isOnSale"
                type="checkbox"
                name="isOnSale"
                checked={formData.isOnSale}
                onChange={handleFormChange}
                className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label
                htmlFor="isOnSale"
                className="text-xs font-semibold text-gray-700"
              >
                On Sale
              </label>
            </div>

            {formData.isOnSale && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Sale/Discounted Price
                </label>
                <input
                  type="number"
                  name="salePrice"
                  value={formData.salePrice}
                  onChange={handleFormChange}
                  className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  min="0"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              rows={3}
              className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 resize-none"
              placeholder="Short description for this product"
            />
          </div>
        </form>
      </SlideOver>

      {/* Rejection Modal */}
      <AdminRejectionModal
        open={rejectionModal.open}
        product={rejectionModal.product}
        onConfirm={handleConfirmRejection}
        onCancel={() => setRejectionModal({ open: false, product: null })}
      />

      {/* Reviews Modal */}
      <AdminReviewsModal
        isOpen={reviewModal.open}
        onClose={() => setReviewModal({ ...reviewModal, open: false })}
        productId={reviewModal.productId}
        productName={reviewModal.productName}
        type="product"
      />
    </div>
  );
}
