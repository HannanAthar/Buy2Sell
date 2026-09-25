import { motion } from "framer-motion";
import { Shirt, Star, Users, Heart, Award } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";

const FadeIn = ({ children, delay = 0, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.55, delay }}
    className={className}
  >
    {children}
  </motion.div>
);

const values = [
  {
    icon: Star,
    title: "Premium Quality",
    description:
      "Every garment is made with high-grade, carefully sourced materials that look great and feel comfortable.",
  },
  {
    icon: Heart,
    title: "Customer First",
    description:
      "We obsess over every detail of the customer experience — from the studio to the moment you unbox your order.",
  },
  {
    icon: Users,
    title: "Built for Everyone",
    description:
      "Whether you want a single custom tee or a bulk order for your crew, we handle it with the same care.",
  },
  {
    icon: Award,
    title: "Made in Pakistan",
    description:
      "We are proud to be a Pakistani brand supporting local craftsmanship, printing talent, and garment manufacturing.",
  },
];

const teamMembers = [
  {
    name: "Hannan Athar",
    role: "Founder & Lead Developer",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&h=400&fit=crop",
  },
  {
    name: "Design Team",
    role: "Creative & UI/UX",
    img: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=400&h=400&fit=crop",
  },
  {
    name: "Production Team",
    role: "Printing & Tailoring",
    img: "https://images.unsplash.com/photo-1488161628813-04466f872be2?q=80&w=400&h=400&fit=crop",
  },
];

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <Header />

      {/* Hero */}
      <div className="relative bg-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-800/60 via-slate-900 to-slate-900" />
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-32 md:py-48 text-center">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-5"
          >
            Our Story
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6"
          >
            We Built the Studio <br className="hidden md:block" />
            Because We Needed It
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
          >
            Buy2Sell started as a final-year project and evolved into a premium custom clothing platform that puts creative control entirely in your hands.
          </motion.p>
        </div>
      </div>

      {/* Mission */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <FadeIn>
            <span className="inline-block text-sm font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full mb-4">
              Our Mission
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6">
              Fashion That's Uniquely Yours
            </h2>
            <p className="text-slate-500 text-lg leading-relaxed mb-6">
              We believe clothing should be an extension of your identity — not a mass-produced item from a rack. Our mission is to make premium custom apparel accessible, fast, and effortless for everyone in Pakistan.
            </p>
            <p className="text-slate-500 text-lg leading-relaxed">
              Through our interactive 3D design studio, anyone — regardless of design experience — can create a garment they'll be proud to wear.
            </p>
          </FadeIn>
          <FadeIn delay={0.15}>
            <div className="relative rounded-3xl overflow-hidden shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=800&auto=format&fit=crop"
                alt="Our workshop"
                className="w-full h-[420px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/40 to-transparent" />
              <div className="absolute bottom-6 left-6">
                <span className="bg-white/90 backdrop-blur-sm text-slate-900 font-bold px-4 py-2 rounded-full text-sm shadow">
                  🇵🇰 Proudly Made in Pakistan
                </span>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-emerald-50 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: "500+", label: "Designs Created" },
              { number: "50+", label: "Happy Customers" },
              { number: "6", label: "Garment Types" },
              { number: "7", label: "Days Avg Delivery" },
            ].map((stat, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="text-4xl font-extrabold text-emerald-700 mb-1">{stat.number}</div>
                <div className="text-sm text-slate-500 font-medium uppercase tracking-wide">{stat.label}</div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">What We Stand For</h2>
            <p className="text-slate-500 max-w-xl mx-auto">The principles that drive every garment we create and every design we help you build.</p>
          </FadeIn>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((v, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="bg-slate-50 p-7 rounded-2xl border border-slate-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300 h-full">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-5">
                    <v.icon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{v.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{v.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">The People Behind Buy2Sell</h2>
            <p className="text-slate-500 mb-14 max-w-xl mx-auto">A passionate team of developers, designers, and craftspeople.</p>
          </FadeIn>
          <div className="grid sm:grid-cols-3 gap-8">
            {teamMembers.map((member, i) => (
              <FadeIn key={i} delay={i * 0.12}>
                <div className="bg-white p-7 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition group">
                  <img
                    src={member.img}
                    alt={member.name}
                    className="w-20 h-20 rounded-full object-cover mx-auto mb-4 ring-4 ring-emerald-100 group-hover:ring-emerald-300 transition"
                  />
                  <h3 className="font-bold text-slate-900">{member.name}</h3>
                  <p className="text-sm text-emerald-600 font-medium">{member.role}</p>
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
            <Shirt className="w-12 h-12 mx-auto mb-5 text-emerald-300" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Create Something Unique?</h2>
            <p className="text-emerald-200 mb-8">Open our 3D studio and design clothing that's purely, entirely you.</p>
            <Link
              to="/designer-tool"
              className="inline-block bg-white text-emerald-900 font-bold px-10 py-4 rounded-full text-lg hover:bg-emerald-50 transition-transform hover:scale-105 shadow-lg"
            >
              Start Designing
            </Link>
          </FadeIn>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutUs;
