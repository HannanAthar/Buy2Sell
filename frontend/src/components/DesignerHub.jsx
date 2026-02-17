"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";
import { Filter, ChevronDown, RotateCcw, X, Search } from "lucide-react";
import { useProducts } from "./ProductContext.jsx";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import DesignerCard from "./DesignerCard.jsx";
import { useAuthCheck } from "../hooks/useAuthCheck";
import HoverWrapper from "./common/HoverWrapper.jsx";
import { useSlider } from "../contexts/SliderContext.jsx";

/* ---------- helpers (aligned with Reseller filters) ---------- */
const getId = (p) => p?._id || p?.id;
const getBrand = (p) =>
  (
    p?.sellerName ||
    p?.brandName ||
    p?.wardrobeName ||
    p?.originalBrand ||
    "Unknown Brand"
  )
    .toString()
    .trim();

const getDisplayPrice = (p) => {
  if (p?.isOnSale && p?.originalPrice && p?.salePercentage >= 0) {
    const discounted = Math.round(
      Number(p.originalPrice) -
      (Number(p.originalPrice) * Number(p.salePercentage)) / 100
    );
    return Math.max(0, discounted || 0);
  }
  return Number(p?.salePrice ?? p?.sellingPrice ?? p?.price ?? 0);
};

/* ---------- Reusable filter widgets (copied from Reseller behavior) ---------- */
function FilterPanel({
  filters,
  onFiltersChange,
  categories,
  priceRange,
  isOpen,
  onToggle,
}) {
  const panelRef = useRef(null);
  useEffect(() => {
    const onDoc = (e) => {
      if (!panelRef.current) return;
      if (isOpen && !panelRef.current.contains(e.target)) {
        onToggle && onToggle(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [isOpen, onToggle]);
  const handleChange = (key, value) =>
    onFiltersChange({ ...filters, [key]: value });
  const clearAll = () =>
    onFiltersChange({
      categories: [],
      priceMin: priceRange.min,
      priceMax: priceRange.max,
      onSale: false,
      listing: "any",
      gender: [], // NEW
    });

  const hasActive =
    (filters.categories?.length || 0) > 0 ||
    (filters.gender?.length || 0) > 0 || // NEW
    !!filters.onSale ||
    filters.listing !== "any" ||
    filters.priceMin !== priceRange.min ||
    filters.priceMax !== priceRange.max;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={onToggle}
        className={`flex items-center justify-between px-4 h-10 w-48 rounded-lg font-medium transition-all duration-200 ${isOpen || hasActive
          ? "bg-emerald-600 text-white shadow-lg"
          : "bg-white text-gray-700 border border-gray-300 hover:border-emerald-300 hover:text-emerald-700"
          }`}
      >
        <Filter className="h-4 w-4" />
        Filters
        {hasActive && (
          <span className="bg-white text-emerald-600 text-xs px-2 py-0.5 rounded-full font-bold">
            {(filters.categories?.length || 0) +
              (filters.onSale ? 1 : 0) +
              (filters.listing !== "any" ? 1 : 0) +
              (filters.priceMin !== priceRange.min ||
                filters.priceMax !== priceRange.max
                ? 1
                : 0)}
          </span>
        )}
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""
            }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 mt-2 w-[90vw] sm:w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
          >
            <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                {hasActive && (
                  <button
                    onClick={clearAll}
                    className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    <RotateCcw className="h-4 w-4" /> Clear All
                  </button>
                )}
              </div>

              {/* Gender Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Gender
                </label>
                <div className="flex flex-wrap gap-2">
                  {["Men", "Women", "Unisex"].map((g) => {
                    const isActive = filters.gender?.includes(g);
                    return (
                      <button
                        key={g}
                        onClick={() => {
                          const current = filters.gender || [];
                          const next = isActive
                            ? current.filter((x) => x !== g)
                            : [...current, g];
                          handleChange("gender", next);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all
                        ${isActive
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-white text-gray-700 border-gray-300 hover:border-emerald-300"
                          }`}
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Listing Type */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Listing Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {["any", "sale", "rent"].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleChange("listing", opt)}
                      className={`h-10 px-4 flex items-center justify-center min-w-[80px] rounded-lg border text-sm font-medium transition-all ${filters.listing === opt
                        ? "border-emerald-600 text-emerald-700 bg-emerald-50"
                        : "border-gray-300 hover:border-emerald-300 hover:text-emerald-700"
                        }`}
                    >
                      {opt === "any"
                        ? "Any"
                        : opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Price Range (Rs {filters.priceMin?.toLocaleString()} - Rs{" "}
                  {filters.priceMax?.toLocaleString()})
                </label>
                <div className="space-y-3 slider-thumb">
                  <input
                    type="range"
                    min={priceRange.min}
                    max={priceRange.max}
                    value={filters.priceMin}
                    onChange={(e) =>
                      handleChange("priceMin", parseInt(e.target.value))
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <input
                    type="range"
                    min={priceRange.min}
                    max={priceRange.max}
                    value={filters.priceMax}
                    onChange={(e) =>
                      handleChange("priceMax", parseInt(e.target.value))
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* On Sale */}
              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={!!filters.onSale}
                    onChange={(e) => handleChange("onSale", e.target.checked)}
                    className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    On Sale Only
                  </span>
                </label>
              </div>

              {/* Categories */}
              {categories.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Categories
                  </label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {categories.map((c) => (
                      <label
                        key={c.name}
                        className="flex items-center space-x-3 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={
                            filters.categories?.includes(c.name) || false
                          }
                          onChange={() =>
                            onFiltersChange({
                              ...filters,
                              categories: filters.categories?.includes(c.name)
                                ? filters.categories.filter((x) => x !== c.name)
                                : [...(filters.categories || []), c.name],
                            })
                          }
                          className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2"
                        />
                        <span className="text-sm text-gray-700 group-hover:text-gray-900 flex-1 capitalize">
                          {c.name}
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          {c.count}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const ActiveFilters = ({ filters, onRemove, priceRange }) => {
  const chips = [];
  (filters.categories || []).forEach((c) =>
    chips.push({ type: "categories", value: c, label: `Category: ${c}` })
  );
  (filters.gender || []).forEach(
    (
      g // NEW
    ) => chips.push({ type: "gender", value: g, label: `Gender: ${g}` })
  );
  if (filters.onSale)
    chips.push({ type: "onSale", value: true, label: "On Sale" });
  if (filters.listing !== "any")
    chips.push({
      type: "listing",
      value: filters.listing,
      label: `Listing: ${filters.listing}`,
    });
  if (
    filters.priceMin !== priceRange.min ||
    filters.priceMax !== priceRange.max
  ) {
    chips.push({
      type: "price",
      value: "price",
      label: `Price: Rs ${filters.priceMin?.toLocaleString()} - Rs ${filters.priceMax?.toLocaleString()}`,
    });
  }
  if (!chips.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip, i) => (
        <span
          key={`${chip.type}-${chip.value}-${i}`}
          className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-medium"
        >
          {chip.label}
          <button
            onClick={() => onRemove(chip.type, chip.value)}
            className="hover:text-emerald-900"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
    </div>
  );
};

import DesignerSearchBox from "./DesignerSearchBox.jsx";

/* ========================= MAIN ========================= */
export default function DesignerHub() {
  const { designerProducts = [] } = useProducts();
  const navigate = useNavigate();
  const location = useLocation();
  const { checkAuth } = useAuthCheck();

  // Use global slider context for continuous hero background animation
  const { images, currentImage } = useSlider();

  // open from top
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  /* Build designers list (+ All) */
  /* Build designers list (+ All) with Ratings */
  const designers = useMemo(() => {
    const map = new Map();
    designerProducts.forEach((p) => {
      const name = getBrand(p);
      const entry = map.get(name) || { count: 0, sum: 0, ratedCount: 0 };

      entry.count += 1;
      // Aggregate ratings
      const r = Number(p.averageRating || p.avgRating || p.rating || 0);
      if (r > 0) {
        entry.sum += r;
        entry.ratedCount += 1;
      }

      map.set(name, entry);
    });

    const arr = Array.from(map.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        rating: data.ratedCount > 0 ? data.sum / data.ratedCount : 0,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return [{ name: "All", count: designerProducts.length, rating: 0 }, ...arr];
  }, [designerProducts]);

  /* Active designer logic */
  const [activeDesigner, setActiveDesigner] = useState("All");
  const [activeSellerId, setActiveSellerId] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sid = params.get("sellerId");
    const d = params.get("d");

    if (sid) {
      // ✅ Priority: Filter by ID if present
      const sellerProd = designerProducts.find(
        (p) => String(p.sellerId) === String(sid)
      );
      if (sellerProd) {
        setActiveSellerId(sid);
        setActiveDesigner(getBrand(sellerProd)); // Set name for UI display
        return;
      }
    }

    // Fallback: Filter by Name
    setActiveSellerId(null);
    if (d && designers.some((x) => x.name.toLowerCase() === d.toLowerCase())) {
      setActiveDesigner(
        designers.find((x) => x.name.toLowerCase() === d.toLowerCase()).name
      );
    } else {
      setActiveDesigner("All");
    }
  }, [location.search, designers, designerProducts]);

  /* Filters (now include listing type). Also avoid initial flicker by deferring price clamp when max==0 */
  const [filters, setFilters] = useState({
    categories: [],
    priceMin: 0,
    priceMax: 0,
    onSale: false,
    listing: "any",
    gender: [], // NEW
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // derive categories + price bounds from currently scoped products (ALL, a designer)
  const scopeProducts = useMemo(() => {
    if (activeSellerId) {
      // ✅ Strict ID filtering
      return designerProducts.filter(
        (p) => String(p.sellerId) === String(activeSellerId)
      );
    }
    return activeDesigner === "All"
      ? designerProducts
      : designerProducts.filter((p) => getBrand(p) === activeDesigner);
  }, [designerProducts, activeDesigner, activeSellerId]);

  const filterOptions = useMemo(() => {
    const catMap = new Map();
    let min = Infinity;
    let max = 0;
    scopeProducts.forEach((p) => {
      const cat = p.category;
      if (cat) {
        if (!catMap.has(cat)) catMap.set(cat, { name: cat, count: 0 });
        catMap.get(cat).count += 1;
      }
      const price = getDisplayPrice(p);
      if (price > 0) {
        min = Math.min(min, price);
        max = Math.max(max, price);
      }
    });
    return {
      categories: Array.from(catMap.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
      priceRange: { min: min === Infinity ? 0 : min, max: max || 0 },
    };
  }, [scopeProducts]);

  // keep sliders in sync with bounds
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      priceMin: filterOptions.priceRange.min,
      priceMax: filterOptions.priceRange.max,
      categories:
        prev.categories?.filter((c) =>
          filterOptions.categories.some((k) => k.name === c)
        ) || [],
    }));
  }, [
    filterOptions.priceRange.min,
    filterOptions.priceRange.max,
    filterOptions.categories,
  ]);

  // apply filters
  const visible = useMemo(() => {
    return scopeProducts.filter((p) => {
      if (
        filters.categories.length > 0 &&
        !filters.categories.includes(p.category)
      )
        return false;
      const price = getDisplayPrice(p);
      if (
        price > 0 &&
        filters.priceMax > 0 &&
        (price < filters.priceMin || price > filters.priceMax)
      )
        return false; // guard prevents initial flicker
      if (filters.onSale && !p.isOnSale) return false;
      const lt = String(p?.listingType || "").toLowerCase();
      if (filters.listing !== "any") {
        if (filters.listing === "sale" && lt !== "sale") return false;
        if (filters.listing === "rent" && lt !== "rent") return false;
      }
      // Gender
      if (filters.gender && filters.gender.length > 0) {
        if (!filters.gender.includes(p.gender || "Unisex")) return false;
      }
      return true;
    });
  }, [scopeProducts, filters]);

  // wishlist
  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("wishlist") || "[]");
    } catch {
      return [];
    }
  });
  const inWishlist = (pid) => wishlist.some((i) => getId(i) === pid);
  const toggleWish = (p) => {
    // Check if user is logged in
    if (!checkAuth("add to wishlist")) {
      return;
    }

    const pid = getId(p);
    const next = inWishlist(pid)
      ? wishlist.filter((i) => getId(i) !== pid)
      : [...wishlist, p];
    setWishlist(next);
    localStorage.setItem("wishlist", JSON.stringify(next));
    window.dispatchEvent(new Event("wishlistUpdated"));
  };

  const openProduct = (p) => {
    const pid = getId(p);
    localStorage.setItem(`product:${pid}`, JSON.stringify(p));
    navigate("/product-detail", { state: p });
  };

  /* Remove filter chip handler */
  const handleRemoveFilter = (type, value) => {
    if (type === "price") {
      setFilters((prev) => ({
        ...prev,
        priceMin: filterOptions.priceRange.min,
        priceMax: filterOptions.priceRange.max,
      }));
    } else if (type === "onSale") {
      setFilters((prev) => ({ ...prev, onSale: false }));
    } else if (type === "listing") {
      setFilters((prev) => ({ ...prev, listing: "any" }));
    } else if (type === "gender") {
      setFilters((prev) => ({
        ...prev,
        gender: prev.gender.filter((x) => x !== value),
      }));
    } else {
      setFilters((prev) => ({
        ...prev,
        [type]: prev[type].filter((x) => x !== value),
      }));
    }
  };

  /* New handler to coordinate URL updates when designer selected */
  const handleDesignerChange = (name) => {
    const searchParams = new URLSearchParams(location.search);
    // Clear potentially conflicting ID filter so 'd' (name) takes precedence
    searchParams.delete("sellerId");

    if (name === "All") {
      searchParams.delete("d");
    } else {
      searchParams.set("d", name);
    }

    navigate({
      pathname: location.pathname,
      search: searchParams.toString(),
    });
  };

  /** --- Manual Hover Fix (Option B) --- */
  const [_ctaHoverRef, _setCtaHoverRef] = useState(null);
  const [_ctaContainerRef, _setCtaContainerRef] = useState(null);

  const _handleCtaMouseMove = (e) => {
    if (!_ctaContainerRef || !_ctaHoverRef) return;
    const rect = _ctaContainerRef.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    _ctaHoverRef.style.setProperty("--mouse-x", `${x}%`);
    _ctaHoverRef.style.setProperty("--mouse-y", `${y}%`);
    _ctaHoverRef.style.setProperty("--opacity", "0.8");
  };

  const _handleCtaMouseLeave = () => {
    if (_ctaHoverRef) _ctaHoverRef.style.setProperty("--opacity", "0");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <section id="hero-section">
        <HoverWrapper
          className="relative text-white min-h-[600px] lg:h-[800px]"
          background={
            <>
              {images.map((img, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 bg-cover bg-no-repeat transition-opacity duration-1000 ease-in-out ${index === currentImage ? "opacity-100" : "opacity-0"
                    }`}
                  style={{
                    backgroundImage: `url('${img}')`,
                    backgroundPosition: "center center",
                  }}
                />
              ))}
              <div className="absolute inset-0 bg-black/50" />
            </>
          }
        >
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-60 text-center z-10">
            <div className="max-w-4xl mx-auto">
              <motion.h1
                className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                EXPLORE TOP DESIGNERS
              </motion.h1>
              <motion.p
                className="text-base sm:text-lg lg:text-xl text-white mb-8 leading-relaxed max-w-3xl mx-auto"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                Discover exclusive collections from the world's most renowned
                fashion houses.
              </motion.p>
              <motion.button
                onClick={() => {
                  const el = document.getElementById("designer-filters");
                  if (el)
                    window.scrollTo({
                      top: el.offsetTop - 100,
                      behavior: "smooth",
                    });
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-none border-none outline-none transition-all duration-300 mb-12"
              >
                Explore Designers
              </motion.button>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            onClick={() => {
              const el = document.getElementById("designer-filters");
              if (el)
                window.scrollTo({
                  top: el.offsetTop - 100,
                  behavior: "smooth",
                });
            }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 cursor-pointer z-20"
          >
            <div className="w-9 h-9 rounded-full bg-gray-800/20 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </div>
          </motion.div>
        </HoverWrapper>
      </section>

      {/* Filters & Grid */}
      <div id="designer-filters" className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            {activeDesigner === "All"
              ? "All Designer Collections"
              : `${activeDesigner} Collection`}
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <FilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              categories={filterOptions.categories}
              priceRange={filterOptions.priceRange}
              isOpen={isFilterOpen}
              onToggle={() => setIsFilterOpen(!isFilterOpen)}
            />
            <DesignerSearchBox
              designers={designers}
              onSelect={handleDesignerChange}
            />
          </div>
        </div>

        {/* Active Filters */}
        <div className="mb-6">
          <ActiveFilters
            filters={filters}
            onRemove={handleRemoveFilter}
            priceRange={filterOptions.priceRange}
          />
        </div>

        {/* Designers List (Horizontal Scroll) */}
        <div className="mb-10 overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max">
            {designers.map((d) => {
              const isActive = activeDesigner === d.name;
              return (
                <button
                  key={d.name}
                  onClick={() => handleDesignerChange(d.name)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${isActive
                    ? "bg-emerald-600 text-white shadow-md"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-emerald-300 hover:text-emerald-700"
                    }`}
                >
                  {d.name}{" "}
                  <span className="text-xs opacity-75">({d.count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Grid */}
        {visible.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-xl text-gray-500 font-medium">
              No designer items found matching your filters.
            </p>
            <button
              onClick={() =>
                setFilters({
                  categories: [],
                  priceMin: filterOptions.priceRange.min,
                  priceMax: filterOptions.priceRange.max,
                  onSale: false,
                  listing: "any",
                  gender: [],
                })
              }
              className="mt-4 text-emerald-600 font-semibold hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
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
          >
            {visible.map((product) => (
              <motion.div
                key={getId(product)}
                layout
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  show: { opacity: 1, y: 0 },
                }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <DesignerCard
                  product={product}
                  inWishlist={inWishlist(getId(product))}
                  onToggleWishlist={() => toggleWish(product)}
                  onClick={() => openProduct(product)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Bottom Spacing */}
        <div className="h-16"></div>
      </div>

      {/* CTA Section */}
      <section>
        <HoverWrapper className="py-16 bg-gray-900 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.h2
              className="text-3xl font-bold mb-6"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              Ready to Start Selling?
            </motion.h2>
            <motion.p
              className="text-lg mb-8 text-gray-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              Join as a Designer and reach thousands of fashion enthusiasts.
            </motion.p>
            <motion.a
              href="/Designer-Signup"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[var(--primary-green)] to-[var(--dark-green)] hover:from-[var(--dark-green)] hover:to-[var(--primary-green)] text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Join As Designer
            </motion.a>
          </div>
        </HoverWrapper>
      </section>
      <br />
      <Footer />

      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #10b981;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }
        .slider-thumb::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #10b981;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}
