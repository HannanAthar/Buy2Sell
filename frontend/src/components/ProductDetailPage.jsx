import React, { useEffect, useMemo, useState } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion"; // eslint-disable-line no-unused-vars
import { useLocation, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Heart,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "react-hot-toast";
import Header from "./Header";
import { useProducts } from "./ProductContext";
import { readStorage, writeStorage } from "../utils/storage";
import RatingStars from "./RatingStars";
import RateProductModal from "./RateProductModal";
import ReviewsList from "./ReviewsList";
import CommentsToggle from "./CommentsToggle";
import ReviewsModal from "./ReviewsModal";
import RentalBadge from "./RentalBadge";
import DesignerCard from "./DesignerCard";
import ResellerCard from "./ResellerCard";
import CustomStyleProductCard from "./CustomYourStyle/ProductCard";
import CloudinaryImage from "./common/CloudinaryImage";
import api from "../api/axios";

const num = (v, d = 0) => (v == null || isNaN(Number(v)) ? d : Number(v));
const lsGet = (k, d = null) => {
  if (k === "cart" || k === "wishlist") {
    const v = readStorage(k);
    return v && v.length > 0 ? v : d;
  }
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : d;
  } catch { /* ignore */ }
};

// Simple Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ProductPage Crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col pt-20 items-center justify-center bg-gray-50 text-center px-4">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Something went wrong
          </h1>
          <p className="text-gray-600 mb-6 max-w-md">
            We encountered an error while loading this product. It might be
            missing essential data.
          </p>
          <div className="bg-red-50 text-red-700 p-3 rounded mb-6 text-left text-xs font-mono max-w-md overflow-auto whitespace-pre-wrap">
            {this.state.error?.toString()}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-[var(--primary-green)] text-white rounded-lg hover:bg-[var(--dark-green)] transition"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
const lsSet = (k, v) => {
  if (k === "cart" || k === "wishlist") {
    writeStorage(k, v);
    return;
  }
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch { /* ignore */ }
};

import { getOptimizedImageUrl } from "../utils/cloudinaryUtils";


