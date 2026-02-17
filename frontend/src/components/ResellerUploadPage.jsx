"use client";
import { useState, useEffect } from "react";
import {
  Upload,
  X,
  Save,
  Tag as TagIcon,
  DollarSign,
  Shield,
  Plus,
  AlertTriangle,
  Image as ImageIcon,
} from "lucide-react";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";
import { useProducts } from "./ProductContext.jsx";
import api from "../api/axios.js";
import { useDialog } from "../context/DialogContext";

const Section = ({ title, children }) => (
  <div className="space-y-4">
    <h3 className="text-xl font-extrabold text-gray-900">{title}</h3>
    {children}
  </div>
);

const Modal = ({ open, title, children, footer }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4">
          <h3 className="text-lg font-bold">{title}</h3>
        </div>
        <div className="p-6 max-h-[60vh] overflow-y-auto text-sm text-gray-700 leading-6">
          {children}
        </div>
        <div className="px-6 py-4 bg-gray-50 flex items-center justify-end gap-3">
          {footer}
        </div>
      </div>
    </div>
  );
};

function computeDiscountedPrice(origStr, pctStr, isOnSale) {
  const orig = Number(origStr);
  const pct = Number(pctStr);
  if (!Number.isFinite(orig) || orig <= 0) return "";
  if (!isOnSale) return Math.round(orig);
  if (!Number.isFinite(pct) || pct <= 0) return Math.round(orig);
  const safePct = Math.min(Math.max(pct, 1), 90);
  const discounted = orig * (1 - safePct / 100);
  return Math.max(1, Math.round(discounted));
}

