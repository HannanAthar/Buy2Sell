// ResellerPage.jsx (with side scroll indicator restored)
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Filter, ChevronDown, RotateCcw } from "lucide-react";
import Header from "./Header";
import Footer from "./Footer";
import { useProducts } from "./ProductContext.jsx";
import { useSlider } from "../contexts/SliderContext.jsx";
import { readStorage, writeStorage } from "../utils/storage";
import ResellerCard from "./ResellerCard.jsx";
import Buy2SellChatbot from "./Buy2SellChatbot.jsx";
import HoverWrapper from "./common/HoverWrapper.jsx";

/** -------------------- Scroll Indicator (same style as DesignerPage) -------------------- */
const ScrollIndicator = ({ sections, activeSection }) => {
  const scrollToSection = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) window.scrollTo({ top: el.offsetTop - 100, behavior: "smooth" });
  };

  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col space-y-4">
      {sections.map((s, i) => (
        <motion.button
          key={s.id}
          onClick={() => scrollToSection(s.id)}
          className="w-4 h-4 rounded-full border-2"
          whileHover={{ scale: 1.15 }}
          transition={{ duration: 0.2 }}
          style={{
            borderColor:
              i === activeSection
                ? "var(--primary-green)"
                : "rgba(156,163,175,.6)",
            background:
              i === activeSection
                ? "linear-gradient(90deg, var(--primary-green), var(--dark-green))"
                : "rgba(243,244,246,.6)",
            boxShadow:
              i === activeSection ? "0 0 12px rgba(16,185,129,.4)" : "none",
          }}
          aria-label={s.label}
          title={s.label}
        />
      ))}
    </div>
  );
};

/** -------------------- Helper: unified price for reseller items -------------------- */
const getDisplayPrice = (p) => {
  if (p?.isOnSale && p?.originalPrice && p?.salePercentage >= 0) {
    const discounted = Math.round(
      Number(p.originalPrice) -
        (Number(p.originalPrice) * Number(p.salePercentage)) / 100
    );
    return Math.max(0, discounted || 0);
  }
  // prefer explicit sale/sellingPrice, then fall back to reseller's `price`
  return Number(p?.salePrice ?? p?.sellingPrice ?? p?.price ?? 0);
};