function ProductDetailPage() {
  const location = useLocation();
  const nav = useNavigate();
  const {
    designerProducts = [],
    resellerProducts = [],
    customProducts = [],
    loading: contextLoading,
  } = useProducts();

  // New state for direct API fetch fallback
  const [fetchedProduct, setFetchedProduct] = useState(null);
  const [fetchLoading, setFetchLoading] = useState(false);

  // 1. Try state
  const stateProduct = location.state;

  // 2. Try URL param lookup
  const searchParams = new URLSearchParams(location.search);
  const paramId = searchParams.get("id");

  // 3. Resolve product
  const product = useMemo(() => {
    if (stateProduct) return stateProduct;
    if (fetchedProduct) return fetchedProduct; // Use directly fetched product
    if (!paramId) return null;

    // Search context
    const all = [...designerProducts, ...resellerProducts];
    const found = all.find((p) => String(p.id || p._id) === String(paramId));
    if (found) return found;

    // Fallback: LocalStorage "product:ID" cache (from Dashboard click)
    try {
      const cached = JSON.parse(localStorage.getItem(`product:${paramId}`));
      if (cached) return cached;
    } catch { /* ignore */ }

    // Fallback: LocalStorage Wishlist
    try {
      const w = readStorage("wishlist");
      const wFound = w.find((p) => String(p.id || p._id) === String(paramId));
      if (wFound) return wFound;
    } catch { /* ignore */ }

    // Fallback: LocalStorage Cart
    try {
      const c = readStorage("cart");
      const cFound = c.find((p) => String(p.id || p._id) === String(paramId));
      if (cFound) return cFound;
    } catch { /* ignore */ }

    return null;
  }, [
    stateProduct,
    fetchedProduct,
    paramId,
    designerProducts,
    resellerProducts,
  ]);

  // Effect to fetch product if not found in context/storage
  useEffect(() => {
    if (paramId && !product && !contextLoading && !fetchLoading) {
      const fetchDirectly = async () => {
        try {
          setFetchLoading(true);
          const { data } = await api.get(`/products/${paramId}`);
          if (data && data.product) {
            setFetchedProduct(data.product);
          }
        } catch (err) {
          console.error("Direct product fetch failed:", err);
        } finally {
          setFetchLoading(false);
        }
      };

      fetchDirectly();
    }
  }, [paramId, product, contextLoading, fetchLoading]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.key]);

  const [ratingData, setRatingData] = useState(null);

  useEffect(() => {
    if (product) {
      const pid = product._id || product.id;
      api
        .get(`/reviews/product/${pid}`)
        .then((res) => setRatingData(res.data))
        .catch((err) => console.error("Failed to fetch rating:", err));
    }
  }, [product]);

  // --- HOISTED HOOKS START ---
  const [qty, setQty] = useState(1);
  const [selectedSize, setSelectedSize] = useState("");
  const [sizeError, setSizeError] = useState("");
  const [wishlist, setWishlist] = useState(() => lsGet("wishlist", []));
  const [zoom, setZoom] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState("50% 50%");
  const [idx, setIdx] = useState(0);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [isCommentsExpanded, setIsCommentsExpanded] = useState(false);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const [direction, setDirection] = useState(0); // 1 = right, -1 = left

  const controls = useAnimation();

  // Swipe Logic
  const touchStartX = React.useRef(0);
  const touchEndX = React.useRef(0);

  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      // Next image
      setIdx((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    }
    if (isRightSwipe) {
      // Prev image
      setIdx((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    }
    // Reset
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  const tagsArray = useMemo(() => {
    if (!product) return [];
    const raw = product.tags ?? [];
    if (Array.isArray(raw))
      return raw
        .map((t) => String(t).trim())
        .filter(Boolean)
        .slice(0, 12);
    if (typeof raw === "string")
      return raw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 12);
    return [];
  }, [product]);

  const sizesArray = useMemo(() => {
    if (!product) return [];
    let raw =
      product.sizes ??
      product.size ??
      product.availableSizes ??
      product.sizeOptions ??
      [];
    const isCustom =
      product.isCustom === true || product.source === "custom-shirt";

    // Only fallback to S/M/L/XL if it is a generic custom design tool item
    // AND has no specified sizes.
    // If it's a "custom-style" product from admin (which counts as custom),
    // we should trust its empty sizing if it really has none, or its specific sizes.
    // We strictly apply fallback ONLY if we are sure it's necessary.
    if (isCustom && (!raw || (Array.isArray(raw) && raw.length === 0))) {
      // If product has an explicit 'productType' of 'custom-style', it means it was added
      // via Admin -> Custom Products. We should NOT force fake sizes on it.
      // We only force fake sizes for the "Designer Tool" flows if needed.
      if (product.productType === "custom-style") {
        // Do nothing, let it be empty array
      } else {
        raw = ["S", "M", "L", "XL"];
      }
    }
    const list = Array.isArray(raw) ? raw : [raw];
    return list
      .flatMap((v) => String(v ?? "").split(/[,/|]/))
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => (/^\d+(\.\d+)?$/.test(s) ? s : s.toUpperCase()));
  }, [product]);

  const showSizeSelector = sizesArray.length > 0;

  useEffect(() => {
    if (showSizeSelector && sizesArray.length === 1) {
      setSelectedSize(sizesArray[0]);
    }
  }, [showSizeSelector, sizesArray]);

  const related = useMemo(() => {
    if (!product) return [];
    const pid = product.id || product._id;
    const category = String(
      product.category ||
        product.type ||
        product.productType ||
        product.mainCategory ||
        ""
    ).toLowerCase();
    const brandName = String(
      product.sellerName ||
        product.brandName ||
        product.designerName ||
        product.resellerName ||
        product.shopName ||
        ""
    ).toLowerCase();

    const all = [...designerProducts, ...resellerProducts, ...customProducts];
    const results = all
      .filter((p) => (p.id || p._id) !== pid)
      .filter((p) => {
        const pc = String(
          p.category || p.type || p.productType || p.mainCategory || ""
        ).toLowerCase();
        const pb = String(
          p.sellerName ||
            p.brandName ||
            p.designerName ||
            p.resellerName ||
            p.shopName ||
            ""
        ).toLowerCase();
        // Custom Product Logic: STRICTLY show only other custom/store items
        const isCurrentCustom =
          product.isCustom === true || product.source === "custom-shirt";

        if (isCurrentCustom) {
          return (
            p.isCustom === true ||
            p.source === "custom-shirt" ||
            p.sellerType === "Store" ||
            p.productType === "custom-style"
          );
        }

        if (category && pc.includes(category)) return true;
        if (brandName && pb.includes(brandName)) return true;

        return !category && !brandName;
      });

    return results.slice(0, 10);
  }, [product, designerProducts, resellerProducts, customProducts]);
  // --- HOISTED HOOKS END ---

  // Show loader while context or direct fetch is loading
  if ((contextLoading || fetchLoading) && !product && !stateProduct) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary-green)]"></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-xl p-6 text-center">
            <div className="text-4xl mb-2">😕</div>
            <h1 className="text-xl font-semibold mb-2">Product Not Found</h1>
            <p className="text-gray-600 mb-4">
              We couldn't find the product you're looking for. It may have been
              removed or the link is invalid. (ID: {paramId || "Unknown"})
            </p>
            <button
              onClick={() => nav(-1)}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-[var(--primary-green)] hover:bg-[var(--dark-green)] text-white font-medium transition-colors"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const pid = product.id || product._id;

  // Check if this is a custom design
  const isCustomDesign =
    product.isCustom === true || product.source === "custom-shirt";

  const isDesignerProduct =
    !isCustomDesign &&
    designerProducts.some((p) => String(p.id || p._id) === String(pid));
  const isResellerProduct =
    !isCustomDesign && resellerProducts.some((p) => (p.id || p._id) === pid);

  const role = isCustomDesign
    ? "Custom"
    : isDesignerProduct
    ? "Designer"
    : isResellerProduct
    ? "Reseller"
    : "Seller";

  const images = (() => {
    if (Array.isArray(product.imageUrls) && product.imageUrls.length)
      return product.imageUrls;
    if (Array.isArray(product.images) && product.images.length)
      return product.images;
    if (typeof product.imageUrl === "string") return [product.imageUrl];
    if (typeof product.image === "string") return [product.image];
    return [];
  })();

  const brandName = isCustomDesign
    ? "Buy2Sell Custom"
    : product.sellerName ||
      product.brandName ||
      product.designerName ||
      product.resellerName ||
      product.shopName ||
      product.storeName ||
      "";

  const titleText =
    product.name ||
    product.title ||
    product.productTitle ||
    product.productName ||
    product.description ||
    "Product";

  const rating = num(
    ratingData?.averageRating ??
      product.averageRating ??
      product.avgRating ??
      product.rating ??
      product.stars ??
      product.reviewScore ??
      0,
    0
  );
  const ratingCount = num(
    ratingData?.ratingCount ??
      product.ratingCount ??
      product.reviewsCount ??
      product.totalReviews ??
      product.numReviews ??
      (Array.isArray(product.reviews) ? product.reviews.length : 0),
    0
  );

  const requireSize = showSizeSelector;

  const fabric = product.fabric || product.Fabric || "";
  const material = product.material || "";
  const pieceCount = product.pieceCount || product.pieces || "";
  const sizeChartUrl = product.sizeChartUrl || product.sizeChart || "";
  const category =
    product.category ||
    product.type ||
    product.productType ||
    product.mainCategory ||
    "";
  const color = product.color || product.colour || "";
  const condition =
    product.condition ||
    (product.conditionRating ? `${product.conditionRating}/10` : "");

  // Stock Logic
  // 1. Custom designs: Treat 999 as unlimited (null). Ignore cart quantity.
  // 2. Regular products: Use stock/itemsCount. Do NOT use 'quantity' as it often represents Cart Quantity (e.g. 1).
  const stockQty = (() => {
    if (isCustomDesign) {
      const s = product.stockQty ?? product.stock;
      // Convert legacy 999 to null (unlimited)
      return s == 999 || s == "999" ? null : s;
    }
    // For non-custom, prioritize explicit stock keys
    return (
      product.stock ??
      product.stockQty ??
      product.itemsCount ??
      product.inventory ??
      null
    );
  })();

  const clampToStock = (val) => {
    let q = Math.max(1, num(val || 1));
    if (stockQty != null) q = Math.min(q, stockQty);
    return q;
  };

  const stitchedRaw =
    product.stitched ??
    product.isStitched ??
    product.stitching ??
    product.stitchingType ??
    product.stitchingInfo ??
    null;

  const stitchedLabel = (() => {
    if (typeof stitchedRaw === "boolean")
      return stitchedRaw ? "Stitched" : "Unstitched";
    if (typeof stitchedRaw === "string") {
      const s = stitchedRaw.toLowerCase();
      if (s.includes("un")) return "Unstitched";
      if (s.includes("stitch")) return "Stitched";
      return stitchedRaw;
    }
    return "";
  })();

  const listingType = String(product.listingType || "").toLowerCase();
  const canRent = listingType === "rent" || listingType === "both";
  const canBuy =
    listingType === "sale" || listingType === "both" || listingType === "";

  const rawBasePrice = num(
    product.originalPrice ??
      product.mrp ??
      product.listPrice ??
      product.maxPrice ??
      product.price ??
      product.sellingPrice ??
      product.salePrice ??
      product.rentPrice ??
      0
  );
  const discounted =
    product.salePrice ??
    product.sellingPrice ??
    product.discountedPrice ??
    null;
  const hasDiscount = discounted != null && discounted < rawBasePrice;

  const effectivePrice = hasDiscount
    ? discounted
    : product.salePrice ??
      product.sellingPrice ??
      product.price ??
      product.rentPrice ??
      rawBasePrice;

  const productBasePrice =
    listingType === "rent" || listingType === "both"
      ? num(product.originalPrice ?? rawBasePrice)
      : 0;

  const isVerified = !!(
    product.hasAuthenticity ||
    product.isVerified ||
    product.verified
  );

  const isInWishlist = wishlist.some((i) => (i.id || i._id) === pid);
  const toggleWishlist = () => {
    // Create a lightweight product object for wishlist
    // For custom designs with data URIs, we need to avoid localStorage quota errors
    const isCustom = product.isCustom || product.source === "custom-shirt";
    const hasDataURI =
      product.customPreview?.startsWith("data:") ||
      product.image?.startsWith("data:");

    let wishlistItem;
    if (isCustom && hasDataURI) {
      // Custom design with large data URI - create lightweight version
      console.log(
        "⚠️ Saving custom design to wishlist without data URI to prevent storage errors"
      );
      wishlistItem = {
        ...product,
        // Mark as custom but remove large data URIs
        _customDesign: true,
        _hasDataURI: true,
        // Use base shirt image instead of data URI
        customPreview: undefined,
        image:
          product.imageUrls?.[1] ||
          product.imageUrls?.[2] ||
          "/placeholder.svg",
        imageUrls:
          product.imageUrls?.filter((url) => !url.startsWith("data:")) || [],
        // Preserve essential data
        id: product.id || product._id,
        _id: product._id || product.id,
        name: product.name,
        price: product.price || product.sellingPrice,
        sellingPrice: product.sellingPrice || product.price,
      };
    } else {
      // Regular product - save normally
      wishlistItem = {
        ...product,
        image: product.image,
        imageUrl: product.imageUrl,
        imageUrls: product.imageUrls,
        images: product.images,
        customPreview: product.customPreview,
        id: product.id || product._id,
        _id: product._id || product.id,
      };
    }

    const updated = isInWishlist
      ? wishlist.filter((i) => (i.id || i._id) !== pid)
      : [...wishlist, wishlistItem];
    setWishlist(updated);
    lsSet("wishlist", updated);
    window.dispatchEvent(new Event("wishlistUpdated"));
  };

  const isLoggedIn = () => {
    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("userToken") ||
        localStorage.getItem("user") ||
        localStorage.getItem("userData");
      return !!token;
    } catch {
      return false;
    }
  };

  const handleCardWishlistToggle = (item) => {
    const itemPid = item.id || item._id;
    const exists = wishlist.some((w) => (w.id || w._id) === itemPid);
    const updated = exists
      ? wishlist.filter((w) => (w.id || w._id) !== itemPid)
      : [...wishlist, item];
    setWishlist(updated);
    lsSet("wishlist", updated);
    window.dispatchEvent(new Event("wishlistUpdated"));
  };

  const ensureValid = () => {
    if (requireSize && !selectedSize) {
      setSizeError("Please select a size.");
      controls.start({
        x: [0, -10, 10, -10, 10, 0],
        transition: { duration: 0.5 },
      });
      return false;
    }
    setSizeError("");
    return true;
  };

  const baseCartItem = () => ({
    cartId: Date.now() + Math.random(),
    id: pid,
    title: titleText,
    description: product.description || titleText,
    imageUrls: images,

    // pricing
    sellingPrice: hasDiscount
      ? discounted
      : product.salePrice ??
        product.sellingPrice ??
        product.price ??
        product.rentPrice ??
        0,
    originalPrice: productBasePrice || Number(product.originalPrice ?? 0),
    price: Number(
      product.salePrice ??
        product.sellingPrice ??
        product.price ??
        product.rentPrice ??
        effectivePrice ??
        0
    ),

    // quantity (respect stock, reseller forced to 1)
    quantity: isResellerProduct ? 1 : clampToStock(qty),

    // NEW: persist seller type + stock for cart logic
    sellerId: product.sellerId || product.ownerId || product.userId,
    sellerType: isResellerProduct
      ? "Reseller"
      : isDesignerProduct
      ? "Designer"
      : product.sellerType || role,
    stock: stockQty,
    stockQty,

    // Custom Design Props
    isCustom: isCustomDesign,
    customPreview: product.customPreview || images[0],
    source: product.source || "product-page",
    meta: {
      brandName,
      listingType: product.listingType,
      size: selectedSize || undefined,
      tags: tagsArray,
    },
  });

  const addToCartOnly = () => {
    const cart = lsGet("cart", []);
    const matchKey = (i) =>
      i.id === pid && i.meta?.size === (selectedSize || undefined);

    const exists = cart.find(matchKey);

    if (!exists) {
      const item = baseCartItem();
      item.quantity = clampToStock(item.quantity);
      cart.push(item);
    } else {
      const current = num(exists.quantity || 1);
      const next = clampToStock(current + (isResellerProduct ? 0 : qty));
      exists.quantity = next;
    }

    lsSet("cart", cart);
  };



  const onBuyNow = () => {
    if (!ensureValid()) return;
    if (!isLoggedIn()) {
      toast.error("Please log in to proceed to checkout");
      localStorage.setItem("redirectAfterLogin", "/checkout");
      setTimeout(() => nav("/Login"), 1500);
      return;
    }
    const item = baseCartItem();
    item.type = "sale";
    item.listingType = "sale";
    const subtotal =
      num(item.sellingPrice || 0) * Math.max(1, num(item.quantity || 1));
    lsSet("checkoutData", { items: [item], subtotal, total: subtotal });
    nav("/checkout");
  };

  const onRentNow = () => {
    if (!ensureValid()) return;

    if (!isLoggedIn()) {
      toast.error("Please log in to rent products");
      localStorage.setItem("redirectAfterLogin", "/cart");
      setTimeout(() => nav("/Login"), 1500);
      return;
    }

    const rentItem = {
      ...baseCartItem(),
      type: "rent",
      isRent: true,
      mode: "rent",
      selectedFor: "rent",
      quantity: clampToStock(qty),
      listingType: "rent",
      rentPrice: product.rentPrice || 0,
      rentDays: Math.max(
        1,
        Math.min(7, num(product.rentDuration || product.rentMinDays || 1))
      ),
    };

    const cart = lsGet("cart", []);
    const exists = cart.find(
      (i) =>
        i.id === pid &&
        i.meta?.size === (selectedSize || undefined) &&
        (i.type === "rent" || i.isRent === true)
    );

    if (!exists) {
      cart.push(rentItem);
    } else {
      const current = num(exists.quantity || 1);
      const next = clampToStock(current + qty);
      exists.quantity = next;
      exists.rentDays = rentItem.rentDays;
    }

    lsSet("cart", cart);
    try {
      window.dispatchEvent(new Event("cartUpdated"));
    } catch { /* ignore */ }
    nav("/cart");
  };

  const handleRatingClick = () => {
    if (!isLoggedIn()) {
      toast.error("Please login to rate this product");
      return;
    }
    // Check if owner
    const userData = localStorage.getItem("user");
    if (userData) {
      const u = JSON.parse(userData);
      const isOwner =
        u._id === product.sellerId ||
        u._id === product.ownerId ||
        u._id === product.userId;
      if (isOwner) {
        toast.error("You cannot rate your own product");
        return;
      }
    }
    setIsRateModalOpen(true);
  };

  const handleMouseMove = (e) => {
    if (!zoom) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin(`${x}% ${y}%`);
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-b from-white to-gray-50"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1], // Custom cubic-bezier for smooth entrance
      }}
    >
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center text-xs text-gray-500 mb-3">
          <button
            onClick={() => nav(-1)}
            className="flex items-center hover:text-gray-800 mr-1"
          >
            <ChevronLeft className="h-4 w-4 mr-0.5" />
            Back
          </button>
          <span className="mx-1">/</span>
          <span className="truncate max-w-[220px] text-gray-700">
            {titleText}
          </span>
        </div>
        {/* CARD IS NOW RELATIVE SO HEART CAN BE ABSOLUTE */}
        <div className="relative bg-white rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8">
          {/* HEART ABSOLUTE TOP-RIGHT INSIDE CARD */}
          <button
            onClick={toggleWishlist}
            className={`absolute top-4 right-4 md:top-6 md:right-6 p-3 rounded-full border transition-colors ${
              isInWishlist
                ? "bg-red-50 border-red-200 text-red-500"
                : "bg-white border-gray-300 hover:border-red-500 hover:text-red-500"
            }`}
            title={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart
              className={`h-4 w-4 ${
                isInWishlist ? "fill-current" : "fill-transparent"
              }`}
            />
          </button>

          {/* MAIN GRID */}
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-8 lg:gap-10 items-start"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.2,
                  delayChildren: 0.1,
                },
              },
            }}
            initial="hidden"
            animate="show"
          >
            {/* LEFT: GALLERY */}
            <motion.div
              className="space-y-3"
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
              }}
            >
              <div
                className={`relative bg-gray-100 rounded-2xl overflow-hidden border ${
                  zoom ? "cursor-move" : "cursor-zoom-in"
                } touch-pan-y`}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setZoomOrigin("50% 50%")}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <AnimatePresence initial={false} custom={direction}>
                  {images.length ? (
                    <motion.img
                      key={idx}
                      custom={direction}
                      variants={{
                        enter: (direction) => ({
                          x: direction > 0 ? 1000 : -1000,
                          opacity: 0,
                          position: "absolute",
                        }),
                        center: {
                          zIndex: 1,
                          x: 0,
                          opacity: 1,
                          position: "relative",
                        },
                        exit: (direction) => ({
                          zIndex: 0,
                          x: direction < 0 ? 1000 : -1000,
                          opacity: 0,
                          position: "absolute",
                        }),
                      }}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{
                        x: { type: "spring", stiffness: 300, damping: 30 },
                        opacity: { duration: 0.2 },
                      }}
                      src={getOptimizedImageUrl(images[idx], 1280)}
                      alt={titleText}
                      srcSet={`
                        ${getOptimizedImageUrl(images[idx], 640)} 640w,
                        ${getOptimizedImageUrl(images[idx], 800)} 800w,
                        ${getOptimizedImageUrl(images[idx], 1024)} 1024w,
                        ${getOptimizedImageUrl(images[idx], 1280)} 1280w
                      `}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 70vw, 50vw"
                      className="w-full max-h-[560px] h-full object-contain bg-white cursor-zoom-in"
                      style={{
                        transform: zoom ? `scale(2.2)` : "scale(1)",
                        transformOrigin: zoomOrigin,
                      }}
                      onClick={() => setZoom((z) => !z)}
                      onError={(e) =>
                        (e.currentTarget.src = "/placeholder.svg")
                      }
                    />
                  ) : null}
                </AnimatePresence>
                {/* RENTAL BADGE for Detail Page */}
                 <RentalBadge product={product} />
                {/* Fallback space filler if needed or handled by absolute positioning */}
                {images.length === 0 && (
                  <div className="w-full h-[560px] flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}

                {images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDirection(-1);
                        setIdx((p) => (p > 0 ? p - 1 : images.length - 1));
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 shadow-md min-h-[44px] min-w-[44px] flex items-center justify-center z-10 hover:scale-110 transition-transform"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDirection(1);
                        setIdx((p) => (p < images.length - 1 ? p + 1 : 0));
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 shadow-md min-h-[44px] min-w-[44px] flex items-center justify-center z-10 hover:scale-110 transition-transform"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>

              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setIdx(i)}
                      className={`relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border ${
                        i === idx
                          ? "border-emerald-500 ring-2 ring-emerald-200"
                          : "border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      <CloudinaryImage
                        src={img}
                        alt={`${titleText} ${i + 1}`}
                        className="w-full h-full object-cover"
                        sizes="64px"
                        width={64}
                        height={64}
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Comments Toggle - Below Product Image, Bottom-Left */}
              <div className="mt-3">
                <button
                  onClick={() => {
                    // On mobile, open modal instead of inline expansion
                    if (window.innerWidth < 768) {
                      setIsMobileModalOpen(true);
                    } else {
                      setIsCommentsExpanded(!isCommentsExpanded);
                    }
                  }}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-emerald-600 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 rounded-lg"
                  aria-expanded={isCommentsExpanded}
                  aria-controls="comments-section"
                  aria-label={`${
                    isCommentsExpanded ? "Hide" : "Show"
                  } comments`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>
                    Comments
                    {ratingCount > 0 && (
                      <span className="ml-1">({ratingCount})</span>
                    )}
                  </span>
                  {isCommentsExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </motion.div>

            {/* RIGHT: DETAILS */}
            <motion.div
              className="space-y-5"
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
              }}
            >
              {/* MOVED TITLE BLOCK */}
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-600">
                  {role}
                </p>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {titleText}
                </h1>
                {brandName && (
                  <p className="text-sm text-gray-600">
                    by{" "}
                    {isDesignerProduct ? (
                      <button
                        type="button"
                        onClick={() =>
                          product.sellerId
                            ? nav(`/designer-hub?sellerId=${product.sellerId}`)
                            : nav(
                                `/designer-hub?d=${encodeURIComponent(
                                  brandName
                                )}`
                              )
                        }
                        className="font-medium text-emerald-700 hover:underline"
                      >
                        {brandName}
                      </button>
                    ) : (
                      <span className="font-medium text-gray-700">
                        {brandName}
                      </span>
                    )}
                  </p>
                )}

                <button
                  onClick={handleRatingClick}
                  className="flex items-center gap-2 mt-1 group"
                  title="Click to rate"
                >
                  <RatingStars
                    rating={rating}
                    size={18}
                    interactive={false}
                    className="group-hover:scale-105 transition-transform origin-left"
                  />
                  <span className="text-xs text-gray-600 group-hover:text-emerald-700 underline-offset-2 group-hover:underline">
                    {rating > 0 ? rating.toFixed(1) : "No ratings"} (
                    {ratingCount} reviews)
                  </span>
                </button>
              </div>

              {/* PRICE BLOCK */}
              <div className="rounded-2xl shadow-sm border border-emerald-100 bg-emerald-50 p-4 sm:p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    {hasDiscount ? (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600 line-through text-sm">
                            Rs {rawBasePrice.toLocaleString()}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white text-emerald-700 text-[11px] font-semibold border border-emerald-200">
                            {Math.round(
                              ((rawBasePrice - discounted) / rawBasePrice) * 100
                            )}
                            % OFF
                          </span>
                        </div>
                        <div className="text-3xl font-extrabold text-emerald-700">
                          Rs {Number(discounted).toLocaleString()}
                          {canRent && product.rentPrice != null && (
                            <span className="text-lg font-semibold text-gray-800 ml-2">
                              / Per Day
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="text-3xl font-extrabold text-emerald-700">
                        Rs {Number(effectivePrice).toLocaleString()}
                        {canRent && product.rentPrice != null && (
                          <span className="text-lg font-semibold text-gray-800 ml-2">
                            / Per Day
                          </span>
                        )}
                      </div>
                    )}

                    {canRent && productBasePrice > 0 && (
                      <div className="text-sm text-gray-800">
                        Total Product Price:{" "}
                        <span className="font-semibold text-gray-900">
                          Rs {productBasePrice.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {stockQty != null && (
                    <div className="text-right">
                      <div className="text-xs text-gray-700">In stock</div>
                      <div className="text-base font-semibold text-gray-900">
                        {stockQty}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  {isVerified && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/70 text-emerald-700 border border-emerald-200 font-semibold">
                      ✔ Verified Authentic
                    </span>
                  )}
                  {listingType === "rent" && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/70 text-indigo-700 border border-indigo-200 font-semibold">
                      Rent Only
                    </span>
                  )}
                  {listingType === "sale" && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/70 text-rose-700 border border-rose-200 font-semibold">
                      Buy Only
                    </span>
                  )}
                  {listingType === "both" && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/70 text-amber-700 border border-amber-200 font-semibold">
                      Buy or Rent
                    </span>
                  )}
                </div>
              </div>

              {/* SIZE / QTY / META */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 space-y-4">
                {showSizeSelector && (
                  <motion.div animate={controls}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900">Size</p>
                      {sizeChartUrl && (
                        <button
                          type="button"
                          onClick={() => window.open(sizeChartUrl, "_blank")}
                          className="text-xs text-emerald-700 hover:underline"
                        >
                          View Size chart
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {sizesArray.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            setSelectedSize(s);
                            setSizeError("");
                          }}
                          className={`px-4 py-3 rounded-full border text-sm font-medium transition-all active:scale-95 min-w-[44px] flex items-center justify-center ${
                            selectedSize === s
                              ? "border-emerald-600 bg-emerald-50 text-emerald-700 shadow-sm"
                              : "border-gray-200 hover:border-gray-400 text-gray-800 hover:bg-gray-50"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    {sizeError && (
                      <p className="text-xs text-red-500 mt-1">{sizeError}</p>
                    )}
                  </motion.div>
                )}

                {!isResellerProduct && (
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      Quantity
                    </p>
                    <div className="inline-flex items-center rounded-full border border-gray-300 overflow-hidden bg-gray-50">
                      <button
                        type="button"
                        onClick={() => setQty((q) => clampToStock(q - 1))}
                        className="w-11 h-11 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors"
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <div className="w-12 h-11 flex items-center justify-center text-sm font-medium text-gray-900 bg-white border-x border-gray-200">
                        {qty}
                      </div>
                      <button
                        type="button"
                        onClick={() => setQty((q) => clampToStock(q + 1))}
                        className="w-11 h-11 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    {stockQty != null && (
                      <span className="ml-2 text-xs text-gray-500">
                        In stock: {stockQty}
                      </span>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-xs text-gray-600 border-t border-gray-100 pt-3">
                  {fabric && (
                    <div>
                      <div className="font-semibold text-gray-800 text-xs">
                        Fabric
                      </div>
                      <div>{fabric}</div>
                    </div>
                  )}
                  {material && (
                    <div>
                      <div className="font-semibold text-gray-800 text-xs">
                        Material
                      </div>
                      <div>{material}</div>
                    </div>
                  )}
                  {stitchedLabel && (
                    <div>
                      <div className="font-semibold text-gray-800 text-xs">
                        Stitching
                      </div>
                      <div>{stitchedLabel}</div>
                    </div>
                  )}
                  {pieceCount && (
                    <div>
                      <div className="font-semibold text-gray-800 text-xs">
                        Pieces
                      </div>
                      <div>{pieceCount}</div>
                    </div>
                  )}
                  {color && (
                    <div>
                      <div className="font-semibold text-gray-800 text-xs">
                        Colour
                      </div>
                      <div>{color}</div>
                    </div>
                  )}
                  {category && (
                    <div>
                      <div className="font-semibold text-gray-800 text-xs">
                        Category
                      </div>
                      <div>{category}</div>
                    </div>
                  )}
                  {condition && (
                    <div>
                      <div className="font-semibold text-gray-800 text-xs">
                        Condition
                      </div>
                      <div>{condition}</div>
                    </div>
                  )}
                </div>

                {product.description && (
                  <div className="mb-4 text-sm">
                    <div className="font-semibold">Description:</div>
                    <div className="text-gray-700 leading-6">
                      {product.description}
                    </div>
                  </div>
                )}

                {tagsArray.length > 0 && (
                  <div className="border-t border-gray-100 pt-3">
                    <div className="text-xs font-semibold text-gray-800 mb-1">
                      Tags
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {tagsArray.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded-full bg-gray-100 text-[11px] text-gray-700"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {canBuy && (
                  <button
                    type="button"
                    onClick={onBuyNow}
                    className="w-full inline-flex items-center justify-center px-4 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm md:text-base shadow-sm transition-all active:scale-95"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Buy Now
                  </button>
                )}

                {canRent && product.rentPrice != null && (
                  <button
                    type="button"
                    disabled={product.rentalStatus === "rented"}
                    onClick={onRentNow}
                    className={`w-full inline-flex items-center justify-center px-4 py-3 rounded-full font-semibold text-sm md:text-base shadow-sm transition-all active:scale-95 ${
                      product.rentalStatus === "rented"
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed border border-gray-300"
                        : "bg-black hover:bg-gray-900 text-white"
                    }`}
                  >
                    {product.rentalStatus === "rented"
                      ? "Already Rented"
                      : "Rent Now"}
                  </button>
                )}

                {canBuy && (
                  <motion.button
                    type="button"
                    onClick={async () => {
                      // Manual loading simulation for feedback
                      if (!ensureValid()) return;
                      if (!isLoggedIn()) {
                        toast.error(
                          "Please log in to add products to your cart"
                        );
                        localStorage.setItem("redirectAfterLogin", "/cart");
                        setTimeout(() => nav("/Login"), 1500);
                        return;
                      }

                      // "Adding" Animation
                      const btn = document.activeElement;
                      if (btn) btn.disabled = true;

                      // Add to cart logic
                      addToCartOnly();
                      try {
                        window.dispatchEvent(new Event("cartUpdated"));
                      } catch { /* ignore */ }

                      await new Promise((r) => setTimeout(r, 600)); // Fake delay for animation

                      if (btn) btn.disabled = false;
                      nav("/cart");
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full inline-flex items-center justify-center px-4 py-3 rounded-full border border-gray-300 hover:border-gray-400 text-gray-800 font-semibold text-sm md:text-base transition-all bg-white relative overflow-hidden group"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4" />
                      Add to Cart
                    </span>
                    <div className="absolute inset-0 bg-gray-100 transform translate-y-full transition-transform group-hover:translate-y-0" />
                  </motion.button>
                )}

                {canRent && (
                  <p className="text-xs text-gray-500 mt-1">
                    * CNIC verification & refundable security deposit are
                    required to complete rental checkout.
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        </div>
        {/* Comments Panel - Inline Expansion Below Product Info */}
        {isCommentsExpanded && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 mt-6 animate-in slide-in-from-top duration-300">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Comments</h2>
            <ReviewsList productId={pid} autoLoad={true} />
          </div>
        )}
        {/* Reviews Modal - Mobile */}
        <ReviewsModal
          isOpen={isMobileModalOpen}
          onClose={() => setIsMobileModalOpen(false)}
          productId={pid}
          productName={titleText}
        />
        {/* Explore more products (unchanged) */}

        {related.length > 0 && (
          <div className="mt-10">
            <motion.h3
              className="text-lg font-bold text-gray-900 mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              Explore more products
            </motion.h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 justify-items-center">
              {related.map((p, index) => {
                const pId = p.id || p._id;
                // Determine if designer or reseller
                // We can check existence in lists or properties
                // Fallback to checking properties if lists aren't exhaustive in context (e.g. search results)
                const isDesigner = designerProducts.some(
                  (dp) => String(dp.id || dp._id) === String(pId)
                );
                // If not explicitly designer, assume reseller for standard cards unless specific logic needed
                // Or checking resellerProducts.
                // Note: related is filtered from [...designerProducts, ...resellerProducts]


                // Default to ResellerCard if unsure, or DesignerCard if isDesigner
                // If both (unlikely), Designer takes precedence or vice versa?
                // Let's use isDesigner check.
                // Check if custom product
                const isCustom = customProducts.some(
                  (cp) => String(cp.id || cp._id) === String(pId)
                );

                if (isCustom) {
                  // Adapt context product to CustomStyleProductCard expectation
                  const customItem = {
                    ...p,
                    front:
                      p.imageUrls?.[0] || p.image || p.customPreview || p.front,
                    back: p.imageUrls?.[1] || p.back,
                    price: p.sellingPrice || p.price,
                    name: p.name || p.title,
                  };
                  return (
                    <motion.div
                      key={pId}
                      className="w-full h-full"
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.08 }}
                      viewport={{ once: true }}
                    >
                      <CustomStyleProductCard
                        item={customItem}
                        isLiked={wishlist.some(
                          (w) => String(w.id || w._id) === String(pId)
                        )}
                        onToggleWishlist={handleCardWishlistToggle}
                      />
                    </motion.div>
                  );
                }

                const CardComponent = isDesigner ? DesignerCard : ResellerCard;

                return (
                  <motion.div
                    key={pId}
                    className="w-full h-full"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.08 }}
                    viewport={{ once: true }}
                  >
                    <CardComponent
                      product={p}
                      isLiked={wishlist.some(
                        (w) => String(w.id || w._id) === String(pId)
                      )}
                      onToggleWishlist={handleCardWishlistToggle}
                    />
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <RateProductModal
        isOpen={isRateModalOpen}
        onClose={() => setIsRateModalOpen(false)}
        product={product}
        onSuccess={(data) => {
          if (data && data.productRating) {
            setRatingData(data.productRating);
          } else {
            window.location.reload();
          }
        }}
      />
    </motion.div>
  );
}

export default function ProductDetailPageWrapper() {
  return (
    <ErrorBoundary>
      <ProductDetailPage />
    </ErrorBoundary>
  );
}
