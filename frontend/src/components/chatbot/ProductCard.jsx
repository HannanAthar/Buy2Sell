import React, { useState } from "react";
import { ShoppingCart, ExternalLink, Check, AlertCircle } from "lucide-react";
import { readStorage, writeStorage } from "../../utils/storage";
import { toast } from "react-hot-toast";

const ProductCard = ({ product }) => {
  const [isAdded, setIsAdded] = useState(false);

  const getImageUrl = (path) => {
    if (!path || path === "/placeholder.svg") return "/placeholder.svg";
    if (path.startsWith("http")) return path;
    // Clean path logic
    let cleanPath = path.replace(/\\/g, "/");
    if (cleanPath.startsWith("uploads/")) cleanPath = "/" + cleanPath;
    if (!cleanPath.startsWith("/")) cleanPath = "/" + cleanPath;
    return `http://localhost:5000${cleanPath}`;
  };

  const isOutOfStock = product.status === "out-of-stock" || product.stock === 0;
  const isRental = product.listingType === "rent";
  const pid = product.id || product._id;

  // Construct SAFE View Product URL
  // Uses /product-detail?id=XYZ pattern which is verified to work
  const viewProductUrl = `/product-detail?id=${pid}`;

  const addToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const cart = readStorage("cart") || [];

      // Check if exists
      const existingItem = cart.find((item) => item.id === pid);

      if (existingItem) {
        // If reseller item, max 1
        if (product.sellerType === "Reseller") {
          toast.error("Reseller items are limited to 1 per customer");
          return;
        }
        existingItem.quantity = (existingItem.quantity || 1) + 1;

        // Clamp to stock if known
        if (product.stock && existingItem.quantity > product.stock) {
          existingItem.quantity = product.stock;
          toast.error(`Max stock available is ${product.stock}`);
        } else {
          toast.success("Cart updated");
        }
      } else {
        // Create new item - MATCHING CartPage.jsx EXPECTATIONS
        const newItem = {
          cartId: Date.now() + Math.random(),
          id: pid,
          title: product.name,
          name: product.name,
          price: Number(product.price),
          sellingPrice: Number(product.price),
          image: product.imageUrl,
          imageUrls: [product.imageUrl],
          quantity: 1,
          sellerType: product.sellerType, // Important for Reseller logic
          sellerName: product.sellerName,
          stock: product.stock,
          listingType: product.listingType,
          category: product.category,
          // For Rent logic if needed
          rentPrice: product.rentPrice,
        };
        cart.push(newItem);
        toast.success(isRental ? "Added to rental cart" : "Added to cart");
      }

      writeStorage("cart", cart);
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);

      // Trigger update event for header counter
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (error) {
      console.error("Add to cart failed:", error);
      toast.error("Failed to add to cart");
    }
  };

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-3 mb-3 hover:border-emerald-300 hover:shadow-md transition-all">
      <div className="flex gap-3">
        {/* Product Image */}
        <div className="relative flex-shrink-0">
          <img
            src={getImageUrl(product.imageUrl)}
            alt={product.name}
            className="w-20 h-20 object-cover rounded-lg bg-gray-50"
            onError={(e) => {
              e.target.src = "/placeholder.svg";
            }}
          />
          {isRental && (
            <span className="absolute top-1 left-1 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded shadow-sm">
              Rent
            </span>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <h4
            className="font-semibold text-sm text-gray-900 truncate"
            title={product.name}
          >
            {product.name}
          </h4>

          <div className="flex items-center gap-2 mt-1">
            <span className="text-emerald-600 font-bold text-base">
              Rs {Number(product.price).toLocaleString()}
            </span>
            {isRental && product.rentPrice && (
              <span className="text-xs text-gray-500">/ Day</span>
            )}
          </div>

          {/* Stock Status & Rating */}
          <div className="mt-1.5 flex items-center gap-2 flex-wrap">
            {isOutOfStock ? (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                <AlertCircle className="w-3 h-3" />
                Out of Stock
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                <Check className="w-3 h-3" /> In Stock ({product.stock})
              </span>
            )}
            {product.averageRating > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">
                <span className="text-yellow-500">★</span>
                {product.averageRating.toFixed(1)} ({product.ratingCount || 0})
              </span>
            )}
          </div>

          {/* Seller Info */}
          {product.sellerName && (
            <p className="text-[10px] text-gray-500 mt-1 truncate">
              by <span className="font-medium">{product.sellerName}</span>
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-3">
        <a
          href={viewProductUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 py-2 rounded-lg text-xs font-semibold transition-colors border border-emerald-200"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          View Details
        </a>

        {!isOutOfStock && (
          <button
            onClick={addToCart}
            disabled={isAdded}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors shadow-sm
                ${
                  isAdded
                    ? "bg-emerald-600 text-white cursor-default"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
          >
            {isAdded ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <ShoppingCart className="w-3.5 h-3.5" />
            )}
            {isAdded ? "Added" : isRental ? "Rent Now" : "Add to Cart"}
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
