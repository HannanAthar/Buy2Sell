import {
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Shield,
  Truck,
  Clock,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import HoverWrapper from "./common/HoverWrapper.jsx";

const Footer = () => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <footer className="relative bg-gradient-to-b from-gray-900 to-black text-white overflow-hidden">
      <HoverWrapper className="w-full h-full">
        {/* Decorative Blur */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>

        {/* Top section with features - Staggered Reveal */}
        <div className="border-b border-gray-800 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <motion.div
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-50px" }}
              className="grid grid-cols-1 md:grid-cols-4 gap-6"
            >
              {[
                {
                  icon: Truck,
                  title: "Free Shipping",
                  text: "Orders over Rs. 5,000",
                  color: "green",
                },
                {
                  icon: Shield,
                  title: "Secure Payment",
                  text: "100% Protected",
                  color: "blue",
                },
                {
                  icon: Clock,
                  title: "24/7 Support",
                  text: "Always available",
                  color: "purple",
                },
                {
                  icon: CreditCard,
                  title: "Easy Returns",
                  text: "7 Day Policy",
                  color: "orange",
                },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  variants={item}
                  className={`flex items-center space-x-3 p-4 bg-gradient-to-r from-${feature.color}-500/5 to-${feature.color}-600/5 rounded-2xl border border-${feature.color}-500/20 hover:border-${feature.color}-500/40 transition-colors group cursor-default`}
                >
                  <div
                    className={`bg-${feature.color}-500/10 p-2.5 rounded-xl group-hover:scale-110 transition-transform duration-300`}
                  >
                    <feature.icon
                      size={22}
                      className={`text-${feature.color}-500`}
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm tracking-wide">
                      {feature.title}
                    </h4>
                    <p className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
                      {feature.text}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Main footer content - Staggered columns */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-8 text-center md:text-left"
          >
            {/* Company Info */}
            <motion.div
              variants={item}
              className="flex flex-col items-center md:items-start"
            >
              <div className="flex items-center mb-6 group cursor-default">
                <div className="bg-gradient-to-br from-emerald-500 to-green-600 p-2.5 rounded-xl mr-3 shadow-lg shadow-emerald-900/20 group-hover:shadow-emerald-500/20 transition-all duration-500">
                  <span className="text-white font-bold text-xl">B2S</span>
                </div>
                <span className="text-2xl font-bold tracking-tight">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-500">
                    Buy
                  </span>
                  <span className="text-white mx-0.5">2</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-500">
                    Sell
                  </span>
                </span>
              </div>
              <p className="text-gray-400 mb-8 leading-relaxed text-sm max-w-xs mx-auto md:mx-0">
                Your premier luxury marketplace connecting designers, resellers,
                and buyers. Discover authentic designer pieces and turn your
                luxury wardrobe into profit.
              </p>

              {/* Contact Info */}
              <div className="space-y-4 w-full md:w-auto text-sm">
                <div className="flex items-center justify-center md:justify-start space-x-3 text-gray-400 hover:text-emerald-400 transition-colors group cursor-default">
                  <div className="p-2 bg-gray-800 rounded-lg group-hover:bg-emerald-500/10 transition-colors">
                    <Phone size={16} className="text-emerald-500" />
                  </div>
                  <span>+92 300 4458969</span>
                </div>
                <div className="flex items-center justify-center md:justify-start space-x-3 text-gray-400 hover:text-emerald-400 transition-colors group cursor-default">
                  <div className="p-2 bg-gray-800 rounded-lg group-hover:bg-emerald-500/10 transition-colors">
                    <Mail size={16} className="text-emerald-500" />
                  </div>
                  <span>support@buy2sell.com</span>
                </div>
                <div className="flex items-center justify-center md:justify-start space-x-3 text-gray-400 hover:text-emerald-400 transition-colors group cursor-default">
                  <div className="p-2 bg-gray-800 rounded-lg group-hover:bg-emerald-500/10 transition-colors">
                    <MapPin size={16} className="text-emerald-500" />
                  </div>
                  <span>Lahore, Punjab, Pakistan</span>
                </div>
              </div>
            </motion.div>

            {/* Account */}
            <motion.div
              variants={item}
              className="flex flex-col items-center md:items-start"
            >
              <h3 className="text-lg font-bold text-white mb-8 relative inline-block">
                Account
                <span className="absolute -bottom-2 left-1/2 md:left-0 -translate-x-1/2 md:translate-x-0 w-12 h-1 bg-emerald-500 rounded-full"></span>
              </h3>
              <ul className="space-y-4">
                <li>
                  <Link
                    to="/Designer-Signup"
                    className="text-gray-400 hover:text-emerald-400 transition-all duration-200 flex items-center group text-sm font-medium"
                  >
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0"></span>
                    Designer Registration
                  </Link>
                </li>
                <li>
                  <Link
                    to="/Reseller-Signup"
                    className="text-gray-400 hover:text-emerald-400 transition-all duration-200 flex items-center group text-sm font-medium"
                  >
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0"></span>
                    Reseller Registration
                  </Link>
                </li>
              </ul>
            </motion.div>

            {/* Support */}
            <motion.div
              variants={item}
              className="flex flex-col items-center md:items-start"
            >
              <h3 className="text-lg font-bold text-white mb-8 relative inline-block">
                Support
                <span className="absolute -bottom-2 left-1/2 md:left-0 -translate-x-1/2 md:translate-x-0 w-12 h-1 bg-emerald-500 rounded-full"></span>
              </h3>
              <ul className="space-y-4">
                <li>
                  <Link
                    to="/shipping-info"
                    className="text-gray-400 hover:text-emerald-400 transition-all duration-200 flex items-center group text-sm font-medium"
                  >
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0"></span>
                    Shipping Info
                  </Link>
                </li>
                <li>
                  <Link
                    to="/return-policy"
                    className="text-gray-400 hover:text-emerald-400 transition-all duration-200 flex items-center group text-sm font-medium"
                  >
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0"></span>
                    Return Policy
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="text-gray-400 hover:text-emerald-400 transition-all duration-200 flex items-center group text-sm font-medium"
                  >
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0"></span>
                    Contact Us
                  </Link>
                </li>
              </ul>
            </motion.div>

            {/* Legal & Policies */}
            <motion.div
              variants={item}
              className="flex flex-col items-center md:items-start"
            >
              <h3 className="text-lg font-bold text-white mb-8 relative inline-block">
                Legal
                <span className="absolute -bottom-2 left-1/2 md:left-0 -translate-x-1/2 md:translate-x-0 w-12 h-1 bg-emerald-500 rounded-full"></span>
              </h3>
              <ul className="space-y-4">
                <li>
                  <Link
                    to="/privacy-policy"
                    className="text-gray-400 hover:text-emerald-400 transition-all duration-200 flex items-center group text-sm font-medium"
                  >
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0"></span>
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    to="/terms-of-services"
                    className="text-gray-400 hover:text-emerald-400 transition-all duration-200 flex items-center group text-sm font-medium"
                  >
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0"></span>
                    Terms of Services
                  </Link>
                </li>
                <li>
                  <Link
                    to="/cookie-policy"
                    className="text-gray-400 hover:text-emerald-400 transition-all duration-200 flex items-center group text-sm font-medium"
                  >
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0"></span>
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-16 text-center text-sm text-gray-600 border-t border-gray-900 pt-8"
          >
            © {new Date().getFullYear()} Buy2Sell. All rights reserved.
          </motion.div>
        </div>
      </HoverWrapper>
    </footer>
  );
};

export default Footer;
