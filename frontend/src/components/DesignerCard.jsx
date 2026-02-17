"use client";

import { useState } from "react";
import { Heart, Plus } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import RentalBadge from "./RentalBadge";
import { useAuthCheck } from "../hooks/useAuthCheck";
import CloudinaryImage from "./common/CloudinaryImage";
import withOptimization from "./common/withOptimization";

const toNum = (v) => (v == null || isNaN(Number(v)) ? 0 : Number(v));
const nowPrice = (p) => {
  const base = toNum(p.salePrice || p.sellingPrice || p.price);
  if (base > 0) return base;
  // fallback if only originalPrice present (no salePrice)
  return toNum(p.originalPrice) || 0;
};

function DesignerHubCard({
  product,
  isLiked = false,
  onToggleWishlist,
}) {
  const navigate = useNavigate();
  const [heartAnim, setHeartAnim] = useState(false);
  const { checkAuth } = useAuthCheck();

  const triggerHeart = (e) => {
    e.stopPropagation();
    e.preventDefault();

    // Check if user is logged in
    if (!checkAuth("add to wishlist")) {
      return;
    }

    setHeartAnim(true);
    setTimeout(() => setHeartAnim(false), 1000);
    onToggleWishlist(product);
  };

  const brand = (
    product?.sellerName ||
    product?.brandName ||
    product?.wardrobeName ||
    product?.originalBrand ||
    "Unknown Brand"
  )
    .toString()
    .trim();
  /* const brandDisplay = `${brand} - Designer`; */

  const title = (
    product?.title ||
    product?.name ||
    product?.productTitle ||
    product?.description ||
    "Untitled Product"
  )
    .toString()
    .trim();

  // badges
  const listingType = String(product?.listingType || "").toLowerCase();
  const isSale = listingType === "sale";
  const isRent =
    listingType === "rent" ||
    product?.isRental === true ||
    product?.forRent === true;

  const pct = toNum(product?.salePercentage);
  const hasSaleOff = Boolean(product?.isOnSale) && pct > 0; // explicit “on sale” with % set from uploader

  const priceNow = nowPrice(product);
  const orig = toNum(product?.originalPrice);

  const saveToHistory = () => {
    const id = product.id ?? product._id;
    if (id) localStorage.setItem(`product:${id}`, JSON.stringify(product));
  };

  const goDetail = (e) => {
    e.preventDefault();
    e.stopPropagation();
    saveToHistory();
    navigate("/product-detail", { state: product });
  };

  return (
    <div
      tabIndex="0"
      className="bg-white rounded-xl shadow-sm transition-all duration-300 ease-out group relative cursor-pointer h-full flex flex-col hover:shadow-xl overflow-hidden outline-none"
    >
      {/* Primary Navigation Link (Overlay) */}
      <Link
        to="/product-detail"
        state={product}
        onClick={saveToHistory}
        className="absolute inset-0 z-10"
        aria-label={`View details for ${title}`}
      />

      {/* BADGES — Designer: SALE → SALE % OFF → RENT */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-2 items-start pointer-events-none transition-transform duration-300 group-hover:translate-x-1">
        {isSale && (
          <span className="bg-emerald-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-sm animate-fade-in-up delay-100">
            SALE
          </span>
        )}
        {hasSaleOff && (
          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-sm animate-fade-in-up delay-200">
            {pct}% OFF
          </span>
        )}
        {isRent && (
          <span className="bg-emerald-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-sm animate-fade-in-up delay-300">
            RENT
          </span>
        )}
      </div>

      {/* WISHLIST */}
      <div className="absolute top-3 right-3 z-20 transition-transform duration-300 group-hover:-translate-y-1">
        <button
          onClick={triggerHeart}
          className={`p-2 rounded-full transition-all duration-300 shadow-md ${
            isLiked
              ? "bg-red-500 text-white transform scale-110"
              : "bg-white/90 backdrop-blur-sm text-gray-600 hover:text-red-500 hover:bg-red-50"
          }`}
          aria-label="Toggle wishlist"
        >
          <Heart
            className={`h-4 w-4 transition-transform ${
              isLiked ? "fill-current" : ""
            } ${heartAnim ? "animate-heart-beat" : "hover:scale-110"}`}
          />
        </button>
      </div>

      {/* IMAGE CONTAINER - Zoom + Fade Upgrade */}
      <div className="relative shrink-0 h-72 overflow-hidden bg-gray-100">
        {/* FRONT IMAGE - Base (Zooms on hover) */}
        <div className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-105">
           <CloudinaryImage
              src={
                  product?.imageUrls?.[0] ||
                  product?.images?.[0] ||
                  product?.imageUrl ||
                  product?.image ||
                  "/placeholder.svg"
              }
              alt={title}
              className="w-full h-full object-cover object-center"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />

        </div>

        {/* BACK IMAGE - Overlay (Fades in + Zooms) */}
        <div className={`absolute inset-0 transition-all duration-300 ease-out group-hover:scale-105 opacity-0 group-hover:opacity-100`}>
             <CloudinaryImage
              src={
                  product?.imageUrls?.[1] ||
                  product?.images?.[1] ||
                  product?.imageUrls?.[0] ||
                  product?.images?.[0] ||
                  product?.imageUrl ||
                  product?.image ||
                  "/placeholder.svg"
              }
              alt={`${title} - Back`}
              className="w-full h-full object-cover object-center"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />

             {/* Subtle Dark Overlay */}
            <div className="absolute inset-0 bg-black/5" />
        </div>
      </div>

      {/* BODY */}
      <div className="p-5 flex flex-col flex-1 pointer-events-none bg-white">
        {/* Desktop: text-sm (original), Mobile: text-[10px] */}
        <div className="text-[10px] lg:text-sm text-emerald-600 font-semibold mb-1 tracking-wide uppercase whitespace-nowrap overflow-visible">
          {brand} - Designer
        </div>
        {/* Desktop: Full title with CSS ellipsis. Mobile: 3-word rule via JS, no CSS ellipsis */}
        <h3 className="text-sm lg:text-lg font-bold text-gray-900 mb-3 leading-tight group-hover:text-emerald-700 transition-colors lg:whitespace-nowrap lg:overflow-hidden lg:text-ellipsis">
          {/* On mobile (< lg), apply 3-word rule. On desktop (lg+), show full title */}
          <span className="hidden lg:inline">{title}</span>
          <span className="lg:hidden">
            {(() => {
               const t = title.split(' ');
               if (t.length <= 3) return title;
               return t.slice(0, 3).join(' ') + '...';
            })()}
          </span>
        </h3>

        <div className="flex flex-row items-center justify-between mt-auto">
          {/* Price Container - FIRST */}
          <div className="flex items-center gap-1 font-extrabold text-gray-900">
             {orig > 0 && priceNow > 0 && priceNow < orig ? (
                <div className="flex flex-col items-start leading-none">
                    <span className="text-[13px] lg:text-sm text-gray-500 line-through">
                      Rs {orig.toLocaleString()}
                    </span>
                    <div className="flex items-center gap-1 text-red-600 text-xl">
                      <span className="text-sm">Rs</span>
                      <span>{priceNow.toLocaleString()}</span>
                    </div>
                </div>
             ) : (
                <div className="flex items-center gap-1 text-xl">
                    <span className="text-sm">Rs</span>
                    <span>{priceNow.toLocaleString()}</span>
                </div>
             )}
          </div>

          {/* Action Button (Plus) - SECOND */}
          <button
            onClick={goDetail}
            className="product-card-btn bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-full shadow-lg transition-all duration-300 hover:scale-110 pointer-events-auto z-20 flex items-center justify-center shrink-0
            opacity-100 translate-y-0
            lg:opacity-0 lg:translate-y-8 lg:group-hover:translate-y-0 lg:group-hover:opacity-100"
            aria-label={`View ${title} details`}
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

const DesignerCard = withOptimization(DesignerHubCard);
export default DesignerCard;
