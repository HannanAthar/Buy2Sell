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
      priceMin: priceRange.min,
      priceMax: priceRange.max,
    });

  const hasActive =
    filters.priceMin !== priceRange.min ||
    filters.priceMax !== priceRange.max;

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
            {filters.priceMin !== priceRange.min ||
              filters.priceMax !== priceRange.max
                ? 1
                : 0}
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
