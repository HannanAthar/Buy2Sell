"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowLeft,
  Calendar,
  AlertCircle,
  ShoppingCart,
  ArrowRight,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import CloudinaryImage from "./common/CloudinaryImage.jsx";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";
import { AnimatePresence, motion } from "framer-motion"; // eslint-disable-line no-unused-vars
import AnimatedPrice from "./AnimatedPrice";

// Import storage utils
import { readStorage, writeStorage, getStorageKey } from "../utils/storage";

import { useProducts } from "./ProductContext.jsx";

const currency = (n) => `PKR ${Number(n || 0).toLocaleString()}`;



const readCart = () => {
  const cart = readStorage("cart");
  const normalized = cart.map((it, i) => ({
    ...it,
    quantity: it?.quantity && it.quantity > 0 ? it.quantity : 1,
    rentDays:
      it?.rentDays && it.rentDays >= 1 && it.rentDays <= 7
        ? Math.floor(it.rentDays)
        : 1,
    cartId: it?.cartId || `${it?.id ?? i}-${Date.now() + i}`,
  }));
  return normalized;
};

const writeCart = (next) => {
  writeStorage("cart", next);
};

// helper: is reseller item (limit quantity = 1)
const isResellerItem = (it) =>
  String(it?.sellerType || "").toLowerCase() === "reseller";

// helper: get stock amount from cart item
const stockOf = (it) => {
  const raw =
    it?.stockQty ??
    it?.stock ??
    it?.itemsCount ??
    it?.availableStock ??
    it?.inventory ??
    null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
};

// RENT/Sale logic
const isRentLine = (it) => {
  const lt = String(it?.listingType || "").toLowerCase();
  const rentSelected =
    it?.isRent === true ||
    it?.mode === "rent" ||
    it?.selectedFor === "rent" ||
    it?.type === "rent";
  return lt === "rent" || (lt === "both" && rentSelected);
};



const baseUnitPrice = (item) => {
  if (isRentLine(item)) return Number(item?.rentPrice || 0);
  if (item?.isOnSale && item?.originalPrice && item?.salePercentage >= 0) {
    return Math.round(
      Number(item.originalPrice) -
        (Number(item.originalPrice) * Number(item.salePercentage)) / 100
    );
  }
  return Number(item?.sellingPrice || item?.salePrice || item?.price || 0);
};

const unitConsideringDays = (item) => {
  const unit = baseUnitPrice(item);
  if (isRentLine(item)) {
    const days = Math.min(7, Math.max(1, Number(item?.rentDays || 1)));
    return unit * days;
  }
  return unit;
};

// quantity: reseller always 1; others clamped to stock
const effectiveQty = (it) => {
  if (isResellerItem(it)) return 1;
  let q = Math.max(1, Number(it.quantity || 1));
  const stock = stockOf(it);
  if (stock != null) q = Math.min(q, stock);
  return q;
};

