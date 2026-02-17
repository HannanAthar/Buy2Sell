import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion"; // eslint-disable-line no-unused-vars
import { Palette, Sparkles } from "lucide-react";
import Header from "./Header";
import Footer from "./Footer";
import api from "../api/axios";
import ProductCard from "./CustomYourStyle/ProductCard";
import { useAuthCheck } from "../hooks/useAuthCheck";
import { readStorage, writeStorage } from "../utils/storage";
import HoverWrapper from "./common/HoverWrapper.jsx";
import "./CustomGallery.css";

const getImageUrl = (path) => {
  if (!path || !path.trim()) return null;
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  return `http://localhost:5000${path.startsWith("/") ? "" : "/"}${path}`;
};

export default function CustomProductsGallery() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState([]);
  const { checkAuth } = useAuthCheck();

  useEffect(() => {
    setWishlist(readStorage("wishlist"));
    const loadProducts = async () => {
      try {
        const { data } = await api.get("/custom-products/all");
        setProducts(data.products || []);
      } catch (error) {
        console.error("Failed to load custom products:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const getProdId = (p) => p.id || p._id;

  const isInWishlist = (id) => {
    if (!id) return false;
    return wishlist.some((w) => String(getProdId(w)) === String(id));
  };

  const toggleWishlist = (product) => {
    if (!checkAuth("add to wishlist")) return;

    const pid = getProdId(product);
    if (!pid) return;

    const next = isInWishlist(pid)
      ? wishlist.filter((w) => String(getProdId(w)) !== String(pid))
      : [...wishlist, product];

    setWishlist(next);
    writeStorage("wishlist", next);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="min-h-[60vh] grid place-items-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-gray-200"></div>
              <div className="w-16 h-16 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin absolute top-0 left-0"></div>
            </div>
            <p className="text-gray-600 font-medium">
              Loading custom products...
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-emerald-700/60 py-20 min-h-[500px] flex items-center justify-center">
        {/* Background Gallery - Visible on all devices */}
        <div className="gallery-container absolute inset-0 z-0 flex items-center justify-center">
          <div className="card-row">
            {[43, 44, 45, 46, 47].map((num, i) => (
              <a
                key={num}
                className="gallery-card"
                href="#"
                role="listitem"
                aria-label={`Custom Design ${i + 1}`}
                onClick={(e) => e.preventDefault()}
              >
                <img src={`/${num}.jpg`} alt={`Custom Design ${i + 1}`} />
              </a>
            ))}
          </div>
        </div>

        {/* Existing Content - Sibling, brought to front */}
        <HoverWrapper
          className="gallery-text-overlay relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pointer-events-none"
          background={null} // Ensure no background from HoverWrapper
        >
          <div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-6"
            style={{ WebkitTapHighlightColor: 'transparent', userSelect: 'none' }}
          >
            <Palette className="w-5 h-5 text-white" />
            <span className="text-sm font-semibold text-white">
              Custom Design Gallery
            </span>
          </div>

          <motion.h1
            className="text-4xl md:text-6xl font-extrabold text-white mb-6"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{ WebkitTapHighlightColor: 'transparent', userSelect: 'none' }}
          >
            Explore Custom Designs
          </motion.h1>
          <motion.p
            className="text-xl text-emerald-50 mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            style={{ WebkitTapHighlightColor: 'transparent', userSelect: 'none' }}
          >
            Browse our collection of unique custom product templates or create
            your own masterpiece
          </motion.p>
        </HoverWrapper>
      </section>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {products.length === 0 ? (
          <div className="text-center py-20">
            <Palette className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              No Custom Products Yet
            </h2>
            <p className="text-gray-600 mb-8">
              Be the first to create a custom design!
            </p>
            <button
              onClick={() => navigate("/custom-shirt-designer")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--primary-green)] text-white font-semibold hover:bg-[var(--dark-green)] transition-colors"
            >
              <Sparkles className="w-5 h-5" />
              Create Your Design
            </button>
          </div>
        ) : (
          <>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                All Custom Designs
              </h2>
              <p className="text-gray-600">
                {products.length} unique product
                {products.length !== 1 ? "s" : ""} available
              </p>
            </div>

            <motion.div
              className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-50px" }}
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
              {products.map((product) => {
                // Adapt product data for check (id) and display (item)
                const item = {
                  id: product._id || product.id,
                  name: product.name,
                  price: product.price || 0,
                  front: getImageUrl(product.images?.[0]),
                  back: getImageUrl(product.images?.[1]),
                  description: product.description,
                  sizes: product.size || product.sizes,
                };

                return (
                  <motion.div
                    key={item.id}
                    variants={{
                      hidden: { opacity: 0, y: 30 },
                      show: { opacity: 1, y: 0 },
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    <ProductCard
                      item={item}
                      isLiked={isInWishlist(`custom-${item.id}`)}
                      onToggleWishlist={toggleWishlist}
                    />
                  </motion.div>
                );
              })}
            </motion.div>

            {/* CTA Section */}
            <motion.div
              className="mt-16 text-center rounded-3xl overflow-hidden shadow-2xl relative"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              viewport={{ once: true, margin: "-50px" }}
            >
              <HoverWrapper
                className="p-12"
                background={
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[var(--primary-green)] to-[var(--dark-green)]" />
                }
              >
                <h2 className="text-3xl font-bold text-white mb-4 relative z-10">
                  Ready to Create Your Own?
                </h2>
                <p className="text-emerald-50 text-lg mb-8 max-w-2xl mx-auto relative z-10">
                  Use our powerful design tool to create unique custom products
                  with your own text, images, and creativity
                </p>
                <button
                  onClick={() => navigate("/custom-shirt-designer")}
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-white text-[var(--dark-green)] font-bold text-lg shadow-xl transition-all duration-300 ease-out hover:bg-[var(--emerald-50)] hover:shadow-2xl hover:scale-105 active:scale-[0.98] relative z-10 whitespace-nowrap"
                >
                  <Sparkles className="w-6 h-6" />
                  Start Designing Now
                </button>
              </HoverWrapper>
            </motion.div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
