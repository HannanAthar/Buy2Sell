// CheckoutCancel.jsx
"use client"

import { XCircle } from "lucide-react"
import { Link } from "react-router-dom"
import Header from "./Header"
import Footer from "./Footer"

export default function CheckoutCancel() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <XCircle className="h-14 w-14 mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Payment cancelled</h1>
          <p className="text-gray-600 mb-6 text-sm">
            Your Stripe payment was cancelled. You can try again or change your payment method.
          </p>
          <Link
            to="/cart"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
          >
            Back to cart
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