/** -------------------- Filter Panel -------------------- */
function FilterPanel({
  filters,
  onFiltersChange,
  categories,
  priceRange,
  isOpen,
  onToggle,
}) {
  const handleFilterChange = (key, value) =>
    onFiltersChange({ ...filters, [key]: value });
  const clearAllFilters = () =>
    onFiltersChange({
      categories: [],
      priceMin: priceRange.min,
      priceMax: priceRange.max,
      condition: "",
      onSale: false,
    });

  const hasActiveFilters =
    (filters.categories?.length || 0) > 0 ||
    !!filters.onSale ||
    filters.priceMin !== priceRange.min ||
    filters.priceMax !== priceRange.max ||
    !!filters.condition;

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={`flex items-center justify-between px-4 h-10 w-48 rounded-lg font-medium transition-all duration-200 ${
          isOpen || hasActiveFilters
            ? "bg-[var(--primary-green)] text-white shadow-lg"
            : "bg-white text-gray-700 border border-gray-300 hover:border-[var(--primary-green)] hover:text-[var(--primary-green)]"
        }`}
      >
        <Filter className="h-4 w-4" />
        Filters
        {hasActiveFilters && (
          <span className="bg-white text-[var(--primary-green)] text-xs px-2 py-0.5 rounded-full font-bold">
            {(filters.categories?.length || 0) +
              (filters.onSale ? 1 : 0) +
              (filters.priceMin !== priceRange.min ||
              filters.priceMax !== priceRange.max
                ? 1
                : 0) +
              (filters.condition ? 1 : 0)}
          </span>
        )}
        <ChevronDown
          className={`h-4 w-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
          >
            <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    <RotateCcw className="h-4 w-4" /> Clear All
                  </button>
                )}
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Price Range (Rs {filters.priceMin?.toLocaleString()} - Rs{" "}
                  {filters.priceMax?.toLocaleString()})
                </label>
                <div className="space-y-3 slider-thumb">
                  <div>
                    <input
                      type="range"
                      min={priceRange.min}
                      max={priceRange.max}
                      value={filters.priceMin}
                      onChange={(e) =>
                        handleFilterChange("priceMin", parseInt(e.target.value))
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <div>
                    <input
                      type="range"
                      min={priceRange.min}
                      max={priceRange.max}
                      value={filters.priceMax}
                      onChange={(e) =>
                        handleFilterChange("priceMax", parseInt(e.target.value))
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Condition */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Condition Rating
                </label>
                <select
                  value={filters.condition}
                  onChange={(e) =>
                    handleFilterChange("condition", e.target.value)
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-gray-700"
                >
                  <option value="">Any Condition</option>
                  {Array.from({ length: 10 }, (_, i) => 10 - i).map((val) => (
                    <option key={val} value={val}>
                      {val}/10
                    </option>
                  ))}
                </select>
              </div>

              {/* On Sale */}
              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={!!filters.onSale}
                    onChange={(e) =>
                      handleFilterChange("onSale", e.target.checked)
                    }
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
                    {categories.map((category) => (
                      <label
                        key={category.name}
                        className="flex items-center space-x-3 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={
                            filters.categories?.includes(category.name) || false
                          }
                          onChange={() =>
                            onFiltersChange({
                              ...filters,
                              categories: filters.categories?.includes(
                                category.name
                              )
                                ? filters.categories.filter(
                                    (c) => c !== category.name
                                  )
                                : [
                                    ...(filters.categories || []),
                                    category.name,
                                  ],
                            })
                          }
                          className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2"
                        />
                        <span className="text-sm text-gray-700 group-hover:text-gray-900 flex-1 capitalize">
                          {category.name}
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          {category.count}
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

const ActiveFilters = ({ filters, onRemoveFilter, priceRange }) => {
  const chips = [];
  (filters.categories || []).forEach((c) =>
    chips.push({ type: "categories", value: c, label: `Category: ${c}` })
  );
  if (filters.onSale)
    chips.push({ type: "onSale", value: true, label: "On Sale" });
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
  if (filters.condition) {
    chips.push({
      type: "condition",
      value: "condition",
      label: `Condition: ${filters.condition}/10`,
    });
  }

  if (!chips.length) return null;
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {chips.map((chip, i) => (
        <span
          key={`${chip.type}-${chip.value}-${i}`}
          className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-medium capitalize"
        >
          {chip.label}
          <button
            onClick={() => onRemoveFilter(chip.type, chip.value)}
            className="hover:text-emerald-900 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
    </div>
  );
};

/** -------------------- Main Page -------------------- */
export default function ResellerPage() {
  const { resellerProducts } = useProducts();

  // Use global slider context
  const { images, currentImage } = useSlider();

  const [wishlist, setWishlist] = useState([]);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    // Only load wishlist if user is logged in
    const token = localStorage.getItem("token");
    if (token) {
      setWishlist(readStorage("wishlist"));
    } else {
      setWishlist([]); // Clear wishlist if logged out
    }
    setCart(readStorage("cart"));
  }, []);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    categories: [],
    priceMin: 0,
    priceMax: 100000,
    condition: "",
    onSale: false,
  });

  const [activeSection, setActiveSection] = useState(0); // ⭐ for dots

  const heroRef = useRef(null);
  const productsRef = useRef(null);
  const ctaRef = useRef(null);

  // sections for scroll indicator (match designer)
  const sections = [
    { id: "hero-section", label: "Home" },
    { id: "products-section", label: "Products" },
    { id: "cta-section", label: "Join Us" },
  ];

  // Derive category list and price range from products
  const filterOptions = useMemo(() => {
    const categories = new Map();
    let minPrice = Infinity;
    let maxPrice = 0;

    resellerProducts.forEach((p) => {
      const cat = p.category;
      if (cat) {
        if (!categories.has(cat)) categories.set(cat, { name: cat, count: 0 });
        categories.get(cat).count += 1;
      }

      const price = getDisplayPrice(p);
      if (price > 0) {
        minPrice = Math.min(minPrice, price);
        maxPrice = Math.max(maxPrice, price);
      }
    });

    return {
      categories: Array.from(categories.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
      priceRange: {
        min: minPrice === Infinity ? 0 : minPrice,
        max: maxPrice || 0,
      },
    };
  }, [resellerProducts]);

  // initialize price sliders when products load
  useEffect(() => {
    if (
      filterOptions.priceRange.min !== undefined &&
      filterOptions.priceRange.max !== undefined
    ) {
      setFilters((prev) => ({
        ...prev,
        priceMin: filterOptions.priceRange.min,
        priceMax: filterOptions.priceRange.max,
      }));
    }
  }, [filterOptions.priceRange]);

  // Apply filters
  const filteredProducts = useMemo(() => {
    return resellerProducts.filter((p) => {
      if (
        (filters.categories?.length || 0) > 0 &&
        !filters.categories.includes(p.category)
      )
        return false;
      const price = getDisplayPrice(p);
      if (price > 0 && (price < filters.priceMin || price > filters.priceMax))
        return false;

      // Condition Filter
      if (filters.condition && p.condition) {
        // format is "X/10"
        const rating = parseInt(p.condition.split("/")[0], 10);
        if (!isNaN(rating)) {
          if (rating !== parseInt(filters.condition, 10)) return false;
        } else {
          return false;
        }
      } else if (filters.condition && !p.condition) {
        return false;
      }

      if (filters.onSale && !p.isOnSale) return false;
      return true;
    });
  }, [resellerProducts, filters]);

  // ⭐ Active section for side dots (same logic as DesignerPage)
  useEffect(() => {
    const onScroll = () => {
      const pos = window.scrollY + 200;
      const list = [
        { ref: heroRef, i: 0 },
        { ref: productsRef, i: 1 },
        { ref: ctaRef, i: 2 },
      ];
      for (let k = list.length - 1; k >= 0; k--) {
        const r = list[k].ref.current;
        if (!r) continue;
        const top = r.offsetTop;
        const bottom = top + r.offsetHeight;
        if (pos >= top && pos < bottom) {
          setActiveSection(list[k].i);
          break;
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleRemoveFilter = (type, value) => {
    if (type === "price") {
      setFilters((prev) => ({
        ...prev,
        priceMin: filterOptions.priceRange.min,
        priceMax: filterOptions.priceRange.max,
      }));
    } else if (type === "condition") {
      setFilters((prev) => ({
        ...prev,
        condition: "",
      }));
    } else if (type === "onSale") {
      setFilters((prev) => ({ ...prev, onSale: false }));
    } else {
      setFilters((prev) => ({
        ...prev,
        [type]: prev[type].filter((item) => item !== value),
      }));
    }
  };

  const getProductId = (p) => p.id || p._id || p.productId;

  const isInWishlist = (product) => {
    const id = getProductId(product);
    if (!id) return false;
    return wishlist.some((w) => getProductId(w) === id);
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const onToggleWishlist = (item) => {
    if (isInWishlist(item)) {
      const id = getProductId(item);
      const next = wishlist.filter((w) => getProductId(w) !== id);
      setWishlist(next);
      writeStorage("wishlist", next);
    } else {
      const next = [...wishlist, item];
      setWishlist(next);
      writeStorage("wishlist", next);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-x-hidden">
      <Header />
      {/* Progress bar like designer */}

      {/* ⭐ Side scroll indicator dots */}
      <ScrollIndicator sections={sections} activeSection={activeSection} />

      {/* HERO */}
      <section id="hero-section" ref={heroRef}>
        <HoverWrapper
          className="relative text-white min-h-[600px] lg:h-[800px]"
          background={
            <>
              {images.map((img, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 bg-cover bg-no-repeat transition-opacity duration-1000 ease-in-out ${
                    index === currentImage ? "opacity-100" : "opacity-0"
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
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-60 text-center">
            <div className="max-w-4xl mx-auto">
              <motion.h1
                className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                AUTHENTIC PRE-LOVED FINDS
              </motion.h1>
              <motion.p
                className="text-base sm:text-lg lg:text-xl text-white mb-8 leading-relaxed max-w-3xl mx-auto"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                Discover verified, gently-used fashion from trusted resellers.
              </motion.p>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                onClick={() => scrollToSection("products-section")}
                className="bg-gradient-to-r from-[var(--primary-green)] to-[var(--dark-green)] hover:from-[var(--dark-green)] hover:to-[var(--primary-green)] text-white px-8 py-4 rounded-full text-lg font-semibold shadow-none border-none outline-none transition-all duration-300 mb-12"
              >
                Explore Pre-Loved Pieces
              </motion.button>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            onClick={() => scrollToSection("products-section")}
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

      {/* PRODUCTS */}
      <section
        id="products-section"
        ref={productsRef}
        className="py-16 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <motion.h2
                className="text-3xl font-bold text-gray-900 mb-4"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                Reseller Collections
              </motion.h2>
              <p className="text-gray-600">
                {filteredProducts.length > 0
                  ? `${filteredProducts.length} Authenticated Items`
                  : "No Reseller Products Available Yet"}
              </p>
            </div>
            <div className="text-right space-y-1">
              <div className="text-sm text-gray-500">
                Wishlist: {wishlist.length}
              </div>
              <div className="text-sm text-gray-500">Cart: {cart.length}</div>
            </div>
          </div>

          {/* Filters */}
          {resellerProducts.length > 0 && (
            <>
              <div className="mb-6 flex flex-wrap items-start gap-4">
                <FilterPanel
                  filters={filters}
                  onFiltersChange={setFilters}
                  categories={filterOptions.categories}
                  priceRange={filterOptions.priceRange}
                  isOpen={isFilterOpen}
                  onToggle={() => setIsFilterOpen(!isFilterOpen)}
                />
              </div>

              <ActiveFilters
                filters={filters}
                onRemoveFilter={handleRemoveFilter}
                priceRange={filterOptions.priceRange}
              />
            </>
          )}

          {/* Grid */}
          {filteredProducts.length === 0 ? (
            <motion.div
              className="text-center text-gray-500 py-12"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="text-6xl mb-4">👜</div>
              <h3 className="text-xl font-semibold mb-2">
                No Products Match Your Filters
              </h3>
              <p>Try changing or clearing the filters.</p>
            </motion.div>
          ) : (
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-10"
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.05,
                  },
                },
              }}
            >
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id || product._id || index}
                  layout
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    show: { opacity: 1, y: 0 },
                  }}
                  transition={{ duration: 0.5 }}
                >
                  <ResellerCard
                    product={product}
                    isLiked={isInWishlist(product)}
                    onToggleWishlist={onToggleWishlist}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>
      {/* CTA */}
      <section id="cta-section" ref={ctaRef}>
        <HoverWrapper className="py-16 bg-gray-900 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.h2
              className="text-3xl font-bold mb-6"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              Ready To Start Reselling?
            </motion.h2>
            <motion.p
              className="text-lg mb-8 text-gray-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              Join thousands of resellers who trust Buy2Sell to turn their
              wardrobes into profit.
            </motion.p>
            <motion.a
              href="/Reseller-Signup"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[var(--primary-green)] to-[var(--dark-green)] hover:from-[var(--dark-green)] hover:to-[var(--primary-green)] text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Join As Reseller
            </motion.a>
          </div>
        </HoverWrapper>
      </section>
      <Buy2SellChatbot />
      <br />
      <Footer />
      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: var(--primary-green);
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }
        .slider-thumb::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: var(--primary-green);
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}
