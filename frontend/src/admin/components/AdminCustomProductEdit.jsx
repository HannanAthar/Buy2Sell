import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Upload,
  X,
  Save,
  Image as ImageIcon,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import api from "../../api/axios";
import { useDialog } from "../../context/DialogContext";

const Section = ({ title, children }) => (
  <div className="space-y-4">
    <h3 className="text-xl font-extrabold text-gray-900">{title}</h3>
    {children}
  </div>
);

export default function AdminCustomProductEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dialog = useDialog();

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    sizes: [],
    frontImage: null,
    backImage: null,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [frontPreview, setFrontPreview] = useState(null);
  const [backPreview, setBackPreview] = useState(null);

  const inputCls =
    "w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-0 focus:border-[var(--primary-green)]";

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `http://localhost:5000${path}`;
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // Use the standard product endpoint (works for admin too)
        const { data } = await api.get(`/products/${id}`);
        const product = data.product;

        setForm({
          title: product.name || product.title || "",
          description: product.description || "",
          price: product.price || "",
          sizes: product.size
            ? product.size.split(", ").filter(Boolean)
            : Array.isArray(product.sizes)
            ? product.sizes
            : [],
          frontImage: null,
          backImage: null,
        });

        if (product.images?.[0])
          setFrontPreview(getImageUrl(product.images[0]));
        if (product.images?.[1]) setBackPreview(getImageUrl(product.images[1]));
      } catch (err) {
        console.error("Failed to fetch product:", err);
        dialog.alert("Failed to load product details", { title: "Error" });
        navigate("/admin/products");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, navigate, dialog]);

  const setField = (k, v) => {
    setForm((prev) => ({ ...prev, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const toB64 = (file) =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });

  const onFrontImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setErrors((e) => ({
        ...e,
        frontImage: "Only JPG, PNG, and WEBP formats are allowed.",
      }));
      return;
    }

    setErrors((e) => ({ ...e, frontImage: "" }));
    const preview = await toB64(file);
    setFrontPreview(preview);
    setForm((p) => ({ ...p, frontImage: file }));
  };

  const onBackImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setErrors((e) => ({
        ...e,
        backImage: "Only JPG, PNG, and WEBP formats are allowed.",
      }));
      return;
    }

    setErrors((e) => ({ ...e, backImage: "" }));
    const preview = await toB64(file);
    setBackPreview(preview);
    setForm((p) => ({ ...p, backImage: file }));
  };

  const removeFrontImage = () => {
    setFrontPreview(null);
    setForm((p) => ({ ...p, frontImage: null }));
  };

  const removeBackImage = () => {
    setBackPreview(null);
    setForm((p) => ({ ...p, backImage: null }));
  };

  const toggleSize = (size) => {
    setForm((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size],
    }));
    setErrors((e) => ({ ...e, sizes: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.description?.trim()) e.description = "Description is required";
    if (!form.price || Number(form.price) <= 0)
      e.price = "Valid price is required";
    if (form.sizes.length === 0) e.sizes = "At least one size is required";
    if (!frontPreview) e.frontImage = "Front image is required";
    if (!backPreview) e.backImage = "Back image is required";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", form.title);
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("price", form.price);
      formData.append("size", form.sizes.join(", "));

      // Append images only if they were changed
      if (form.frontImage) {
        formData.append("frontImage", form.frontImage);
      }
      if (form.backImage) {
        formData.append("backImage", form.backImage);
      }

      // Use admin products endpoint for updates
      await api.put(`/admin/products/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      dialog.alert("Product updated successfully!", {
        title: "Success",
      });

      setTimeout(() => {
        navigate("/admin/products");
      }, 1000);
    } catch (err) {
      console.error("Update error:", err);
      let errorMessage = "Failed to update custom product. ";

      if (err.response) {
        const backendError =
          err.response.data?.error ||
          err.response.data?.message ||
          "Server error";
        const details = err.response.data?.details;
        errorMessage += backendError;
        if (details && Array.isArray(details)) {
          errorMessage += "\n\nDetails:\n" + details.join("\n");
        }
      } else {
        errorMessage += err.message;
      }

      dialog.alert(errorMessage, { title: "Update Failed" });
    } finally {
      setSaving(false);
    }
  };

  const sizes = ["S", "M", "L", "XL", "XXL"];

  if (loading) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <Loader2 className="w-12 h-12 text-[var(--primary-green)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--primary-green)] via-[var(--dark-green)] to-[var(--accent-blue)] rounded-3xl p-8 shadow-xl text-white">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/admin/products")}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold">Edit Custom Product</h1>
            <p className="text-emerald-50 opacity-90 mt-1">
              Modify custom design template details
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="p-6 space-y-8">
          <Section title="Product Details">
            <div className="grid grid-cols-1 gap-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Product Title *
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                  className={inputCls}
                  placeholder="e.g., Custom T-Shirt Design"
                />
                {errors.title && (
                  <p className="text-red-500 text-xs mt-1">{errors.title}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  className={`${inputCls} resize-none`}
                  placeholder="Enter product description..."
                  rows={4}
                />
                {errors.description && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.description}
                  </p>
                )}
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Price (PKR) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.price}
                  onChange={(e) => setField("price", e.target.value)}
                  className={inputCls}
                  placeholder="e.g., 1500"
                />
                {errors.price && (
                  <p className="text-red-500 text-xs mt-1">{errors.price}</p>
                )}
              </div>

              {/* Sizes */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Sizes * (Select all that apply)
                </label>
                <div className="flex gap-3">
                  {sizes.map((s) => (
                    <label
                      key={s}
                      className={`px-4 py-2 rounded-xl border-2 cursor-pointer text-sm font-semibold transition-all ${
                        form.sizes.includes(s)
                          ? "border-[var(--primary-green)] bg-[var(--emerald-50)] text-[var(--dark-green)]"
                          : "border-gray-200 hover:border-[var(--emerald-100)]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={form.sizes.includes(s)}
                        onChange={() => toggleSize(s)}
                      />
                      {s}
                    </label>
                  ))}
                </div>
                {errors.sizes && (
                  <p className="text-red-500 text-xs mt-1">{errors.sizes}</p>
                )}
              </div>
            </div>
          </Section>

          <Section title="Product Images">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Front Image */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Front Image *
                </label>
                {!frontPreview ? (
                  <label className="border-2 border-dashed rounded-xl h-64 w-full flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onFrontImage}
                    />
                    <div className="flex flex-col items-center text-gray-600">
                      <ImageIcon className="h-12 w-12 mb-2" />
                      <p className="font-semibold">Upload Front Image</p>
                    </div>
                  </label>
                ) : (
                  <div className="relative">
                    <img
                      src={frontPreview}
                      alt="Front preview"
                      className="w-full h-64 object-contain rounded-xl border bg-gray-50"
                    />
                    <button
                      onClick={removeFrontImage}
                      className="absolute -top-2 -right-2 bg-white border rounded-full p-1.5 shadow-lg hover:bg-red-50 transition-colors"
                    >
                      <X className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                )}
                {errors.frontImage && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.frontImage}
                  </p>
                )}
              </div>

              {/* Back Image */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Back Image *
                </label>
                {!backPreview ? (
                  <label className="border-2 border-dashed rounded-xl h-64 w-full flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onBackImage}
                    />
                    <div className="flex flex-col items-center text-gray-600">
                      <ImageIcon className="h-12 w-12 mb-2" />
                      <p className="font-semibold">Upload Back Image</p>
                    </div>
                  </label>
                ) : (
                  <div className="relative">
                    <img
                      src={backPreview}
                      alt="Back preview"
                      className="w-full h-64 object-contain rounded-xl border bg-gray-50"
                    />
                    <button
                      onClick={removeBackImage}
                      className="absolute -top-2 -right-2 bg-white border rounded-full p-1.5 shadow-lg hover:bg-red-50 transition-colors"
                    >
                      <X className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                )}
                {errors.backImage && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.backImage}
                  </p>
                )}
              </div>
            </div>
          </Section>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <button
              onClick={() => navigate("/admin/products")}
              className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--primary-green)] to-[var(--dark-green)] text-white font-semibold hover:from-[var(--dark-green)] hover:to-[var(--primary-green)] shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
