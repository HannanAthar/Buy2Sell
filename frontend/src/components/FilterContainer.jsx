import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, ChevronDown, RotateCcw, X, Search } from "lucide-react";

/**
 * FilterContainer
 * @param {Object} props
 * @param {Object} props.filters - Current filter state
 * @param {Function} props.onFilterChange - Callback (key, value) => void
 * @param {Function} props.onClear - Callback to reset filters
 * @param {Object} props.config - e.g. { showCondition: true, showDesigner: true, showPrice: true, showCategory: true }
 * @param {Object} props.options - Available options { categories: [], designers: [], priceRange: {min, max} }
 * @param {boolean} props.isOpen - Is panel open
 * @param {Function} props.onToggle - Toggle panel
 */
export function FilterContainer({
  filters,
  onFilterChange,
  onClear,
  config = {},
  options = {
    categories: [],
    designers: [],
    priceRange: { min: 0, max: 10000 },
  },
  isOpen,
  onToggle,
}) {
  const panelRef = useRef(null);
  const [designerSearch, setDesignerSearch] = useState("");

  // Close on outside click
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

  const hasActiveFilters =
    (filters.categories?.length || 0) > 0 ||
    !!filters.onSale ||
    (filters.listing && filters.listing !== "any") ||
    filters.priceMin !== options.priceRange.min ||
    filters.priceMax !== options.priceRange.max ||
    !!filters.condition ||
    !!filters.designer;

  const activeCount =
    (filters.categories?.length || 0) +
    (filters.onSale ? 1 : 0) +
    (filters.listing && filters.listing !== "any" ? 1 : 0) +
    (filters.priceMin !== options.priceRange.min ||
    filters.priceMax !== options.priceRange.max
      ? 1
      : 0) +
    (filters.condition ? 1 : 0) +
    (filters.designer ? 1 : 0);

  // Filter designers based on search
  const filteredDesigners = (options.designers || []).filter((d) =>
    d.toLowerCase().includes(designerSearch.toLowerCase())
  );

  return (
    <div className="relative z-30" ref={panelRef}>
      <button
        onClick={onToggle}
        className={`flex items-center justify-between px-4 h-10 w-48 rounded-lg font-medium transition-all duration-200 ${
          isOpen || hasActiveFilters
            ? "bg-emerald-600 text-white shadow-lg"
            : "bg-white text-gray-700 border border-gray-300 hover:border-emerald-300 hover:text-emerald-700"
        }`}
      >
        <Filter className="h-4 w-4" />
        Filters
        {hasActiveFilters && (
          <span className="bg-white text-emerald-600 text-xs px-2 py-0.5 rounded-full font-bold">
            {activeCount}
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
            className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
          >
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                {hasActiveFilters && (
                  <button
                    onClick={onClear}
                    className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    <RotateCcw className="h-4 w-4" /> Clear All
                  </button>
                )}
              </div>

              {/* 1. Listing Type (Buttons - Designer Context) */}
              {config.showListing && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Listing Type
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["any", "sale", "rent"].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => onFilterChange("listing", opt)}
                        className={`h-10 px-4 flex items-center justify-center min-w-[80px] rounded-lg border text-sm font-medium transition-all ${
                          filters.listing === opt
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
              )}

              {/* 1b. Listing Type (Checkboxes - Main Context) */}
              {config.showListingCheckboxes && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Listing Type
                  </label>
                  <div className="flex flex-col space-y-2">
                    <label className="flex items-center space-x-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={
                          filters.listing === "sale" ||
                          filters.listing === "both"
                        }
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          // If Checking Sale:
                          //   If Rent is currently Checked (rent/both) -> become Both
                          //   Else (any/sale) -> become Sale
                          // If Unchecking Sale:
                          //   If Rent is currently Checked (rent/both) -> become Rent
                          //   Else -> become Any
                          const isRentChecked =
                            filters.listing === "rent" ||
                            filters.listing === "both";

                          let next = "any";
                          if (isChecked) {
                            next = isRentChecked ? "both" : "sale";
                          } else {
                            next = isRentChecked ? "rent" : "any";
                          }
                          onFilterChange("listing", next);
                        }}
                        className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2"
                      />
                      <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                        For Sale
                      </span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={
                          filters.listing === "rent" ||
                          filters.listing === "both"
                        }
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          // If Checking Rent:
                          //   If Sale is currently Checked (sale/both) -> become Both
                          //   Else -> become Rent
                          const isSaleChecked =
                            filters.listing === "sale" ||
                            filters.listing === "both";

                          let next = "any";
                          if (isChecked) {
                            next = isSaleChecked ? "both" : "rent";
                          } else {
                            next = isSaleChecked ? "sale" : "any";
                          }
                          onFilterChange("listing", next);
                        }}
                        className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2"
                      />
                      <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                        For Rent
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* 2. Price Range */}
              {config.showPrice && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Price Range (Rs {filters.priceMin?.toLocaleString()} - Rs{" "}
                    {filters.priceMax?.toLocaleString()})
                  </label>
                  <div className="space-y-3 slider-thumb">
                    <div>
                      <input
                        type="range"
                        min={options.priceRange.min}
                        max={options.priceRange.max}
                        value={filters.priceMin}
                        onChange={(e) =>
                          onFilterChange("priceMin", parseInt(e.target.value))
                        }
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    <div>
                      <input
                        type="range"
                        min={options.priceRange.min}
                        max={options.priceRange.max}
                        value={filters.priceMax}
                        onChange={(e) =>
                          onFilterChange("priceMax", parseInt(e.target.value))
                        }
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Condition (Reseller Context) */}
              {config.showCondition && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Condition Rating
                  </label>
                  <select
                    value={filters.condition || ""}
                    onChange={(e) =>
                      onFilterChange("condition", e.target.value)
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-700"
                  >
                    <option value="">Any Condition</option>
                    {Array.from({ length: 10 }, (_, i) => 10 - i).map((val) => (
                      <option key={val} value={val}>
                        {val}/10
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* 4. Designer Filter (Searchable) */}
              {config.showDesigner && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Designer
                  </label>

                  {/* Search Input */}
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search designers..."
                      value={designerSearch}
                      onChange={(e) => setDesignerSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  {/* List */}
                  <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-1">
                    <button
                      onClick={() => onFilterChange("designer", "")}
                      className={`block w-full text-left px-2 py-1 rounded text-sm ${
                        !filters.designer
                          ? "bg-emerald-50 text-emerald-700 font-medium"
                          : "hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      Any Designer
                    </button>
                    {filteredDesigners.length > 0 ? (
                      filteredDesigners.map((d) => (
                        <button
                          key={d}
                          onClick={() => onFilterChange("designer", d)}
                          className={`block w-full text-left px-2 py-1 rounded text-sm ${
                            filters.designer === d
                              ? "bg-emerald-50 text-emerald-700 font-medium"
                              : "hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          {d}
                        </button>
                      ))
                    ) : (
                      <div className="text-xs text-gray-400 p-2 text-center">
                        No designers found
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 5. On Sale */}
              {config.showOnSale && (
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={!!filters.onSale}
                      onChange={(e) =>
                        onFilterChange("onSale", e.target.checked)
                      }
                      className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2"
                    />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                      On Sale Only
                    </span>
                  </label>
                </div>
              )}

              {/* 6. Categories (Dynamic) */}
              {config.showCategory && options.categories.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Categories
                  </label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {options.categories.map((c) => (
                      <label
                        key={c.name}
                        className="flex items-center space-x-3 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={
                            filters.categories?.includes(c.name) || false
                          }
                          onChange={() => {
                            const current = filters.categories || [];
                            const next = current.includes(c.name)
                              ? current.filter((x) => x !== c.name)
                              : [...current, c.name];
                            onFilterChange("categories", next);
                          }}
                          className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2"
                        />
                        <span className="text-sm text-gray-700 group-hover:text-gray-900 flex-1 capitalize">
                          {c.name} ({c.count})
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
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
}

/**
 * Filter container chip - simplified
 */
export const FilterChips = ({ filters, onRemove, options }) => {
  const chips = [];

  // Categories
  (filters.categories || []).forEach((c) =>
    chips.push({ type: "categories", value: c, label: c })
  );

  // Price
  if (
    filters.priceMin !== options.priceRange.min ||
    filters.priceMax !== options.priceRange.max
  ) {
    chips.push({
      type: "price",
      value: "price",
      label: `Rs ${filters.priceMin} - ${filters.priceMax}`,
    });
  }

  // Condition
  if (filters.condition) {
    chips.push({
      type: "condition",
      value: "condition",
      label: `Condition: ${filters.condition}/10`,
    });
  }

  // Designer
  if (filters.designer) {
    chips.push({
      type: "designer",
      value: "designer",
      label: filters.designer,
    });
  }

  // Listing
  if (filters.listing && filters.listing !== "any") {
    chips.push({
      type: "listing",
      value: filters.listing,
      label: filters.listing,
    });
  }

  // Sale
  if (filters.onSale) {
    chips.push({ type: "onSale", value: true, label: "On Sale" });
  }

  if (!chips.length) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {chips.map((chip, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-medium capitalize"
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
