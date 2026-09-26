import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";
import { Mail, Phone, MapPin, Send } from "lucide-react";

import { useDialog } from "../context/DialogContext";
import HoverWrapper from "./common/HoverWrapper.jsx";
import { hasXSS } from "../utils/security";

// Removed ScrollIndicator from here
const ContactUs = () => {
  const dialog = useDialog();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  // Scroll Progress only 
  const [scrollProgress, setScrollProgress] = useState(0);

  // Refs for each section
  const heroRef = useRef(null);
  const contactRef = useRef(null);
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

  // Scroll Progress ends here

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



      <div id="footer-section" ref={footerRef}>
        <Footer />
      </div>
    </div>
  );
};

export default ContactUs;
