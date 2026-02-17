import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import Buy2SellChatbot from "./Buy2SellChatbot.jsx";
import { useDialog } from "../context/DialogContext";
import HoverWrapper from "./common/HoverWrapper.jsx";
import { hasXSS } from "../utils/security";

// Scroll Indicator Component
const ScrollIndicator = ({ sections, activeSection }) => {
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offsetTop = element.offsetTop - 100; // Account for header height
      window.scrollTo({
        top: offsetTop,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="fixed right-6 top-1/2 transform -translate-y-1/2 z-50 hidden lg:flex flex-col space-y-4">
      {sections.map((section, index) => (
        <motion.div
          key={section.id}
          className="group relative cursor-pointer flex items-center"
          onClick={() => scrollToSection(section.id)}
          whileHover={{ scale: 1.15 }}
          transition={{ duration: 0.3 }}
        >
          {/* Label - Left side */}
          <div
            className={`absolute right-8 top-1/2 transform -translate-y-1/2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 whitespace-nowrap pointer-events-none border ${
              activeSection === index
                ? "bg-gradient-to-r from-[var(--primary-green)] to-[var(--dark-green)] text-white opacity-100 translate-x-0 shadow-xl border-[var(--primary-green)]"
                : "bg-gray-800 text-white opacity-0 translate-x-6 group-hover:opacity-100 group-hover:translate-x-0 border-gray-600"
            }`}
          >
            {section.label}
          </div>

          {/* Dot - Made smaller and less visible */}
          <div
            className={`w-4 h-4 rounded-full border-2 transition-all duration-300 relative ${
              activeSection === index
                ? "bg-gradient-to-r from-[var(--primary-green)] to-[var(--dark-green)] border-[var(--primary-green)] shadow-lg shadow-[var(--primary-green)]/40 scale-110"
                : "bg-gray-100/60 border-gray-400/60 hover:border-[var(--primary-green)]/70 hover:shadow-md hover:bg-[var(--emerald-50)]/80"
            }`}
          >
            {/* Inner dot for better visibility */}
            <div
              className={`absolute inset-1 rounded-full transition-all duration-300 ${
                activeSection === index
                  ? "bg-white opacity-40"
                  : "bg-gray-300/40 opacity-60"
              }`}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
};
const ContactUs = () => {
  const dialog = useDialog();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  // Scroll indicator state
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState(0);

  // Define sections for scroll indicator
  const sections = [
    { id: "hero-section", label: "Home" },
    { id: "contact-section", label: "Contact" },
    { id: "footer-section", label: "Footer" },
  ];

  // Refs for each section
  const heroRef = useRef(null);
  const contactRef = useRef(null);
  const chatbotRef = useRef(null);
  const footerRef = useRef(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // XSS Validation
    if (hasXSS(form.name) || hasXSS(form.email) || hasXSS(form.message)) {
      dialog.alert(
        "Invalid input detected. Please remove any special characters or scripts.",
        { title: "Security Alert" }
      );
      setIsLoading(false);
      return;
    }

    try {
      const API_BASE_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";

      const response = await axios.post(`${API_BASE_URL}/contact`, form);

      if (response.data.success) {
        dialog.alert("Message sent successfully!", { title: "Success" });
        setForm({ name: "", email: "", message: "" });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMsg =
        error.response?.data?.message ||
        "Failed to send message. Please try again.";
      dialog.alert(errorMsg, { title: "Error" });
    } finally {
      setIsLoading(false);
    }
  };

  // Scroll Progress Indicator
  useEffect(() => {
    const updateScrollProgress = () => {
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.max(
        0,
        Math.min((scrollTop / (scrollHeight * 0.95)) * 100, 100)
      );
      setScrollProgress(progress);
    };

    const handleScroll = () => {
      requestAnimationFrame(updateScrollProgress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    updateScrollProgress();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll indicator observer
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200; // Offset for header

      const sections = [
        { ref: heroRef, index: 0 },
        { ref: contactRef, index: 1 },
        { ref: footerRef, index: 2 },
      ];

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section.ref.current) {
          const sectionTop = section.ref.current.offsetTop;
          const sectionHeight = section.ref.current.offsetHeight;
          const sectionBottom = sectionTop + sectionHeight;

          if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
            setActiveSection(section.index);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [heroRef, contactRef, chatbotRef, footerRef]);

  return (
    <div className="min-h-screen bg-white relative overflow-x-hidden">
      <Header />

      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-black/20 z-[9999]">
        <motion.div
          className="h-full bg-gradient-to-r from-[var(--primary-green)] to-[var(--dark-green)] shadow-lg"
          style={{ width: `${scrollProgress}%` }}
          transition={{ duration: 0.05, ease: "linear" }}
        />
      </div>

      {/* Scroll Indicator */}
      <ScrollIndicator sections={sections} activeSection={activeSection} />

      {/* Hero Banner */}
      <section id="hero-section" ref={heroRef}>
        <HoverWrapper className="bg-gray-900 py-24 text-white text-center">
          <div className="max-w-2xl mx-auto px-4">
            <motion.h1
              className="text-4xl lg:text-5xl font-bold mb-4"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Get in Touch
            </motion.h1>
            <motion.p
              className="text-lg leading-relaxed mb-3"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              We'd love to hear from you! Whether you're a customer, designer,
              or reseller — drop us a message anytime.
            </motion.p>
            <motion.p
              className="text-md text-lime-100 italic"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              You can also chat with our{" "}
              <span className="font-semibold">AI Assistant</span> for quick
              help.
            </motion.p>
          </div>
        </HoverWrapper>
      </section>

      {/* Contact Form and Info */}
      <section id="contact-section" ref={contactRef} className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <motion.form
            onSubmit={handleSubmit}
            className="space-y-6"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={{
              hidden: { opacity: 0, x: -50 },
              show: {
                opacity: 1,
                x: 0,
                transition: {
                  staggerChildren: 0.1,
                },
              },
            }}
          >
            <motion.h2
              className="text-3xl font-bold text-gray-800"
              variants={{
                hidden: { opacity: 0, x: -20 },
                show: { opacity: 1, x: 0 },
              }}
            >
              Send Us a Message
            </motion.h2>
            <motion.input
              type="text"
              name="name"
              placeholder="Your Name"
              value={form.name}
              onChange={handleChange}
              className="w-full border-b p-2 focus:outline-none focus:border-[var(--primary-green)] transition-colors text-base"
              required
              whileFocus={{ scale: 1.02, originX: 0 }}
              transition={{ duration: 0.2 }}
              variants={{
                hidden: { opacity: 0, x: -20 },
                show: { opacity: 1, x: 0 },
              }}
            />
            <motion.input
              type="email"
              name="email"
              placeholder="Your Email"
              value={form.email}
              onChange={handleChange}
              className="w-full border-b p-2 focus:outline-none focus:border-[var(--primary-green)] transition-colors text-base"
              required
              whileFocus={{ scale: 1.02, originX: 0 }}
              transition={{ duration: 0.2 }}
              variants={{
                hidden: { opacity: 0, x: -20 },
                show: { opacity: 1, x: 0 },
              }}
            />
            <motion.textarea
              name="message"
              placeholder="Your Message"
              value={form.message}
              onChange={handleChange}
              rows="5"
              className="w-full border-b p-2 focus:outline-none focus:border-[var(--primary-green)] transition-colors text-base"
              required
              whileFocus={{ scale: 1.02, originX: 0 }}
              transition={{ duration: 0.2 }}
              variants={{
                hidden: { opacity: 0, x: -20 },
                show: { opacity: 1, x: 0 },
              }}
            />

            <motion.button
              type="submit"
              disabled={isLoading}
              className={`bg-[var(--primary-green)] text-white px-6 py-3 rounded-full hover:bg-[var(--dark-green)] flex items-center gap-2 transition-colors ${
                isLoading ? "opacity-70 cursor-not-allowed" : ""
              }`}
              whileHover={isLoading ? {} : { scale: 1.05 }}
              whileTap={isLoading ? {} : { scale: 0.95 }}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send size={18} /> Send Message
                </>
              )}
            </motion.button>
          </motion.form>

          {/* Contact Info */}
          <motion.div
            className="bg-gray-50 p-8 rounded-xl shadow-md"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              Contact Information
            </h2>
            <div className="space-y-4 text-gray-700">
              <motion.div
                className="flex items-start gap-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <Phone size={20} className="text-[var(--primary-green)]" />
                <span>+92 300 4458969</span>
              </motion.div>
              <motion.div
                className="flex items-start gap-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <Mail size={20} className="text-[var(--primary-green)]" />
                <span>support@buy2sell.pk</span>
              </motion.div>
              <motion.div
                className="flex items-start gap-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <MapPin size={20} className="text-[var(--primary-green)]" />
                <span>Lahore, Punjab, Pakistan</span>
              </motion.div>
              <motion.div
                className="mt-6 text-sm text-gray-500"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
              >
                <p>Our team typically responds within 24 hours.</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      <div id="chatbot-section" ref={chatbotRef}>
        <Buy2SellChatbot />
      </div>

      <div id="footer-section" ref={footerRef}>
        <Footer />
      </div>
    </div>
  );
};

export default ContactUs;
