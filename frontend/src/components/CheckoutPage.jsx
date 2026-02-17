"use client";

// import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion"; // eslint-disable-line no-unused-vars
import {
  ArrowLeft,
  CreditCard,
  MapPin,
  User,
  CheckCircle,
  ShieldCheck,
  Truck,
  Upload,
  ChevronRight,
  ShoppingBag,
  CreditCard as CardIcon,
} from "lucide-react";

import Header from "./Header";
import MessageModal from "./common/MessageModal";
import api from "../api/axios.js";
import { writeStorage, getStorageKey } from "../utils/storage";

// --- Simple Confetti Implementation ---
const fireConfetti = () => {
  const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ec4899"];
  const count = 200;
  const container = document.createElement("div");
  container.className =
    "fixed inset-0 pointer-events-none z-[99999] overflow-hidden";
  document.body.appendChild(container);

  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.className = "absolute w-2 h-2 rounded-full opacity-0";
    el.style.backgroundColor =
      colors[Math.floor(Math.random() * colors.length)];
    el.style.left = Math.random() * 100 + "vw";
    el.style.top = -10 + "px";
    el.style.transform = `rotate(${Math.random() * 360}deg)`;

    // Animate
    const duration = Math.random() * 3 + 2;
    const delay = Math.random() * 2;
    el.style.transition = `top ${duration}s ease-in, opacity ${duration}s ease-in`;

    container.appendChild(el);

    setTimeout(() => {
      el.style.opacity = 1;
      el.style.top = "110vh";
    }, delay * 100);
  }

  setTimeout(() => {
    document.body.removeChild(container);
  }, 6000);
};

const WALLET_CONFIG = {
  jazzcash: { accountName: "Nabiha Batool", accountNumber: "0325-4001301" },
  easypaisa: { accountName: "Hannan Athar", accountNumber: "0300-4458969" },
};

const DELIVERY_CHARGE = 200;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const phoneRegex = /^(?:\+92|0)?3\d{2}[- ]?\d{7}$/;

import CloudinaryImage from "./common/CloudinaryImage";


// Helpers


const isRentLine = (it) => {
  const lt = String(it?.listingType || "").toLowerCase();
  const rentSelected =
    it?.isRent === true ||
    it?.mode === "rent" ||
    it?.selectedFor === "rent" ||
    it?.type === "rent";
  return lt === "rent" || (lt === "both" && rentSelected);
};

const isCustomLine = (item) => {
  const id = String(item?.id || item?.productId || "");
  return (
    item?.isCustom === true ||
    item?.source === "custom-shirt" ||
    item?.source === "custom" ||
    id.startsWith("custom-")
  );
};

const mapItemToOrderItem = (item) => {
  const quantity = item.quantity || 1;
  const unitPrice = Number(
    item.effectivePrice ??
      item.salePrice ??
      item.sellingPrice ??
      item.price ??
      0
  );

  const custom = isCustomLine(item);

  let sellerType;
  if (custom) {
    sellerType = "custom";
  } else {
    const raw = String(item.sellerType || item.productType || "").toLowerCase();
    if (raw === "designer") sellerType = "designer";
    else if (raw === "reseller") sellerType = "reseller";
    else sellerType = "Store";
  }

  const sellerId =
    item.sellerId ||
    item.createdBy ||
    item.ownerId ||
    item.designerId ||
    item.resellerId ||
    item.userId ||
    item.seller ||
    null;

  const baseImage = item.imageUrls?.[0] || item.image || "";

  const orderItem = {
    ...(custom ? {} : { productId: item._id || item.productId || item.id }),
    name:
      item.title ||
      item.name ||
      item.productTitle ||
      item.description ||
      "Untitled product",
    image: baseImage,
    quantity,
    unitPrice,
    lineTotal: quantity * unitPrice,
    sellerType,
    sellerId,
    size: item.size || item.meta?.size || item.selectedSize || null,
  };

  if (custom) {
    orderItem.isCustom = true;
    orderItem.source = item.source || "custom-shirt";
    orderItem.designData = item.designData || null;
    orderItem.productMeta = item.productMeta || item.meta || null;
    orderItem.customPreview = item.customPreview || item.image || baseImage;
    const imgs =
      item.imageUrls && item.imageUrls.length > 0
        ? item.imageUrls
        : [orderItem.customPreview];
    orderItem.imageUrls = imgs.filter(Boolean);
    orderItem.color = item.color || item.meta?.color || null;
    orderItem.description = item.description || orderItem.name;
  }

  const isRent = isRentLine(item);
  if (isRent) {
    orderItem.isRent = true;
    orderItem.rentDays = item.rentDays || 1;
    orderItem.rentPrice = item.rentPrice || unitPrice;
  }

  return orderItem;
};