export default function CartPage() {
  const navigate = useNavigate();
  const { designerProducts = [], resellerProducts = [] } = useProducts();
  const [cartItems, setCartItems] = useState(() => readCart());

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const sync = () => setCartItems(readCart());
    const onStorage = (e) => {
      if (e.key === getStorageKey("cart")) sync();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("cartUpdated", sync);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("cartUpdated", sync);
    };
  }, []);

  // AUTO-HEAL: Update cart items with latest stock/seller info from context
  useEffect(() => {
    if (
      (!designerProducts.length && !resellerProducts.length) ||
      !cartItems.length
    )
      return;

    let changed = false;
    const nextCart = cartItems.map((item) => {
      let newItem = { ...item };
      const pid = item.id || item._id;

      // Find product in context
      const dProd = designerProducts.find((p) => (p.id || p._id) === pid);
      const rProd = resellerProducts.find((p) => (p.id || p._id) === pid);
      const realProd = dProd || rProd;

      if (realProd) {
        // Correct seller type
        const realSellerType = rProd
          ? "Reseller"
          : dProd
          ? "Designer"
          : item.sellerType || "Store";
        if (newItem.sellerType !== realSellerType) {
          newItem.sellerType = realSellerType;
          changed = true;
        }

        // Correct stock
        const realStock = Number(
          realProd.stock ??
            realProd.itemsCount ??
            realProd.quantity ??
            realProd.availableStock ??
            0 // default if missing
        );
        const currentStock = stockOf(newItem);

        // If stock info on item is outdated or missing, update it
        if (currentStock !== realStock) {
          newItem.stock = realStock;
          newItem.stockQty = realStock; // keep both keys for safety
          changed = true;
        }

        // Enforce limits immediately
        if (isResellerItem(newItem)) {
          if (newItem.quantity !== 1) {
            newItem.quantity = 1;
            changed = true;
          }
        } else {
          // For Designer/Store: clamp to stock if available
          if (realStock > 0 && newItem.quantity > realStock) {
            newItem.quantity = realStock;
            changed = true;
          }
        }
      }
      return newItem;
    });

    if (changed) {
      console.log("🛒 Auto-healing cart items with fresh stock/seller data...");
      updateCart(nextCart);
    }
  }, [designerProducts, resellerProducts, cartItems]);

  const updateCart = (next) => {
    setCartItems(next);
    writeCart(next);
  };

  const updateQuantity = (cartId, q) => {
    const item = cartItems.find((i) => i.cartId === cartId);
    if (!item) return;

    if (isResellerItem(item)) return;

    let next = Math.max(1, Number(q || 1));
    const stock = stockOf(item);
    if (stock != null) next = Math.min(next, stock);

    if (next <= 0) return;
    updateCart(
      cartItems.map((i) => (i.cartId === cartId ? { ...i, quantity: next } : i))
    );
  };

  const updateRentDays = (cartId, d) => {
    const days = Math.max(1, Math.min(7, Number(d) || 1));
    updateCart(
      cartItems.map((i) => (i.cartId === cartId ? { ...i, rentDays: days } : i))
    );
  };

  const removeItem = (cartId) =>
    updateCart(cartItems.filter((i) => i.cartId !== cartId));

  const subtotal = useMemo(
    () =>
      cartItems.reduce(
        (sum, it) => sum + unitConsideringDays(it) * effectiveQty(it),
        0
      ),
    [cartItems]
  );
  const total = subtotal;

  const goBack = () => navigate("/");
  const [cartError, setCartError] = useState("");

  const proceedToCheckout = () => {
    if (cartItems.length === 0) {
      setCartError("Your cart is empty. Please add items before checking out.");
      return;
    }
    setCartError("");

    const items = cartItems.map((it) => ({
      ...it,
      title:
        it.title ||
        it.name ||
        it.productTitle ||
        it.description ||
        "Untitled Product",
      quantity: effectiveQty(it),
      rentDays: isRentLine(it)
        ? Math.max(1, Math.min(7, Number(it.rentDays || 1)))
        : undefined,
    }));

    const sub = items.reduce(
      (sum, it) => sum + unitConsideringDays(it) * effectiveQty(it),
      0
    );

    const orderSummary = { items, subtotal: sub, total: sub };
    localStorage.setItem("checkoutData", JSON.stringify(orderSummary));

    const hasRent = items.some(isRentLine);

    if (hasRent) {
      localStorage.removeItem("rentAgreement");
      navigate("/rent-form");
      return;
    }

    navigate("/checkout");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <button
            onClick={goBack}
            className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
          >
            <ArrowLeft className="h-5 w-5 mr-1" /> Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Cart ({cartItems.length})
          </h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items */}
          <div className="flex-1 space-y-6">
            <AnimatePresence mode="popLayout">
              {cartItems.map((item) => {
                const stock = stockOf(item);
                const isResell = isResellerItem(item);
                const isRent = isRentLine(item);
                const qEff = effectiveQty(item);

                // Validation warnings
                const stockWarn = !isRent && stock != null && qEff > stock;
                const rentWarn =
                  isRent &&
                  (item.rentalStatus === "rented" ||
                    item.rentalStatus === "unavailable");


                const lineTotal = unitConsideringDays(item) * qEff;

                return (
                  <motion.div
                    key={item.cartId}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow ${
                      rentWarn || stockWarn ? "border-red-200 bg-red-50/30" : ""
                    }`}
                  >
                    <div className="flex gap-4 sm:gap-6">
                      {/* Image */}
                      {/* Image - Static (Non-clickable) */}
                      <div className="shrink-0">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                          <CloudinaryImage
                            src={
                              item.customPreview ||
                              (item.imageUrls && item.imageUrls[0]) ||
                              item.image ||
                              "/placeholder.svg"
                            }
                            alt={item.title}
                            className="w-full h-full object-cover"
                            sizes="(max-width: 640px) 96px, 128px"
                          />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <div>
                              <Link to={`/products/${item.id}`} state={item}>
                                <h3 className="font-serif font-bold text-gray-900 text-lg hover:text-emerald-600 transition-colors line-clamp-1">
                                  {item.title ||
                                    item.name ||
                                    "Untitled Product"}
                                </h3>
                              </Link>
                              <p className="text-sm text-gray-500 mb-1">
                                {item.sellerName || "Brand"}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span
                                  className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                    isRent
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-emerald-100 text-emerald-700"
                                  }`}
                                >
                                  {isRent ? "Rent" : "Sale"}
                                </span>
                                {item.size && (
                                  <span className="text-xs text-gray-500 border border-gray-200 px-2 py-0.5 rounded">
                                    Size: {item.size}
                                  </span>
                                )}
                              </div>
                            </div>

                            <button
                              onClick={() => removeItem(item.cartId)}
                              className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-all"
                              title="Remove"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>

                          {/* Warnings */}
                          {stockWarn && (
                            <div className="inline-flex items-center gap-1 text-xs text-red-600 font-medium mt-2 bg-red-50 px-2 py-1 rounded">
                              <AlertCircle size={12} />
                              Currently Out of Stock
                            </div>
                          )}
                          {rentWarn && (
                            <div className="inline-flex items-center gap-1 text-xs text-red-600 font-medium mt-2 bg-red-50 px-2 py-1 rounded">
                              <AlertCircle size={12} />
                              Already Rented / Unavailable
                            </div>
                          )}
                        </div>

                        {/* Footer: Qty & Price */}
                        <div className="flex flex-wrap items-end justify-between gap-4 mt-4">
                          {/* Qty / Days Control */}
                          {isRent ? (
                            <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                              <span className="text-xs font-bold text-gray-500 px-2">
                                Days:
                              </span>
                              <button
                                onClick={() =>
                                  updateRentDays(
                                    item.cartId,
                                    (item.rentDays || 1) - 1
                                  )
                                }
                                className="w-11 h-11 flex items-center justify-center bg-white rounded shadow-sm hover:text-emerald-600 disabled:opacity-50 min-w-[44px] min-h-[44px]"
                                disabled={(item.rentDays || 1) <= 1}
                              >
                                <Minus size={16} />
                              </button>
                              <span className="w-6 text-center font-bold text-sm">
                                {item.rentDays || 1}
                              </span>
                              <button
                                onClick={() =>
                                  updateRentDays(
                                    item.cartId,
                                    (item.rentDays || 1) + 1
                                  )
                                }
                                className="w-11 h-11 flex items-center justify-center bg-white rounded shadow-sm hover:text-emerald-600 min-w-[44px] min-h-[44px]"
                                disabled={(item.rentDays || 1) >= 7} // Max 7 days rent per policy
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                              <button
                                onClick={() =>
                                  updateQuantity(item.cartId, item.quantity - 1)
                                }
                                className="w-11 h-11 flex items-center justify-center bg-white rounded shadow-sm hover:text-emerald-600 disabled:opacity-50 min-w-[44px] min-h-[44px]"
                                disabled={item.quantity <= 1}
                              >
                                <Minus size={16} />
                              </button>
                              <span className="w-6 text-center font-bold text-sm">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(item.cartId, item.quantity + 1)
                                }
                                className="w-11 h-11 flex items-center justify-center bg-white rounded shadow-sm hover:text-emerald-600 disabled:opacity-50 min-w-[44px] min-h-[44px]"
                                disabled={
                                  !isResell &&
                                  stock != null &&
                                  item.quantity >= stock
                                }
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          )}

                          {/* Price */}
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Total:</p>
                            <p className="text-xl font-bold text-emerald-600">
                              {currency(lineTotal)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {cartItems.length === 0 && (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                <div className="mb-6 inline-block p-6 bg-emerald-50 rounded-full animate-bounce-subtle">
                  <ShoppingCart size={48} className="text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Your cart is empty
                </h2>
                <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                  Looks like you haven't added anything to your cart yet.
                  Explore our collections and find something you love.
                </p>
                <Link
                  to="/"
                  className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
                >
                  Start Shopping
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </div>
            )}
          </div>

          {/* SUMMARY */}
          {cartItems.length > 0 && (
            <aside className="lg:w-[350px] shrink-0 animate-fade-in delay-300">
              <div className="bg-white rounded-xl shadow-lg shadow-gray-200/50 p-6 border border-gray-100 sticky top-28 transition-all duration-300">
                <h4 className="text-lg font-bold text-gray-900 mb-6 pb-4 border-b">
                  Order Summary
                </h4>

                <div className="space-y-4 text-sm mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {cartItems.map((it) => {
                    const unit = baseUnitPrice(it);
                    const qEff = effectiveQty(it);
                    const rent = isRentLine(it);
                    const line = unitConsideringDays(it) * qEff;

                    return (
                      <div
                        key={`s-${it.cartId}`}
                        className="flex justify-between items-start gap-2"
                      >
                        <div className="text-gray-600">
                          <span className="font-medium text-gray-800">
                            {it.title || "Product"}
                          </span>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {rent ? (
                              <>
                                {it.rentDays || 1} Days x {currency(unit)}
                              </>
                            ) : (
                              <>
                                {qEff} x {currency(unit)}
                              </>
                            )}
                          </div>
                        </div>
                        <div className="font-semibold text-gray-900">
                          {currency(line)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t pt-4 mt-2 flex justify-between items-end">
                  <span className="text-gray-500">Total</span>
                  <span className="text-2xl font-bold text-gray-900">
                    <AnimatedPrice value={total} />
                  </span>
                </div>

                <button
                  onClick={proceedToCheckout}
                  className="w-full mt-8 py-4 px-6 rounded-xl font-bold text-lg transition-all shadow-lg shadow-emerald-500/30 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white hover:-translate-y-1 active:scale-95"
                >
                  CHECKOUT NOW
                </button>

                {cartError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <p>{cartError}</p>
                  </div>
                )}

                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
                  <AlertCircle className="w-3 h-3" />
                  <span>Secure Checkout. Taxes calculated at next step.</span>
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