export default function ResellerUploadPage() {
  const { addResellerProduct: _addResellerProduct } = useProducts(); // Available for future use, eslint-disable-line no-unused-vars
  const dialog = useDialog();

  const user = JSON.parse(localStorage.getItem("reseller") || "{}");
  const userRole = (localStorage.getItem("role") || "").toLowerCase();
  const isLoggedIn = !!localStorage.getItem("token");

  // particles
  const [particlesLoaded, setParticlesLoaded] = useState(false);
  useEffect(() => {
    const loadParticles = async () => {
      try {
        if (typeof window !== "undefined" && !window.particlesJS) {
          const script = document.createElement("script");
          script.src =
            "https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js";
          script.onload = () => {
            initializeParticles();
            setParticlesLoaded(true);
          };
          script.onerror = () => {
            setParticlesLoaded(true);
          };
          document.head.appendChild(script);
        } else {
          initializeParticles();
          setParticlesLoaded(true);
        }
      } catch {
        setParticlesLoaded(true);
      }
    };
    const initializeParticles = () => {
      if (window.particlesJS) {
        window.particlesJS("particles-background", {
          particles: {
            number: { value: 60, density: { enable: true, value_area: 800 } },
            color: { value: "#10b981" },
            shape: { type: "circle" },
            opacity: { value: 0.3, random: true },
            size: { value: 3, random: true },
            line_linked: {
              enable: true,
              distance: 150,
              color: "#10b981",
              opacity: 0.2,
              width: 1,
            },
            move: { enable: true, speed: 1.5, random: true },
          },
          interactivity: {
            detect_on: "canvas",
            events: { onhover: { enable: true, mode: "grab" }, resize: true },
            modes: { grab: { distance: 140, line_linked: { opacity: 0.5 } } },
          },
          retina_detect: true,
        });
      }
    };
    loadParticles();
    return () => {
      if (window.pJSDom?.length) {
        try {
          window.pJSDom[0].pJS.fn.vendors.destroypJS();
        } catch { /* Ignore particle cleanup errors */ }
        window.pJSDom = [];
      }
    };
  }, []);
  useEffect(() => {
    if (!particlesLoaded) {
      const style = document.createElement("style");
      style.textContent = `
        @keyframes fallbackGlow { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        .fallback-bg { background:linear-gradient(-45deg,#fff,#f0f0f0,#e0f0e0,#f0f0ff); background-size:400% 400%; animation:fallbackGlow 15s ease infinite; }
      `;
      document.head.appendChild(style);
      return () => {
        document.head.removeChild(style);
      };
    }
  }, [particlesLoaded]);



  const inputCls =
    "w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-0 focus:border-emerald-500 text-base";
  const selectCls = inputCls;
  const checkboxCls =
    "h-5 w-5 text-emerald-600 rounded focus:outline-none focus:ring-0";

  const categories = ["Clothes", "Bags", "Shoes"];

  const [form, setForm] = useState({
    title: "",
    description: "",
    selectedSize: "",
    fabric: "",
    material: "",
    pieceCount: "",
    sizeChartUrl: "",
    category: "",
    conditionRating: "",
    originalPrice: "",
    isOnSale: false,
    salePercentage: "",
    hasAuthenticity: false,
    imageUrls: [],
    imageFiles: [], // Store raw files for upload
    terms: false,
    gender: "Unisex", // NEW: Default value
  });

  const [customCategory, setCustomCategory] = useState("");
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCat, setNewCat] = useState("");

  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [showSubmitted, setShowSubmitted] = useState(false);
  const setField = (k, v) => {
    setForm((prev) => {
      const n = { ...prev, [k]: v };
      if (k === "isOnSale" && !v) n.salePercentage = "";
      return n;
    });
    if (k === "category" && v !== customCategory) setCustomCategory("");
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  useEffect(() => {
    const c = form.category;
    const isClothes = c === "Clothes";
    const isBags = c === "Bags";
    const isShoes = c === "Shoes";
    setForm((p) => ({
      ...p,
      selectedSize: isClothes || isShoes ? p.selectedSize : "",
      fabric: isClothes ? p.fabric : "",
      sizeChartUrl: isClothes ? p.sizeChartUrl : "",
      material: isBags || isShoes ? p.material : "",
      pieceCount: isClothes ? p.pieceCount : "",
    }));
  }, [form.category]);

  const pushTag = (raw) => {
    const t = raw.trim().replace(/\s+/g, " ");
    if (!t) return;
    if (tags.includes(t)) return;
    setTags((prev) => [...prev, t]);
  };
  const onTagKeyDown = (e) => {
    if ([" ", "Enter", ","].includes(e.key)) {
      e.preventDefault();
      pushTag(tagInput);
      setTagInput("");
    } else if (e.key === "Backspace" && !tagInput)
      setTags((prev) => prev.slice(0, -1));
  };
  const removeTag = (idx) =>
    setTags((prev) => prev.filter((_, i) => i !== idx));

  const toB64 = (file) =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  const onImages = async (e) => {
    const files = Array.from(e.target.files || []);
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

    const validFiles = files.filter((f) => validTypes.includes(f.type));

    if (validFiles.length !== files.length) {
      setErrors((e) => ({
        ...e,
        images: "Only JPG, PNG, WEBP, and GIF formats are allowed.",
      }));
      return;
    }

    if (validFiles.length + form.imageUrls.length > 5) {
      setErrors((e) => ({ ...e, images: "Max 5 images allowed" }));
      return;
    }

    setErrors((e) => ({ ...e, images: "" }));

    try {
      const imgs = await Promise.all(validFiles.map(toB64));
      setForm((p) => ({
        ...p,
        imageUrls: [...p.imageUrls, ...imgs],
        imageFiles: [...(p.imageFiles || []), ...validFiles],
      }));
    } catch (error) {
      console.error("Image processing error", error);
      setErrors((e) => ({ ...e, images: "Failed to process images" }));
    }
  };
  const removeImg = (i) =>
    setForm((p) => ({
      ...p,
      imageUrls: p.imageUrls.filter((_, idx) => idx !== i),
      imageFiles: (p.imageFiles || []).filter((_, idx) => idx !== i),
    }));

  const onSizeChart = async (e) => {
    const f = (e.target.files || [])[0];
    if (!f) return;
    const img = await toB64(f);
    setForm((p) => ({ ...p, sizeChartUrl: img }));
  };
  const removeSizeChart = () => setForm((p) => ({ ...p, sizeChartUrl: "" }));

  const discountedPrice = computeDiscountedPrice(
    form.originalPrice,
    form.salePercentage,
    form.isOnSale
  );
  const pctOutOfRange =
    form.isOnSale &&
    form.salePercentage !== "" &&
    (Number(form.salePercentage) < 1 || Number(form.salePercentage) > 90);

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Required";
    if (!form.description.trim()) e.description = "Required";
    if (!form.category) e.category = "Required";
    if (!form.conditionRating) e.conditionRating = "Select 1–10";
    if (!form.originalPrice) e.originalPrice = "Required";
    if (form.isOnSale) {
      const pct = Number(form.salePercentage);
      if (!form.salePercentage) e.salePercentage = "Required";
      else if (!Number.isFinite(pct) || pct < 1 || pct > 90)
        e.salePercentage = "Enter 1–90";
    }

    // Gender validation for specific categories
    if (["Clothes", "Clothing", "Bags", "Shoes"].includes(form.category)) {
      if (!form.gender) {
        e.gender = "Required";
      }
    }
    if (form.imageUrls.length === 0 && (!form.imageFiles || form.imageFiles.length === 0)) e.images = "At least one image";
    if (!form.terms) e.terms = "You must accept the terms";
    if (!form.hasAuthenticity)
      e.hasAuthenticity = "You must complete the verification";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      console.log("🚀 Starting product submission...");

      // 🔥 GET USER INFO FIRST
      const userEmail = localStorage.getItem("email");
      const userId =
        localStorage.getItem("userId") || localStorage.getItem("token");
      const reseller = JSON.parse(localStorage.getItem("reseller") || "{}");
      const wardrobeName =
        reseller.wardrobeName ||
        reseller.fullName ||
        user.wardrobeName ||
        user.fullName ||
        "Unknown Wardrobe";

      console.log("👤 User Info:", { userEmail, userId, wardrobeName });

      // Prepare FormData
      const formData = new FormData();

      // 🔥 CRITICAL: Add user identification fields FIRST
      formData.append("userEmail", userEmail);
      formData.append("ownerId", userId);
      formData.append("sellerId", userId);
      formData.append("userId", userId);
      formData.append("wardrobeName", wardrobeName);
      formData.append("sellerName", wardrobeName);
      formData.append("role", "reseller");
      formData.append("userType", "reseller");
      formData.append("sellerType", "Reseller");

      // Basic fields
      formData.append("name", form.title);
      formData.append("description", form.description);
      formData.append("category", form.category.toLowerCase());
      formData.append("price", form.originalPrice);
      formData.append("originalPrice", form.originalPrice);
      formData.append("stock", 1);
      formData.append("listingType", "sale");

      // Reseller-specific
      formData.append("condition", `${form.conditionRating}/10`);
      formData.append(
        "hasAuthenticity",
        form.hasAuthenticity ? "true" : "false"
      );

      // Sale pricing
      if (form.isOnSale) {
        formData.append("isOnSale", "true");
        formData.append("salePercentage", form.salePercentage);
        formData.append("salePrice", discountedPrice);
        formData.append("sellingPrice", discountedPrice);
      } else {
        formData.append("sellingPrice", form.originalPrice);
      }

      // Product details
      if (tags.length > 0) formData.append("tags", tags.join(", "));
      if (form.selectedSize) formData.append("size", form.selectedSize);
      if (form.fabric) formData.append("fabric", form.fabric);
      if (form.material) formData.append("material", form.material);
      if (form.material) formData.append("material", form.material);
      if (form.pieceCount) formData.append("pieceCount", form.pieceCount);
      if (form.gender) formData.append("gender", form.gender); // NEW

      // Append Images
      console.log("📸 Appending images...");
      const filesToUpload = form.imageFiles || [];
      if (filesToUpload.length === 0) {
        // Fallback if imageFiles is empty but imageUrls has content (should not happen with new logic)
        console.warn("⚠️ No imageFiles found, attempting conversion...");
        for (let i = 0; i < form.imageUrls.length; i++) {
          try {
            const base64 = form.imageUrls[i];
            const response = await fetch(base64);
            const blob = await response.blob();
            const file = new File([blob], `reseller-${Date.now()}-${i}.jpg`, {
              type: "image/jpeg",
            });
            formData.append("images", file);
          } catch (err) {
            console.error(`❌ Failed to convert image ${i}:`, err);
          }
        }
      } else {
        filesToUpload.forEach((file) => {
          formData.append("images", file);
        });
        console.log(`✅ Appended ${filesToUpload.length} images`);
      }

      // Size chart if exists
      if (form.sizeChartUrl) {
        try {
          const response = await fetch(form.sizeChartUrl);
          const blob = await response.blob();
          const file = new File([blob], `size-chart-${Date.now()}.jpg`, {
            type: "image/jpeg",
          });
          formData.append("sizeChart", file);
          console.log("✅ Size chart converted");
        } catch (err) {
          console.error("❌ Failed to convert size chart:", err);
        }
      }

      console.log("📤 Submitting to MongoDB...");

      // Make API call
      const response = await api.post("/products", formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log(`Upload progress: ${percentCompleted}%`);
        },
      });

      console.log("✅ Submission successful:", response.data);

      setShowSubmitted(true);

      setTimeout(() => {
        window.location.href = "/reseller/dashboard";
      }, 5000);
    } catch (err) {
      console.error("❌ Submission error:", err);

      let errorMessage = "Failed to submit product. ";

      if (err.response) {
        errorMessage +=
          err.response.data?.error ||
          err.response.data?.message ||
          "Server error";
        console.error("Server error:", err.response.data);
      } else if (err.request) {
        errorMessage += "No response from server. Check your connection.";
      } else {
        errorMessage += err.message;
      }

      dialog.alert(errorMessage, { title: "Submission Failed" });
    } finally {
      setSaving(false);
    }
  };

  // derived flags for conditional UI
  const isClothes = form.category === "Clothes";
  const isBags = form.category === "Bags";
  const isShoes = form.category === "Shoes";
  const showSizes = isClothes || isShoes;
  const shoeSizes = ["38", "39", "40", "41", "42", "43", "44", "45"];
  const clothSizes = ["S", "M", "L"];

  // Access control check - placed after all hooks
  if (!isLoggedIn || userRole !== "reseller") {
    return (
      <div className="min-h-screen relative">
        <div
          id="particles-background"
          className={`fixed inset-0 ${!particlesLoaded ? "fallback-bg" : ""}`}
          style={{ zIndex: 0 }}
        />
        <div className="relative z-[1]">
          <Header />
          <div className="max-w-4xl mx-auto py-16 px-4 text-center">
            <div className="bg-white rounded-3xl shadow-2xl p-12">
              <div className="text-6xl mb-6">🚫</div>
              <h1 className="text-3xl font-bold text-emerald-700 mb-6">
                Access Denied
              </h1>
              <p className="text-gray-600 mb-8 text-lg">
                Login as a Reseller to upload products.
              </p>
              <a
                href="/Login"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-bold"
              >
                Login as Reseller
              </a>
            </div>
          </div>
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] relative">
      <div
        id="particles-background"
        className={`fixed inset-0 pointer-events-none z-0 ${
          !particlesLoaded ? "fallback-bg" : ""
        }`}
      />
      <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-400/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="relative z-[1]">
        <Header />

        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="rounded-3xl overflow-hidden shadow-xl mb-6">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-7 text-white">
              <h1 className="text-2xl md:text-3xl font-extrabold">
                Reseller – Submit Product
              </h1>
              <p className="text-white/90 mt-1">
                Submitting as{" "}
                <b>
                  {user.wardrobeName || user.fullName || "Unknown Wardrobe"}
                </b>
              </p>
            </div>

            <div className="bg-white p-6 space-y-8">
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
                      placeholder="e.g., Khaadi Kurta"
                    />
                    {errors.title && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.title}
                      </p>
                    )}
                  </div>

                  {/* ONE ROW: Category | Condition Rating | Tags */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Category */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        Category *
                      </label>
                      <select
                        value={form.category}
                        onChange={(e) => setField("category", e.target.value)}
                        className={selectCls}
                      >
                        <option value="">Select</option>
                        {categories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      {errors.category && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.category}
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setNewCat("");
                          setShowAddCat(true);
                        }}
                        className="mt-2 inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-semibold"
                      >
                        <Plus className="h-4 w-4" /> Add new category
                      </button>
                      {customCategory && (
                        <div className="mt-2 flex items-center gap-3">
                          <span className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-300 px-3 py-1 rounded-lg text-xs font-semibold">
                            {customCategory}
                            <button
                              className="hover:text-red-600 focus:outline-none"
                              onClick={() => {
                                setCustomCategory("");
                                setField("category", "");
                              }}
                              aria-label="Remove custom category"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Condition Rating (1–10) */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        Condition Rating (1–10) *
                      </label>
                      <select
                        value={form.conditionRating}
                        onChange={(e) =>
                          setField("conditionRating", e.target.value)
                        }
                        className={selectCls}
                      >
                        <option value="">Select</option>
                        {Array.from({ length: 10 }, (_, i) =>
                          String(10 - i)
                        ).map((n) => (
                          <option key={n} value={n}>
                            {n}/10
                          </option>
                        ))}
                      </select>
                      {errors.conditionRating && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.conditionRating}
                        </p>
                      )}
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        Tags
                      </label>
                      <input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={onTagKeyDown}
                        className={inputCls}
                        placeholder="Type a tag"
                      />
                      <div className="mt-2 flex flex-wrap gap-2">
                        {tags.map((t, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-300 px-2 py-1 rounded-lg text-xs font-semibold"
                          >
                            <TagIcon className="h-3 w-3" /> {t}
                            <button
                              onClick={() => removeTag(i)}
                              className="hover:text-red-600 focus:outline-none"
                              aria-label={`Remove tag ${t}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Gender Selection - For Clothing, Bags, Shoes */}
                  {(form.category === "Clothes" ||
                    form.category === "Bags" ||
                    form.category === "Shoes" ||
                    form.category === "Clothing") && (
                    <Section title="Gender">
                      <div className="flex gap-4">
                        {["Men", "Women", "Unisex"].map((genderOption) => (
                            <label
                              key={genderOption}
                              onClick={(e) => {
                                e.preventDefault();
                                setField("gender", form.gender === genderOption ? "" : genderOption);
                              }}
                              className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-xl border-2 font-semibold transition-all
                              ${
                                form.gender === genderOption
                                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                  : "border-gray-200 text-gray-600 hover:border-emerald-300"
                              }`}
                            >
                              <input
                                type="radio"
                                name="gender"
                                value={genderOption}
                                checked={form.gender === genderOption}
                                onChange={() => {}}
                                className="hidden"
                              />
                            {/* Custom radio circle */}
                            <div
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
                              ${
                                form.gender === genderOption
                                  ? "border-emerald-600"
                                  : "border-gray-400"
                              }`}
                            >
                              {form.gender === genderOption && (
                                <div className="w-2 h-2 rounded-full bg-emerald-600" />
                              )}
                            </div>
                            <span>{genderOption}</span>
                          </label>
                        ))}
                      </div>
                      {errors.gender && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.gender}
                        </p>
                      )}
                    </Section>
                  )}

                  {/* Sizes / Size Chart / Fabric / Material / Pieces (Clothes) */}
                  {(showSizes || isClothes || isBags || isShoes) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                      {/* LEFT COLUMN */}
                      {isClothes ? (
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">
                            Sizes
                          </label>
                          <div className="flex flex-wrap items-center gap-3">
                            {clothSizes.map((s) => (
                              <label
                                key={s}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setField("selectedSize", form.selectedSize === s ? "" : s);
                                }}
                                className={`px-3 py-1.5 rounded-xl border-2 cursor-pointer text-sm font-semibold
                                ${
                                  form.selectedSize === s
                                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                    : "border-gray-200 hover:border-emerald-300"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="selectedSizeClothes"
                                  className="hidden"
                                  checked={form.selectedSize === s}
                                  onChange={() => {}}
                                />
                                {s}
                              </label>
                            ))}
                          </div>

                          {/* Size Chart (optional) */}
                          <div className="mt-4">
                            <label className="block text-sm font-bold text-gray-700 mb-1">
                              Size Chart (optional)
                            </label>
                            {!form.sizeChartUrl ? (
                              <label className="border-2 border-dashed rounded-xl h-24 w-full flex items-center justify-center cursor-pointer hover:bg-gray-50">
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={onSizeChart}
                                />
                                <div className="flex flex-col items-center text-gray-600">
                                  <ImageIcon className="h-6 w-6 mb-1" /> Upload
                                  Size Chart
                                </div>
                              </label>
                            ) : (
                              <div className="relative inline-block">
                                <img
                                  src={form.sizeChartUrl}
                                  alt="size-chart"
                                  className="w-48 h-24 object-contain rounded-xl border bg-white"
                                />
                                <button
                                  onClick={removeSizeChart}
                                  className="absolute -top-2 -right-2 bg-white border rounded-full p-1 shadow focus:outline-none"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          {/* LEFT for Bags/Shoes = Material */}
                          <label className="block text-sm font-bold text-gray-700 mb-1">
                            Material
                          </label>
                          <input
                            value={form.material}
                            onChange={(e) =>
                              setField("material", e.target.value)
                            }
                            className={inputCls}
                            placeholder="e.g., Leather, PU, Canvas"
                          />
                        </div>
                      )}

                      {/* RIGHT COLUMN */}
                      <div>
                        {isClothes && (
                          <>
                            <label className="block text-sm font-bold text-gray-700 mb-1">
                              Fabric
                            </label>
                            <input
                              value={form.fabric}
                              onChange={(e) =>
                                setField("fabric", e.target.value)
                              }
                              className={inputCls}
                              placeholder="e.g., Lawn, Cotton, Silk"
                            />

                            {/* Pieces under Fabric */}
                            <div className="mt-4">
                              <label className="block text-sm font-bold text-gray-700 mb-1">
                                Pieces
                              </label>
                              <div className="flex items-center gap-3">
                                {["1pc", "2pc", "3pc"].map((v) => (
                                  <label
                                    key={v}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setField("pieceCount", form.pieceCount === v ? "" : v);
                                    }}
                                    className={`px-3 py-1.5 rounded-xl border-2 cursor-pointer text-sm font-semibold
                                    ${
                                      form.pieceCount === v
                                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                        : "border-gray-200 hover:border-emerald-300"
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name="pieceCount"
                                      className="hidden"
                                      checked={form.pieceCount === v}
                                      onChange={() => {}}
                                    />
                                    {v.replace("pc", " pc")}
                                  </label>
                                ))}
                              </div>
                            </div>
                          </>
                        )}

                        {isShoes && (
                          <>
                            <label className="block text-sm font-bold text-gray-700 mb-1">
                              Sizes
                            </label>
                            <div className="flex flex-wrap items-center gap-3">
                              {shoeSizes.map((s) => (
                                <label
                                  key={s}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setField("selectedSize", form.selectedSize === s ? "" : s);
                                  }}
                                  className={`px-3 py-1.5 rounded-xl border-2 cursor-pointer text-sm font-semibold
                                  ${
                                    form.selectedSize === s
                                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                      : "border-gray-200 hover:border-emerald-300"
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name="selectedSizeShoes"
                                    className="hidden"
                                    checked={form.selectedSize === s}
                                    onChange={() => {}}
                                  />
                                  {s}
                                </label>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      Product Description *
                    </label>
                    <textarea
                      rows={4}
                      value={form.description}
                      onChange={(e) => setField("description", e.target.value)}
                      className={inputCls}
                      placeholder="Short, clear description…"
                    />
                    {errors.description && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.description}
                      </p>
                    )}
                  </div>
                </div>
              </Section>

              <Section title="Price">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      Original Price (Rs) *
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 border-2 rounded-l-xl text-gray-600">
                        <DollarSign className="h-4 w-4" />
                      </span>
                      <input
                        type="number"
                        value={form.originalPrice}
                        onChange={(e) =>
                          setField("originalPrice", e.target.value)
                        }
                        className="w-full px-4 py-2.5 border-2 border-l-0 rounded-r-xl focus:outline-none focus:ring-0 focus:border-emerald-500 text-base"
                        placeholder="8000"
                      />
                    </div>
                    {errors.originalPrice && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.originalPrice}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      id="isOnSale"
                      type="checkbox"
                      checked={form.isOnSale}
                      onChange={(e) => setField("isOnSale", e.target.checked)}
                      className={checkboxCls}
                    />
                    <label
                      htmlFor="isOnSale"
                      className="font-semibold select-none"
                    >
                      This item is on sale
                    </label>
                  </div>
                </div>

                {form.isOnSale && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-orange-50 border-2 border-orange-200 p-4 rounded-2xl mt-2">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        Sale Percentage (%) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="90"
                        value={form.salePercentage}
                        onChange={(e) =>
                          setField("salePercentage", e.target.value)
                        }
                        className={inputCls}
                      />
                      {errors.salePercentage && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.salePercentage}
                        </p>
                      )}
                      {pctOutOfRange && !errors.salePercentage && (
                        <p className="text-amber-700 text-xs mt-1 flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4" /> Enter a value
                          between 1 and 90.
                        </p>
                      )}
                    </div>
                    <div className="flex items-end">
                      <div className="w-full text-sm bg-white border rounded-xl p-3">
                        Discounted Price will be:{" "}
                        <b>Rs {discountedPrice || "–"}</b>
                      </div>
                    </div>
                  </div>
                )}

                {!form.isOnSale && form.originalPrice && (
                  <div className="text-sm bg-white border rounded-xl p-3 mt-2">
                    Final Selling Price will be: <b>Rs {discountedPrice}</b>
                  </div>
                )}
              </Section>

              <Section title="Upload Image">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {form.imageUrls.map((src, i) => (
                    <div key={i} className="relative">
                      <img
                        src={src}
                        alt={`img-${i}`}
                        className="w-full h-36 object-cover rounded-xl border"
                      />
                      <button
                        onClick={() => removeImg(i)}
                        className="absolute -top-2 -right-2 bg-white border rounded-full p-1 shadow focus:outline-none"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {form.imageUrls.length < 5 && (
                    <label className="border-2 border-dashed rounded-xl h-36 flex items-center justify-center cursor-pointer hover:bg-gray-50">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={onImages}
                      />
                      <div className="flex flex-col items-center text-gray-600">
                        <Upload className="h-6 w-6 mb-1" /> Add Image
                      </div>
                    </label>
                  )}
                </div>
                {errors.images && (
                  <p className="text-red-500 text-xs mt-1">{errors.images}</p>
                )}
              </Section>

              <Section title="Terms & Conditions">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={form.terms}
                    readOnly
                    onClick={(e) => {
                      e.preventDefault();
                      setShowTerms(true);
                    }}
                    className={checkboxCls + " cursor-pointer"}
                  />
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={() => setShowTerms(true)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setShowTerms(true);
                      }
                    }}
                    className="font-semibold text-emerald-700 hover:text-emerald-800 underline underline-offset-4 decoration-emerald-600 cursor-pointer"
                  >
                    Terms & Conditions
                  </span>
                </div>
                {errors.terms && (
                  <p className="text-red-500 text-xs mt-1">{errors.terms}</p>
                )}
              </Section>

              <Section title="Verification">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={form.hasAuthenticity}
                    readOnly
                    onClick={(e) => {
                      e.preventDefault();
                      setShowVerify(true);
                    }}
                    className={checkboxCls + " cursor-pointer"}
                  />
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={() => setShowVerify(true)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setShowVerify(true);
                      }
                    }}
                    className="font-semibold text-emerald-700 hover:text-emerald-800 underline underline-offset-4 decoration-emerald-600 cursor-pointer inline-flex items-center gap-2"
                  >
                    <Shield className="h-4 w-4" /> Reseller Verification
                  </span>
                </div>
                {errors.hasAuthenticity && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.hasAuthenticity}
                  </p>
                )}
              </Section>

              <div className="flex justify-end pt-2">
                <button
                  onClick={submit}
                  disabled={saving}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold shadow focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-5 w-5" /> {saving ? "Saving..." : "Submit"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Add Category Modal */}
        <Modal
          open={showAddCat}
          title="Add new category"
          footer={
            <>
              <button
                onClick={() => setShowAddCat(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const clean = newCat.trim();
                  if (!clean) return;
                  setField("category", clean);
                  setCustomCategory(clean);
                  setShowAddCat(false);
                }}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
              >
                Add
              </button>
            </>
          }
        >
          <label className="text-sm font-semibold text-gray-700">
            Category name
          </label>
          <input
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            className="mt-2 w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-0 focus:border-emerald-500 text-base"
            placeholder="e.g., Jewelry"
          />
        </Modal>

        {/* T&C Modal */}
        <Modal
          open={showTerms}
          title="Terms & Conditions"
          footer={
            <>
              <button
                onClick={() => {
                  setShowTerms(false);
                  setField("terms", false);
                }}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
              >
                Not agree
              </button>
              <button
                onClick={() => {
                  setShowTerms(false);
                  setField("terms", true);
                }}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
              >
                Agree
              </button>
            </>
          }
        >
          <ul className="list-disc pl-5 space-y-1 mb-2">
            <li>10% commission will be deducted from every sale.</li>
            <li>Provide truthful pricing and condition.</li>
            <li>Real images, no infringement of IP rights.</li>
            <li>Timely replies to buyers.</li>
            <li>Comply with local laws & platform rules.</li>
          </ul>
          <p>Violations may lead to removal or account limits.</p>
        </Modal>

        {/* Verification Modal */}
        <Modal
          open={showVerify}
          title="Reseller Verification"
          footer={
            <>
              <button
                onClick={() => {
                  setShowVerify(false);
                  setField("hasAuthenticity", false);
                }}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
              >
                Not agree
              </button>
              <button
                onClick={() => {
                  setShowVerify(false);
                  setField("hasAuthenticity", true);
                }}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
              >
                Agree
              </button>
            </>
          }
        >
          <p className="mb-2">
            By enabling <b>Reseller Verification</b> you confirm the product's
            authenticity and that you're authorized to sell it.
          </p>
          <ul className="list-disc pl-5 space-y-1 mb-2">
            <li>Accurate, truthful product details.</li>
            <li>
              I agree to send my product to Buy2Sell for verification before it
              goes live.
            </li>
            <li>Compliance with local laws & platform rules.</li>
          </ul>
        </Modal>

        {/* Success Modal after submit */}
        <Modal
          open={showSubmitted}
          title="Product Submitted"
          footer={
            <button
              onClick={() => {
                window.location.href = "/reseller/dashboard";
              }}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
            >
              Go to Reseller Dashboard
            </button>
          }
        >
          <div className="text-center space-y-3">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-gray-700 font-semibold">
              Your product has been submitted successfully.
            </p>
            <p className="text-gray-600">
              Send your product to warehouse <b>'XYZ Warehouse'</b> for physical
              verification.
            </p>
            <p className="text-gray-600">
              The product will go <b>live after admin approval</b>.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              You’ll be redirected to your reseller dashboard shortly.
            </p>
          </div>
        </Modal>

        <Footer />

        <Footer />
      </div>
    </div>
  );
}
