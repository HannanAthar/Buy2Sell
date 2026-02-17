// HomePage.jsx
"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";
import Buy2SellChatbot from "./Buy2SellChatbot.jsx";
import { motion, AnimatePresence } from "framer-motion"; // eslint-disable-line no-unused-vars
import { useProducts } from "./ProductContext.jsx";
import { useSlider } from "../contexts/SliderContext.jsx";
import { Link } from "react-router-dom";
import { readStorage, writeStorage } from "../utils/storage";
import { useAuthCheck } from "../hooks/useAuthCheck";

import { Suspense, lazy } from "react";
import React from "react"; // Ensure React is imported for lazy
import CardSkeleton from "./common/CardSkeleton.jsx";

const ResellerCard = lazy(() => import("./ResellerCard.jsx"));
const DesignerCard = lazy(() => import("./DesignerCard.jsx"));
const StudioProductCard = lazy(() => import("./CustomYourStyle/ProductCard.jsx"));
import HoverImageContainer from "./common/HoverImageContainer.jsx";
import HoverWrapper from "./common/HoverWrapper.jsx";
import CloudinaryImage from "./common/CloudinaryImage.jsx";
import { getOptimizedImageUrl } from "../utils/cloudinaryUtils";

const throttleFn = (func, limit) => {
  let inThrottle;
  return function () {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

const ScrollIndicator = ({ sections, activeSection }) => {
  const scrollToSection = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      const offsetTop = el.offsetTop - 100;
      window.scrollTo({ top: offsetTop, behavior: "smooth" });
    }
  };
  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col space-y-4">
      {sections.map((section, index) => (
        <motion.div
          key={section.id}
          className="group relative cursor-pointer flex items-center"
          onClick={() => scrollToSection(section.id)}
          whileHover={{ scale: 1.15 }}
          transition={{ duration: 0.3 }}
        >
          <div
            className={`absolute right-8 top-1/2 -translate-y-1/2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 whitespace-nowrap pointer-events-none border ${
              activeSection === index
                ? "bg-gradient-to-r from-[var(--primary-green)] to-[var(--dark-green)] text-white opacity-100 translate-x-0 shadow-xl border-[var(--primary-green)]"
                : "bg-gray-800 text-white opacity-0 translate-x-6 group-hover:opacity-100 group-hover:translate-x-0 border-gray-600"
            }`}
          >
            {section.label}
          </div>
          <div
            className={`w-4 h-4 rounded-full border-2 transition-all duration-300 relative ${
              activeSection === index
                ? "bg-gradient-to-r from-[var(--primary-green)] to-[var(--dark-green)] border-[var(--primary-green)] shadow-lg shadow-[var(--primary-green)]/40 scale-110"
                : "bg-gray-100/60 border-gray-400/60 hover:border-[var(--primary-green)]/70 hover:shadow-md hover:bg-[var(--emerald-50)]/80"
            }`}
          >
            <div
              className={`absolute inset-1 rounded-full transition-all duration-300 ${
                activeSection === index
                  ? "bg-white opacity-40"
                  : "bg-gray-300/40 opacity-60"
              }`}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// HubCard component for touch-friendly flip animation
const HubCard = ({ hub }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className="group h-[350px] perspective-1000"
      onClick={() => setIsFlipped(!isFlipped)}
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
    >
      <div
        className={`flip-card w-full h-full relative cursor-pointer ${
          isFlipped ? "flipped" : ""
        }`}
      >
        <div className="flip-card-inner w-full h-full shadow-md rounded-xl">
          {/* Front Face: Image + Title */}
          <div className="flip-card-front absolute inset-0 w-full h-full rounded-xl overflow-hidden bg-white">
            <div className="relative w-full h-full">
              <CloudinaryImage
                src={hub.image}
                alt={hub.name}
                className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300"></div>
              <div className="absolute bottom-0 left-0 w-full p-6 text-center bg-gradient-to-t from-black/70 to-transparent">
                <h3 className="text-xl font-semibold text-white mb-1 shadow-sm">
                  {hub.name}
                </h3>
              </div>
            </div>
          </div>

          {/* Back Face: Details + Button */}
          <div className="flip-card-back absolute inset-0 w-full h-full rounded-xl overflow-hidden bg-white p-6 flex flex-col items-center justify-center text-center transform rotate-y-180 border border-gray-100 shadow-xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {hub.name}
            </h3>
            <p className="text-gray-600 text-sm mb-6 line-clamp-3">
              {hub.description}
            </p>
            <a
              href={hub.link}
              className="inline-block px-6 py-2 bg-gradient-to-r from-[var(--primary-green)] to-[var(--dark-green)] text-white font-medium rounded-lg shadow hover:shadow-lg transition-all hover:scale-105"
            >
              Explore
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

// ...

const HomePage = () => {
  const { designerProducts, resellerProducts } = useProducts();
  const { checkAuth } = useAuthCheck();

  // ... (featuredDesigners memo) ... same ...
  const featuredDesigners = useMemo(() => {
    const map = new Map();
    for (const p of designerProducts) {
      const brand = (
        p.sellerName ||
        p.brandName ||
        p.wardrobeName ||
        p.originalBrand ||
        "Unknown Brand"
      ).trim();
      if (!map.has(brand)) map.set(brand, p);
      if (map.size >= 4) break;
    }
    return Array.from(map.values());
  }, [designerProducts]);

  console.log("HomePage featuredDesigners:", featuredDesigners);
  console.log("HomePage resellerProducts (slice):", resellerProducts?.slice(0, 4));

  const [wishlist, setWishlist] = useState([]);
  const [customProducts, setCustomProducts] = useState([]);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);
    setWishlist(readStorage("wishlist"));

    // Fetch custom products
    const fetchCustomProducts = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/custom-products/featured"
        );
        const data = await response.json();
        if (data.success && data.products) {
          setCustomProducts(data.products);
        }
      } catch (error) {
        console.error("Failed to fetch custom products:", error);
      }
    };

    fetchCustomProducts();
  }, []);
  const getProdId = (p) => p.id || p._id;

  const isInWishlist = (id) => {
    if (!id) return false;
    return wishlist.some((w) => String(getProdId(w)) === String(id));
  };

  const toggleWishlist = (product) => {
    // Check if user is logged in
    if (!checkAuth("add to wishlist")) {
      return;
    }

    const pid = getProdId(product);
    if (!pid) return;

    const next = isInWishlist(pid)
      ? wishlist.filter((w) => String(getProdId(w)) !== String(pid))
      : [...wishlist, product];

    setWishlist(next);
    writeStorage("wishlist", next);
  };

  const hubs = [
    {
      name: "Designers",
      image: "/12.webp",
      hoverImage: "/3.webp",
      link: "/designers",
      description: "Connect and discover exclusive collections",
    },
    {
      name: "Resellers",
      image: "/20.webp",
      hoverImage: "/22.jpg",
      link: "/reseller",
      description: "Explore authenticated pre-loved luxury items",
    },
    {
      name: "Custom Clothes",
      image: "/33.jpg",
      hoverImage: "/34.webp",
      link: "/designer-tool",
      description: "Design and personalize your own clothes",
    },
  ];

  // Use global slider context
  const { images, currentImage } = useSlider();
  const [activeSection, setActiveSection] = useState(0);
  const sections = [
    { id: "hero-section", label: "Home" },
    { id: "discover-section", label: "Discover" },
    { id: "featured-designers", label: "Designers" },
    { id: "featured-resellers", label: "Resellers" },
    { id: "featured-custom", label: "Custom" },
    { id: "trust-section", label: "Why Us" },
    { id: "footer-section", label: "Contact" },
  ];

  const heroRef = useRef(null);
  const discoverRef = useRef(null);
  const featuredRef = useRef(null);
  const featuredResellersRef = useRef(null);
  const customRef = useRef(null);
  const trustRef = useRef(null);
  const footerRef = useRef(null);

  const [trustVisible, setTrustVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => setTrustVisible(e.isIntersecting),
      { threshold: 0.2 }
    );
    if (trustRef.current) obs.observe(trustRef.current);
    return () => obs.disconnect();
  }, []);

  // useEffect(() => {
  //   const lenis = new Lenis({
  //     duration: 1.2,
  //     smooth: true,
  //     direction: "vertical",
  //     gestureDirection: "vertical",
  //     smoothWheel: true,
  //     smoothTouch: false,
  //     easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  //   })
  //   const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf) }
  //   requestAnimationFrame(raf)
  //   return () => lenis.destroy()
  // }, [])

  // Timer now managed by global SliderContext - no local timer needed

  useEffect(() => {
    const SECTIONS = [
      { ref: heroRef, index: 0 },
      { ref: discoverRef, index: 1 },
      { ref: featuredRef, index: 2 },
      { ref: featuredResellersRef, index: 3 },
      { ref: customRef, index: 4 },
      { ref: trustRef, index: 5 },
      { ref: footerRef, index: 6 },
    ];
    const pickActive = throttleFn(() => {
      const mid = window.innerHeight / 2;
      let active = 0;
      for (let i = 0; i < SECTIONS.length; i++) {
        const el = SECTIONS[i].ref.current;
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= mid && rect.bottom >= mid) {
          active = SECTIONS[i].index;
          break;
        }
      }
      setActiveSection(active);
    }, 100);
    window.addEventListener("scroll", pickActive, { passive: true });
    window.addEventListener("resize", pickActive);
    pickActive();
    return () => {
      window.removeEventListener("scroll", pickActive);
      window.removeEventListener("resize", pickActive);
    };
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-x-hidden">
      <Header />

      <ScrollIndicator sections={sections} activeSection={activeSection} />

      <section
        id="hero-section"
        ref={heroRef}
        className="relative text-white min-h-[600px] lg:h-[800px]"
        onMouseMove={(e) => {
          if (!heroRef.current) return;
          const rect = heroRef.current.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          e.currentTarget.style.setProperty("--mouse-x", `${x}%`);
          e.currentTarget.style.setProperty("--mouse-y", `${y}%`);
          e.currentTarget.style.setProperty("--opacity", "0.8");
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.setProperty("--opacity", "0");
        }}
      >
        {/* 1. Background Images Layer (Bottom, z-0) */}
        <div className="absolute inset-0 w-full h-full z-0">

          {images.map((img, index) => (
            <div
              key={index}
              className={`absolute inset-0 bg-cover bg-no-repeat transition-opacity duration-700 ease-in-out ${
                index === currentImage ? "opacity-100" : "opacity-0"
              }`}
              style={{
                backgroundImage: `url('${getOptimizedImageUrl(img, 1920)}')`, // Optimize hero images
                backgroundPosition: "center center",
              }}
            />
          ))}
          {/* Dark Overlay (z-10) */}
          <div className="absolute inset-0 bg-black/50 z-10 pointer-events-none"></div>
        </div>

        {/* 2. Hover Effect Layer (Middle, z-20) - PURE VISUAL */}
        <div className="hover-layer" />

        {/* 3. Text/Content Layer (Top, z-30) */}
        {/* 3. Text/Content Layer (Top, z-30) */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-60 text-center">
          <div className="max-w-4xl mx-auto">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6 text-white"
            >
              WELCOME TO BUY2SELL
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-base sm:text-lg lg:text-xl text-white mb-8 leading-relaxed max-w-3xl mx-auto"
            >
              Discover A World Of Luxury Fashion. Connect With Pre-Loved Market
              and Top Designers And Explore Unique Styles That Elevate Your
              Wardrobe.
            </motion.p>

            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => scrollToSection("discover-section")}
              className="bg-gradient-to-r from-[var(--primary-green)] to-[var(--dark-green)] text-white px-8 py-4 rounded-full text-lg font-semibold shadow-xl transition-all mb-12"
            >
              Explore Collection
            </motion.button>
          </div>
        </div>

        <div
          onClick={() => scrollToSection("discover-section")}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 cursor-pointer z-20 animate-bounce-subtle"
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
        </div>
      </section>

      {/* DISCOVER */}
      <section
        id="discover-section"
        ref={discoverRef}
        className="py-20 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="relative inline-block">
              <h2
                className="text-3xl lg:text-4xl font-bold text-white uppercase tracking-wide relative z-10 px-8 py-3"
                style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.3)" }}
              >
                <span className="relative">
                  <span className="absolute -inset-1 -skew-x-3 bg-red-600 rounded-lg -z-10"></span>
                  Discover & Shop
                </span>
              </h2>
            </div>
            <p className="text-gray-600 text-lg mt-4">
              Join our community and explore luxury categories
            </p>
          </div>

          <motion.div
            className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-8 discover-grid"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.2,
                },
              },
            }}
          >
            {hubs.map((hub, i) => (
              <motion.div
                key={i}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  show: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.5 }}
              >
                <HubCard hub={hub} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* DESIGNERS */}
      <section
        id="featured-designers"
        ref={featuredRef}
        className="py-10 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8 flex flex-col items-center justify-center text-center space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Explore Our Designers
            </h2>
            <Link
              to="/designers"
              className="text-[var(--dark-green)] hover:text-[var(--primary-green)] font-semibold"
            >
              View all →
            </Link>
          </div>

          <motion.div
            className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6"
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
            {featuredDesigners.map((p) => (
              <motion.div
                key={p.id || p._id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.4 }}
              >
                <Suspense fallback={<CardSkeleton />}>
                  <DesignerCard
                    product={p}
                    isLiked={isInWishlist(p.id || p._id)}
                    onToggleWishlist={toggleWishlist}
                  />
                </Suspense>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* RESELLERS */}
      <section
        id="featured-resellers"
        ref={featuredResellersRef}
        className="py-10 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8 flex flex-col items-center justify-center text-center space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Explore Our Resellers
            </h2>
            <Link
              to="/reseller"
              className="text-[var(--dark-green)] hover:text-[var(--primary-green)] font-semibold"
            >
              View all →
            </Link>
          </div>

          <motion.div
            className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6"
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
            {(Array.isArray(resellerProducts)
              ? resellerProducts.slice(0, 4)
              : []
            ).map((p) => (
              <motion.div
                key={p.id || p._id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.4 }}
              >
                <Suspense fallback={<CardSkeleton />}>
                  <ResellerCard
                    product={p}
                    isLiked={isInWishlist(p.id || p._id)}
                    onToggleWishlist={toggleWishlist}
                  />
                </Suspense>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CUSTOM */}
      <section id="featured-custom" ref={customRef} className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8 flex flex-col items-center justify-center text-center space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Custom Your Style
            </h2>
            <Link
              to="/custom-products"
              className="text-[var(--dark-green)] hover:text-[var(--primary-green)] font-semibold"
            >
              View all →
            </Link>
          </div>

          <motion.div
            className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6"
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
            {customProducts.map((g) => {
              // Helper to get image URL
              const getImageUrl = (path) => {
                if (!path) return "/placeholder.svg";
                if (path.startsWith("http") || path.startsWith("data:")) return path;
                if (path.startsWith("/uploads/")) return `http://localhost:5000${path}`;
                if (!path.startsWith("/") && (path.includes("/") || path.length > 5)) {
                    return `https://res.cloudinary.com/dnnkoqxct/image/upload/${path}`;
                }
                return `http://localhost:5000/${path}`;
              };

              // Adapt custom product to StudioProductCard format
              const item = {
                id: g._id || g.id,
                name: g.name,
                price: g.price || 0,
                front: getImageUrl(g.images?.[0]),
                back: getImageUrl(g.images?.[1]),
                // Pass size info to avoid default "All Sizes" fallback in Detail Page
                sizes: g.sizes || g.size || g.availableSizes || [],
                sizeOptions: g.sizeOptions || [],
              };

              return (
                <motion.div
                  key={item.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0 },
                  }}
                  transition={{ duration: 0.4 }}
                >
                  <Suspense fallback={<CardSkeleton />}>
                    <StudioProductCard
                      item={item}
                      isLiked={isInWishlist(`custom-${item.id}`)}
                      onToggleWishlist={toggleWishlist}
                      loading="lazy"
                    />
                  </Suspense>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* WHY US */}
      <section id="trust-section" ref={trustRef}>
        <HoverWrapper
          imageSrc="8.webp"
          className="relative min-h-screen flex flex-col items-center justify-center text-center text-white"
        >
          {/* Removed bg-black/40 overlay as requested */}
          <div
            className={`relative w-full py-20 transition-opacity duration-1000 ease-in-out homepage-text-fix ${
              trustVisible ? "opacity-100" : "opacity-80"
            }`}
          >
            <div className="center-container border-none shadow-none outline-none">
              <h2
                className={`text-4xl lg:text-5xl font-bold mb-8 text-center mx-auto ${
                  trustVisible ? "animate-fade-in-up" : "opacity-0"
                }`}
              >
                Why Choose Buy2Sell?
              </h2>
              <p
                className={`text-lg lg:text-xl text-white mb-8 leading-relaxed text-center mx-auto max-w-6xl ${
                  trustVisible ? "animate-fade-in-up delay-200" : "opacity-0"
                }`}
              >
                Experience Secure Transactions With Our Escrow Payment System And Thorough Admin Verification,
                <br className="hidden md:block" /> Ensuring A Safe Shopping Environment For All Users.
              </p>
              <div className="flex justify-center w-full">
                <a
                  href="/learn-more"
                  className={`inline-block bg-gradient-to-r from-[var(--primary-green)] to-[var(--dark-green)] hover:from-[var(--dark-green)] hover:to-[var(--primary-green)] text-white px-8 py-4 rounded-full text-lg font-semibold shadow-none border-none outline-none ${
                    trustVisible ? "animate-fade-in-up delay-400" : "opacity-0"
                  }`}
                >
                  Learn More
                </a>
              </div>
            </div>
          </div>
        </HoverWrapper>
      </section>
      <br />

      <div id="footer-section" ref={footerRef}>
        <Buy2SellChatbot />
        <Footer />
      </div>
    </div>
  );
};

export default HomePage;
