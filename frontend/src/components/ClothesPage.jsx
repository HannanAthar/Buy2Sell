"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";
import { useProducts } from "./ProductContext.jsx";
import { UnifiedFilterPanel, ActiveFilters } from "./UnifiedFilterPanel.jsx";
import { useUrlFilterState } from "../hooks/useUrlFilterState.js";
import { useAuthCheck } from "../hooks/useAuthCheck";
import { motion } from "framer-motion";

// Directly import the component the user requested
import DesignerSearchBox from "./DesignerSearchBox.jsx";

import ResellerCard from "./ResellerCard.jsx";
import DesignerCard from "./DesignerCard.jsx";

const getId = (p) => p?._id || p?.id;
const isDesigner = (p) =>
  String(p?.sellerType || "").toLowerCase() === "designer";

const CLOTHES_KEYWORDS = [
  "cloth",
  "clothes",
  "dress",
  "gown",
  "shirt",
  "t-shirt",
  "tee",
  "top",
  "hoodie",
  "sweatshirt",
  "jacket",
  "coat",
  "kurta",
  "kurti",
  "abaya",
  "maxi",
  "skirt",
  "pants",
  "trouser",
  "trousers",
  "jeans",
  "shorts",
  "suit",
  "blazer",
  "sweater",
];

const matchesClothes = (p) => {
  const category = String(p?.category || "").toLowerCase();
  const name = String(p?.name || "").toLowerCase();
  return CLOTHES_KEYWORDS.some(
    (kw) => category.includes(kw) || name.includes(kw)
  );
};

