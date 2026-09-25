"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { useProducts } from "./ProductContext.jsx";
import { useSlider } from "../contexts/SliderContext.jsx";
import { readStorage, writeStorage } from "../utils/storage";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";
import DesignerCard from "./DesignerCard.jsx";

import { useAuthCheck } from "../hooks/useAuthCheck";
import HoverWrapper from "./common/HoverWrapper.jsx";

const ScrollIndicator = ({ sections, activeSection }) => {
  const scrollToSection = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) window.scrollTo({ top: el.offsetTop - 100, behavior: "smooth" });
  };
  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col space-y-4">
      {sections.map((s, i) => (
        <motion.button
          key={s.id}
          onClick={() => scrollToSection(s.id)}
          className="w-4 h-4 rounded-full border-2"
          whileHover={{ scale: 1.15 }}
          transition={{ duration: 0.2 }}
          style={{
            borderColor:
              i === activeSection
                ? "var(--primary-green)"
                : "rgba(156,163,175,.6)",
            background:
              i === activeSection
                ? "linear-gradient(90deg, var(--primary-green), var(--dark-green))"
                : "rgba(243,244,246,.6)",
            boxShadow:
              i === activeSection ? "0 0 12px rgba(16,185,129,.4)" : "none",
          }}
          aria-label={s.label}
          title={s.label}
        />
      ))}
    </div>
  );
};

import { useNavigate } from "react-router-dom";
import DesignerSearchBox from "./DesignerSearchBox.jsx";

const normalizeBrand = (p) =>
  (
    p?.sellerName ||
    p?.brandName ||
    p?.wardrobeName ||
    p?.originalBrand ||
    "Unknown Brand"
  )
    .toString()
    .trim();

