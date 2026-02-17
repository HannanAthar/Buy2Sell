import { motion, useInView, animate } from "framer-motion";
import {
  Shield,
  ShoppingBag,
  Palette,
  Truck,
  CheckCircle,
  CreditCard,
  RefreshCw,
  Star,
  Users,
  Search,
  Lock,
  Heart,
  ChevronDown,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
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
    transition={{ duration: 0.25, delay }}
  >
    {children}
  </motion.div>
);

const Counter = ({ value }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  // Parse value: "50,000+" -> num: 50000, suffix: "+"
  const num = parseInt(
    value.replace(/,/g, "").replace(/\+/g, "").replace(/%/g, ""),
    10
  );
  const suffix = value.replace(/[0-9,]/g, "");

  useEffect(() => {
    if (inView) {
      const node = ref.current;
      const controls = animate(0, num, {
        duration: 2.5,
        ease: "easeOut",
        onUpdate(v) {
          if (node) {
            node.textContent = Math.round(v).toLocaleString();
          }
        },
      });
      return () => controls.stop();
    }
  }, [inView, num]);

  return (
    <span>
      <span ref={ref}>0</span>
      {suffix}
    </span>
  );
};

const LearnMore = () => {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (idx) => setOpenFaq(openFaq === idx ? null : idx);

  const stats = [
    { label: "Happy Customers", value: "50,000+", icon: Users },
    { label: "Verified Designers", value: "500+", icon: Palette },
    { label: "Successful Rentals", value: "10,000+", icon: RefreshCw },
    { label: "Satisfaction Rate", value: "95%", icon: Heart },
  ];

  const faqs = [
    {
      q: "How does the rental system work?",
      a: "Choose the 'Rent' option on eligible products, select your duration, and pay the rental fee plus security deposit. Enjoy your item and return it in the original condition to get your deposit back.",
    },
    {
      q: "Are all designers verified?",
      a: "Yes! Every designer and reseller on Buy2Sell undergoes a strict verification process, including CNIC checks, business proof, and quality auditing to ensure authenticity.",
    },
    {
      q: "What payment methods are accepted?",
      a: "We accept Credit/Debit Cards, Bank Transfer, Easypaisa, JazzCash, and Cash on Delivery for your convenience.",
    },
    {
      q: "How is item authenticity ensured?",
      a: "Our dedicated verification team physically inspects luxury items and checks authenticity certificates before they are listed or shipped.",
    },
    {
      q: "What if I receive a damaged item?",
      a: "You are covered by our 100% Buyer Protection. Report the issue within 24 hours of delivery for an immediate replacement or full refund.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Header />

      {/* 1. HERO SECTION */}
      <div className="relative bg-emerald-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/40 z-10" />
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop')",
          }}
        />
        <div className="relative z-20 max-w-7xl mx-auto px-6 py-32 md:py-48 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6"
          >
            Why Buy2Sell is Pakistan's <br className="hidden md:block" />
            Leading Fashion Marketplace
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-emerald-100 max-w-3xl mx-auto mb-10"
          >
            Discover the platform revolutionizing fashion commerce with secure
            rentals, verified designers, and premium buyer protection.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              to="/designers"
              className="bg-[var(--primary-green)] hover:bg-[var(--dark-green)] text-white px-8 py-4 rounded-full font-bold text-lg transition-transform hover:scale-105 shadow-lg"
            >
              Start Exploring
            </Link>
            <Link
              to="/designer-signup"
              className="bg-white text-emerald-900 hover:bg-emerald-50 px-8 py-4 rounded-full font-bold text-lg transition-transform hover:scale-105 shadow-lg"
            >
              Join as Designer
            </Link>
          </motion.div>
        </div>
      </div>

      {/* 2. KEY FEATURES */}
      <Section>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              A Platform for Everyone
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Whether you want to shop, sell, or rent, Buy2Sell offers tailored
              features to meet your fashion needs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Column 1: For Buyers */}
            <FadeIn delay={0.1}>
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 h-full hover:shadow-md transition">
                <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center mb-6">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-4">For Fashion Lovers</h3>
                <ul className="space-y-3">
                  {[
                    "Access to 500+ Verified Designers",
                    "Rent & Buy Options",
                    "Authentic Luxury Items",
                    "100% Buyer Protection",
                  ].map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start text-slate-600 text-sm"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-500 mr-2 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>

            {/* Column 2: For Designers */}
            <FadeIn delay={0.2}>
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 h-full hover:shadow-md transition">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
                  <Palette className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-4">For Designers</h3>
                <ul className="space-y-3">
                  {[
                    "Showcase to 50,000+ Users",
                    "Zero Commission Fees on Sales",
                    "Rental Revenue Stream",
                    "Marketing Support",
                  ].map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start text-slate-600 text-sm"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-500 mr-2 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>

            {/* Column 3: For Resellers */}
            <FadeIn delay={0.3}>
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 h-full hover:shadow-md transition">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-4">For Resellers</h3>
                <ul className="space-y-3">
                  {[
                    "Sell Pre-loved Luxury",
                    "Verified Authentication Service",
                    "Easy Inventory Management",
                    "Dedicated Support Team",
                  ].map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start text-slate-600 text-sm"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-500 mr-2 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>

            {/* Column 4: Platform Benefits */}
            <FadeIn delay={0.4}>
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 h-full hover:shadow-md transition">
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-6">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-4">Why Trust Us</h3>
                <ul className="space-y-3">
                  {[
                    "Secure Payment Gateway",
                    "Verified Seller Program",
                    "Quality Assurance",
                    "24/7 Customer Support",
                  ].map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start text-slate-600 text-sm"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-500 mr-2 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
          </div>
        </div>
      </Section>

      {/* 3. HOW IT WORKS */}
      <div className="bg-emerald-900 py-20 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-emerald-200">
              Your journey to premium fashion in 3 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 text-center relative">
            {/* Connector Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-emerald-700 -z-0" />

            {/* Step 1 */}
            <FadeIn delay={0.1}>
              <div className="relative z-10">
                <div className="w-24 h-24 bg-emerald-800 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-emerald-900 shadow-xl">
                  <Search className="w-10 h-10 text-emerald-300" />
                </div>
                <h3 className="text-xl font-bold mb-3">1. Explore & Choose</h3>
                <p className="text-emerald-100 text-sm leading-relaxed">
                  Browse thousands of verified items. Filter by designer, price,
                  or rental availability to find your perfect match.
                </p>
              </div>
            </FadeIn>

            {/* Step 2 */}
            <FadeIn delay={0.3}>
              <div className="relative z-10">
                <div className="w-24 h-24 bg-emerald-800 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-emerald-900 shadow-xl">
                  <CreditCard className="w-10 h-10 text-emerald-300" />
                </div>
                <h3 className="text-xl font-bold mb-3">2. Transact Safely</h3>
                <p className="text-emerald-100 text-sm leading-relaxed">
                  Checkout securely with multiple payment options. We hold funds
                  in escrow for high-value items until you are satisfied.
                </p>
              </div>
            </FadeIn>

            {/* Step 3 */}
            <FadeIn delay={0.5}>
              <div className="relative z-10">
                <div className="w-24 h-24 bg-emerald-800 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-emerald-900 shadow-xl">
                  <Star className="w-10 h-10 text-emerald-300" />
                </div>
                <h3 className="text-xl font-bold mb-3">3. Enjoy & Grow</h3>
                <p className="text-emerald-100 text-sm leading-relaxed">
                  Get fast delivery across Pakistan. Enjoy your new look, or
                  start selling to build your own fashion empire!
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>

      {/* 4. STATISTICS */}
      <Section className="bg-emerald-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="text-center">
                  <stat.icon className="w-8 h-8 mx-auto text-[var(--primary-green)] mb-4" />
                  <div className="text-4xl font-extrabold text-slate-900 mb-1">
                    <Counter value={stat.value} />
                  </div>
                  <div className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                    {stat.label}
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </Section>

      {/* 5. SUCCESS STORIES (Testimonials) */}
      <Section>
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">
            Success Stories
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FadeIn delay={0.1}>
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 relative">
                <div className="text-emerald-300 absolute top-6 right-6">
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M14.017 21L14.017 18C14.017 16.896 14.353 15.923 15.026 15.08C15.698 14.237 16.746 13.682 18.169 13.414C18.428 13.364 18.243 13.048 18.169 13.298V11.231C16.897 11.458 15.897 12.019 15.168 12.914C14.439 13.809 14.074 14.965 14.074 16.382V21H14.017ZM8.003 21L8.003 18C8.003 16.896 8.339 15.923 9.011 15.08C9.684 14.237 10.732 13.682 12.155 13.414C12.414 13.364 12.23 13.048 12.155 13.298V11.231C10.883 11.458 9.883 12.019 9.154 12.914C8.425 13.809 8.06 14.965 8.06 16.382V21H8.003Z" />
                  </svg>
                </div>
                <p className="text-slate-600 mb-6 relative z-10 italic">
                  "Buy2Sell helped me grow my boutique from 10 to 100+ monthly
                  orders. The rental feature doubled my revenue!"
                </p>
                <div>
                  <h4 className="font-bold text-slate-900">
                    Ayesha's Boutique
                  </h4>
                  <p className="text-sm text-emerald-600">Verified Designer</p>
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 relative">
                <div className="text-emerald-300 absolute top-6 right-6">
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M14.017 21L14.017 18C14.017 16.896 14.353 15.923 15.026 15.08C15.698 14.237 16.746 13.682 18.169 13.414C18.428 13.364 18.243 13.048 18.169 13.298V11.231C16.897 11.458 15.897 12.019 15.168 12.914C14.439 13.809 14.074 14.965 14.074 16.382V21H14.017ZM8.003 21L8.003 18C8.003 16.896 8.339 15.923 9.011 15.08C9.684 14.237 10.732 13.682 12.155 13.414C12.414 13.364 12.23 13.048 12.155 13.298V11.231C10.883 11.458 9.883 12.019 9.154 12.914C8.425 13.809 8.06 14.965 8.06 16.382V21H8.003Z" />
                  </svg>
                </div>
                <p className="text-slate-600 mb-6 relative z-10 italic">
                  "I rented a designer gown for my wedding at 1/4th the price.
                  It arrived in perfect condition. Amazing service!"
                </p>
                <div>
                  <h4 className="font-bold text-slate-900">Sarah K.</h4>
                  <p className="text-sm text-emerald-600">Happy Customer</p>
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.3}>
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 relative">
                <div className="text-emerald-300 absolute top-6 right-6">
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M14.017 21L14.017 18C14.017 16.896 14.353 15.923 15.026 15.08C15.698 14.237 16.746 13.682 18.169 13.414C18.428 13.364 18.243 13.048 18.169 13.298V11.231C16.897 11.458 15.897 12.019 15.168 12.914C14.439 13.809 14.074 14.965 14.074 16.382V21H14.017ZM8.003 21L8.003 18C8.003 16.896 8.339 15.923 9.011 15.08C9.684 14.237 10.732 13.682 12.155 13.414C12.414 13.364 12.23 13.048 12.155 13.298V11.231C10.883 11.458 9.883 12.019 9.154 12.914C8.425 13.809 8.06 14.965 8.06 16.382V21H8.003Z" />
                  </svg>
                </div>
                <p className="text-slate-600 mb-6 relative z-10 italic">
                  "Sold 50+ pre-loved luxury bags in 3 months. The
                  authentication service builds instant trust with buyers!"
                </p>
                <div>
                  <h4 className="font-bold text-slate-900">
                    Luxury Resale Hub
                  </h4>
                  <p className="text-sm text-emerald-600">Top Reseller</p>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </Section>

      {/* 6. COMPARISON TABLE */}
      <Section className="bg-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">
            Smart Shopping vs. Traditional
          </h2>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-sm uppercase tracking-wide text-slate-500">
                    <th className="p-6 font-semibold">Feature</th>
                    <th className="p-6 font-bold text-emerald-700 bg-emerald-50/50">
                      Buy2Sell
                    </th>
                    <th className="p-6 font-semibold">Traditional Stores</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    ["Price Range", "Budget to Luxury", "Usually Fixed"],
                    ["Options", "Rent & Buy", "Only Purchase"],
                    [
                      "Designer Access",
                      "500+ Verified Designers",
                      "Limited Selection",
                    ],
                    [
                      "Verification",
                      "100% Authenticity Check",
                      "Varies / None",
                    ],
                    ["Delivery", "Nationwide Shipping", "Store Dependent"],
                    ["Returns", "Easy 7-Day Policy", "Strict / No Returns"],
                  ].map(([feature, us, them], i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition">
                      <td className="p-6 font-medium text-slate-900">
                        {feature}
                      </td>
                      <td className="p-6 text-emerald-700 bg-emerald-50/20 font-medium">
                        {us}
                      </td>
                      <td className="p-6 text-slate-500">{them}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Section>

      {/* 7. FAQ */}
      <Section>
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((item, i) => (
              <div
                key={i}
                className="border border-slate-200 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full flex items-center justify-between p-6 bg-white hover:bg-slate-50 transition text-left"
                >
                  <span className="font-semibold text-lg text-slate-900">
                    {item.q}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: openFaq === i ? "auto" : 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-6 pt-0 text-slate-600 bg-white border-t border-slate-100/50">
                    {item.a}
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* 8. CALL TO ACTION */}
      <Section className="bg-emerald-900 text-white text-center py-24">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            Ready to Transform Your Wardrobe?
          </h2>
          <div className="grid md:grid-cols-2 gap-8 mt-12">
            <div className="bg-emerald-800/50 p-8 rounded-2xl border border-emerald-700 backdrop-blur-sm">
              <h3 className="text-2xl font-bold mb-3">For Customers</h3>
              <p className="text-emerald-100 mb-6">
                Join 50,000+ fashion enthusiasts discovering unique styles
                daily.
              </p>
              <Link
                to="/"
                className="inline-block w-full bg-white text-emerald-900 hover:bg-emerald-50 py-3 rounded-lg font-bold transition shadow-md"
              >
                Start Shopping
              </Link>
            </div>
            <div className="bg-emerald-800/50 p-8 rounded-2xl border border-emerald-700 backdrop-blur-sm">
              <h3 className="text-2xl font-bold mb-3">For Business</h3>
              <p className="text-emerald-100 mb-6">
                Reach thousands of customers and grow your fashion business.
              </p>
              <div className="flex gap-2">
                <Link
                  to="/designer-signup"
                  className="flex-1 bg-[var(--primary-green)] hover:bg-[var(--dark-green)] text-white py-3 rounded-lg font-bold transition shadow-md"
                >
                  As Designer
                </Link>
                <Link
                  to="/Reseller-Signup"
                  className="flex-1 bg-[var(--primary-green)] hover:bg-[var(--dark-green)] text-white py-3 rounded-lg font-bold transition shadow-md"
                >
                  As Reseller
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Footer />
    </div>
  );
};

export default LearnMore;
