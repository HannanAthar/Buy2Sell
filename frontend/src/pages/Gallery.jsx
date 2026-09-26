import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";

// Curated gallery items (Korean/Anime Aesthetic Vibe)
const galleryItems = [
  {
    id: 1,
    src: "https://images.unsplash.com/photo-1549584483-e028b1464b63?q=80&w=800",
    tag: "Anime Stitched Tee",
    category: "T-Shirt",
  },
  {
    id: 2,
    src: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800",
    tag: "Korean Streetwear",
    category: "T-Shirt",
  },
  {
    id: 3,
    src: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800",
    tag: "Oversized Street Hoodie",
    category: "Hoodie",
  },
  {
    id: 4,
    src: "https://images.unsplash.com/photo-1614975058782-b7e17424422e?q=80&w=800",
    tag: "Graphic Anime Hoodie",
    category: "Hoodie",
  },
  {
    id: 5,
    src: "https://images.unsplash.com/photo-1553531384-cc64ac80f931?q=80&w=800",
    tag: "Printed Aesthetic Polo",
    category: "Polo",
  },
  {
    id: 6,
    src: "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?q=80&w=800",
    tag: "Techwear T-Shirt",
    category: "T-Shirt",
  },
  {
    id: 7,
    src: "https://images.unsplash.com/photo-1517551061971-ce4a64dcf2e8?q=80&w=800",
    tag: "Subtle Korean Sweatshirt",
    category: "Sweatshirt",
  },
  {
    id: 8,
    src: "https://images.unsplash.com/photo-1520975954732-57dd06d64195?q=80&w=800",
    tag: "Street Fashion Tee",
    category: "T-Shirt",
  },
  {
    id: 9,
    src: "https://images.unsplash.com/photo-1522083165195-3424ed129620?q=80&w=800",
    tag: "K-Pop Inspired Polo",
    category: "Polo",
  },
  {
    id: 10,
    src: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800",
    tag: "Pastel Color Hoodie",
    category: "Hoodie",
  },
  {
    id: 11,
    src: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=800",
    tag: "Vintage Oversized Print",
    category: "Sweatshirt",
  },
  {
    id: 12,
    src: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?q=80&w=800",
    tag: "Minimalist Cut T-Shirt",
    category: "T-Shirt",
  },
];

const categories = ["All", "T-Shirt", "Hoodie", "Sweatshirt", "Polo"];

const Gallery = () => {
  const [filter, setFilter] = useState("All");
  const [lightbox, setLightbox] = useState(null);

  const filtered = filter === "All" ? galleryItems : galleryItems.filter((g) => g.category === filter);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Header />

      {/* Hero */}
      <div className="relative bg-slate-900 text-white overflow-hidden py-28 md:py-36 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/40 via-slate-900 to-slate-900" />
        <div className="relative z-10 max-w-3xl mx-auto px-6">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-5"
          >
            Design Inspiration
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-extrabold tracking-tight mb-5"
          >
            Gallery
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-300 text-lg max-w-xl mx-auto"
          >
            Browse examples of custom clothing made through our studio. Let these inspire your next design.
          </motion.p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`shrink-0 px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                filter === cat
                  ? "bg-emerald-600 text-white shadow"
                  : "bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Masonry Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <motion.div
          layout
          className="columns-2 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4"
        >
          <AnimatePresence>
            {filtered.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="break-inside-avoid rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow cursor-pointer group relative mb-4"
                onClick={() => setLightbox(item)}
              >
                <img
                  src={item.src}
                  alt={item.tag}
                  className="w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="absolute bottom-0 left-0 w-full p-3 bg-gradient-to-t from-black/60 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <span className="text-white text-xs font-bold">{item.tag}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-2xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img src={lightbox.src} alt={lightbox.tag} className="w-full object-cover" />
              <div className="p-5 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">{lightbox.tag}</p>
                  <p className="text-sm text-slate-500">{lightbox.category}</p>
                </div>
                <Link
                  to="/designer-tool"
                  className="bg-emerald-600 text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-emerald-700 transition"
                >
                  Design Similar
                </Link>
              </div>
              <button
                onClick={() => setLightbox(null)}
                className="absolute top-3 right-3 w-9 h-9 bg-black/40 rounded-full flex items-center justify-center text-white hover:bg-black/60 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA */}
      <section className="bg-emerald-900 text-white py-20 text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Inspired? Start Designing.</h2>
          <p className="text-emerald-200 mb-8">Jump into the studio and create your own version of any style you love.</p>
          <Link
            to="/designer-tool"
            className="inline-block bg-white text-emerald-900 font-bold px-10 py-4 rounded-full text-lg hover:bg-emerald-50 transition-transform hover:scale-105 shadow-lg"
          >
            Open the Studio
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Gallery;