export default function DesignerPage() {
  const { designerProducts } = useProducts();
  const navigate = useNavigate();
  const { checkAuth } = useAuthCheck();

  // Compute full designers list like in Hub
  const designers = useMemo(() => {
    const map = new Map();
    (designerProducts || []).forEach((p) => {
      const name = normalizeBrand(p);
      map.set(name, (map.get(name) || 0) + 1);
    });
    const arr = Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // We don't necessarily need "All" here for the search box if we want pure navigation
    // but the search box component likes it. We can treat "All" as just a label or ignore selection.
    // For navigation purposes, selecting "All" could go to Hub with no filter.
    return [{ name: "All Designers", count: designerProducts.length }, ...arr];
  }, [designerProducts]);

  const handleDesignerSelect = (name) => {
    if (name === "All Designers") {
      navigate("/designer-hub");
    } else {
      navigate(`/designer-hub?d=${encodeURIComponent(name)}`);
    }
  };

  const [wishlist, setWishlist] = useState([]);
  const [cart, setCart] = useState([]);

  const [activeSection, setActiveSection] = useState(0);

  // Use global slider context
  const { images, currentImage } = useSlider();

  // one card per unique designer (keep newest)
  const normalizeDesigner = (p) =>
    (
      p.sellerName ||
      p.brandName ||
      p.wardrobeName ||
      p.originalBrand ||
      "Unknown Brand"
    )
      .toString()
      .trim()
      .toLowerCase();

  const timeScore = (p) =>
    (p.updatedAt && Date.parse(p.updatedAt)) ||
    (p.createdAt && Date.parse(p.createdAt)) ||
    (typeof p.createdAtMs === "number" && p.createdAtMs) ||
    0;

  const displayedProducts = useMemo(() => {
    const map = new Map();
    (designerProducts || []).forEach((p) => {
      const key = normalizeDesigner(p);
      const prev = map.get(key);
      if (!prev || timeScore(p) > timeScore(prev)) map.set(key, p);
    });
    return Array.from(map.values()).sort((a, b) => timeScore(b) - timeScore(a));
  }, [designerProducts]);

  const sections = [
    { id: "hero-section", label: "Home" },
    { id: "products-section", label: "Products" },
    { id: "cta-section", label: "Join Us" },
  ];

  const heroRef = useRef(null);
  const productsRef = useRef(null);
  const ctaRef = useRef(null);

  // Timer now managed by global SliderContext - no local timer needed

  useEffect(() => {
    setCart(readStorage("cart"));

    // Only load wishlist if user is logged in
    const token = localStorage.getItem("token");
    if (token) {
      setWishlist(readStorage("wishlist"));
    } else {
      setWishlist([]); // Clear wishlist if logged out
    }
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const pos = window.scrollY + 200;
      const list = [
        { ref: heroRef, i: 0 },
        { ref: productsRef, i: 1 },
        { ref: ctaRef, i: 2 },
      ];
      for (let k = list.length - 1; k >= 0; k--) {
        const r = list[k].ref.current;
        if (!r) continue;
        const top = r.offsetTop,
          bottom = top + r.offsetHeight;
        if (pos >= top && pos < bottom) {
          setActiveSection(list[k].i);
          break;
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isInWishlist = (id) =>
    wishlist.some((w) => String(w.id || w._id) === String(id));
  const toggleWishlist = (item) => {
    // Check if user is logged in
    if (!checkAuth("add to wishlist")) {
      return;
    }

    const itemId = item.id || item._id;
    const next = isInWishlist(itemId)
      ? wishlist.filter((w) => String(w.id || w._id) !== String(itemId))
      : [...wishlist, item];
    setWishlist(next);
    writeStorage("wishlist", next);
  };

  const uniqueDesignerCount = displayedProducts.length;

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-x-hidden">
      <Header />

      <ScrollIndicator sections={sections} activeSection={activeSection} />

      {/* HERO */}
      <section id="hero-section" ref={heroRef}>
        <HoverWrapper
          className="relative text-white min-h-[600px] lg:h-[800px]"
          background={
            <>
              {images.map((img, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 bg-cover bg-no-repeat transition-opacity duration-1000 ease-in-out ${
                    index === currentImage ? "opacity-100" : "opacity-0"
                  }`}
                  style={{
                    backgroundImage: `url('${img}')`,
                    backgroundPosition: "center center",
                  }}
                />
              ))}
              <div className="absolute inset-0 bg-black/50" />
            </>
          }
        >
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-60 text-center">
            <div className="max-w-4xl mx-auto">
              <motion.h1
                className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                Discover Unique Designer Creations
              </motion.h1>
              <motion.p
                className="text-base sm:text-lg lg:text-xl text-white mb-8 leading-relaxed max-w-3xl mx-auto"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                Exclusive pieces directly from emerging designers.
              </motion.p>

              <motion.button
                onClick={() => {
                  const el = document.getElementById("products-section");
                  if (el)
                    window.scrollTo({
                      top: el.offsetTop - 100,
                      behavior: "smooth",
                    });
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="bg-gradient-to-r from-[var(--primary-green)] to-[var(--dark-green)] hover:from-[var(--dark-green)] hover:to-[var(--primary-green)] text-white px-8 py-4 rounded-full text-lg font-semibold shadow-none border-none outline-none transition-all duration-300 mb-12"
              >
                Explore Designers
              </motion.button>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            onClick={() => {
              const el = document.getElementById("products-section");
              if (el)
                window.scrollTo({
                  top: el.offsetTop - 100,
                  behavior: "smooth",
                });
            }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 cursor-pointer z-20"
          >
            <div className="w-9 h-9 rounded-full bg-gray-800/20 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </div>
          </motion.div>
        </HoverWrapper>
      </section>
      {/* PRODUCTS */}
      <section
        id="products-section"
        ref={productsRef}
        className="py-16 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <div>
              <motion.h2 className="text-3xl font-bold text-gray-900 mb-4">
                Designer Collections
              </motion.h2>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <p className="text-gray-600">
                  {uniqueDesignerCount > 0
                    ? `${uniqueDesignerCount} Designers`
                    : "No Designer Products Available Yet"}
                </p>
                <div className="hidden sm:block w-px h-6 bg-gray-300"></div>
                <DesignerSearchBox
                  designers={designers}
                  active=""
                  onChange={() => {}}
                  onSelect={handleDesignerSelect}
                />
              </div>
            </div>
            <div className="text-right space-y-1">
              <div className="text-sm text-gray-500">
                Wishlist: {wishlist.length}
              </div>
              <div className="text-sm text-gray-500">Cart: {cart.length}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {displayedProducts.map((p, i) => (
              <motion.div
                key={p.id || p._id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.06 }}
                viewport={{ once: true }}
              >
                <DesignerCard
                  product={p}
                  isLiked={isInWishlist(p.id || p._id)}
                  onToggleWishlist={toggleWishlist}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      {/* CTA */}
      <section id="cta-section" ref={ctaRef}>
        <HoverWrapper className="py-16 bg-gray-900 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.h2 className="text-3xl font-bold mb-6">
              Ready To Start Selling?
            </motion.h2>
            <motion.p className="text-lg mb-8 text-gray-300">
              Join thousands of designers who trust Buy2Sell to turn their
              luxury wardrobes into profit.
            </motion.p>
            <motion.a
              href="/Designer-Signup"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[var(--primary-green)] to-[var(--dark-green)] hover:from-[var(--dark-green)] hover:to-[var(--primary-green)] text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Join As Designer
            </motion.a>
          </div>
        </HoverWrapper>
      </section>

      <br />
      <Footer />
    </div>
  );
}
