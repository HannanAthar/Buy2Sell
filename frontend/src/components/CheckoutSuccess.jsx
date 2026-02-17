// CheckoutSuccess.jsx
"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "./Header";
import Footer from "./Footer";

function useQuery() {
  const { search } = useLocation();
  return new URLSearchParams(search);
}

export default function CheckoutSuccess() {
  const query = useQuery();
  const navigate = useNavigate();

  const [status, setStatus] = useState("checking"); // "checking" | "success" | "failed"
  const [message, setMessage] = useState("");

  useEffect(() => {
    const sessionId = query.get("session_id");

    if (!sessionId) {
      setStatus("failed");
      setMessage(
        "Missing payment session. If money was deducted from your card, please contact support with your payment screenshot."
      );
      return;
    }

    const verifyPayment = async () => {
      try {
        const base = import.meta.env.VITE_API_BASE || "http://localhost:5000";

        const res = await fetch(
          `${base}/api/orders/stripe-success?session_id=${encodeURIComponent(
            sessionId
          )}`
        );

        if (!res.ok) {
          console.error("Stripe verify HTTP error:", res.status);
          setStatus("failed");
          setMessage(
            "We could not confirm your payment. If money was deducted from your card, please contact support with your payment screenshot."
          );
          return;
        }

        const data = await res.json();
        console.log("Stripe verify result:", data);

        if (data.success && data.paid) {
          setStatus("success");
          setMessage("");

          // Clear localStorage using scoped keys
          localStorage.removeItem("pendingStripeOrder");

          // Import these at the top of the file if not already imported
          // For now, we'll calculate the scoped key inline
          const getUserKey = () => {
            try {
              const token = localStorage.getItem("token");
              if (!token) return "guest";
              const buyer = JSON.parse(localStorage.getItem("buyer") || "{}");
              if (buyer.id || buyer._id || buyer.uid)
                return String(buyer.id || buyer._id || buyer.uid);
              const designer = JSON.parse(
                localStorage.getItem("designer") || "{}"
              );
              if (designer.id || designer._id)
                return String(designer.id || designer._id);
              const reseller = JSON.parse(
                localStorage.getItem("reseller") || "{}"
              );
              if (reseller.id || reseller._id || reseller.uid)
                return String(reseller.id || reseller._id || reseller.uid);
              return "user_generic";
            } catch {
              return "guest";
            }
          };

          const uid = getUserKey();
          const cartKey = uid === "guest" ? "cart" : `cart_${uid}`;
          localStorage.removeItem(cartKey);

          // Set cart to empty array
          localStorage.setItem(cartKey, "[]");

          // Also clear cart from backend
          try {
            const base =
              import.meta.env.VITE_API_BASE || "http://localhost:5000";
            await fetch(`${base}/api/cart`, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json",
              },
            });
            console.log("✅ Backend cart cleared after Stripe payment");
          } catch (cartErr) {
            console.warn("⚠️ Could not clear backend cart:", cartErr);
            // Don't fail the success page if cart clear fails
          }

          // Dispatch events to notify all components (Header, Dashboard, Cart page)
          window.dispatchEvent(new Event("cartUpdated"));
          window.dispatchEvent(new Event("storage"));
        } else {
          setStatus("failed");
          setMessage(
            "We could not confirm your payment. If money was deducted from your card, please contact support with your payment screenshot."
          );
        }
      } catch (err) {
        console.error("Stripe verify error:", err);
        setStatus("failed");
        setMessage(
          "We could not confirm your payment. If money was deducted from your card, please contact support with your payment screenshot."
        );
      }
    };

    verifyPayment();
  }, [query]);

  const handleViewOrders = () => {
    const role = (localStorage.getItem("role") || "buyer").toLowerCase();

    let path = "/buyer-dashboard";
    if (role === "designer") path = "/designer/dashboard";
    else if (role === "reseller") path = "/reseller/dashboard";

    navigate(`${path}?tab=orders`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-sm border max-w-lg w-full p-8 text-center"
        >
          {status === "checking" && (
            <>
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Checking your payment…
              </h1>
              <p className="text-gray-600 text-sm">
                Please wait a moment while we verify your card payment with
                Stripe.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                  delay: 0.2,
                }}
                className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </motion.div>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
                Payment confirmed!
              </h1>
              <p className="text-gray-700 text-sm mb-6">
                Your card payment was successful and your order has been
                received. You can view your order details in your dashboard.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={handleViewOrders}
                  className="inline-flex items-center justify-center bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors"
                >
                  View my order
                </button>
                <Link
                  to="/"
                  className="inline-flex items-center justify-center border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  Continue shopping
                </Link>
              </div>
            </>
          )}

          {status === "failed" && (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4"
              >
                <XCircle className="w-10 h-10 text-red-600" />
              </motion.div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-red-600 mb-3">
                We could not confirm your payment
              </h1>
              <p className="text-gray-700 text-sm mb-6">
                {message ||
                  "If money was deducted from your card, please contact support with your payment screenshot and order details."}
              </p>
              <Link
                to="/cart"
                className="inline-flex items-center justify-center bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors"
              >
                Go back to cart
              </Link>
            </>
          )}
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
