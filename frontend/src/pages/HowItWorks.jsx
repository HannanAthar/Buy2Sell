import { motion } from "framer-motion";
import { Palette, Scissors, Truck, CheckCircle, MessageCircle, Package } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";

const steps = [
  {
    icon: Palette,
    step: "01",
    title: "Open the Design Studio",
    description:
      "Browse our base garment collection and launch our interactive 3D design tool. No design experience needed — it's fully visual and intuitive.",
    color: "emerald",
  },
  {
    icon: MessageCircle,
    step: "02",
    title: "Customize Every Detail",
    description:
      "Add your own text, upload logos or images, pick colors, choose fabric patterns, and preview the garment in real time from all angles.",
    color: "green",
  },
  {
    icon: Package,
    step: "03",
    title: "Place Your Order",
    description:
      "Select your size, review your design, and securely checkout. We accept cards, bank transfer, Easypaisa, and JazzCash.",
    color: "teal",
  },
  {
    icon: Scissors,
    step: "04",
    title: "We Craft Your Garment",
    description:
      "Our master tailors and premium printing machines bring your design to life with care, ensuring perfect quality in every stitch.",
    color: "emerald",
  },
  {
    icon: Truck,
    step: "05",
    title: "Delivered to Your Door",
    description:
      "Your unique custom clothing is securely packed and shipped nationwide across Pakistan — typically within 5–10 business days.",
    color: "green",
  },
  {
    icon: CheckCircle,
    step: "06",
    title: "Love It or We Fix It",
    description:
      "We stand behind our quality. If something isn't right, our support team will work with you to make it perfect.",
    color: "teal",
  },
];

const FadeIn = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
  >
    {children}
  </motion.div>
);

const HowItWorks = () => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Header />

      {/* Hero */}
      <div className="relative bg-emerald-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/50 z-10" />
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=2074&auto=format&fit=crop')",
          }}
        />
        <div className="relative z-20 max-w-4xl mx-auto px-6 py-32 md:py-44 text-center">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-block bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-5"
          >
            Simple. Transparent. Premium.
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6"
          >
            How It Works
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-emerald-100 max-w-2xl mx-auto"
          >
            From concept to doorstep — here is exactly how we transform your creative vision into a premium custom garment.
          </motion.p>
        </div>
      </div>

      {/* Steps Grid */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300 group h-full">
                  <div className="flex items-start gap-5">
                    <div className="shrink-0 w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                      <s.icon className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <span className="text-xs font-black uppercase tracking-widest text-emerald-500 block mb-1">Step {s.step}</span>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">{s.title}</h3>
                      <p className="text-slate-500 text-sm leading-relaxed">{s.description}</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-emerald-900 text-white py-20 text-center">
        <div className="max-w-3xl mx-auto px-6">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Create Your Piece?</h2>
            <p className="text-emerald-200 mb-8">Jump into the studio and start designing your own custom clothing today.</p>
            <Link
              to="/designer-tool"
              className="inline-block bg-white text-emerald-900 font-bold px-10 py-4 rounded-full text-lg hover:bg-emerald-50 transition-transform hover:scale-105 shadow-lg"
            >
              Open the Studio
            </Link>
          </FadeIn>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HowItWorks;
