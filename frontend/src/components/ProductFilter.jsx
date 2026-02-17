"use client";

// useState and useEffect removed - not currently used

export default function ProductFilter({ filters, onFilterChange }) {
    // Extract unique values for dynamic filters if needed, or use static lists
    // For now, we'll use static lists as requested, but we could derive them from products later.

    const handleChange = (key, value) => {
        onFilterChange({ ...filters, [key]: value });
    };

    const handleCheckboxChange = (key, value) => {
        const current = filters[key] || [];
        const next = current.includes(value)
            ? current.filter((item) => item !== value)
            : [...current, value];
        handleChange(key, next);
    };

    const handlePriceChange = (e) => {
        const { name, value } = e.target;
        handleChange("priceRange", { ...filters.priceRange, [name]: value });
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 w-full md:w-64 flex-shrink-0 h-fit">
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg">Filters</h2>
                <button
                    onClick={() => onFilterChange({})}
                    className="text-sm text-blue-600 hover:underline"
                >
                    Clear All
                </button>
            </div>

            {/* Price Range */}
            <div className="mb-6">
                <h3 className="font-medium mb-2">Price</h3>
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        name="min"
                        placeholder="Min"
                        value={filters.priceRange?.min || ""}
                        onChange={handlePriceChange}
                        className="w-full px-2 py-1 border rounded text-sm"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                        type="number"
                        name="max"
                        placeholder="Max"
                        value={filters.priceRange?.max || ""}
                        onChange={handlePriceChange}
                        className="w-full px-2 py-1 border rounded text-sm"
                    />
                </div>
            </div>

            {/* Seller Type */}
            <div className="mb-6">
                <h3 className="font-medium mb-2">Seller Type</h3>
                <div className="space-y-2">
                    {["Designer", "Reseller"].map((type) => (
                        <label key={type} className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                                type="checkbox"
                                checked={(filters.sellerType || []).includes(type)}
                                onChange={() => handleCheckboxChange("sellerType", type)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            {type}
                        </label>
                    ))}
                </div>
            </div>

            {/* Condition */}
            <div className="mb-6">
                <h3 className="font-medium mb-2">Condition</h3>
                <div className="space-y-2">
                    {["New", "Like New", "Good", "Fair"].map((cond) => (
                        <label key={cond} className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                                type="checkbox"
                                checked={(filters.condition || []).includes(cond)}
                                onChange={() => handleCheckboxChange("condition", cond)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            {cond}
                        </label>
                    ))}
                </div>
            </div>

            {/* Size */}
            <div className="mb-6">
                <h3 className="font-medium mb-2">Size</h3>
                <div className="flex flex-wrap gap-2">
                    {["XS", "S", "M", "L", "XL", "XXL"].map((size) => (
                        <button
                            key={size}
                            onClick={() => handleCheckboxChange("size", size)}
                            className={`px-2 py-1 text-xs border rounded ${(filters.size || []).includes(size)
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                                }`}
                        >
                            {size}
                        </button>
                    ))}
                </div>
            </div>

            {/* Color */}
            <div className="mb-6">
                <h3 className="font-medium mb-2">Color</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                    {["Black", "White", "Red", "Blue", "Green", "Yellow", "Pink", "Purple", "Grey", "Beige"].map((color) => (
                        <label key={color} className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                                type="checkbox"
                                checked={(filters.color || []).includes(color)}
                                onChange={() => handleCheckboxChange("color", color)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span
                                className="w-3 h-3 rounded-full border border-gray-200"
                                style={{ backgroundColor: color.toLowerCase() }}
                            />
                            {color}
                        </label>
                    ))}
                </div>
            </div>

            {/* Material */}
            <div className="mb-6">
                <h3 className="font-medium mb-2">Material</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                    {["Cotton", "Polyester", "Silk", "Leather", "Denim", "Wool", "Linen"].map((mat) => (
                        <label key={mat} className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                                type="checkbox"
                                checked={(filters.material || []).includes(mat)}
                                onChange={() => handleCheckboxChange("material", mat)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            {mat}
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
}
