import { motion } from "framer-motion";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";
import {
  RefreshCcw,
  Calendar,
  CheckSquare,
  XCircle,
  DollarSign,
  HelpCircle,
} from "lucide-react";

const ReturnPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-grow pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Return & Exchange Policy
            </h1>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
              <div className="p-6 md:p-8 space-y-8">
                <div className="bg-green-50 border border-green-100 rounded-lg p-4 flex items-start gap-3">
                  <CheckSquare
                    className="text-green-600 mt-1 shrink-0"
                    size={20}
                  />
                  <div>
                    <h3 className="font-semibold text-[var(--dark-green)]">
                      Hassle-Free Returns
                    </h3>
                    <p className="text-sm text-[var(--dark-green)]">
                      We want you to love your purchase. If you're not
                      completely satisfied, we're here to help.
                    </p>
                  </div>
                </div>

                {/* Eligibility */}
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Calendar className="text-blue-600" size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">
                      Return Eligibility
                    </h2>
                  </div>
                  <div className="pl-4 md:pl-12 text-gray-600 space-y-2">
                    <ul className="list-disc space-y-2 ml-4">
                      <li>
                        You have <strong>7 days</strong> from the date of
                        delivery to initiate a return.
                      </li>
                      <li>
                        Items must be unused, unworn, and in the same condition
                        that you received them.
                      </li>
                      <li>All original tags and packaging must be intact.</li>
                      <li>
                        Proof of purchase (order number or receipt) is required.
                      </li>
                    </ul>
                  </div>
                </section>

                <hr className="border-gray-100" />

                {/* Initiation */}
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <RefreshCcw className="text-purple-600" size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">
                      How to Initiate a Return
                    </h2>
                  </div>
                  <div className="pl-4 md:pl-12 text-gray-600">
                    <p className="mb-4">
                      To start a return, please follow these steps:
                    </p>
                    <ol className="list-decimal space-y-3 ml-4">
                      <li>
                        Log in to your Buy2Sell account and go to{" "}
                        <strong>My Orders</strong>.
                      </li>
                      <li>
                        Select the order containing the item you wish to return.
                      </li>
                      <li>
                        Click on the <strong>Request Return</strong> button and
                        select the reason for return.
                      </li>
                      <li>
                        Our team will review your request and approve it within
                        24-48 hours.
                      </li>
                      <li>
                        Once approved, you will receive a return shipping label
                        via email.
                      </li>
                    </ol>
                  </div>
                </section>

                <hr className="border-gray-100" />

                {/* Non-Returnable */}
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-red-100 p-2 rounded-lg">
                      <XCircle className="text-red-600" size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">
                      Non-Returnable Items
                    </h2>
                  </div>
                  <div className="pl-4 md:pl-12 text-gray-600">
                    <p>The following items cannot be returned or exchanged:</p>
                    <ul className="list-disc space-y-1 ml-4 mt-2">
                      <li>
                        Custom-made or personalized items (unless defective).
                      </li>
                      <li>
                        Intimates, swimwear, or earrings for hygiene reasons.
                      </li>
                      <li>"Final Sale" items.</li>
                      <li>Gift cards.</li>
                    </ul>
                  </div>
                </section>

                <hr className="border-gray-100" />

                {/* Refunds */}
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-[var(--emerald-100)] p-2 rounded-lg">
                      <DollarSign
                        className="text-[var(--primary-green)]"
                        size={24}
                      />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">
                      Refund Process & Timeline
                    </h2>
                  </div>
                  <div className="pl-4 md:pl-12 text-gray-600">
                    <p>
                      Once your return is received and inspected, we will notify
                      you of the approval or rejection of your refund.
                    </p>
                    <ul className="list-disc space-y-2 ml-4 mt-2">
                      <li>
                        <strong>Approved Refunds:</strong> Will be processed,
                        and a credit will automatically be applied to your
                        original method of payment or Buy2Sell wallet within 5-7
                        business days.
                      </li>
                      <li>
                        <strong>Return Shipping Costs:</strong> Unless the
                        return is due to our error (defective or wrong item),
                        the cost of return shipping will be deducted from your
                        refund.
                      </li>
                    </ul>
                  </div>
                </section>

                <hr className="border-gray-100" />

                {/* Support */}
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-orange-100 p-2 rounded-lg">
                      <HelpCircle className="text-orange-600" size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">
                      Questions?
                    </h2>
                  </div>
                  <div className="pl-4 md:pl-12 text-gray-600">
                    <p>
                      If you have any questions regarding our return policy,
                      please contact us at{" "}
                      <span className="text-[var(--primary-green)]">
                        support@buy2sell.com
                      </span>
                      .
                    </p>
                  </div>
                </section>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ReturnPolicy;