const CheckoutPage = () => {
  const [currentStep, setCurrentStep] = useState(1); // 1: Info, 2: Payment, 3: Confirm
  const [direction, setDirection] = useState(0);
  const steps = [
    { id: 1, label: "Information", icon: User },
    { id: 2, label: "Payment", icon: CreditCard },
    { id: 3, label: "Review", icon: CheckCircle },
  ];

  const [orderData, setOrderData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [hasRentItems, setHasRentItems] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    paymentMethod: "cod", // "cod" | "online" | "card"
    onlineProvider: "jazzcash",
  });

  const [msgModal, setMsgModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "error",
  });
  const showError = (msg) =>
    setMsgModal({ isOpen: true, title: "Error", message: msg, type: "error" });


  const [paymentProof, setPaymentProof] = useState({
    file: null,
    previewUrl: "",
  });


  useEffect(() => {
    const checkoutData = localStorage.getItem("checkoutData");
    if (!checkoutData) {
      window.location.href = "/cart";
      return;
    }
    const data = JSON.parse(checkoutData);
    const items = (data.items || []).map((it) => ({
      ...it,
      title:
        it.title ||
        it.name ||
        it.productTitle ||
        it.description ||
        "Untitled Product",
    }));
    const normalized = { ...data, items };
    setOrderData(normalized);
    const rentItems = normalized.items?.some(
      (item) => isRentLine(item) || item.rentPrice
    );
    setHasRentItems(rentItems);

    try {
      const book = JSON.parse(localStorage.getItem("addressBook") || "[]");
      if (Array.isArray(book) && book.length > 0) {
        const def = book.find((a) => a.isDefault) || book[0];
        setFormData((prev) => ({
          ...prev,
          address: def.address || "",
          city: def.city || "",
          phone: prev.phone || def.phone || "",
        }));
      }
    } catch { /* ignore */ }

    const role = localStorage.getItem("role");
    let user = null;
    if (role === "buyer")
      user = JSON.parse(localStorage.getItem("buyer") || "null");
    else if (role === "designer")
      user = JSON.parse(localStorage.getItem("designer") || "null");
    else if (role === "reseller")
      user = JSON.parse(localStorage.getItem("reseller") || "null");

    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || user.fullName || user.name || "",
        email: prev.email || user.email || "",
        phone: prev.phone || user.phone || "",
      }));
    }
  }, []);

  const handleInputChange = (field, value) => {
    setFormData((p) => ({ ...p, [field]: value }));
  };

  const computed = useMemo(() => {
    if (!orderData)
      return {
        subtotal: 0,
        discount: 0,
        delivery: DELIVERY_CHARGE,
        total: DELIVERY_CHARGE,
      };
    const subtotal = Number(orderData.subtotal || 0);
    const discount = Number(orderData.discount || 0);
    const delivery = DELIVERY_CHARGE;
    const total = Math.max(0, subtotal - discount) + delivery;
    return { subtotal, discount, delivery, total };
  }, [orderData]);

  const validateInfoStep = () => {
    const required = ["fullName", "email", "phone", "address", "city"];
    const missing = required.filter((f) => !String(formData[f] || "").trim());
    if (missing.length) {
      showError("Please fill in all required fields.");
      return false;
    }
    if (!emailRegex.test(formData.email.trim())) {
      showError("Invalid email.");
      return false;
    }
    if (!phoneRegex.test(formData.phone.replace(/\s+/g, ""))) {
      showError("Invalid phone.");
      return false;
    }
    return true;
  };

  const validatePaymentStep = () => {
    if (formData.paymentMethod === "online") {
      if (!paymentProof.file) {
        showError("Please upload payment screenshot.");
        return false;
      }
      if (!["jazzcash", "easypaisa"].includes(formData.onlineProvider)) {
        showError("Choose a valid provider.");
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!validateInfoStep()) return;
      setDirection(1);
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!validatePaymentStep()) return;
      setDirection(1);
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setDirection(-1);
      setCurrentStep(currentStep - 1);
    }
  };

  const handleProofFile = (file) => {
    if (!file) return setPaymentProof({ file: null, previewUrl: "" });
    const url = URL.createObjectURL(file);
    setPaymentProof({ file, previewUrl: url });
  };

  const payWithStripe = async () => {
    if (!orderData) return;
    setIsProcessing(true);
    try {
      const mappedItems = (orderData.items || []).map(mapItemToOrderItem);
      const totalsPayload = {
        subtotal: computed.subtotal,
        shipping: computed.delivery,
        serviceFee: 0,
        discount: computed.discount,
        grandTotal: computed.total,
        currency: "pkr",
      };
      const shippingPayload = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        addressLine: formData.address,
        city: formData.city,
        state: "",
        country: "Pakistan",
        postalCode: formData.postalCode || "",
      };

      const requestPayload = {
        items: mappedItems,
        totals: totalsPayload,
        shippingAddress: shippingPayload,
      };
      const res = await api.post(
        "/payments/create-checkout-session",
        requestPayload
      );

      if (!res.data?.url) {
        showError("Stripe error. No checkout URL returned.");
        setIsProcessing(false);
        return;
      }

      localStorage.setItem(
        "pendingStripeOrder",
        JSON.stringify({
          items: mappedItems,
          totals: totalsPayload,
          shippingAddress: shippingPayload,
        })
      );

      window.location.href = res.data.url;
    } catch (err) {
      console.error(err);
      showError(
        "Card payment failed. " + (err.response?.data?.error || err.message)
      );
      setIsProcessing(false);
    }
  };

  const confirmOrder = async () => {
    if (!orderData) return;

    if (formData.paymentMethod === "card") {
      await payWithStripe();
      return;
    }

    setIsProcessing(true);
    try {
      const mappedItems = (orderData.items || []).map(mapItemToOrderItem);

      const totalsPayload = {
        subtotal: computed.subtotal,
        shipping: computed.delivery,
        serviceFee: 0,
        discount: computed.discount,
        grandTotal: computed.total,
        currency: "pkr",
      };

      const shippingPayload = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        addressLine: formData.address,
        city: formData.city,
        state: "",
        country: "Pakistan",
        postalCode: formData.postalCode || "",
      };

      const paymentMethod =
        formData.paymentMethod === "online" ? "wallet" : "cod";
      const walletType =
        formData.paymentMethod === "online" ? formData.onlineProvider : null;
      const walletNumber =
        formData.paymentMethod === "online"
          ? WALLET_CONFIG[formData.onlineProvider].accountNumber
          : null;
      const walletTxnId =
        formData.paymentMethod === "online" ? "uploaded-screenshot" : null;

      let rentalAgreement = null;
      try {
        const raw = localStorage.getItem("rentAgreement");
        if (raw) rentalAgreement = JSON.parse(raw);
    } catch { /* ignore */ }

      const payload = {
        items: mappedItems,
        totals: totalsPayload,
        shippingAddress: shippingPayload,
        paymentMethod,
        walletType,
        walletNumber,
        walletTxnId,
        rentalAgreement: hasRentItems ? rentalAgreement : null,
      };

      await api.post("/orders", payload);

      // Cleaup
      const cartKey = getStorageKey("cart");
      localStorage.removeItem(cartKey);
      localStorage.removeItem("checkoutData");
      localStorage.removeItem("rentAgreement");
      writeStorage("cart", []);

      try {
        await api.delete("/cart");
      } catch { /* ignore */ }

      window.dispatchEvent(new Event("cartUpdated"));
      window.dispatchEvent(new Event("storage"));

      setOrderConfirmed(true);
      fireConfetti(); // 🎉 Trigger Confetti
    } catch (e) {
      showError(e.response?.data?.message || "Order creation failed.");
    } finally {
      setIsProcessing(false);
    }
  };



  if (!orderData)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        Loading...
      </div>
    );

  if (orderConfirmed) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="bg-white border rounded-2xl p-12 text-center shadow-xl animate-scale-up relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-green-600"></div>

            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-subtle">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Order Confirmed!
            </h1>
            <p className="text-gray-700 mb-1 text-lg">
              Thank you, {formData.fullName}. Your order has been placed.
            </p>
            <p className="text-gray-500 mb-8">
              A confirmation email has been sent to {formData.email}.
            </p>

            <div className="flex items-center justify-center gap-4 flex-wrap">
              <a
                href="/"
                className="inline-flex items-center justify-center bg-gray-900 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
              >
                Continue Shopping
              </a>
              <button
                className="inline-flex items-center justify-center border-2 border-gray-200 hover:border-emerald-500 text-gray-700 hover:text-emerald-600 px-8 py-3 rounded-full font-bold transition-all bg-white"
                onClick={() => {
                  const role = (
                    localStorage.getItem("role") || "buyer"
                  ).toLowerCase();
                  let path = "/buyer-dashboard";
                  if (role === "designer") path = "/designer/dashboard";
                  else if (role === "reseller") path = "/reseller/dashboard";
                  window.location.href = `${path}?tab=orders`;
                }}
              >
                Track Order
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-6"></div>
        <h3 className="text-xl font-bold text-gray-900">
          Processing Your Order
        </h3>
        <p className="text-gray-500 mt-2">Please do not close this window...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <MessageModal
        isOpen={msgModal.isOpen}
        onClose={() => setMsgModal((p) => ({ ...p, isOpen: false }))}
        title={msgModal.title}
        message={msgModal.message}
        type={msgModal.type}
      />
      <Header />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* STEPPER */}
        <div className="mb-10">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-10"></div>
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-500 -z-10 transition-all duration-500"
              style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
            ></div>

            {steps.map((step) => {
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;
              const Icon = step.icon;

              return (
                <div
                  key={step.id}
                  className="flex flex-col items-center bg-gray-50 px-2"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      isActive
                        ? "bg-emerald-600 border-emerald-600 text-white scale-110 shadow-lg"
                        : isCompleted
                        ? "bg-emerald-100 border-emerald-600 text-emerald-600"
                        : "bg-white border-gray-300 text-gray-400"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle size={20} />
                    ) : (
                      <Icon size={20} />
                    )}
                  </div>
                  <span
                    className={`mt-2 text-sm font-semibold ${
                      isActive ? "text-emerald-800" : "text-gray-500"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px] p-4 sm:p-6">
              {" "}
              {/* Reduced padding mobile */}
              {/* STEP 1: INFO */}
              <AnimatePresence mode="wait" custom={direction} initial={false}>
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    custom={direction}
                    variants={{
                      enter: (direction) => ({
                        x: direction > 0 ? 50 : -50,
                        opacity: 0,
                      }),
                      center: { x: 0, opacity: 1 },
                      exit: (direction) => ({
                        x: direction < 0 ? 50 : -50,
                        opacity: 0,
                      }),
                    }}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="animate-fade-in-up"
                  >
                    <h2 className="text-2xl font-bold mb-6 text-gray-900">
                      Contact & Shipping
                    </h2>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700 block mb-1">
                            Full Name
                          </label>
                          <input
                            type="text"
                            value={formData.fullName}
                            onChange={(e) =>
                              handleInputChange("fullName", e.target.value)
                            }
                            className="w-full border rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-base sm:text-sm" // Mobile text-base
                            placeholder="John Doe"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700 block mb-1">
                            Email
                          </label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                              handleInputChange("email", e.target.value)
                            }
                            className="w-full border rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-base sm:text-sm"
                            placeholder="john@example.com"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">
                          Phone Number
                        </label>
                        <input
                          type="text"
                          value={formData.phone}
                          onChange={(e) =>
                            handleInputChange("phone", e.target.value)
                          }
                          className="w-full border rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-base sm:text-sm"
                          placeholder="03XXXXXXXXX"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">
                          Address
                        </label>
                        <textarea
                          value={formData.address}
                          onChange={(e) =>
                            handleInputChange("address", e.target.value)
                          }
                          rows={3}
                          className="w-full border rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-base sm:text-sm"
                          placeholder="House #, Street, Area..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700 block mb-1">
                            City
                          </label>
                          <input
                            type="text"
                            value={formData.city}
                            onChange={(e) =>
                              handleInputChange("city", e.target.value)
                            }
                            className="w-full border rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-base sm:text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700 block mb-1">
                            Postal Code
                          </label>
                          <input
                            type="text"
                            value={formData.postalCode}
                            onChange={(e) =>
                              handleInputChange("postalCode", e.target.value)
                            }
                            className="w-full border rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-base sm:text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                {/* STEP 2: PAYMENT */}
                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    custom={direction}
                    variants={{
                      enter: (direction) => ({
                        x: direction > 0 ? 50 : -50,
                        opacity: 0,
                      }),
                      center: { x: 0, opacity: 1 },
                      exit: (direction) => ({
                        x: direction < 0 ? 50 : -50,
                        opacity: 0,
                      }),
                    }}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="animate-fade-in-up"
                  >
                    <h2 className="text-2xl font-bold mb-6 text-gray-900">
                      Payment Method
                    </h2>

                    <div className="space-y-4">
                      <label
                        className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${
                          formData.paymentMethod === "cod"
                            ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="pay"
                          value="cod"
                          checked={formData.paymentMethod === "cod"}
                          onChange={() =>
                            handleInputChange("paymentMethod", "cod")
                          }
                          className="w-5 h-5 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="ml-4">
                          <span className="block font-bold text-gray-900">
                            Cash on Delivery
                          </span>
                          <span className="text-sm text-gray-500">
                            Pay when you receive the order
                          </span>
                        </div>
                      </label>

                      <label
                        className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${
                          formData.paymentMethod === "online"
                            ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="pay"
                          value="online"
                          checked={formData.paymentMethod === "online"}
                          onChange={() =>
                            handleInputChange("paymentMethod", "online")
                          }
                          className="w-5 h-5 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="ml-4">
                          <span className="block font-bold text-gray-900">
                            Online Wallet (JazzCash / EasyPaisa)
                          </span>
                          <span className="text-sm text-gray-500">
                            Transfer and upload screenshot
                          </span>
                        </div>
                      </label>

                      <label
                        className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${
                          formData.paymentMethod === "card"
                            ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="pay"
                          value="card"
                          checked={formData.paymentMethod === "card"}
                          onChange={() =>
                            handleInputChange("paymentMethod", "card")
                          }
                          className="w-5 h-5 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="ml-4">
                          <span className="block font-bold text-gray-900">
                            Credit / Debit Card
                          </span>
                          <span className="text-sm text-gray-500">
                            Powered by Stripe
                          </span>
                        </div>
                      </label>
                    </div>

                    {/* Online Payment Details */}
                    {formData.paymentMethod === "online" && (
                      <div className="mt-6 p-6 bg-gray-50 rounded-xl border border-gray-200 animate-fade-in">
                        <div className="mb-4">
                          <label className="text-sm font-bold text-gray-700 block mb-2">
                            Select Provider
                          </label>
                          <div className="flex gap-4">
                            {["jazzcash", "easypaisa"].map((p) => (
                              <button
                                key={p}
                                onClick={() =>
                                  handleInputChange("onlineProvider", p)
                                }
                                className={`px-4 py-2 rounded-lg border text-sm font-semibold capitalize ${
                                  formData.onlineProvider === p
                                    ? "bg-emerald-600 text-white border-emerald-600"
                                    : "bg-white text-gray-700"
                                }`}
                              >
                                {p}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="bg-white p-4 rounded-lg border mb-4">
                          <p className="text-sm text-gray-500">
                            Please send amount to:
                          </p>
                          <p className="font-mono font-bold text-lg">
                            {
                              WALLET_CONFIG[formData.onlineProvider]
                                .accountNumber
                            }
                          </p>
                          <p className="text-sm font-medium">
                            {WALLET_CONFIG[formData.onlineProvider].accountName}
                          </p>
                        </div>

                        <div>
                          <label className="text-sm font-bold text-gray-700 block mb-2">
                            Upload Payment Screenshot
                          </label>
                          <div className="flex items-center gap-4">
                            <label className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 bg-white shadow-sm font-medium text-sm text-gray-700 transition-all">
                              <Upload className="w-4 h-4 mr-2" />
                              Choose File
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) =>
                                  handleProofFile(e.target.files[0])
                                }
                              />
                            </label>
                            {paymentProof.file && (
                              <span className="text-sm text-emerald-600 font-medium">
                                File selected
                              </span>
                            )}
                          </div>
                          {paymentProof.previewUrl && (
                            <div className="mt-3">
                              <img
                                src={paymentProof.previewUrl}
                                alt="Proof"
                                className="h-32 rounded-lg border object-cover"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
                {/* STEP 3: REVIEW */}
                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    custom={direction}
                    variants={{
                      enter: (direction) => ({
                        x: direction > 0 ? 50 : -50,
                        opacity: 0,
                      }),
                      center: { x: 0, opacity: 1 },
                      exit: (direction) => ({
                        x: direction < 0 ? 50 : -50,
                        opacity: 0,
                      }),
                    }}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="animate-fade-in-up"
                  >
                    <h2 className="text-2xl font-bold mb-6 text-gray-900">
                      Review Your Order
                    </h2>

                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                      <h3 className="font-bold text-gray-800 mb-2">
                        Shipping To:
                      </h3>
                      <p className="text-gray-600">{formData.fullName}</p>
                      <p className="text-gray-600">
                        {formData.address}, {formData.city}
                      </p>
                      <p className="text-gray-600">{formData.phone}</p>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-bold text-gray-800">
                            Payment Method
                          </h3>
                          <p className="text-gray-600 capitalize">
                            {formData.paymentMethod === "online"
                              ? `Online Wallet (${formData.onlineProvider})`
                              : formData.paymentMethod === "card"
                              ? "Credit Card"
                              : "Cash on Delivery"}
                          </p>
                        </div>
                        <button
                          onClick={() => setCurrentStep(2)}
                          className="text-emerald-600 text-sm font-medium hover:underline"
                        >
                          Change
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 p-3 rounded-lg text-sm font-semibold">
                      <ShieldCheck size={18} />
                      <span>
                        You are covered by our Buyer Protection Policy.
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* NAVIGATION BUTTONS */}
            <div className="mt-6 flex justify-between">
              {currentStep > 1 ? (
                <button
                  onClick={handlePrevStep}
                  className="px-6 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors flex items-center"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" /> Back
                </button>
              ) : (
                <div></div>
              )}

              {currentStep < 3 ? (
                <button
                  onClick={handleNextStep}
                  className="px-8 py-3 rounded-xl font-bold bg-gray-900 text-white hover:bg-black transition-colors flex items-center shadow-lg"
                >
                  Next Step <ChevronRight className="w-5 h-5 ml-2" />
                </button>
              ) : (
                <button
                  onClick={confirmOrder}
                  className="px-8 py-3 rounded-xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:scale-105 active:scale-95 transition-all flex items-center shadow-lg hover:shadow-emerald-500/30"
                >
                  Confirm Order <CheckCircle className="w-5 h-5 ml-2" />
                </button>
              )}
            </div>
          </div>

          {/* SIDEBAR SUMMARY */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h3 className="font-serif font-bold text-gray-900 text-lg mb-4 pb-2 border-b">
                Order Summary
              </h3>
              <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {orderData?.items?.map((item, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <div className="w-12 h-12 bg-gray-100 rounded-md shrink-0 overflow-hidden">
                      <CloudinaryImage
                        src={
                          item.image ||
                          item.customPreview ||
                          item.imageUrls?.[0]
                        }
                        className="w-full h-full object-cover"
                        sizes="48px"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 line-clamp-2">
                        {item.title}
                      </p>
                      <p className="text-gray-500 text-xs">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <div className="font-semibold text-gray-700">
                      PKR {mapItemToOrderItem(item).lineTotal.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-sm text-gray-600 border-t pt-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>PKR {computed.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>PKR {computed.delivery.toLocaleString()}</span>
                </div>
                {computed.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>- PKR {computed.discount.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="border-t mt-4 pt-4">
                <div className="flex justify-between items-end">
                  <span className="font-bold text-gray-800">Total</span>
                  <span className="font-bold text-2xl text-emerald-600">
                    PKR {computed.total.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Inclusive of all taxes
                </p>
              </div>

              <div className="mt-6 flex items-center justify-center gap-2 text-emerald-700 bg-emerald-50 py-2 rounded text-xs font-semibold">
                <ShieldCheck size={14} /> Secure Checkout
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
