import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, ShoppingCart, ArrowLeft, ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion"; // eslint-disable-line no-unused-vars
import { readStorage, writeStorage } from "../utils/storage";
import CloudinaryImage from "./common/CloudinaryImage";
import Header from "./Header";
import Footer from "./Footer";
import ConfirmModal from "./common/ConfirmModal";
import MessageModal from "./common/MessageModal";

const currency = (n) => `PKR ${Number(n || 0).toLocaleString()}`;

const WishlistPage = () => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const navigate = useNavigate();

  // Modal States
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    isDestructive: false,
  });

  const [messageModal, setMessageModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info", // success, error, warning, info
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    loadWishlist();
    window.addEventListener("wishlistUpdated", loadWishlist);
    return () => window.removeEventListener("wishlistUpdated", loadWishlist);
  }, []);

  const loadWishlist = () => {
    setWishlistItems(readStorage("wishlist"));
  };

  const closeConfirmModal = () =>
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  const closeMessageModal = () =>
    setMessageModal((prev) => ({ ...prev, isOpen: false }));

  const showMessage = (title, message, type = "info") => {
    setMessageModal({
      isOpen: true,
      title,
      message,
      type,
    });
  };

  const removeFromWishlist = (id) => {
    setConfirmModal({
      isOpen: true,
      title: "Remove Item",
      message: "Are you sure you want to remove this item from your wishlist?",
      isDestructive: true,
      onConfirm: () => {
        const updated = wishlistItems.filter(
          (item) => (item.id || item._id) !== id
        );
        setWishlistItems(updated);
        writeStorage("wishlist", updated);
        closeConfirmModal();
        showMessage(
          "Removed",
          "Item has been removed from your wishlist.",
          "success"
        );
      },
    });
  };

  const removeAll = () => {
    if (wishlistItems.length === 0) return;

    setConfirmModal({
      isOpen: true,
      title: "Clear Wishlist",
      message:
        "Are you sure you want to clear your entire wishlist? This action cannot be undone.",
      isDestructive: true,
      confirmText: "Clear Wishlist",
      onConfirm: () => {
        setWishlistItems([]);
        writeStorage("wishlist", []);
        closeConfirmModal();
        showMessage(
          "Wishlist Cleared",
          "Your wishlist has been cleared successfully.",
          "success"
        );
      },
    });
  };

  const addToCart = (product) => {
    try {
      const currentCart = readStorage("cart");
      const existingItem = currentCart.find(
        (item) => (item.id || item._id) === (product.id || product._id)
      );

      if (existingItem) {
        showMessage(
          "Already in Cart",
          "This item is already in your shopping cart.",
          "warning"
        );
        return;
      }

      const cartItem = { ...product, quantity: 1 };
      const updatedCart = [...currentCart, cartItem];
      writeStorage("cart", updatedCart);
      showMessage(
        "Added to Cart",
        "Item successfully added to your cart.",
        "success"
      );
    } catch (error) {
      console.error("Error adding to cart:", error);
      showMessage(
        "Error",
        "Failed to add item to cart. Please try again.",
        "error"
      );
    }
  };

  const addAllToCart = () => {
    if (wishlistItems.length === 0) return;

    setConfirmModal({
      isOpen: true,
      title: "Add All to Cart",
      message: `Are you sure you want to add all ${wishlistItems.length} items to your cart?`,
      isDestructive: false,
      confirmText: "Add All",
      onConfirm: () => {
        try {
          const currentCart = readStorage("cart");
          let addedCount = 0;
          const updatedCart = [...currentCart];

          wishlistItems.forEach((product) => {
            const exists = updatedCart.find(
              (item) => (item.id || item._id) === (product.id || product._id)
            );
            if (!exists) {
              updatedCart.push({ ...product, quantity: 1 });
              addedCount++;
            }
          });

          if (addedCount > 0) {
            writeStorage("cart", updatedCart);
            closeConfirmModal();
            showMessage(
              "Added to Cart",
              `Successfully added ${addedCount} items to your cart.`,
              "success"
            );
          } else {
            closeConfirmModal();
            showMessage(
              "No Items Added",
              "All items in your wishlist are already in your cart.",
              "info"
            );
          }
        } catch (error) {
          console.error("Error adding all to cart:", error);
          closeConfirmModal();
          showMessage("Error", "Failed to add items to cart.", "error");
        }
      },
    });
  };

  const getPrice = (item) => {
    return item.price || item.rentalPrice || 0;
  };

  const goBack = () => navigate(-1);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Modals */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        isDestructive={confirmModal.isDestructive}
        confirmText={confirmModal.confirmText || "Confirm"}
      />

      <MessageModal
        isOpen={messageModal.isOpen}
        onClose={closeMessageModal}
        title={messageModal.title}
        message={messageModal.message}
        type={messageModal.type}
      />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header - EXACTLY MATCHING CART PAGE */}
        <div className="flex items-center mb-8">
          <button
            onClick={goBack}
            className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
          >
            <ArrowLeft className="h-5 w-5 mr-1" /> Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Wishlist ({wishlistItems.length})
          </h1>
        </div>

        {wishlistItems.length === 0 ? (
          // Empty State - Similar to Cart logic
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <div className="mb-6 inline-block p-6 bg-rose-50 rounded-full animate-bounce-subtle">
              <HeartOff className="w-12 h-12 text-rose-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Your wishlist is empty
            </h2>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">
              Looks like you haven't added anything to your wishlist yet.
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
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Wishlist Items List - EXACTLY MATCHING CART GRID */}
            <div className="flex-1 space-y-6">
              <AnimatePresence mode="popLayout">
                {wishlistItems.map((item) => (
                  <motion.div
                    key={item.id || item._id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, y: -20, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow"
                  >
                    <div className="flex gap-4 sm:gap-6">
                      {/* Image */}
                      <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                        <CloudinaryImage
                          src={item.image || item.imageUrls?.[0]}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          sizes="(max-width: 640px) 96px, 128px"
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-serif font-bold text-gray-900 text-lg hover:text-emerald-600 transition-colors line-clamp-1">
                                {item.name}
                              </h3>
                              <p className="text-sm text-gray-500 mb-1 capitalize">
                                {item.category || "Product"}
                              </p>
                              <div className="font-bold text-emerald-600 text-lg mt-1">
                                {currency(getPrice(item))}
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                removeFromWishlist(item.id || item._id)
                              }
                              className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-all"
                              title="Remove"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-end justify-end mt-4">
                          <button
                            onClick={() => addToCart(item)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                          >
                            <ShoppingCart className="w-4 h-4" /> Add to Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Sidebar / Summary Section - EXACTLY MATCHING CART SUMMARY ASIDE */}
            <aside className="lg:w-[350px] shrink-0 animate-fade-in delay-300">
              <div className="bg-white rounded-xl shadow-lg shadow-gray-200/50 p-6 border border-gray-100 sticky top-28 transition-all duration-300">
                <h4 className="text-lg font-bold text-gray-900 mb-6 pb-4 border-b">
                  Wishlist Actions
                </h4>

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-gray-600 text-sm">
                    <span>Total Items</span>
                    <span className="font-semibold text-gray-900">
                      {wishlistItems.length}
                    </span>
                  </div>
                  <div className="w-full h-px bg-gray-100 my-4"></div>

                  <button
                    onClick={addAllToCart}
                    className="w-full py-4 px-6 rounded-xl font-bold text-lg transition-all shadow-lg shadow-emerald-500/30 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Add All to Cart
                  </button>

                  <button
                    onClick={removeAll}
                    className="w-full mt-4 py-3.5 bg-white border-2 border-red-100 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-5 h-5" />
                    Clear Wishlist
                  </button>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

function HeartOff(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="2" y1="2" x2="22" y2="22" />
      <path d="M16.5 16.5 12 21l-7-7c-1.5-1.45-3-3.2-3-5.5a5.5 5.5 0 0 1 2.14-4.35" />
      <path d="M8.7 4.7c.98-.73 2.31-1.09 3.3-1.09a5.5 5.5 0 0 1 5.5 5.5c0 1.6-.6 3.6-2.5 4.8" />
    </svg>
  );
}

export default WishlistPage;
