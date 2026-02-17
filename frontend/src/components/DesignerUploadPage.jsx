"use client";
import { useState, useEffect } from "react";
import {
  Upload,
  X,
  Save,
  Tag as TagIcon,
  DollarSign,
  Plus,
  AlertTriangle,
  Shield,
  CheckCircle2,
} from "lucide-react";
import { useDialog } from "../context/DialogContext";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";
import { useProducts } from "./ProductContext.jsx";
import api from "../api/axios.js";

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

// ---- Image Compression ----
const compressImage = (
  file,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.8
) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const compressedValues = canvas.toDataURL("image/jpeg", quality);
        
        canvas.toBlob(
          (blob) => {
             const newFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve({ file: newFile, preview: compressedValues });
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// ---- Discount helper ----
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

export default function DesignerUploadPage() {
  const { addDesignerProduct: _addDesignerProduct } = useProducts(); // Used for context, eslint-disable-line no-unused-vars
  const dialog = useDialog();

  const getDesignerFromStorage = () => {
    const tryJson = (k) => {
      const raw = localStorage.getItem(k);
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    };

    return (
      tryJson("designer") ||
      tryJson("userProfile") ||
      tryJson("profile") ||
      tryJson("currentUser") ||
      tryJson("authUser") ||
      {}
    );
  };

  const designerObj = getDesignerFromStorage();
  const designerDisplayName =
    designerObj.brandName ||
    designerObj.collectionName ||
    designerObj.fullName ||
    designerObj.name ||
    localStorage.getItem("brandName") ||
    localStorage.getItem("fullName") ||
    "Designer";

  const userRole = localStorage.getItem("role");
  const isLoggedIn = localStorage.getItem("token");

  // --- particles background ---
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
            console.error("Failed to load particles.js");
            setParticlesLoaded(true);
          };
          document.head.appendChild(script);
        } else {
          initializeParticles();
          setParticlesLoaded(true);
        }
      } catch (err) {
        console.error("Particles load error:", err);
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
      if (window.pJSDom && window.pJSDom.length > 0) {
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
        @keyframes fallbackGlow {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .fallback-bg {
          background: linear-gradient(-45deg, #ffffff, #f0f0f0, #e0f0e0, #f0f0ff);
          background-size: 400% 400%;
          animation: fallbackGlow 15s ease infinite;
        }
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

  const [categories] = useState(["Clothes", "Bags", "Shoes"]);

  const [showAddCat, setShowAddCat] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [customCategory, setCustomCategory] = useState("");

  const shoeSizes = ["38", "39", "40", "41", "42", "43", "44", "45"];

  const [form, setForm] = useState({
    title: "",
    description: "",
    sizes: [],
    stitching: "",
    fabric: "",
    sizeChartUrl: "",
    pieceCount: "",
    material: "",
    category: "",
    itemsCount: "",
    listingType: "",
    originalPrice: "",
    isOnSale: false,
    salePercentage: "",
    rentPrice: "",
    rentMinDays: "",
    securityDeposit: "",
    imageUrls: [],
    imageFiles: [], // Store raw files for upload
    terms: false,
    hasAuthenticity: false,
    gender: "Unisex", // NEW: Default value
  });

  const [uploading, setUploading] = useState(false);

  const toggleSize = (s) => {
    setForm((p) => {
      const has = p.sizes.includes(s);
      const sizes = has ? p.sizes.filter((x) => x !== s) : [...p.sizes, s];
      return { ...p, sizes };
    });
  };

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
      if (k === "listingType") {
        if (v === "sale") {
          n.rentPrice = "";
          n.rentMinDays = "";
          n.securityDeposit = "";
        }
        if (v === "rent") {
          n.originalPrice = "";
          n.isOnSale = false;
          n.salePercentage = "";
        }
      }
      if (k === "isOnSale" && !v) {
        n.salePercentage = "";
      }
      if (k === "stitching" && v === "Unstitched") {
        n.sizes = [];
        n.sizeChartUrl = "";
      }
      if (k === "category") {
        if (v === "Clothes") {
          n.material = "";
          n.sizes = [];
        } else if (v === "Shoes") {
          n.stitching = "";
          n.fabric = "";
          n.sizeChartUrl = "";
          n.pieceCount = "";
          n.sizes = [];
          n.material = "";
        } else {
          n.stitching = "";
          n.fabric = "";
          n.sizeChartUrl = "";
          n.pieceCount = "";
          n.sizes = "";
          n.material = "";
        }
      }
      return n;
    });
    if (k === "category" && v !== customCategory) setCustomCategory("");
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };

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
    } else if (e.key === "Backspace" && !tagInput) {
      setTags((prev) => prev.slice(0, -1));
    }
  };
  const removeTag = (idx) =>
    setTags((prev) => prev.filter((_, i) => i !== idx));

  const onImages = async (e) => {
    const files = Array.from(e.target.files || []);
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

    // Filter invalid files
    const validFiles = files.filter((f) => validTypes.includes(f.type));

    if (validFiles.length !== files.length) {
      setErrors((prev) => ({
        ...prev,
        images: "Only JPG, PNG, WEBP, and GIF formats are allowed.",
      }));
      return;
    }

    if (validFiles.length + form.imageUrls.length > 5) {
      setErrors((prev) => ({ ...prev, images: "Maximum 5 images allowed." }));
      return;
    }

    // Clear previous errors if check passes
    setErrors((prev) => ({ ...prev, images: "" }));

    setUploading(true);
    try {
      console.log(`🖼️ Compressing ${validFiles.length} image(s)...`);
      const results = await Promise.all(
        validFiles.map((f) => compressImage(f))
      );
      
      const newPreviews = results.map(r => r.preview);
      const newFiles = results.map(r => r.file);

      setForm((p) => ({ 
          ...p, 
          imageUrls: [...p.imageUrls, ...newPreviews],
          imageFiles: [...(p.imageFiles || []), ...newFiles]
      }));
      console.log("✅ All images compressed and added");
    } catch (err) {
      console.error("Image compression error:", err);
      setErrors((prev) => ({
        ...prev,
        images: "Failed to process images. Please try again.",
      }));
    } finally {
      setUploading(false);
    }
  };

  const removeImg = (i) =>
    setForm((p) => ({
      ...p,
      imageUrls: p.imageUrls.filter((_, idx) => idx !== i),
      imageFiles: (p.imageFiles || []).filter((_, idx) => idx !== i),
    }));

  const onSizeChart = async (e) => {
    const file = (e.target.files || [])[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      // We can use a specific error field or a generic one, or reuse 'images' field if appropriate,
      // but here I'll use a generic alert equivalent via specific state if I had one,
      // or just ignore invalid input and maybe log it.
      // Since the original was an alert, let's use a temporary error state or reuse `errors` object.
      // However, `errors.sizeChart` isn't used in JSX. Let's add it to state if needed, or just reuse `images` for simplicity?
      // Better: Just set a specific error for size chart if the user views it.
      // For now, let's use a standard pattern:
      console.error("Invalid file type for size chart");
      return;
    }

    setUploading(true);
    try {
      const compressed = await compressImage(file);
      setForm((p) => ({ ...p, sizeChartUrl: compressed }));
    } catch (err) {
      console.error("Size chart compression error:", err);
    } finally {
      setUploading(false);
    }
  };

  const removeSizeChart = () => setForm((p) => ({ ...p, sizeChartUrl: "" }));

  const discountedPrice = computeDiscountedPrice(
    form.originalPrice,
    form.salePercentage,
    form.isOnSale
  );

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Required";
    if (!form.description.trim()) e.description = "Required";
    if (!form.category) e.category = "Required";
    if (!form.itemsCount || !String(form.itemsCount).trim())
      e.itemsCount = "Required";
    if (!form.listingType) e.listingType = "Required";

    // Gender validation for specific categories
    if (["Clothes", "Clothing", "Bags", "Shoes"].includes(form.category)) {
      if (!form.gender) {
        e.gender = "Required";
      }
    }

    if (form.listingType === "sale") {
      if (!form.originalPrice) e.originalPrice = "Required";
      if (form.isOnSale) {
        const pct = Number(form.salePercentage);
        if (!form.salePercentage) e.salePercentage = "Required";
        else if (!Number.isFinite(pct) || pct < 1 || pct > 90)
          e.salePercentage = "Enter 1–90";
      }
    }

    if (form.listingType === "rent") {
      if (!form.originalPrice) e.originalPrice = "Required";
      if (!form.rentPrice) e.rentPrice = "Required";
    }

    if (form.imageUrls.length === 0 && (!form.imageFiles || form.imageFiles.length === 0)) e.images = "At least one image";

    const missingChecks = [];
    if (!form.terms) missingChecks.push("Terms & Conditions");
    if (!form.hasAuthenticity) missingChecks.push("Designer Verification");

    if (missingChecks.length > 0) {
      dialog.alert(
        `Please accept the following requirements:\n• ${missingChecks.join(
          "\n• "
        )}`,
        { title: "Error" }
      );
      // Return false immediately if checkboxes are missing, preventing other errors from showing or just returning false
      return false;
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      console.log("🚀 Starting product upload...");

      // 🔥 GET USER INFO FIRST
      const userEmail = localStorage.getItem("email");
      const userId =
        localStorage.getItem("userId") || localStorage.getItem("token");
      const designer = getDesignerFromStorage();
      const brandName =
        designer.brandName || designer.fullName || designerDisplayName;

      console.log("👤 User Info:", { userEmail, userId, brandName });

      // Prepare FormData
      const formData = new FormData();

      formData.append(
        "hasAuthenticity",
        form.hasAuthenticity ? "true" : "false"
      );

      // 🔥 CRITICAL: Add user identification fields FIRST
      formData.append("userEmail", userEmail);
      formData.append("ownerId", userId);
      formData.append("sellerId", userId);
      formData.append("userId", userId);
      formData.append("brandName", brandName);
      formData.append("sellerName", brandName);
      formData.append("role", "designer");
      formData.append("userType", "designer");
      formData.append("sellerType", "Designer");

      // Basic fields
      formData.append("name", form.title);
      formData.append("description", form.description);
      formData.append("category", form.category.toLowerCase());
      formData.append("stock", form.itemsCount || 1);

      // Pricing
      if (form.listingType === "sale") {
        formData.append("price", form.originalPrice);
        formData.append("originalPrice", form.originalPrice);
        formData.append("listingType", "sale");

        if (form.isOnSale) {
          formData.append("isOnSale", "true");
          formData.append("salePercentage", form.salePercentage);
          formData.append("salePrice", discountedPrice);
          formData.append("sellingPrice", discountedPrice);
        } else {
          formData.append("sellingPrice", form.originalPrice);
        }
      } else if (form.listingType === "rent") {
        formData.append("price", form.rentPrice);
        formData.append("listingType", "rent");
        formData.append("rentPrice", form.rentPrice);
        if (form.originalPrice) {
          formData.append("originalPrice", form.originalPrice);
        }
        if (form.rentMinDays) formData.append("rentDuration", form.rentMinDays);
        if (form.securityDeposit)
          formData.append("securityDeposit", form.securityDeposit);
      }

      // Product details
      if (tags.length > 0) formData.append("tags", tags.join(", "));
      if (form.sizes.length > 0) formData.append("size", form.sizes.join(", "));
      if (form.fabric) formData.append("fabric", form.fabric);
      if (form.material) formData.append("material", form.material);
      if (form.stitching) formData.append("stitching", form.stitching);

      if (form.pieceCount) formData.append("pieceCount", form.pieceCount);
      if (form.gender) formData.append("gender", form.gender); // NEW

      // Append Images
      console.log("📸 Appending images...");
      const filesToUpload = form.imageFiles || [];
      
      if (filesToUpload.length === 0) {
         // Fallback logic if needed, but validation should catch this
         console.warn("No image files found in state");
      }

      filesToUpload.forEach((file) => {
        formData.append("images", file);
      });
      console.log(`✅ Appended ${filesToUpload.length} images`);

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

      console.log("📤 Uploading to MongoDB...");

      // Make API call
      const response = await api.post("/products", formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log(`Upload progress: ${percentCompleted}%`);
        },
      });

      console.log("✅ Upload successful:", response.data);

      setShowSubmitted(true);

      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = "/designer/dashboard";
      }, 5000);
    } catch (err) {
      console.error("❌ Upload error:", err);

      let errorMessage = "Failed to upload product. ";

      if (err.response) {
        errorMessage +=
          err.response.data?.error ||
          err.response.data?.message ||
          "Server error";
        console.error("Server error:", err.response.data);
      } else if (err.request) {
        errorMessage += "No response from server. Check your connection.";
        console.error("No response:", err.request);
      } else {
        errorMessage += err.message;
      }

      dialog.alert(errorMessage, { title: "Upload Failed" });
    } finally {
      setSaving(false);
    }
  };



  if (!isLoggedIn || userRole?.toLowerCase() !== "designer") {
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
                Login as a Designer to upload products.
              </p>
              <a
                href="/Login"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-bold"
              >
                Login as Designer
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
                Designer – Upload Product
              </h1>
              <p className="text-white/90 mt-1">
                Uploading as <b>{designerDisplayName}</b>
              </p>
            </div>

            <div className="bg-white p-6 space-y-8">
              {/* Product Details */}
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
                      placeholder="e.g., Silk Evening Gown"
                    />
                    {errors.title && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.title}
                      </p>
                    )}
                  </div>

                  {/* Category + Tags + Items */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Product Category */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        Product Category *
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

                      {errors.category && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.category}
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

                    {/* Items (quantity) */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        Items (quantity) *
                      </label>
                      <input
                        type="number"
                        inputMode="numeric"
                        min="1"
                        step="1"
                        value={form.itemsCount}
                        onChange={(e) => setField("itemsCount", e.target.value)}
                        className={inputCls}
                        placeholder="e.g., 100"
                      />
                      {errors.itemsCount && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.itemsCount}
                        </p>
                      )}
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

                  {/* CONDITIONAL BLOCKS */}
                  {form.category === "Clothes" && (
                    <div className="grid grid-cols-1 gap-4">
                      {/* Stitching */}
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">
                          Stitching
                        </label>
                        <div className="flex items-center gap-3">
                          {["Stitched", "Unstitched"].map((v) => (
                            <label
                              key={v}
                              onClick={(e) => {
                                e.preventDefault();
                                setField("stitching", form.stitching === v ? "" : v);
                              }}
                              className={`px-3 py-1.5 rounded-xl border-2 cursor-pointer text-sm font-semibold
                              ${
                                form.stitching === v
                                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                  : "border-gray-200 hover:border-emerald-300"
                              }`}
                            >
                              <input
                                type="radio"
                                name="stitching"
                                className="hidden"
                                checked={form.stitching === v}
                                onChange={() => {}}
                              />
                              {v}
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Sizes + Size Chart (stitched only) */}
                      {form.stitching === "Stitched" && (
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">
                            Sizes
                          </label>
                          <div className="flex items-center gap-3">
                            {["S", "M", "L"].map((s) => (
                              <label
                                key={s}
                                className={`px-3 py-1.5 rounded-xl border-2 cursor-pointer text-sm font-semibold
                                ${
                                  form.sizes.includes(s)
                                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                    : "border-gray-200 hover:border-emerald-300"
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

                          <div className="mt-4">
                            <label className="block text-sm font-bold text-gray-700 mb-1">
                              Size Chart (optional)
                            </label>
                            {form.sizeChartUrl ? (
                              <div className="relative inline-block">
                                <img
                                  src={form.sizeChartUrl}
                                  alt="size-chart"
                                  className="w-48 h-48 object-cover rounded-xl border"
                                />
                                <button
                                  onClick={removeSizeChart}
                                  className="absolute -top-2 -right-2 bg-white border rounded-full p-1 shadow focus:outline-none"
                                  aria-label="Remove size chart"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <label className="border-2 border-dashed rounded-xl h-36 w-48 flex items-center justify-center cursor-pointer hover:bg-gray-50">
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={onSizeChart}
                                  disabled={uploading}
                                />
                                <div className="flex flex-col items-center text-gray-600">
                                  <Upload className="h-6 w-6 mb-1" />{" "}
                                  {uploading ? "Processing..." : "Upload Image"}
                                </div>
                              </label>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Fabric + Pieces */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">
                            Fabric
                          </label>
                          <input
                            value={form.fabric}
                            onChange={(e) => setField("fabric", e.target.value)}
                            className={inputCls}
                            placeholder="e.g., Lawn, Cotton, Silk"
                          />
                        </div>
                        <div>
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
                      </div>
                    </div>
                  )}

                  {(form.category === "Bags" || form.category === "Shoes") && (
                    <>
                      {form.category === "Shoes" ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">
                              Material
                            </label>
                            <input
                              value={form.material}
                              onChange={(e) =>
                                setField("material", e.target.value)
                              }
                              className={inputCls}
                              placeholder="e.g., Leather, PU, Canvas, Rubber"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">
                              Sizes
                            </label>
                            <div className="flex flex-wrap items-center gap-3">
                              {shoeSizes.map((s) => (
                                <label
                                  key={s}
                                  className={`px-3 py-1.5 rounded-xl border-2 cursor-pointer text-sm font-semibold
                                  ${
                                    form.sizes.includes(s)
                                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                      : "border-gray-200 hover:border-emerald-300"
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
                          </div>
                        </div>
                      ) : (
                        <div>
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
                    </>
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

              {/* Listing & Price */}
              <Section title="Listing & Price">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Listing Type *
                  </label>
                  <div className="flex gap-3">
                    {["sale", "rent"].map((v) => (
                      <label
                        key={v}
                        className={`px-3 py-2 rounded-xl border-2 cursor-pointer text-sm font-semibold
                        ${
                          form.listingType === v
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : "border-gray-200 hover:border-emerald-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="lt"
                          className="hidden"
                          checked={form.listingType === v}
                          onChange={() => setField("listingType", v)}
                        />
                        {v === "sale" ? "Sale Only" : "Rent Only"}
                      </label>
                    ))}
                  </div>
                  {errors.listingType && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.listingType}
                    </p>
                  )}
                </div>

                {form.listingType === "sale" && (
                  <div className="grid grid-cols-1 gap-3">
                    <div>
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
                          placeholder="25000"
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

                    {form.isOnSale && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-orange-50 border-2 border-orange-200 p-4 rounded-2xl">
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
                            placeholder="20"
                          />
                          {errors.salePercentage && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors.salePercentage}
                            </p>
                          )}
                          {form.salePercentage !== "" &&
                            (Number(form.salePercentage) < 1 ||
                              Number(form.salePercentage) > 90) &&
                            !errors.salePercentage && (
                              <p className="text-amber-700 text-xs mt-1 flex items-center gap-1">
                                <AlertTriangle className="h-4 w-4" /> Enter a
                                value between 1 and 90.
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
                      <div className="text-sm bg-white border rounded-xl p-3">
                        Final Sale Price will be: <b>Rs {discountedPrice}</b>
                      </div>
                    )}
                  </div>
                )}

                {form.listingType === "rent" && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    {/* Product Price */}
                    <div className="md:col-span-1">
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        Product Price (Rs) *
                      </label>
                      <input
                        type="number"
                        value={form.originalPrice}
                        onChange={(e) =>
                          setField("originalPrice", e.target.value)
                        }
                        className={inputCls}
                        placeholder="e.g., 25000"
                      />
                      {errors.originalPrice && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.originalPrice}
                        </p>
                      )}
                    </div>

                    {/* Rent per day */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        Rent Price Per Day (Rs) *
                      </label>
                      <input
                        type="number"
                        value={form.rentPrice}
                        onChange={(e) => setField("rentPrice", e.target.value)}
                        className={inputCls}
                        placeholder="2000"
                      />
                      {errors.rentPrice && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.rentPrice}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </Section>

              {/* Images */}
              <Section title="Upload Images">
                {uploading && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3 mb-3">
                    <p className="text-blue-700 font-semibold text-sm">
                      🖼️ Compressing images... Please wait.
                    </p>
                  </div>
                )}
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
                    <label
                      className={`border-2 border-dashed rounded-xl h-36 flex items-center justify-center ${
                        uploading
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={onImages}
                        disabled={uploading}
                      />
                      <div className="flex flex-col items-center text-gray-600">
                        <Upload className="h-6 w-6 mb-1" />{" "}
                        {uploading ? "Processing..." : "Add Image"}
                      </div>
                    </label>
                  )}
                </div>

                {errors.images && (
                  <p className="text-red-500 text-xs mt-1">{errors.images}</p>
                )}
              </Section>

              {/* Terms & Publish */}
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
                    <Shield className="h-4 w-4" /> Designer Verification
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
                  disabled={saving || uploading}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold shadow focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-5 w-5" />{" "}
                  {saving ? "Saving..." : "Publish"}
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
            <li>
              Deposit can only be up to 10% of the total rent price charged from
              buyers.
            </li>
            <li>Provide truthful pricing and condition.</li>
            <li>Real images, no infringement of IP rights.</li>
            <li>Timely replies to buyers/renters.</li>
            <li>Comply with local laws & platform rules.</li>
          </ul>
          <p>Violations may lead to removal or account limits.</p>
        </Modal>

        {/* Verification Modal */}
        <Modal
          open={showVerify}
          title="Designer Verification"
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
            By enabling <b>Designer Verification</b> you confirm the product's
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
                window.location.href = "/designer/dashboard";
              }}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
            >
              Go to Designer Dashboard
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
              You will be redirected to your Designer Dashboard shortly.
            </p>
          </div>
        </Modal>

        <Footer />
      </div>
    </div>
  );
}
