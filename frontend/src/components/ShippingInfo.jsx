import { motion } from "framer-motion";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";
import {
  Truck,
  Clock,
  Globe,
  MapPin,
  AlertCircle,
  Package,
} from "lucide-react";

const ShippingInfo = () => {
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
              Shipping Information
            </h1>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
              <div className="p-6 md:p-8 space-y-8">
                {/* Shipping Methods section */}
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <Truck className="text-green-600" size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">
                      Shipping Methods & Delivery Times
                    </h2>
                  </div>
                  <div className="space-y-4 pl-4 md:pl-12">
                    <p className="text-gray-600">
                      We offer reliable shipping options to ensure your items
                      arrive safely and on time. Delivery times may vary
                      depending on your location.
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                        <h3 className="font-semibold text-gray-800 mb-2">
                          Standard Shipping
                        </h3>
                        <p className="text-sm text-gray-600">
                          3-5 Business Days
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Free for orders over Rs. 5,000
                        </p>
                      </div>
                      <div className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                        <h3 className="font-semibold text-gray-800 mb-2">
                          Express Shipping
                        </h3>
                        <p className="text-sm text-gray-600">
                          1-2 Business Days
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Flat rate of Rs. 250
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <hr className="border-gray-100" />

                {/* Shipping Costs section */}
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Package className="text-blue-600" size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">
                      Shipping Costs & Free Shipping
                    </h2>
                  </div>
                  <div className="pl-4 md:pl-12 text-gray-600 space-y-3">
                    <p>
                      Shipping costs are calculated based on the weight of your
                      order and the delivery location. You can view the exact
                      shipping cost at checkout before completing your purchase.
                    </p>
                    <div className="bg-green-50 text-green-800 px-4 py-3 rounded-lg border border-green-100 inline-block">
                      <strong>Free Shipping Offer:</strong> Enjoy free standard
                      shipping on all orders totaling Rs. 5,000 or more (after
                      discounts).
                    </div>
                  </div>
                </section>

                <hr className="border-gray-100" />

                {/* International section */}
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <Globe className="text-purple-600" size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">
                      International Shipping
                    </h2>
                  </div>
                  <div className="pl-4 md:pl-12 text-gray-600">
                    <p>
                      Currently, Buy2Sell primarily serves customers within
                      Pakistan. For international shipping inquiries, please
                      contact our support team directly as rates and
                      availability vary significantly by region. International
                      orders may be subject to customs duties and taxes which
                      are the responsibility of the recipient.
                    </p>
                  </div>
                </section>

                <hr className="border-gray-100" />

                {/* Tracking section */}
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-orange-100 p-2 rounded-lg">
                      <Clock className="text-orange-600" size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">
                      Order Tracking
                    </h2>
                  </div>
                  <div className="pl-4 md:pl-12 text-gray-600">
                    <p>
                      Once your order ships, you will receive a confirmation
                      email containing a tracking number and link. You can also
                      track your order status directly from your{" "}
                      <span className="font-semibold">Account Dashboard</span>{" "}
                      under &quot;My Orders&quot;.
                    </p>
                  </div>
                </section>

                <hr className="border-gray-100" />

                {/* Issues section */}
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-red-100 p-2 rounded-lg">
                      <AlertCircle className="text-red-600" size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">
                      Delivery Issues
                    </h2>
                  </div>
                  <div className="pl-4 md:pl-12 text-gray-600">
                    <p>
                      If your order has not arrived within the estimated
                      timeframe, or if it arrives damaged, please contact our
                      customer support team immediately at{" "}
                      <span className="text-green-600">
                        support@buy2sell.com
                      </span>{" "}
                      or call us at{" "}
                      <span className="text-green-600">+92 300 4458969</span>.
                      We will investigate the issue with the carrier and keep
                      you updated.
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

export default ShippingInfo;
