// SubmissionSuccess.jsx
"use client";
import { Link } from "react-router-dom";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";
import { CheckCircle, Home } from "lucide-react";

export default function SubmissionSuccess() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50">
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-6 flex items-center gap-3">
            <CheckCircle className="h-6 w-6" />
            <h1 className="text-2xl font-extrabold">Thank you for submitting your product!</h1>
          </div>

          <div className="p-8 space-y-6 text-gray-800">
            <p className="text-gray-600">
              Before your product can go live on our website, please follow the steps below:
            </p>

            <section className="space-y-2">
              <h2 className="text-lg font-bold">📦 Step 1: Package Your Product</h2>
              <p>Make sure the product is in the same condition as described (New / Used / Refurbished).</p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold">🚚 Step 2: Send to Our Verification Center</h2>
              <div className="rounded-xl border bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-700">Shipping Address:</p>
                <address className="not-italic leading-6">
                  Riphah<br />
                  Riwind<br />
                  Lahore, 54770<br />
                  Pakistan
                </address>
              </div>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold">🔍 Step 3: Verification Process</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Our team will inspect the product for authenticity and quality.</li>
                <li>Once verified, your product will be marked as “Live” and visible to buyers.</li>
                <li>If the product fails verification, you will be notified and the product will be returned.</li>
              </ul>
            </section>

            <section className="border-t pt-4">
              <h3 className="text-base font-bold">⚠️ Important Notes</h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                <li>Products will not be published until verification is complete.</li>
                <li>You are responsible for shipping costs to the verification center.</li>
              </ul>
            </section>

            <div className="pt-2">
              <Link
                to="/"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold shadow"
              >
                <Home className="h-5 w-5" />
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
