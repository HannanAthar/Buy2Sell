import { motion } from "framer-motion";
import {
  Shirt,
  Palette,
  Truck,
  CheckCircle,
  Star,
  Search,
  Scissors
} from "lucide-react";
import { Link } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

const Section = ({ children, className = "" }) => (
  <section className={`py-16 md:py-24 ${className}`}>{children}</section>
);

const FadeIn = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
  >
    {children}
  </motion.div>
);

const LearnMore = () => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Header />

      {/* 1. HERO SECTION */}
      <div className="relative bg-emerald-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/50 z-10" />
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=2070&auto=format&fit=crop')",
          }}
        />
        <div className="relative z-20 max-w-7xl mx-auto px-6 py-32 md:py-48 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6"
          >
            Wear Your Imagination <br className="hidden md:block" />
            With Buy2Sell Custom
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-emerald-100 max-w-3xl mx-auto mb-10"
          >
            Design, personalize, and order premium quality custom clothing online. Perfect fits, endless customizations.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col flex-wrap sm:flex-row gap-4 justify-center"
          >
            <Link
              to="/designer-tool"
              className="bg-[var(--primary-green)] hover:bg-[var(--dark-green)] text-white px-8 py-4 rounded-full font-bold text-lg transition-transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
            >
              <Shirt className="w-5 h-5"/> Enter Studio
            </Link>
            <Link
              to="/gallery"
              className="bg-white text-emerald-900 hover:bg-emerald-50 px-8 py-4 rounded-full font-bold text-lg transition-transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5"/> View Inspiration
            </Link>
          </motion.div>
        </div>
      </div>

      {/* 2. THE PROCESS */}
      <div className="bg-white py-20 text-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How Customization Works
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Our 3D designer studio gives you pixel-perfect control over your apparel before you even place the order.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 text-center relative">
            {/* Step 1 */}
            <FadeIn delay={0.1}>
              <div className="relative z-10 group">
                <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-emerald-100 shadow-xl group-hover:scale-105 transition-transform">
                  <Palette className="w-10 h-10 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">1. Select & Design</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Choose a base garment and use our interactive studio to add text, change colors, or upload your own logos and decals.
                </p>
              </div>
            </FadeIn>

            {/* Step 2 */}
            <FadeIn delay={0.3}>
              <div className="relative z-10 group">
                <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-emerald-100 shadow-xl group-hover:scale-105 transition-transform">
                  <Scissors className="w-10 h-10 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">2. We Print & Stitch</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Our master tailors and high-end printing hardware take your digital design and translate it into a stunning physical garment.
                </p>
              </div>
            </FadeIn>

            {/* Step 3 */}
            <FadeIn delay={0.5}>
              <div className="relative z-10 group">
                <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-emerald-100 shadow-xl group-hover:scale-105 transition-transform">
                  <Truck className="w-10 h-10 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">3. Fast Delivery</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  We securely package your custom clothing and deliver it to your doorstep nationwide within days.
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default LearnMore;
