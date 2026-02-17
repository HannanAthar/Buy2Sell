"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "./Header";
import {
  ArrowLeft,
  Upload,
  ShieldCheck,
  Smartphone,
  Image as ImageIcon,
} from "lucide-react";
import MessageModal from "./common/MessageModal";

// Compress image if > 5MB
const compressImage = async (file, maxSizeMB = 5) => {
  return new Promise((resolve, reject) => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (file.size <= maxSizeBytes) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement("img");
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        const scaleFactor = Math.sqrt(maxSizeBytes / file.size);
        width = Math.floor(width * scaleFactor);
        height = Math.floor(height * scaleFactor);

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const quality = 0.7;
        const compressed = canvas.toDataURL("image/jpeg", quality);
        resolve(compressed);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// same rent detection logic as cart / checkout
const isRentLine = (it) => {
  const lt = String(it?.listingType || "").toLowerCase();
  const rentSelected =
    it?.isRent === true ||
    it?.mode === "rent" ||
    it?.selectedFor === "rent" ||
    it?.type === "rent";
  return lt === "rent" || (lt === "both" && rentSelected);
};

export default function RentForm() {
  const nav = useNavigate();
  const { search } = useLocation();
  useMemo(() => new URLSearchParams(search), [search]);

  const next = "/checkout"; // after this step, go to checkout

  const [cnic, setCnic] = useState("");
  const [front, setFront] = useState(null);
  const [back, setBack] = useState(null);

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [depositReceipt, setDepositReceipt] = useState(null);

  const [terms, setTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [compressing, setCompressing] = useState(false);
  const [msgModal, setMsgModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "error",
  });

  const showError = (msg) =>
    setMsgModal({
      isOpen: true,
      title: "Validation Error",
      message: msg,
      type: "error",
    });

  const showSuccess = (title, msg) =>
    setMsgModal({
      isOpen: true,
      title: title,
      message: msg,
      type: "success",
    });

  // numbers to show calculation
  const [depositBaseTotal, setDepositBaseTotal] = useState(0); // total product price of all rent items (including quantity)
  const [depositAmount, setDepositAmount] = useState(0); // 30% of that
  const [rentLines, setRentLines] = useState([]); // for UI breakdown

  const validCnic = /^\d{5}-\d{7}-\d{1}$/.test(cnic.trim());

  // Payment account numbers
  const JAZZCASH_NUMBER = "03004458969";
  const JAZZCASH_NAME = "Nabiha Batool";
  const EASYPAISA_NUMBER = "03104317177";
  const EASYPAISA_NAME = "Nabiha Batool";

  // Load checkoutData, compute base total = sum(originalPrice * quantity)
  useEffect(() => {
    window.scrollTo(0, 0);

    let data = null;
    try {
      data = JSON.parse(localStorage.getItem("checkoutData") || "null");
    } catch {
      data = null;
    }

    if (!data || !Array.isArray(data.items)) {
      nav("/cart", { replace: true });
      return;
    }

    const rentItems = data.items.filter(isRentLine);
    if (!rentItems.length) {
      nav("/checkout", { replace: true });
      return;
    }

    const lines = rentItems.map((it, index) => {
      const base = Number(
        it.originalPrice ??
          it.productBasePrice ??
          it.price ??
          it.sellingPrice ??
          0
      );
      const quantity = Math.max(1, Number(it.quantity || 1));
      const rentDays = Math.max(1, Math.min(7, Number(it.rentDays || 1)));
      return {
        id: it.cartId || `${index}`,
        title:
          it.title ||
          it.name ||
          it.productTitle ||
          it.description ||
          "Rented Item",
        basePrice: base > 0 ? base : 0,
        quantity,
        rentDays,
      };
    });

    const baseTotal = lines.reduce(
      (sum, l) => sum + l.basePrice * l.quantity,
      0
    );

    if (baseTotal <= 0) {
      nav("/cart", { replace: true });
      return;
    }

    const deposit = Math.round(baseTotal * 0.3); // 30%

    setRentLines(lines);
    setDepositBaseTotal(baseTotal);
    setDepositAmount(deposit);
  }, [nav]);

  const chooseFront = async (file) => {
    if (!file) {
      setFront(null);
      return;
    }
    setCompressing(true);
    try {
      const compressed = await compressImage(file);
      setFront({ file, preview: compressed });
    } catch {
      showError("Failed to process image. Please try again.");
    }
    setCompressing(false);
  };

  const chooseBack = async (file) => {
    if (!file) {
      setBack(null);
      return;
    }
    setCompressing(true);
    try {
      const compressed = await compressImage(file);
      setBack({ file, preview: compressed });
    } catch {
      showError("Failed to process image. Please try again.");
    }
    setCompressing(false);
  };

  const chooseDepositReceipt = async (file) => {
    if (!file) {
      setDepositReceipt(null);
      return;
    }
    setCompressing(true);
    try {
      const compressed = await compressImage(file);
      setDepositReceipt({ file, preview: compressed });
    } catch {
      showError("Failed to process receipt image. Please try again.");
    }
    setCompressing(false);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validCnic)
      return showError("Please enter a valid CNIC (12345-1234567-1).");
    if (!front) return showError("Please upload CNIC front image.");
    if (!back) return showError("Please upload CNIC back image.");
    if (!selectedPaymentMethod)
      return showError("Please select a payment method.");
    if (!depositReceipt)
      return showError("Please upload payment receipt screenshot.");
    if (!terms)
      return showError("Please accept the Rental Terms & Conditions.");

    try {
      setSubmitting(true);

      const payload = {
        accepted: true,
        cnic: cnic.trim(),
        frontImage: front.preview,
        backImage: back.preview,
        paymentMethod: selectedPaymentMethod,
        depositBaseTotal,
        depositAmount,
        depositReceipt: depositReceipt.preview,
        acceptedAt: new Date().toISOString(),
      };
      localStorage.setItem("rentAgreement", JSON.stringify(payload));

      nav(next, { replace: true }); // go to checkout
    } catch (err) {
      console.error(err);
      showError("Failed to submit. Please try again.");
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showSuccess("Copied", `Copied: ${text}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => nav(-1)}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="h-5 w-5 mr-1" /> Back
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Rental Verification & Security Deposit
        </h1>

        <div className="rounded-2xl border shadow-sm overflow-hidden">
          <div className="bg-emerald-600 text-white px-4 py-3 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            <span className="font-semibold">
              Complete this verification to proceed with rental
            </span>
          </div>

          <form onSubmit={onSubmit} className="bg-white p-6 space-y-6">
            {/* CNIC Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                1. CNIC Information
              </h2>
              <label className="block text-sm text-gray-700 mb-1">
                CNIC Number (required)
              </label>
              <input
                value={cnic}
                onChange={(e) => setCnic(e.target.value)}
                placeholder="12345-1234567-1"
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 ${
                  validCnic
                    ? "border-gray-300 focus:ring-emerald-500"
                    : "border-red-300 focus:ring-red-400"
                }`}
                maxLength={15}
              />
            </div>

            {/* CNIC Images */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border-2 rounded-xl p-4 flex flex-col gap-3">
                <span className="text-sm font-medium">
                  CNIC Front Image (required)
                </span>
                <label className="inline-flex items-center px-3 py-2 border rounded-md cursor-pointer hover:bg-gray-50 w-fit">
                  <Upload className="h-4 w-4 mr-2" />
                  <span>{compressing ? "Processing..." : "Choose Image"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => chooseFront(e.target.files?.[0] || null)}
                    disabled={compressing}
                  />
                </label>
                {front && (
                  <img
                    src={front.preview}
                    alt="Front preview"
                    className="h-24 w-auto rounded border"
                  />
                )}
              </div>

              <div className="border-2 rounded-xl p-4 flex flex-col gap-3">
                <span className="text-sm font-medium">
                  CNIC Back Image (required)
                </span>
                <label className="inline-flex items-center px-3 py-2 border rounded-md cursor-pointer hover:bg-gray-50 w-fit">
                  <Upload className="h-4 w-4 mr-2" />
                  <span>{compressing ? "Processing..." : "Choose Image"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => chooseBack(e.target.files?.[0] || null)}
                    disabled={compressing}
                  />
                </label>
                {back && (
                  <img
                    src={back.preview}
                    alt="Back preview"
                    className="h-24 w-auto rounded border"
                  />
                )}
              </div>
            </div>

            {/* Security Deposit Section */}
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                2. Security Deposit Payment
              </h2>

              {/* Calculation explanation */}
              <div className="mb-3 text-sm text-gray-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3 space-y-1">
                {rentLines.map((line) => {
                  const lineTotal = line.basePrice * line.quantity;
                  return (
                    <div key={line.id}>
                      <div>
                        {line.title}: Rs {line.basePrice.toLocaleString()}{" "}
                        {line.quantity > 1 && <>× {line.quantity} item(s)</>} ={" "}
                        <span className="font-semibold">
                          Rs {lineTotal.toLocaleString()}
                        </span>
                      </div>
                      {line.rentDays > 1 && (
                        <div className="text-xs text-gray-500">
                          Rental duration: {line.rentDays} day(s)
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="pt-1">
                  <p>
                    Total product price of rented item(s):{" "}
                    <span className="font-semibold">
                      Rs {depositBaseTotal.toLocaleString()}
                    </span>
                  </p>
                  <p>
                    Security deposit ={" "}
                    <span className="font-semibold">30%</span> of Rs{" "}
                    {depositBaseTotal.toLocaleString()} ={" "}
                    <span className="font-semibold">
                      Rs {depositAmount.toLocaleString()}
                    </span>
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Please transfer the above security deposit to one of the
                accounts below and upload the payment receipt.
              </p>

              {/* Payment Methods */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* JazzCash */}
                <div
                  onClick={() => setSelectedPaymentMethod("jazzcash")}
                  className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                    selectedPaymentMethod === "jazzcash"
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="radio"
                      name="payment"
                      checked={selectedPaymentMethod === "jazzcash"}
                      onChange={() => setSelectedPaymentMethod("jazzcash")}
                      className="w-4 h-4"
                    />
                    <Smartphone className="h-5 w-5 text-red-600" />
                    <span className="font-semibold text-gray-900">
                      JazzCash
                    </span>
                  </div>
                  <div className="ml-6 space-y-1">
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">Account Name:</span>{" "}
                      {JAZZCASH_NAME}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                        {JAZZCASH_NUMBER}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(JAZZCASH_NUMBER);
                        }}
                        className="text-emerald-600 hover:underline text-xs"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>

                {/* EasyPaisa */}
                <div
                  onClick={() => setSelectedPaymentMethod("easypaisa")}
                  className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                    selectedPaymentMethod === "easypaisa"
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="radio"
                      name="payment"
                      checked={selectedPaymentMethod === "easypaisa"}
                      onChange={() => setSelectedPaymentMethod("easypaisa")}
                      className="w-4 h-4"
                    />
                    <Smartphone className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-gray-900">
                      EasyPaisa
                    </span>
                  </div>
                  <div className="ml-6 space-y-1">
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">Account Name:</span>{" "}
                      {EASYPAISA_NAME}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                        {EASYPAISA_NUMBER}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(EASYPAISA_NUMBER);
                        }}
                        className="text-emerald-600 hover:underline text-xs"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Receipt Upload */}
              <div className="border-2 rounded-xl p-4">
                <span className="text-sm font-medium block mb-3">
                  Upload Payment Receipt (required)
                </span>
                <label className="inline-flex items-center px-3 py-2 border rounded-md cursor-pointer hover:bg-gray-50">
                  <ImageIcon className="h-4 w-4 mr-2" />
                  <span>
                    {compressing ? "Processing..." : "Choose Screenshot"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      chooseDepositReceipt(e.target.files?.[0] || null)
                    }
                    disabled={compressing}
                  />
                </label>
                {depositReceipt && (
                  <img
                    src={depositReceipt.preview}
                    alt="Receipt preview"
                    className="mt-3 h-32 w-auto rounded border"
                  />
                )}
              </div>
            </div>

            {/* Terms */}
            <label className="flex items-start gap-2 pt-4 border-t">
              <input
                type="checkbox"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
                className="mt-1"
              />
              <span className="text-sm">
                I accept the{" "}
                <a
                  href="/rental-terms"
                  className="text-emerald-700 font-medium hover:underline"
                >
                  Rental Terms &amp; Conditions
                </a>{" "}
                and understand that the security deposit will be refunded after
                returning the item(s) in good condition otherwise it will be
                retained.
              </span>
            </label>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting || compressing}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting
                  ? "Submitting..."
                  : compressing
                  ? "Processing Images..."
                  : "Submit & Go to Checkout"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <MessageModal
        isOpen={msgModal.isOpen}
        onClose={() => setMsgModal((p) => ({ ...p, isOpen: false }))}
        title={msgModal.title}
        message={msgModal.message}
        type={msgModal.type}
      />
    </div>
  );
}
