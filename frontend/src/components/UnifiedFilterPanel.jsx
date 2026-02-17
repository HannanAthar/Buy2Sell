import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Filter, ChevronDown, RotateCcw, X } from "lucide-react";
import withOptimization from "./common/withOptimization";

function UnifiedFilterPanelBase({
  filters,
  onFiltersChange,
  categories,
  priceRange,
  isOpen,
  onToggle,
}) {
  console.log("UnifiedFilterPanel Render:", { filters, categories, priceRange });
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
      condition: "",
      onSale: false,
      listing: "any",
      gender: "", // CHANGED from [] to ""
    });

  const hasActive =
    (filters.categories?.length || 0) > 0 ||
    !!filters.gender || // CHANGED
    !!filters.onSale ||
    filters.listing !== "any" ||
    filters.priceMin !== priceRange.min ||
    filters.priceMax !== priceRange.max ||
    !!filters.condition;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={onToggle}
        className={`flex items-center justify-between px-4 h-10 w-48 rounded-lg font-medium transition-all duration-200 ${
          isOpen || hasActive
            ? "bg-emerald-600 text-white shadow-lg"
            : "bg-white text-gray-700 border border-gray-300 hover:border-emerald-300 hover:text-emerald-700"
        }`}
      >
        <Filter className="h-4 w-4" />
        Filters
        {hasActive && (
          <span className="bg-white text-emerald-600 text-xs px-2 py-0.5 rounded-full font-bold">
            {(filters.categories?.length || 0) +
              (filters.gender ? 1 : 0) + // CHANGED
              (filters.onSale ? 1 : 0) +
              (filters.listing !== "any" ? 1 : 0) +
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
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 mt-2 w-[90vw] max-w-xs sm:w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
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

              {/* Gender Filter - SINGLE SELECT */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Gender
                </label>
                <div className="flex flex-wrap gap-2">
                  {["Men", "Women", "Unisex"].map((g) => {
                    const isActive = filters.gender === g; // Single string selection check
                    return (
                      <button
                        key={g}
                        onClick={() => {
                          // Toggle: if clicked same, clear it; otherwise set new
                          const next = isActive ? "" : g;
                          handleChange("gender", next);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all flex items-center gap-2
                        ${
                          isActive
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-white text-gray-700 border-gray-300 hover:border-emerald-300"
                        }`}
                      >
                         <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : 'bg-gray-300'}`}></span>
                         {g}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Listing Type (Designer) */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Listing Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {["any", "sale", "rent"].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleChange("listing", opt)}
                      className={`h-10 px-4 flex items-center justify-center min-w-[80px] rounded-lg border text-sm font-medium transition-all ${
                        filters.listing === opt
                          ? "border-emerald-600 text-emerald-700 bg-emerald-50 ring-1 ring-emerald-600"
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

              {/* Price Range */}
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
                        handleChange("priceMin", parseInt(e.target.value))
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
                        handleChange("priceMax", parseInt(e.target.value))
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Condition (Reseller) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Condition Rating
                </label>
                <select
                  value={filters.condition}
                  onChange={(e) => handleChange("condition", e.target.value)}
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

export const UnifiedFilterPanel = withOptimization(UnifiedFilterPanelBase);

const ActiveFiltersBase = ({ filters, onRemove, priceRange }) => {
  const chips = [];
  (filters.categories || []).forEach((c) =>
    chips.push({ type: "categories", value: c, label: `Category: ${c}` })
  );
  
  // CHANGED: Handle single string gender
  if (filters.gender) {
    chips.push({ type: "gender", value: filters.gender, label: `Gender: ${filters.gender}` });
  }

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
            onClick={() => onRemove(chip.type, chip.value)}
            className="hover:text-emerald-900 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
    </div>
  );
};

export const ActiveFilters = withOptimization(ActiveFiltersBase);
