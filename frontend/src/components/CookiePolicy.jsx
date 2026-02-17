import { motion } from "framer-motion";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";
import { Cookie, Settings, Info, ShieldCheck, List } from "lucide-react";

const CookiePolicy = () => {
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
              Cookie Policy
            </h1>
            <p className="text-center text-gray-500 mb-8 max-w-2xl mx-auto">
              This Cookie Policy explains what cookies are, how we use them, and
              your choices regarding their use.
            </p>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
              <div className="p-6 md:p-8 space-y-8">
                {/* What are cookies */}
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-orange-100 p-2 rounded-lg">
                      <Cookie className="text-orange-600" size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">
                      What Are Cookies
                    </h2>
                  </div>
                  <div className="pl-4 md:pl-12 text-gray-600">
                    <p>
                      Cookies are small text files that are sent to your web
                      browser by a website you visit. A cookie file is stored in
                      your web browser and allows the Service or a third-party
                      to recognize you and make your next visit easier and the
                      Service more useful to you.
                    </p>
                  </div>
                </section>

                <hr className="border-gray-100" />

                {/* Types of cookies */}
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <List className="text-blue-600" size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">
                      Types of Cookies We Use
                    </h2>
                  </div>
                  <div className="pl-4 md:pl-12 text-gray-600 space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        Essential Cookies
                      </h3>
                      <p className="text-sm">
                        These cookies are necessary for the website to function
                        properly. They enable basic functions like page
                        navigation and access to secure areas of the website.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        Analytics Cookies
                      </h3>
                      <p className="text-sm">
                        These cookies help us understand how visitors interact
                        with the website by collecting and reporting information
                        anonymously. This helps us improve our website.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        Functionality Cookies
                      </h3>
                      <p className="text-sm">
                        These cookies allow the website to remember choices you
                        make (such as your user name, language or the region you
                        are in) and provide enhanced, more personal features.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        Advertising Cookies
                      </h3>
                      <p className="text-sm">
                        These cookies are used to track visitors across
                        websites. The intention is to display ads that are
                        relevant and engaging for the individual user.
                      </p>
                    </div>
                  </div>
                </section>

                <hr className="border-gray-100" />

                {/* Third Party */}
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <ShieldCheck className="text-purple-600" size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">
                      Third-Party Cookies
                    </h2>
                  </div>
                  <div className="pl-4 md:pl-12 text-gray-600">
                    <p>
                      In addition to our own cookies, we may also use various
                      third-parties cookies to report usage statistics of the
                      Service, deliver advertisements on and through the
                      Service, and so on.
                    </p>
                  </div>
                </section>

                <hr className="border-gray-100" />

                {/* Cookie Management */}
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <Settings className="text-green-600" size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">
                      Cookie Management
                    </h2>
                  </div>
                  <div className="pl-4 md:pl-12 text-gray-600">
                    <p>
                      If you'd like to delete cookies or instruct your web
                      browser to delete or refuse cookies, please visit the help
                      pages of your web browser. Please note, however, that if
                      you delete cookies or refuse to accept them, you might not
                      be able to use all of the features we offer, you may not
                      be able to store your preferences, and some of our pages
                      might not display properly.
                    </p>
                  </div>
                </section>

                <hr className="border-gray-100" />

                {/* More Info */}
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-gray-100 p-2 rounded-lg">
                      <Info className="text-gray-600" size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">
                      More Information
                    </h2>
                  </div>
                  <div className="pl-4 md:pl-12 text-gray-600">
                    <p>
                      For more information about cookies, you can visit{" "}
                      <a
                        href="https://www.allaboutcookies.org"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:underline"
                      >
                        All About Cookies
                      </a>
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

export default CookiePolicy;
