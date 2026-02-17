import { useMemo, useState } from "react";
import DesignerSearchBox from "./DesignerSearchBox.jsx";
import { FilterContainer } from "./FilterContainer.jsx";

/**
 * DesignerHubFilter
 * A composite component that renders the Designer dropdown + Sidebar Filter button.
 */
export default function DesignerHubFilter({
  filters,
  onFilterChange,
  onClear,
  options, // { designers, categories, priceRange }
}) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Config for the inner FilterContainer
  const filterConfig = useMemo(
    () => ({
      showPrice: true,
      showCategory: true,
      showDesigner: false, // Handled by search box
      showListing: true,
      showOnSale: true,
      showCondition: false,
    }),
    []
  );

  // Map DesignerSearchBox change to our filter system
  const handleDesignerChange = (name) => {
    // If "All" selected, clear the designer filter
    // If user selects specific designer, update filter
    onFilterChange(
      "designer",
      name === "All" || name === "Select Designer" ? "" : name
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* 1. Reuse existing Designer Dropdown */}
      <DesignerSearchBox
        designers={options.designersWithCounts || []}
        // Pass empty string if no designer selected, so it renders "Select Designer" placeholder
        // instead of forcing "All"
        active={filters.designer || ""}
        onChange={handleDesignerChange}
      />

      {/* 2. Standard Filters (Price, Listing, Category) */}
      <FilterContainer
        filters={filters}
        onFilterChange={onFilterChange}
        onClear={onClear}
        config={filterConfig}
        options={options}
        isOpen={isFilterOpen}
        onToggle={() => setIsFilterOpen(!isFilterOpen)}
      />
    </div>
  );
}
