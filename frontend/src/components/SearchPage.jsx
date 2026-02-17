"use client";

import { useSearchParams, useNavigate } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import Header from "./Header";
import Footer from "./Footer";
import { useProducts } from "./ProductContext";
import ResellerCard from "./ResellerCard";
import DesignerCard from "./DesignerCard";
import { UnifiedFilterPanel, ActiveFilters } from "./UnifiedFilterPanel";
import { motion } from "framer-motion";

const getId = (p) => p?._id || p?.id;

// helper: unified price for items
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

// helper: token-based matching for a single query word
function matchesFieldTokenized(fieldValue, query) {
  const text = String(fieldValue || "").toLowerCase();
  if (!text || !query) return false;

  const tokens = text.split(/[^a-z0-9]+/).filter(Boolean); // words

  return tokens.some((t) => {
    return (
      t === query || // exact: men
      t.startsWith(query) || // heel -> heels
      t.endsWith(query) // bag -> handbag
    );
  });
}

// helper: match against any of the query variants (synonyms)
function matchesAnyToken(fieldValue, queries) {
  return queries.some((q) => matchesFieldTokenized(fieldValue, q));
}

export default function SearchPage() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const rawQuery = (params.get("q") || "").trim();
  const query = rawQuery.toLowerCase();
  const isMultiWord = query.split(/\s+/).length > 1;

  const {
    designerProducts = [],
    resellerProducts = [],
    loading,
    error,
  } = useProducts();

  const allProducts = useMemo(
    () => [...designerProducts, ...resellerProducts],
    [designerProducts, resellerProducts]
  );

  // 1. Initial Search Results
  const initialResults = useMemo(() => {
    if (!query) return [];

    // 🔹 detect ONLY explicit header commands
    const isDesignerHeader =
      query === "designer" || query === "designer products";
    const isPrelovedHeader =
      query === "preloved" ||
      query === "pre-loved" ||
      query === "pre loved" ||
      query === "reseller";

    const isClothesHeader = query === "clothes" || query === "cloth";
    const isBagsHeader = query === "bags" || query === "bag";
    const isShoesHeader = query === "shoes" || query === "shoe";
    const isHeelsHeader = query === "heels" || query === "heel";

    const sellerFilter = isDesignerHeader
      ? "designer"
      : isPrelovedHeader
      ? "reseller"
      : null;

    const categoryFilter = isClothesHeader
      ? "clothes"
      : isBagsHeader
      ? "bags"
      : isShoesHeader
      ? "shoes"
      : isHeelsHeader
      ? "heels"
      : null;

    // 🔹 gender + bridal + plural synonyms for single-word queries
    let queryVariants = [query];
    if (!isMultiWord) {
      const womenGroup = [
        "women",
        "woman",
        "female",
        "girl",
        "girls",
        "lady",
        "ladies",
      ];
      const menGroup = ["men", "man", "male", "boy", "boys", "gent", "gents"];
      const bridalGroup = ["bridal", "bride", "wedding"];

      // Auto-pluralization map
      const plurals = {
        cloth: "clothes",
        bag: "bags",
        shoe: "shoes",
        heel: "heels",
        sneaker: "sneakers",
        clothes: "cloth",
        bags: "bag",
        shoes: "shoe",
        heels: "heel",
        sneakers: "sneaker",
      };

      if (womenGroup.includes(query)) {
        queryVariants = womenGroup;
      } else if (menGroup.includes(query)) {
        queryVariants = menGroup;
      } else if (bridalGroup.includes(query)) {
        queryVariants = bridalGroup;
      } else if (plurals[query]) {
        queryVariants = [query, plurals[query]];
      }
    }

    return allProducts.filter((p) => {
      const sellerType = String(
        p?.sellerType || p?.role || p?.userType || ""
      ).toLowerCase();
      const category = String(p?.category || "").toLowerCase();

      // ✅ APPLY HEADER FILTERS ONLY WHEN EXACT MATCH
      if (sellerFilter && sellerType !== sellerFilter) return false;
      if (categoryFilter && category !== categoryFilter) return false;

      const name = String(p?.name || p?.title || "").toLowerCase();
      const desc = String(p?.description || "").toLowerCase();
      const cat = category;
      const tags = Array.isArray(p?.tags)
        ? p.tags.join(" ").toLowerCase()
        : String(p?.tags || "").toLowerCase();

      if (isMultiWord) {
        // ✅ old behaviour for multi-word searches
        return (
          name.includes(query) ||
          desc.includes(query) ||
          cat.includes(query) ||
          tags.includes(query)
        );
      }

      // ✅ token-based for single-word queries (+ synonyms)
      return (
        matchesAnyToken(name, queryVariants) ||
        matchesAnyToken(desc, queryVariants) ||
        matchesAnyToken(cat, queryVariants) ||
        matchesAnyToken(tags, queryVariants)
      );
    });
  }, [query, allProducts, isMultiWord]);

  // 2. Filter Options (derived from results)
  const filterOptions = useMemo(() => {
    const categories = new Map();
    let minPrice = Infinity;
    let maxPrice = 0;

    initialResults.forEach((p) => {
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
  }, [initialResults]);

  // 3. Filter State
  const [filters, setFilters] = useState({
    categories: [],
    priceMin: 0,
    priceMax: 0,
    condition: "",
    onSale: false,
    listing: "any",
    gender: "", // NEW
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Initialize Price Range
  useEffect(() => {
    console.log("SearchPage: Initialize Price Range", filterOptions.priceRange);
    if (
      filterOptions.priceRange.min !== undefined &&
      filterOptions.priceRange.max !== undefined
    ) {
      setFilters((prev) => {
        console.log("SearchPage: Setting filters from price range", prev);
        return {
          ...prev,
          priceMin: filterOptions.priceRange.min,
          priceMax: filterOptions.priceRange.max,
        };
      });
    }
  }, [filterOptions.priceRange]);

  // 4. Filtered Results
  const filteredResults = useMemo(() => {
    return initialResults.filter((p) => {
      // Category
      if (
        (filters.categories?.length || 0) > 0 &&
        !filters.categories.includes(p.category)
      )
        return false;

      // Price
      const price = getDisplayPrice(p);
      if (price > 0 && (price < filters.priceMin || price > filters.priceMax))
        return false;

      // Gender
      if (filters.gender) {
         if ((p.gender || "Unisex") !== filters.gender) return false;
      }

      // Condition
      if (filters.condition) {
        // If product has condition, must match.
        // If product does NOT have condition (e.g. Designer), it is EXCLUDED if a condition filter is set.
        // Rationale: User asked for "Condition 9/10", implies looking for items with that condition.
        const productCondition = String(p?.condition || "");
        if (!productCondition) return false;

        const rating = parseInt(productCondition.split("/")[0], 10);
        if (isNaN(rating) || rating !== parseInt(filters.condition, 10))
          return false;
      }

      // On Sale
      if (filters.onSale && !p.isOnSale) return false;

      // Listing Type
      const lt = String(p?.listingType || "").toLowerCase();
      if (filters.listing !== "any") {
        if (filters.listing === "sale" && lt !== "sale") return false;
        if (filters.listing === "rent" && lt !== "rent") return false;
      }

      return true;
    });
  }, [initialResults, filters]);

  // Handlers
  const handleRemoveFilter = (type, value) => {
    if (type === "price") {
      setFilters((prev) => ({
        ...prev,
        priceMin: filterOptions.priceRange.min,
        priceMax: filterOptions.priceRange.max,
      }));
    } else if (type === "onSale") {
      setFilters((prev) => ({ ...prev, onSale: false }));
    } else if (type === "condition") {
      setFilters((prev) => ({ ...prev, condition: "" }));
    } else if (type === "listing") {
      setFilters((prev) => ({ ...prev, listing: "any" }));
    } else if (type === "gender") {
      setFilters((prev) => ({ ...prev, gender: "" }));
    } else {
      setFilters((prev) => {
        // Helper to ensure we only filter if it is actually an array
        const currentList = Array.isArray(prev[type]) ? prev[type] : [];
        return {
          ...prev,
          [type]: currentList.filter((item) => item !== value),
        };
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex flex-col items-start gap-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Search results for:{" "}
            <span className="text-emerald-600">"{rawQuery}"</span>
          </h1>
          <div className="flex flex-wrap items-center gap-4">
            {/* Filters */}
            <UnifiedFilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              categories={filterOptions.categories}
              priceRange={filterOptions.priceRange}
              isOpen={isFilterOpen}
              onToggle={() => setIsFilterOpen(!isFilterOpen)}
            />
          </div>
        </div>

        <ActiveFilters
          filters={filters}
          onRemove={handleRemoveFilter}
          priceRange={filterOptions.priceRange}
        />

        {loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="bg-white border rounded-xl p-10 text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-6">
              {error || "Failed to load products. Please try again."}
            </p>
            <button
              onClick={() => nav("/")}
              className="px-5 py-2 bg-black text-white rounded-lg hover:bg-gray-900"
            >
              Back to Home
            </button>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="bg-white border rounded-xl p-10 text-center">
            {initialResults.length === 0 ? (
              <>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  This type of product is not available
                </h2>
                <p className="text-gray-600 mb-6">
                  Try searching with different words like{" "}
                  <b>dress, purse, heels, sneakers, jacket</b>.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  No products match your filters
                </h2>
                <p className="text-gray-600 mb-6">
                  Try clearing some filters to see more results.
                </p>
              </>
            )}

            <button
              onClick={() => nav("/")}
              className="px-5 py-2 bg-black text-white rounded-lg hover:bg-gray-900"
            >
              Back to Home
            </button>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1,
                },
              },
            }}
          >
            {filteredResults.map((p) => (
              <motion.div
                key={getId(p)}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                {String(
                  p?.sellerType || p?.role || p?.userType || ""
                ).toLowerCase() === "designer" ? (
                  <DesignerCard product={p} />
                ) : (
                  <ResellerCard product={p} />
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <Footer />
    </div>
  );
}
