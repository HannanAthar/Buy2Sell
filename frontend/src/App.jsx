import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useEffect, Suspense, lazy } from "react";

// Components
import PageLoader from "./components/common/PageLoader.jsx";
import RouteErrorBoundary from "./components/common/RouteErrorBoundary.jsx";

// ... existing imports ...
import { ProductProvider } from "./components/ProductContext.jsx";
import { DialogProvider } from "./context/DialogContext.jsx";
import { SliderProvider } from "./contexts/SliderContext.jsx";
import AutoLogout from "./components/AutoLogout.jsx";
import GlobalProgressBar from "./components/GlobalProgressBar.jsx";
import NavigationLoader from "./components/NavigationLoader.jsx";
import { Toaster } from "react-hot-toast";

// Eager load Home for performance
import HomePage from "./components/HomePage.jsx";





const prefetchCriticalRoutes = () => {
  // Prefetch critical paths after main load
  if (typeof window !== 'undefined' && window.requestIdleCallback) {
    window.requestIdleCallback(() => {
      import("./components/ProductDetailPage.jsx");
      import("./components/CartPage.jsx");
      import("./components/CheckoutPage.jsx");
    });
  } else {
    setTimeout(() => {
      import("./components/ProductDetailPage.jsx");
      import("./components/CartPage.jsx");
      import("./components/CheckoutPage.jsx");
    }, 2000);
  }
};

// Lazy load everything else
const ResellerPage = lazy(() => import("./components/ResellerPage.jsx"));
const DesignerPage = lazy(() => import("./components/DesignerPage.jsx"));
const DesignerSignUp = lazy(() => import("./components/DesignerSignup.jsx"));
const ResellerSignUp = lazy(() => import("./components/ResellerSignup.jsx"));
const Login = lazy(() => import("./components/Login.jsx"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword.jsx"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword.jsx"));
const DesignerUploadPage = lazy(() =>
  import("./components/DesignerUploadPage.jsx")
);
const ResellerUploadPage = lazy(() =>
  import("./components/ResellerUploadPage.jsx")
);
const ContactUs = lazy(() => import("./components/ContactUs.jsx"));
const LearnMore = lazy(() => import("./components/LearnMore.jsx"));
const CartPage = lazy(() => import("./components/CartPage.jsx"));
const WishlistPage = lazy(() => import("./components/WishlistPage.jsx"));
const ShoesPage = lazy(() => import("./components/ShoesPage.jsx"));
const ClothesPage = lazy(() => import("./components/ClothesPage.jsx"));
const BagsPage = lazy(() => import("./components/BagsPage.jsx"));
const CheckoutPage = lazy(() => import("./components/CheckoutPage.jsx"));
const CustomShirtDesigner = lazy(() =>
  import("./components/CustomShirtDesigner.jsx")
);
const CustomProductsGallery = lazy(() =>
  import("./components/CustomProductsGallery.jsx")
);
const DesignerHub = lazy(() => import("./components/DesignerHub.jsx"));
const DesignerDashboard = lazy(() =>
  import("./components/DesignerDashboard.jsx")
);
const ResellerDashboard = lazy(() =>
  import("./components/ResellerDashboard.jsx")
);
const SubmissionSuccess = lazy(() =>
  import("./components/SubmissionSuccess.jsx")
);
const RentForm = lazy(() => import("./components/RentForm.jsx"));
const ProductDetailPage = lazy(() =>
  import("./components/ProductDetailPage.jsx")
);
const BuyerDashboard = lazy(() => import("./components/BuyerDashboard.jsx"));
const CheckoutSuccess = lazy(() => import("./components/CheckoutSuccess.jsx"));
const CheckoutCancel = lazy(() => import("./components/CheckoutCancel.jsx"));
const SearchPage = lazy(() => import("./components/SearchPage.jsx"));
const SettingsPage = lazy(() => import("./components/SettingsPage.jsx"));
const ShippingInfo = lazy(() => import("./components/ShippingInfo.jsx"));
const ReturnPolicy = lazy(() => import("./components/ReturnPolicy.jsx"));
const PrivacyPolicy = lazy(() => import("./components/PrivacyPolicy.jsx"));
const TermsOfServices = lazy(() => import("./components/TermsOfServices.jsx"));
const CookiePolicy = lazy(() => import("./components/CookiePolicy.jsx"));
const NotFound = lazy(() => import("./components/NotFound.jsx"));


const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<HomePage />} />

        <Route path="/Login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/user/dashboard" element={<HomePage />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/learn-more" element={<LearnMore />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/shoes" element={<ShoesPage />} />
        <Route path="/clothes" element={<ClothesPage />} />
        <Route path="/bags" element={<BagsPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />

        <Route path="/designers" element={<DesignerPage />} />
        <Route path="/designer-signup" element={<DesignerSignUp />} />
        <Route path="/designer-hub" element={<DesignerHub />} />
        <Route path="/designer-upload" element={<DesignerUploadPage />} />
        <Route path="/designer/dashboard" element={<DesignerDashboard />} />

        <Route path="/reseller" element={<ResellerPage />} />
        <Route path="/Reseller-Signup" element={<ResellerSignUp />} />
        <Route path="/reseller-upload" element={<ResellerUploadPage />} />
        <Route path="/reseller/dashboard" element={<ResellerDashboard />} />
        <Route path="/submission-success" element={<SubmissionSuccess />} />

        <Route path="/designer-tool" element={<CustomShirtDesigner />} />
        <Route
          path="/custom-shirt-designer"
          element={<CustomShirtDesigner />}
        />
        <Route path="/custom-products" element={<CustomProductsGallery />} />
        <Route path="/rent-form" element={<RentForm />} />

        <Route path="/buyer-dashboard" element={<BuyerDashboard />} />

        <Route path="/product-detail" element={<ProductDetailPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/settings" element={<SettingsPage />} />

        <Route path="/checkout/success" element={<CheckoutSuccess />} />
        <Route path="/checkout/cancel" element={<CheckoutCancel />} />

        <Route path="/shipping-info" element={<ShippingInfo />} />
        <Route path="/return-policy" element={<ReturnPolicy />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-services" element={<TermsOfServices />} />
        <Route path="/cookie-policy" element={<CookiePolicy />} />

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {

  // Trigger prefetch on mount
  useEffect(() => {
    prefetchCriticalRoutes();
  }, []);

  return (
    <ProductProvider>
      <DialogProvider>
        <SliderProvider>
          <Router>
            <div className="noise-overlay" />
            <ScrollToTop />
            <NavigationLoader />
            <GlobalProgressBar />
            <AutoLogout />
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 4000,
                className: "",
                style: {
                  background: "rgba(255, 255, 255, 0.9)",
                  backdropFilter: "blur(10px)",
                  color: "#1f2937",
                  fontSize: "14px",
                  fontWeight: "500",
                  padding: "12px 20px",
                  borderRadius: "12px",
                  boxShadow: "0 10px 40px -10px rgba(0, 0, 0, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.5)",
                },
                success: {
                  iconTheme: {
                    primary: "#10b981",
                    secondary: "white",
                  },
                },
                error: {
                  iconTheme: {
                    primary: "#ef4444",
                    secondary: "white",
                  },
                },
              }}
            />
            <RouteErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Admin Routes - Defined explicitly to avoid nesting issues */}


                  {/* Main App Routes */}
                  <Route path="/*" element={<AnimatedRoutes />} />
                </Routes>
              </Suspense>
            </RouteErrorBoundary>
          </Router>
        </SliderProvider>
      </DialogProvider>
    </ProductProvider>
  );
}

export default App;
