import { motion } from "framer-motion";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";
import { Shield, Lock, Eye, Share2, UserCheck, FileText } from "lucide-react";

const PrivacyPolicy = () => {
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
              Privacy Policy
            </h1>
            <p className="text-center text-gray-500 mb-8 max-w-2xl mx-auto">
              Your privacy is important to us. This policy outlines how we
              collect, use, and protect your personal information when you use
              Buy2Sell.
            </p>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
              <div className="p-6 md:p-8 space-y-8">
                {/* Information We Collect */}
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <FileText className="text-blue-600" size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">
                      Information We Collect
                    </h2>
                  </div>
                  <div className="pl-4 md:pl-12 text-gray-600 space-y-3">
                    <p>
                      We collect information that you strictly provide to us
                      directly:
                    </p>
                    <ul className="list-disc space-y-2 ml-4">
                      <li>
                        <strong>Personal Information:</strong> When you
                        register, we collect your name, email address, password,
                        phone number, and for designers/resellers, your brand or
                        business details.
                      </li>
                      <li>
                        <strong>Transaction Information:</strong> Details
                        necessary to process orders, such as shipping address
                        and payment confirmation references.
                      </li>
                      <li>
                        <strong>Usage Data:</strong> Information about how you
                        navigate and interact with our website to improve user
                        experience.
                      </li>
                    </ul>
                  </div>
                </section>

                <hr className="border-gray-100" />

                {/* How We Use Information */}
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <Eye className="text-green-600" size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">
                      How We Use Your Information
                    </h2>
                  </div>
                  <div className="pl-4 md:pl-12 text-gray-600">
                    <p>We use your data to:</p>
                    <ul className="list-disc space-y-2 ml-4 mt-2">
                      <li>Process and fulfill your orders and returns.</li>
                      <li>Manage your account and registration.</li>
                      <li>
                        Provide customer support and respond to inquiries.
                      </li>
                      <li>
                        Send important updates, security alerts, and
                        administrative messages.
                      </li>
                      <li>
                        Verify identities to maintain a safe marketplace
                        environment.
                      </li>
                    </ul>
                  </div>
                </section>

                <hr className="border-gray-100" />

                {/* Data Protection */}
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <Lock className="text-purple-600" size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">
                      Data Protection & Security
                    </h2>
                  </div>
                  <div className="pl-4 md:pl-12 text-gray-600">
                    <p>
                      We implement appropriate technical and organizational
                      measures to safeguard your personal data against
                      unauthorized access, alteration, disclosure, or
                      destruction. However, no internet transmission is
                      completely secure, and we cannot guarantee absolute
                      security.
                    </p>
                  </div>
                </section>

                <hr className="border-gray-100" />

                {/* Sharing */}
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-orange-100 p-2 rounded-lg">
                      <Share2 className="text-orange-600" size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">
                      Third-Party Sharing
                    </h2>
                  </div>
                  <div className="pl-4 md:pl-12 text-gray-600">
                    <p>
                      We do not sell your personal information. We may share
                      your data with trusted third-party service providers who
                      assist us in operating our website, conducting our
                      business, or servicing you (e.g., payment processors,
                      shipping partners), so long as those parties agree to keep
                      this information confidential.
                    </p>
                  </div>
                </section>

                <hr className="border-gray-100" />

                {/* User Rights */}
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-teal-100 p-2 rounded-lg">
                      <UserCheck className="text-teal-600" size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">
                      Your Rights
                    </h2>
                  </div>
                  <div className="pl-4 md:pl-12 text-gray-600">
                    <p>You have the right to:</p>
                    <ul className="list-disc space-y-2 ml-4 mt-2">
                      <li>
                        Access the personal information we hold about you.
                      </li>
                      <li>
                        Request correction of inaccurate or incomplete data.
                      </li>
                      <li>
                        Request deletion of your account and personal data,
                        subject to legal obligations.
                      </li>
                      <li>Opt-out of marketing communications.</li>
                    </ul>
                  </div>
                </section>

                <hr className="border-gray-100" />

                {/* Last Updated */}
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-gray-100 p-2 rounded-lg">
                      <Shield className="text-gray-600" size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">
                      Updates to This Policy
                    </h2>
                  </div>
                  <div className="pl-4 md:pl-12 text-gray-600">
                    <p>
                      We may update this privacy policy from time to time. We
                      will notify you of any significant changes by posting the
                      new policy on this page with an updated "Effective Date".
                    </p>
                    <p className="mt-4 text-sm text-gray-500">
                      Effective Date: December 25, 2024
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

export default PrivacyPolicy;