export default function ClothesPage() {
  const {
    designerProducts = [],
    resellerProducts = [],
    loading,
  } = useProducts();
  const [searchParams] = useSearchParams();
  const sellerMode = (searchParams.get("seller") || "main").toLowerCase();

  // 1. Initial Data Preparation
  const initialData = useMemo(() => {
    let all = [...(designerProducts || []), ...(resellerProducts || [])];
    if (sellerMode === "designer") {
      all = all.filter((p) => isDesigner(p));
    } else if (sellerMode === "reseller") {
      all = all.filter((p) => !isDesigner(p));
    }
    return all.filter(matchesClothes);
  }, [designerProducts, resellerProducts, sellerMode]);

  // 2. Calculate Derived Options
  const options = useMemo(() => {
    const cats = new Map();
    const designersMap = new Map();
    let minPrice = Infinity;
    let maxPrice = 0;

    initialData.forEach((p) => {
      const price = Number(p.salePrice || p.price || 0);
      if (price > 0) {
        minPrice = Math.min(minPrice, price);
        maxPrice = Math.max(maxPrice, price);
      }
      const c = p.category || "Other";
      if (!cats.has(c)) cats.set(c, { name: c, count: 0 });
      cats.get(c).count++;

      // Robust Designer Name Extraction matching DesignerPage.jsx
      const dName = (
        p.sellerName ||
        p.brandName ||
        p.wardrobeName ||
        p.originalBrand ||
        p.designerName ||
        p.brand ||
        ""
      )
        .toString()
        .trim();

      if (dName && dName !== "Unknown Brand") {
        designersMap.set(dName, (designersMap.get(dName) || 0) + 1);
      }
    });

    const designersWithCounts = Array.from(designersMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Ensure "All" is present for the SearchBox to work as expected
    const designersForSearch = [
      { name: "All", count: initialData.length },
      ...designersWithCounts,
    ];

    return {
      categories: Array.from(cats.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
      designers: Array.from(designersMap.keys()).sort(),
      designersWithCounts: designersForSearch,
      priceRange: {
        min: minPrice === Infinity ? 0 : minPrice,
        max: maxPrice || 100000,
      },
    };
  }, [initialData]);

  // 3. Filter State
  const { filters, setFilters, updateFilter } = useUrlFilterState(
    {
      categories: [],
      priceMin: options.priceRange.min,
      priceMax: options.priceRange.max,
      condition: "",
      designer: "",
      listing: "any",
      onSale: false,
      gender: "", // NEW
    }
  );

  useEffect(() => {
    if (
      filters.priceMin === 0 &&
      filters.priceMax === 0 &&
      options.priceRange.max > 0
    ) {
      setFilters((prev) => ({
        ...prev,
        priceMin: options.priceRange.min,
        priceMax: options.priceRange.max,
      }));
    }
  }, [options.priceRange.min, options.priceRange.max, setFilters, filters.priceMin, filters.priceMax]);

  // 4. Apply Filters
  const filteredProducts = useMemo(() => {
    return initialData.filter((p) => {
      const price = Number(p.salePrice || p.price || 0);
      if (filters.priceMin !== undefined && price < filters.priceMin)
        return false;
      if (filters.priceMax !== undefined && price > filters.priceMax)
        return false;
      if (filters.categories && filters.categories.length > 0) {
        if (!filters.categories.includes(p.category)) return false;
      }

      // Gender Filter
      if (filters.gender) {
         if ((p.gender || "Unisex") !== filters.gender) return false;
      }

      if (filters.designer) {
        const d = (
          p.sellerName ||
          p.brandName ||
          p.wardrobeName ||
          p.originalBrand ||
          p.designerName ||
          p.brand ||
          ""
        )
          .toString()
          .trim();
        if (d !== filters.designer) return false;
      }
      if (filters.condition) {
        if (!p.condition) return false;
        const rating = parseInt(p.condition.split("/")[0], 10);
        if (isNaN(rating) || rating !== parseInt(filters.condition, 10))
          return false;
      }
      if (filters.listing && filters.listing !== "any") {
        const lt = String(p.listingType || "").toLowerCase();
        if (filters.listing === "sale" && lt !== "sale") return false;
        if (filters.listing === "rent" && lt !== "rent") return false;
      }
      if (filters.onSale && !p.isOnSale) return false;

      return true;
    });
  }, [initialData, filters]);

  // 5. Config (Simplified - FilterPanel handles its own config)
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleRemoveFilter = (type, value) => {
    if (type === "price") updateFilter("priceMin", options.priceRange.min);
    else if (type === "condition") updateFilter("condition", "");
    else if (type === "designer") updateFilter("designer", "");
    else if (type === "listing") updateFilter("listing", "any");
    else if (type === "onSale") updateFilter("onSale", false);
    else if (type === "gender") updateFilter("gender", ""); // Single select reset
    else if (type === "categories") {
      updateFilter(
        "categories",
        filters.categories.filter((c) => c !== value)
      );
    }
  };

  const handleDesignerSelect = (name) => {
    // If "All" is selected, clear the filter (empty string)
    // Otherwise set the name
    updateFilter(
      "designer",
      name === "All" || name === "All Designers" ? "" : name
    );
  };

  const renderEmptyState = () => {
    if (filteredProducts.length > 0) return null;
    if (sellerMode === "designer" && filters.designer) {
      return (
        <div className="text-center py-24 border rounded-xl bg-white shadow-sm">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No items available for {filters.designer} in Clothes
          </h3>
          <p className="text-gray-500 mb-6">
            Try selecting a different designer or category.
          </p>
          <button
            onClick={() => updateFilter("designer", "")}
            className="text-emerald-600 font-medium hover:underline"
          >
            View all designers
          </button>
        </div>
      );
    }
    return (
      <div className="text-center text-gray-500 py-16 border rounded-xl bg-white">
        <h3 className="text-lg font-medium text-gray-900">No products found</h3>
        <p>Try clearing your filters to see more results.</p>
      </div>
    );
  };

  // Wishlist
  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("wishlist") || "[]");
    } catch {
      return [];
    }
  });
  const { checkAuth } = useAuthCheck();

  const inWishlist = (pid) => wishlist.some((i) => getId(i) === pid);
  const toggleWishlist = (p) => {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex flex-col items-start mb-8 gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 capitalize">
              {sellerMode === "main" ? "Clothes" : `${sellerMode} Clothes`}
            </h1>
            <p className="text-gray-600">{filteredProducts.length} items</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {sellerMode === "designer" && (
              // Reuse existing component EXACTLY as requested
              <DesignerSearchBox
                designers={options.designersWithCounts}
                active={filters.designer || ""}
                onChange={handleDesignerSelect}
              />
            )}

            <UnifiedFilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              categories={options.categories}
              priceRange={options.priceRange}
              isOpen={isFilterOpen}
              onToggle={() => setIsFilterOpen(!isFilterOpen)}
            />
          </div>
        </div>

        <ActiveFilters
          filters={filters}
          options={options}
          onRemove={handleRemoveFilter}
          priceRange={options.priceRange}
        />

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredProducts.length === 0 ? (
          renderEmptyState()
        ) : (
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
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
            {filteredProducts.map((p) => (
              <motion.div
                key={getId(p)}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.4 }}
              >
                {isDesigner(p) ? (
                  <DesignerCard
                    product={p}
                    isLiked={inWishlist(getId(p))}
                    onToggleWishlist={toggleWishlist}
                  />
                ) : (
                  <ResellerCard
                    product={p}
                    isLiked={inWishlist(getId(p))}
                    onToggleWishlist={toggleWishlist}
                  />
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
