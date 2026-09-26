"use client";

import { useSearchParams, useNavigate } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import Header from "./Header";
import Footer from "./Footer";
import { useProducts } from "./ProductContext";
import { UnifiedFilterPanel, ActiveFilters } from "./UnifiedFilterPanel";
import { motion } from "framer-motion";

const getId = (p) => p?._id || p?.id;

// helper: get display price for a product
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

export default function SearchPage() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const rawQuery = (params.get("q") || "").trim();
  const query = rawQuery.toLowerCase();

  const { customProducts = [], loading, error } = useProducts();

  // 1. Search Results — simple substring match across all text fields
  const initialResults = useMemo(() => {
    if (!query) return customProducts; // show all if no query

    return customProducts.filter((p) => {
      const name = String(p?.name || p?.title || "").toLowerCase();
      const desc = String(p?.description || "").toLowerCase();
      const cat  = String(p?.category || "").toLowerCase();
      const tags = Array.isArray(p?.tags)
        ? p.tags.join(" ").toLowerCase()
        : String(p?.tags || "").toLowerCase();

      return (
        name.includes(query) ||
        desc.includes(query) ||
        cat.includes(query)  ||
        tags.includes(query)
      );
    });
  }, [query, customProducts]);

  // 2. Dynamic Price Range — derived from ALL custom products (not just search hits)
  const filterOptions = useMemo(() => {
    let maxPrice = 0;
    customProducts.forEach((p) => {
      const price = getDisplayPrice(p);
      if (price > 0) maxPrice = Math.max(maxPrice, price);
    });
    return {
      priceRange: { min: 0, max: maxPrice || 0 },
    };
  }, [customProducts]);

  // 3. Filter State
  const [filters, setFilters] = useState({ priceMin: 0, priceMax: 0 });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Sync price range when products load / change
  useEffect(() => {
    if (filterOptions.priceRange.max > 0) {
      setFilters((prev) => ({
        ...prev,
        priceMin: filterOptions.priceRange.min,
        priceMax: filterOptions.priceRange.max,
      }));
    }
  }, [filterOptions.priceRange.min, filterOptions.priceRange.max]);

  // 4. Filtered Results
  const filteredResults = useMemo(() => {
    return initialResults.filter((p) => {
      const price = getDisplayPrice(p);
      if (
        filters.priceMax > 0 &&
        price > 0 &&
        (price < filters.priceMin || price > filters.priceMax)
      )
        return false;
      return true;
    });
  }, [initialResults, filters]);

  // Remove filter chip handler
  const handleRemoveFilter = (type) => {
    if (type === "price") {
      setFilters((prev) => ({
        ...prev,
        priceMin: filterOptions.priceRange.min,
        priceMax: filterOptions.priceRange.max,
      }));
    }
  };

  // --- Card component for custom products ---
  const CustomProductCard = ({ product }) => {
    const price = getDisplayPrice(product);
    const image =
      product?.images?.[0] || product?.imageUrls?.[0] || "/placeholder.svg";

    return (
      <motion.div
        className="bg-white rounded-2xl shadow-md overflow-hidden cursor-pointer group hover:shadow-xl transition-all duration-300"
        whileHover={{ y: -4 }}
        onClick={() =>
          nav(`/product-detail?id=${getId(product)}`)
        }
      >
        <div className="aspect-square overflow-hidden bg-gray-100">
          <img
            src={image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { e.target.src = "/placeholder.svg"; }}
          />
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 truncate text-sm">
            {product.name || product.title}
          </h3>
          {product.category && (
            <p className="text-xs text-gray-500 capitalize mt-0.5">
              {product.category}
            </p>
          )}
          <p className="text-emerald-600 font-bold mt-2 text-sm">
            Rs {price.toLocaleString()}
          </p>
        </div>
      </motion.div>
    );
  };

  // --- Render ---
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          {query ? (
            <>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Results for&nbsp;
                <span className="text-emerald-600">"{rawQuery}"</span>
              </h1>
              <p className="text-gray-500 mt-1 text-sm">
                {loading
                  ? "Searching..."
                  : `${filteredResults.length} product${filteredResults.length !== 1 ? "s" : ""} found`}
              </p>
            </>
          ) : (
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              All Products
            </h1>
          )}
        </div>

        {/* Filter bar */}
        {!loading && customProducts.length > 0 && (
          <div className="mb-6">
            <UnifiedFilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              priceRange={filterOptions.priceRange}
              isOpen={isFilterOpen}
              onToggle={() => setIsFilterOpen(!isFilterOpen)}
            />
            <ActiveFilters
              filters={filters}
              onRemove={handleRemoveFilter}
              priceRange={filterOptions.priceRange}
            />
          </div>
        )}

        {/* States */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent" />
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-20 text-red-500">
            <p>Failed to load products. Please try again.</p>
          </div>
        )}

        {!loading && !error && filteredResults.length === 0 && (
          <motion.div
            className="text-center py-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              No products found
            </h2>
            <p className="text-gray-500 mb-6">
              {query
                ? `We couldn't find any products matching "${rawQuery}".`
                : "No products are available right now."}
            </p>
            <button
              onClick={() => nav("/")}
              className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
            >
              Back to Home
            </button>
          </motion.div>
        )}

        {!loading && !error && filteredResults.length > 0 && (
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6"
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.05 } },
            }}
          >
            {filteredResults.map((product) => (
              <motion.div
                key={getId(product)}
                variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
              >
                <CustomProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <Footer />
    </div>
  );
}
