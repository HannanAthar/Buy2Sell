import { motion } from "framer-motion";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";
import {
  Scale,
  Users,
  FileWarning,
  Copyright,
  Ban,
  AlertTriangle,
} from "lucide-react";

const TermsOfServices = () => {
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
              Terms of Service
            </h1>
            <p className="text-center text-gray-500 mb-8 max-w-2xl mx-auto">
              Please read these terms carefully before accessing or using our
              website. By accessing or using any part of the site, you agree to
              be bound by these Terms of Service.
            </p>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
              <div className="p-6 md:p-8 space-y-8">
                {/* Registration */}
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Users className="text-blue-600" size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">
                      Account Registration
                    </h2>
                  </div>
                  <div className="pl-4 md:pl-12 text-gray-600">
                    <p>
                      To use certain features of the Site, you may be required
                      to register for an account. You agree to provide accurate,
                      current, and complete information during the registration
                      process and to update such information to keep it
                      accurate, current, and complete. You are responsible for
                      safeguarding your password and for all activities that
                      occur under your account.
                    </p>
                  </div>
                </section>

                <hr className="border-gray-100" />

                {/* Prohibited Activities */}
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-red-100 p-2 rounded-lg">
                      <Ban className="text-red-600" size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">
                      Prohibited Activities
                    </h2>
                  </div>
                  <div className="pl-4 md:pl-12 text-gray-600 space-y-2">
                    <p>
                      You agree not to engage in any of the following prohibited
                      activities:
                    </p>
                    <ul className="list-disc space-y-2 ml-4">
                      <li>
                        Violating any applicable laws, regulations, or
                        third-party rights.
                      </li>
                      <li>Posting false, misleading, or deceptive content.</li>
                      <li>
                        Distributing viruses or any other technologies that may
                        harm the Site or the interests of its users.
                      </li>
                      <li>
                        Interfering with the proper working of the Site or
                        imposing an unreasonable load on our infrastructure.
                      </li>
                      <li>Selling counterfeit or stolen items.</li>
                    </ul>
                  </div>
                </section>

                <hr className="border-gray-100" />

                {/* Intellectual Property */}
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <Copyright className="text-purple-600" size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">
                      Intellectual Property Rights
                    </h2>
                  </div>
                  <div className="pl-4 md:pl-12 text-gray-600">
                    <p>
                      The Site and its original content, features, and
                      functionality are owned by Buy2Sell and are protected by
                      international copyright, trademark, patent, trade secret,
                      and other intellectual property or proprietary rights
                      laws. User-generated content remains the property of the
                      user, but by posting, you grant Buy2Sell a license to use
                      it for platform purposes.
                    </p>
                  </div>
                </section>

                <hr className="border-gray-100" />

                {/* Liability */}
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-orange-100 p-2 rounded-lg">
                      <AlertTriangle className="text-orange-600" size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">
                      Limitation of Liability
                    </h2>
                  </div>
                  <div className="pl-4 md:pl-12 text-gray-600">
                    <p>
                      In no event shall Buy2Sell, its directors, employees,
                      partners, agents, suppliers, or affiliates, be liable for
                      any indirect, incidental, special, consequential or
                      punitive damages, including without limitation, loss of
                      profits, data, use, goodwill, or other intangible losses,
                      resulting from your access to or use of or inability to
                      access or use the Service.
                    </p>
                  </div>
                </section>

                <hr className="border-gray-100" />

                {/* Termination */}
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-gray-100 p-2 rounded-lg">
                      <FileWarning className="text-gray-600" size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">
                      Termination
                    </h2>
                  </div>
                  <div className="pl-4 md:pl-12 text-gray-600">
                    <p>
                      We may terminate or suspend your account and bar access to
                      the Service immediately, without prior notice or
                      liability, under our sole discretion, for any reason
                      whatsoever and without limitation, including but not
                      limited to a breach of the Terms.
                    </p>
                  </div>
                </section>

                <hr className="border-gray-100" />

                {/* Governing Law */}
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <Scale className="text-green-600" size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">
                      Governing Law
                    </h2>
                  </div>
                  <div className="pl-4 md:pl-12 text-gray-600">
                    <p>
                      These Terms shall be governed and construed in accordance
                      with the laws of Pakistan, without regard to its conflict
                      of law provisions.
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

export default TermsOfServices;
