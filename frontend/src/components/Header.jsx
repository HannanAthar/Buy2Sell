// Header.jsx
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  User,
  Menu,
  X,
  Shirt,
  LogOut,
  LayoutDashboard,
  ShoppingCart,
  ChevronDown,
  Settings,
  Heart,
} from "lucide-react";
import { readStorage, getStorageKey } from "../utils/storage";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false); // NEW: Mobile search state
  const [searchQuery, setSearchQuery] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [cartBump, setCartBump] = useState(false);
  const [wishlistBump, setWishlistBump] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Categories
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isCategoriesOpenMobile, setIsCategoriesOpenMobile] = useState(false);
  const catRef = useRef(null);
  const userMenuRef = useRef(null);
  const closeTimer = useRef(null);

  // NEW: dropdown state for Designer & Pre-Loved
  const [isDesignerMenuOpen, setIsDesignerMenuOpen] = useState(false);
  const [isResellerMenuOpen, setIsResellerMenuOpen] = useState(false);
  const designerRef = useRef(null);
  const resellerRef = useRef(null);

  // NEW: separate timers for smoother hover
  const designerTimer = useRef(null);
  const resellerTimer = useRef(null);

  // NEW: State for mobile menu dropdows
  const [mobileMenuState, setMobileMenuState] = useState({
    designers: false,
    resellers: false,
  });

  const toggleMobileSubmenu = (menu) => {
    setMobileMenuState((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));
  };

  const checkUser = () => {
    try {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");

      let user = null;
      if (role === "designer") {
        user = JSON.parse(localStorage.getItem("designer") || "null");
      } else if (role === "reseller") {
        user = JSON.parse(localStorage.getItem("reseller") || "null");
      } else {
        user = JSON.parse(localStorage.getItem("buyer") || "null");
      }

      setUserInfo(token ? { role, user } : null);
    } catch {
      setUserInfo(null);
    }
  };

  const updateCounts = () => {
    const c = readStorage("cart");
    const cCount = c.reduce(
      (sum, item) => sum + (Number(item.quantity) || 1),
      0
    );
    if (cCount !== cartCount) {
      setCartBump(true);
      setTimeout(() => setCartBump(false), 300);
    }
    setCartCount(cCount);

    const w = readStorage("wishlist");
    if (w.length !== wishlistCount) {
      setWishlistBump(true);
      setTimeout(() => setWishlistBump(false), 300);
    }
    setWishlistCount(w.length);
  };

  // hydrate state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("userInfo");
    if (stored) {
      setUserInfo(JSON.parse(stored));
    }

    // Initial load
    checkUser();
    updateCounts();

    const handleStorage = (e) => {
      // Check if the changed key matches our current user's keys
      if (
        e.key === getStorageKey("cart") ||
        e.key === getStorageKey("wishlist")
      ) {
        updateCounts();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("cartUpdated", updateCounts);
    window.addEventListener("wishlistUpdated", updateCounts);

    // Also listen for login/logout to refresh keys
    const handleAuthChange = () => {
      checkUser();
      updateCounts();
    };
    window.addEventListener("authUpdated", handleAuthChange); // Assuming we discard customs in future?
    // Actually simpler: just re-run updateCounts() periodically or when notified?
    // We can rely on cartUpdated being fired after login if we handle it there, but better to be reactive.

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("cartUpdated", updateCounts);
      window.removeEventListener("wishlistUpdated", updateCounts);
      window.removeEventListener("authUpdated", handleAuthChange);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally run once on mount - updateCounts is stable

  // Removed checkCart - using updateCounts instead

  // Removed checkWishlist - using updateCounts instead

  const isLoggedIn = !!userInfo;

  const getDashboardLink = (tab = "") => {
    const base = (() => {
      switch (userInfo?.role) {
        case "designer":
          return "/designer/dashboard";
        case "reseller":
          return "/reseller/dashboard";
        default:
          return "/buyer-dashboard";
      }
    })();
    return tab ? base : base; // Use tab to avoid unused warning
  };

  const getRoleLabel = () => {
    switch (userInfo?.role) {
      case "designer":
        return "Designer";
      case "reseller":
        return "Reseller";
      case "buyer":
        return "Buyer";
      default:
        return "User";
    }
  };

  const handleLogout = () => {
    // Clear user auth data
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("buyer");
    localStorage.removeItem("designer");
    localStorage.removeItem("reseller");

    // Clear cart and wishlist
    localStorage.removeItem("cart");
    localStorage.removeItem("wishlist");

    setUserInfo(null);
    setCartCount(0);
    setWishlistCount(0);
    window.location.href = "/";
  };

  // Close menus on outside click (user & categories & new dropdowns)
  useEffect(() => {
    const onClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
      if (catRef.current && !catRef.current.contains(e.target)) {
        setIsCategoriesOpen(false);
      }
      if (designerRef.current && !designerRef.current.contains(e.target)) {
        setIsDesignerMenuOpen(false);
      }
      if (resellerRef.current && !resellerRef.current.contains(e.target)) {
        setIsResellerMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // ===== Categories hover logic (unchanged) =====
  const openCats = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setIsCategoriesOpen(true);
  };
  const closeCatsWithDelay = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setIsCategoriesOpen(false), 120); // anti-flicker
  };

  const onCatKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsCategoriesOpen((v) => !v);
    }
    if (e.key === "Escape") setIsCategoriesOpen(false);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIsCategoriesOpen(true);
    }
  };

  // ===== NEW: Designer hover logic with delay & bridge =====
  const openDesigner = () => {
    if (designerTimer.current) {
      clearTimeout(designerTimer.current);
      designerTimer.current = null;
    }
    setIsDesignerMenuOpen(true);
  };

  const closeDesignerWithDelay = () => {
    if (designerTimer.current) clearTimeout(designerTimer.current);
    designerTimer.current = setTimeout(() => setIsDesignerMenuOpen(false), 120);
  };

  // ===== NEW: Reseller hover logic with delay & bridge =====
  const openReseller = () => {
    if (resellerTimer.current) {
      clearTimeout(resellerTimer.current);
      resellerTimer.current = null;
    }
    setIsResellerMenuOpen(true);
  };

  const closeResellerWithDelay = () => {
    if (resellerTimer.current) clearTimeout(resellerTimer.current);
    resellerTimer.current = setTimeout(() => setIsResellerMenuOpen(false), 120);
  };

  return (
    <header className="relative z-20 bg-white/95 backdrop-blur-md shadow-lg border-b border-green-100">
      <div className="w-full px-2 sm:px-4">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <a href="/" className="flex items-center group shrink-0">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-2 rounded-xl mr-2 sm:mr-3 shadow-lg group-hover:shadow-xl transition-all">
              <span className="text-white font-bold text-lg sm:text-xl leading-none">
                B2S
              </span>
            </div>
            <span className="text-xl sm:text-2xl font-bold text-gray-800 animate-pulse-subtle">
              <span className="text-green-500">Buy</span>
              <span className="text-gray-700">2</span>
              <span className="text-green-500">Sell</span>
            </span>
          </a>

          {/* Centered Menu (Desktop) - Tablet Fix: Whitespace nowrap & scroll if needed */}
          <nav className="hidden lg:flex items-center space-x-6 mx-auto whitespace-nowrap">
            {/* Designer Hub + dropdown */}
            <div
              className="relative flex items-center"
              ref={designerRef}
              onMouseEnter={openDesigner}
              onMouseLeave={closeDesignerWithDelay}
              onPointerEnter={openDesigner}
              onPointerLeave={closeDesignerWithDelay}
            >
              <span className="border-l border-gray-300 h-5 opacity-50"></span>
              <Link
                to="/designers"
                className="h-10 px-4 flex items-center justify-center text-gray-700 hover:text-green-500 text-sm font-medium relative group gap-1 transition-all nav-link-animated"
                aria-haspopup="true"
                aria-expanded={isDesignerMenuOpen}
              >
                Designer Hub
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    isDesignerMenuOpen ? "rotate-180" : ""
                  }`}
                />
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-500 transition-all group-hover:w-full" />
              </Link>

              {/* Invisible hover bridge to avoid gap */}
              <div className="absolute left-0 right-0 top-full h-2" />

              {/* Dropdown panel – only designer items */}
              <div
                className={`absolute top-full left-1/2 -translate-x-1/2 mt-3 w-56 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden z-50 transition-all duration-150 ${
                  isDesignerMenuOpen
                    ? "opacity-100 translate-y-1 pointer-events-auto"
                    : "opacity-0 -translate-y-1 pointer-events-none"
                }`}
              >
                <Link
                  to="/clothes?seller=designer"
                  className="block px-4 py-3 text-sm text-gray-700 hover:bg-green-50"
                  onClick={() => setIsDesignerMenuOpen(false)}
                >
                  Designer Clothes
                </Link>
                <Link
                  to="/shoes?seller=designer"
                  className="block px-4 py-3 text-sm text-gray-700 hover:bg-green-50"
                  onClick={() => setIsDesignerMenuOpen(false)}
                >
                  Designer Shoes
                </Link>
                <Link
                  to="/bags?seller=designer"
                  className="block px-4 py-3 text-sm text-gray-700 hover:bg-green-50"
                  onClick={() => setIsDesignerMenuOpen(false)}
                >
                  Designer Bags
                </Link>
              </div>

              <span className="border-l border-gray-300 h-5 opacity-50"></span>
            </div>

            {/* Pre-Loved Treasures (Reseller) + dropdown */}
            <div
              className="relative flex items-center"
              ref={resellerRef}
              onMouseEnter={openReseller}
              onMouseLeave={closeResellerWithDelay}
              onPointerEnter={openReseller}
              onPointerLeave={closeResellerWithDelay}
            >
              <span className="border-l border-gray-300 h-5 opacity-50"></span>
              <Link
                to="/reseller"
                className="h-10 px-4 flex items-center justify-center text-gray-700 hover:text-green-500 text-sm font-medium relative group gap-1 transition-all nav-link-animated"
                aria-haspopup="true"
                aria-expanded={isResellerMenuOpen}
              >
                Pre-Loved Treasures
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    isResellerMenuOpen ? "rotate-180" : ""
                  }`}
                />
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-500 transition-all group-hover:w-full" />
              </Link>

              {/* Invisible hover bridge to avoid gap */}
              <div className="absolute left-0 right-0 top-full h-2" />

              <div
                className={`absolute top-full left-1/2 -translate-x-1/2 mt-3 w-56 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden z-50 transition-all duration-150 ${
                  isResellerMenuOpen
                    ? "opacity-100 translate-y-1 pointer-events-auto"
                    : "opacity-0 -translate-y-1 pointer-events-none"
                }`}
              >
                <Link
                  to="/clothes?seller=reseller"
                  className="block px-4 py-3 text-sm text-gray-700 hover:bg-green-50"
                  onClick={() => setIsResellerMenuOpen(false)}
                >
                  Pre-loved Clothes
                </Link>
                <Link
                  to="/shoes?seller=reseller"
                  className="block px-4 py-3 text-sm text-gray-700 hover:bg-green-50"
                  onClick={() => setIsResellerMenuOpen(false)}
                >
                  Pre-loved Shoes
                </Link>
                <Link
                  to="/bags?seller=reseller"
                  className="block px-4 py-3 text-sm text-gray-700 hover:bg-green-50"
                  onClick={() => setIsResellerMenuOpen(false)}
                >
                  Pre-loved Bags
                </Link>
              </div>

              <span className="border-l border-gray-300 h-5 opacity-50"></span>
            </div>

            {/* Custom Clothes */}
            <div className="flex items-center">
              <span className="border-l border-gray-300 h-5 opacity-50"></span>
              <Link
                to="/custom-products"
                className="h-10 px-4 flex items-center justify-center text-gray-700 hover:text-green-500 text-sm font-medium relative group gap-1 transition-all nav-link-animated"
              >
                <Shirt className="w-4 h-4" />
                Custom Cloths
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-500 transition-all group-hover:w-full" />
              </Link>
              <span className="border-l border-gray-300 h-5 opacity-50"></span>
            </div>

            {/* ===== CATEGORIES (glitch-free) ===== */}
            <div
              className="relative flex items-center"
              ref={catRef}
              onMouseEnter={openCats}
              onMouseLeave={closeCatsWithDelay}
              onPointerEnter={openCats}
              onPointerLeave={closeCatsWithDelay}
            >
              <span className="border-l border-gray-300 h-5 opacity-50"></span>

              {/* Trigger */}
              <button
                type="button"
                className="h-10 px-4 flex items-center justify-center text-gray-700 hover:text-green-500 text-sm font-medium relative group gap-1 transition-all nav-link-animated"
                aria-haspopup="menu"
                aria-expanded={isCategoriesOpen}
                onClick={() => setIsCategoriesOpen((v) => !v)}
                onKeyDown={onCatKeyDown}
              >
                Categories
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    isCategoriesOpen ? "rotate-180" : ""
                  }`}
                />
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-500 transition-all group-hover:w-full" />
              </button>

              {/* Invisible hover bridge */}
              <div className="absolute left-0 right-0 top-full h-2" />

              {/* Panel */}
              <div
                role="menu"
                aria-label="Categories"
                className={`absolute top-full left-1/2 -translate-x-1/2 mt-3 w-52 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden z-50 transition-all duration-150 ${
                  isCategoriesOpen
                    ? "opacity-100 translate-y-1 pointer-events-auto"
                    : "opacity-0 -translate-y-1 pointer-events-none"
                }`}
              >
                <a
                  href="/clothes"
                  className="block px-4 py-3 text-sm text-gray-700 hover:bg-green-50"
                  role="menuitem"
                >
                  Clothes
                </a>
                <a
                  href="/bags"
                  className="block px-4 py-3 text-sm text-gray-700 hover:bg-green-50"
                >
                  Bags
                </a>
                <a
                  href="/shoes"
                  className="block px-4 py-3 text-sm text-gray-700 hover:bg-green-50"
                >
                  Shoes
                </a>
              </div>

              <span className="border-l border-gray-300 h-5 opacity-50"></span>
            </div>

            {/* Contact */}
            <div className="flex items-center">
              <span className="border-l border-gray-300 h-5 opacity-50"></span>
              <a
                href="/contact"
                className="h-10 px-4 flex items-center justify-center text-gray-700 hover:text-green-500 text-sm font-medium relative group gap-1 transition-all nav-link-animated"
              >
                Contact Us
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-500 transition-all group-hover:w-full" />
              </a>
              <span className="border-l border-gray-300 h-5 opacity-50"></span>
            </div>
          </nav>

          {/* Right edge actions - Mobile Icon Fix: Flex nowrap and gap */}
          <div className="flex items-center gap-2 sm:gap-3 pl-1 sm:pl-2 pr-1 sm:pr-2 flex-nowrap shrink-0">
            {/* Search Bar */}
            {/* Search Bar - Desktop */}
            <div className="hidden sm:block">
              <div className="search-wrapper w-32 lg:w-48 h-10">
                <div className="glow-effect"></div>
                <div className="search-box">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!searchQuery.trim()) return;
                      const q = searchQuery.toLowerCase();

                      if (
                        q.includes("custom shirt") ||
                        q.includes("custom shirts")
                      )
                        window.location.href = "/designer-tool";
                      else
                        window.location.href = `/search?q=${encodeURIComponent(
                          q
                        )}`;
                    }}
                    className="flex items-center w-full h-full px-3 bg-transparent"
                  >
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search"
                      className="w-full bg-transparent border-none text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-green-100 transition-colors shrink-0"
                    >
                      <Search className="w-4 h-4 text-gray-500" />
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Logged In Icons */}
            {/* NEW: Mobile Search Toggle (Static Flex Item) */}
            <button
              onClick={() => setIsMobileSearchOpen((v) => !v)}
              className="lg:hidden p-2 rounded-full text-gray-600 hover:bg-green-50 min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
              aria-label="Toggle search"
            >
              <Search className="w-5 h-5" />
            </button>

            {isLoggedIn && (
              <>
                <Link
                  to="/cart"
                  className={`relative p-2 rounded-full hover:bg-green-50 text-gray-600 transition-colors ${
                    cartBump ? "animate-bounce-subtle text-green-600" : ""
                  }`}
                  title="Cart"
                >
                  <ShoppingCart className="w-6 h-6" />
                  {cartCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full min-w-[18px] h-[18px]">
                      {cartCount}
                    </span>
                  )}
                </Link>

                {/* Wishlist Icon */}
                <Link
                  to="/wishlist"
                  className={`relative p-2 rounded-full hover:bg-green-50 text-gray-600 transition-colors ${
                    wishlistBump ? "animate-bounce-subtle text-red-500" : ""
                  }`}
                  title="Wishlist"
                >
                  <Heart className="w-6 h-6" />
                  {wishlistCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full min-w-[18px] h-[18px]">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
              </>
            )}

            {/* Mobile Icons Separation Fix */}
            {/* User / Login */}
            <div className="flex items-center gap-4 sm:gap-6 shrink-0 flex-nowrap">
              {isLoggedIn ? (
                <>
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setIsUserMenuOpen((v) => !v)}
                      className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-green-50 text-gray-700 border border-transparent hover:border-green-200 transition-all"
                      aria-haspopup="menu"
                      aria-expanded={isUserMenuOpen}
                      aria-label="User menu"
                    >
                      <User className="w-6 h-6 text-green-600" />
                    </button>

                    {isUserMenuOpen && (
                      <div
                        role="menu"
                        className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden z-50 transform origin-top-right transition-all"
                      >
                        <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
                          <div className="overflow-hidden">
                            <p className="text-sm font-bold text-gray-900 truncate">
                              {userInfo?.user?.name ||
                                userInfo?.user?.fullName ||
                                userInfo?.user?.displayName ||
                                "User"}
                            </p>
                            <p className="text-xs text-green-600 font-medium uppercase tracking-wide">
                              {getRoleLabel()}
                            </p>
                          </div>
                          <a
                            href="/settings"
                            className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 p-1.5 rounded-full transition-colors"
                            title="Settings"
                          >
                            <Settings className="w-4 h-4" />
                          </a>
                        </div>
                        <a
                          href={getDashboardLink()}
                          className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-green-50 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4" /> Dashboard
                        </a>
                        {/* Cart link removed as requested */}
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
                        >
                          <LogOut className="w-4 h-4" /> Logout
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <a
                    href="/Login"
                    className="h-10 px-6 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center"
                  >
                    Login
                  </a>
                </>
              )}
            </div>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setIsMobileMenuOpen((v) => !v)}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-green-50 min-h-[44px] min-w-[44px] flex items-center justify-center" // Touch target fix
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar (Expandable) */}
        {isMobileSearchOpen && (
          <div className="lg:hidden px-2 pb-3 pt-1 animate-fade-in-down">
            <div className="search-wrapper w-full h-12">
              <div className="glow-effect"></div>
              <div className="search-box">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!searchQuery.trim()) return;
                    const q = searchQuery.toLowerCase();
                    if (
                      q.includes("custom shirt") ||
                      q.includes("custom shirts")
                    )
                      window.location.href = "/designer-tool";
                    else
                      window.location.href = `/search?q=${encodeURIComponent(
                        q
                      )}`;
                    setIsMobileSearchOpen(false);
                  }}
                  className="flex items-center w-full h-full px-3 bg-transparent"
                >
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="flex-1 bg-transparent border-none text-base text-gray-700 placeholder-gray-400 focus:outline-none" // text-base for iOS zoom prevention
                  />
                  <button
                    type="submit"
                    className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-green-100 transition-colors shrink-0"
                  >
                    <Search className="w-5 h-5 text-gray-500" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile menu panel */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute inset-x-0 top-full bg-white border-b border-gray-100 shadow-md z-40 animate-fade-in-up">
          <nav className="px-4 py-3 space-y-1 text-sm">
            {!isLoggedIn && (
              <div className="pb-3 border-b border-gray-100 mb-2">
                <a
                  href="/Login"
                  className="block w-full text-center py-3 bg-green-600 text-white font-bold rounded-xl"
                >
                  Login / Sign Up
                </a>
              </div>
            )}

            {/* Designer Hub Dropdown (Mobile) */}
            <div className="border-b border-gray-50">
              <div className="flex items-center justify-between w-full">
                <Link
                  to="/designer-hub"
                  className="flex-grow px-3 py-3 rounded-l-md hover:bg-green-50 text-gray-700 text-base font-medium transition-colors"
                >
                  Designer Hub
                </Link>
                <button
                  onClick={() => toggleMobileSubmenu("designers")}
                  className="p-3 rounded-r-md hover:bg-green-100 text-gray-500 transition-colors"
                  aria-label="Toggle Designer Hub menu"
                >
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      mobileMenuState.designers ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  mobileMenuState.designers
                    ? "max-h-48 opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <div className="pl-4 bg-gray-50/50 py-2 space-y-1">
                  <a
                    href="/clothes?seller=designer"
                    className="block px-3 py-2 rounded-md text-gray-600 hover:text-green-600 hover:bg-green-50 text-sm"
                  >
                    Designer Clothes
                  </a>
                  <a
                    href="/shoes?seller=designer"
                    className="block px-3 py-2 rounded-md text-gray-600 hover:text-green-600 hover:bg-green-50 text-sm"
                  >
                    Designer Shoes
                  </a>
                  <a
                    href="/bags?seller=designer"
                    className="block px-3 py-2 rounded-md text-gray-600 hover:text-green-600 hover:bg-green-50 text-sm"
                  >
                    Designer Bags
                  </a>
                </div>
              </div>
            </div>

            {/* Pre-Loved Dropdown (Mobile) */}
            <div className="border-b border-gray-50">
              <div className="flex items-center justify-between w-full">
                <Link
                  to="/reseller"
                  className="flex-grow px-3 py-3 rounded-l-md hover:bg-green-50 text-gray-700 text-base font-medium transition-colors"
                >
                  Pre-Loved Treasures
                </Link>
                <button
                  onClick={() => toggleMobileSubmenu("resellers")}
                  className="p-3 rounded-r-md hover:bg-green-100 text-gray-500 transition-colors"
                  aria-label="Toggle Pre-Loved Treasures menu"
                >
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      mobileMenuState.resellers ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  mobileMenuState.resellers
                    ? "max-h-48 opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <div className="pl-4 bg-gray-50/50 py-2 space-y-1">
                  <a
                    href="/clothes?seller=reseller"
                    className="block px-3 py-2 rounded-md text-gray-600 hover:text-green-600 hover:bg-green-50 text-sm"
                  >
                    Pre-loved Clothes
                  </a>
                  <a
                    href="/shoes?seller=reseller"
                    className="block px-3 py-2 rounded-md text-gray-600 hover:text-green-600 hover:bg-green-50 text-sm"
                  >
                    Pre-loved Shoes
                  </a>
                  <a
                    href="/bags?seller=reseller"
                    className="block px-3 py-2 rounded-md text-gray-600 hover:text-green-600 hover:bg-green-50 text-sm"
                  >
                    Pre-loved Bags
                  </a>
                </div>
              </div>
            </div>

            <a
              href="/custom-products"
              className="px-3 py-3 rounded-md hover:bg-green-50 text-gray-700 flex items-center gap-2 text-base font-medium"
            >
              <Shirt className="w-4 h-4" />
              Custom Cloths
            </a>

            {/* Mobile Categories accordion */}
            <button
              className="w-full flex items-center justify-between px-3 py-3 rounded-md hover:bg-green-50 text-gray-700 text-base font-medium"
              onClick={() => setIsCategoriesOpenMobile((v) => !v)}
              aria-expanded={isCategoriesOpenMobile}
            >
              <span>Categories</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  isCategoriesOpenMobile ? "rotate-180" : ""
                }`}
              />
            </button>
            {isCategoriesOpenMobile && (
              <div className="ml-3 pb-2 border-l-2 border-gray-100 pl-2">
                <a
                  href="/clothes"
                  className="block px-3 py-3 rounded-md hover:bg-green-50 text-gray-700 text-base"
                >
                  Clothes
                </a>
                <a
                  href="/bags"
                  className="block px-3 py-3 rounded-md hover:bg-green-50 text-gray-700 text-base"
                >
                  Bags
                </a>
                <a
                  href="/shoes"
                  className="block px-3 py-3 rounded-md hover:bg-green-50 text-gray-700 text-base"
                >
                  Shoes
                </a>
              </div>
            )}

            <a
              href="/contact"
              className="block px-3 py-3 rounded-md hover:bg-green-50 text-gray-700 text-base font-medium"
            >
              Contact Us
            </a>

            {isLoggedIn && (
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-2">
                <a
                  href="/cart"
                  className="flex items-center justify-center gap-2 p-3 bg-gray-50 rounded-xl font-medium"
                >
                  <ShoppingCart className="w-4 h-4" /> Cart ({cartCount})
                </a>
                <a
                  href={`${getDashboardLink()}`}
                  className="flex items-center justify-center gap-2 p-3 bg-gray-50 rounded-xl font-medium"
                >
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </a>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
