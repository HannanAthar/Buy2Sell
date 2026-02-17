import { useRef, useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import Header from "./Header";
import api from "../api/axios"; // Import axios for API calls
import { readStorage, writeStorage } from "../utils/storage";

/* ——— tiny UI ——— */
const Container = ({ children, className = "" }) => (
  <div className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}>
    {children}
  </div>
);
const Card = ({ children, className = "", ...props }) => (
  <div
    className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}
    {...props}
  >
    {children}
  </div>
);
const Button = ({ children, className = "", ...props }) => (
  <button
    className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 ${className}`}
    {...props}
  >
    {children}
  </button>
);

/* ——— PRODUCT CATALOG (each product has per-color front/back) ———
   Replace the paths with your actual assets. Keep the keys exactly: white, red, black, blue
*/
const PRODUCTS = {
  tshirts: [
    {
      id: 1,
      name: "Cotton Tee",
      defaultColor: "white",
      colors: {
        white: { front: "/c1.png", back: "/c11.png" },
        blue: { front: "/c2.png", back: "/c22.png" },
        red: { front: "/c3.jpg", back: "/c33.jpg" },
        black: { front: "/c4.png", back: "/c44.png" },
      },
    },
    {
      id: 2,
      name: "Hoodies",
      defaultColor: "white",
      colors: {
        white: { front: "/h1.png", back: "/h11.png" },
        blue: { front: "/h2.png", back: "/h22.png" },
        red: { front: "/h3.png", back: "/h33.png" },
        black: { front: "/h4.png", back: "/h44.png" },
      },
    },
    {
      id: 3,
      name: "Baggy Tee",
      defaultColor: "white",
      colors: {
        white: { front: "/b1.png", back: "/b11.png" },
        blue: { front: "/b2.png", back: "/b22.png" },
        red: { front: "/b3.png", back: "/b33.png" },
        black: { front: "/b4.png", back: "/b44.png" },
      },
    },
    {
      id: 4,
      name: "Long Sleeve Tee",
      defaultColor: "white",
      colors: {
        white: { front: "/f1.png", back: "/f11.png" },
        blue: { front: "/f2.png", back: "/f22.png" },
        red: { front: "/f3.png", back: "/f33.png" },
        black: { front: "/f4.png", back: "/f44.png" },
      },
    },
    {
      id: 5,
      name: "Tank Top",
      defaultColor: "white",
      colors: {
        white: { front: "/s1.png", back: "/s11.png" },
        blue: { front: "/s2.png", back: "/s22.png" },
        red: { front: "/s3.png", back: "/s33.png" },
        black: { front: "/s4.png", back: "/s44.png" },
      },
    },
  ],
};

/* ——— allowed color choices (fixed list) ——— */
const COLOR_OPTIONS = [
  { key: "white", label: "White", color: "#ffffff" },
  { key: "red", label: "Red", color: "#ef4444" },
  { key: "black", label: "Black", color: "#000000" },
  { key: "blue", label: "Blue", color: "#3b82f6" },
];

/* ——— NEW: Image Upload Dialog ——— */
function ImageUploadDialog({ file, isOpen, onClose, onApply }) {
  const [removeBg, setRemoveBg] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [processedUrl, setProcessedUrl] = useState(null); // Cache processed image
  const [loading, setLoading] = useState(false);

  // Initial load
  useEffect(() => {
    if (file && isOpen) {
      setPreviewUrl(URL.createObjectURL(file));
      setRemoveBg(false);
      setProcessedUrl(null);
    }
  }, [file, isOpen]);

  // Handle toggle change
  useEffect(() => {
    if (!file || !isOpen) return;

    const updatePreview = async () => {
      if (removeBg) {
        if (processedUrl) {
          setPreviewUrl(processedUrl);
        } else {
          setLoading(true);
          try {
            const url = await removeBackground(file);
            setProcessedUrl(url);
            setPreviewUrl(url);
          } catch (error) {
            console.error("Bg removal failed", error);
            toast.error("Background removal failed");
            setRemoveBg(false); // Revert toggle
          } finally {
            setLoading(false);
          }
        }
      } else {
        setPreviewUrl(URL.createObjectURL(file));
      }
    };

    updatePreview();
  }, [removeBg, file, isOpen, processedUrl]);

  if (!isOpen || !file) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">Customize Image</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Image Preview Container */}
          <div className="relative aspect-square bg-[url('https://res.cloudinary.com/dkxxg886h/image/upload/v1706649178/transparent-bg-pattern_wbdjtd.png')] bg-repeat rounded-xl overflow-hidden border border-gray-200 mb-6 shadow-inner group">
            {loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-2"></div>
                <span className="text-sm text-gray-600 font-medium">Removing Background...</span>
              </div>
            ) : (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-contain transition-all duration-300"
              />
            )}
             <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 text-white text-xs rounded backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                {removeBg ? "Background Removed" : "Original Image"}
             </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="flex flex-col">
              <span className="font-semibold text-gray-800 text-sm">Remove Background</span>
              <span className="text-xs text-gray-500">
                {removeBg ? "Transparent background" : "Keep original background"}
              </span>
            </div>
            
            {/* Toggle Switch */}
            <button
              onClick={() => !loading && setRemoveBg(!removeBg)}
              disabled={loading}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                removeBg ? "bg-blue-600" : "bg-gray-300"
              } ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-300 ${
                  removeBg ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onApply(previewUrl)}
            disabled={loading}
            className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply Image
          </button>
        </div>
      </div>
    </div>
  );
}

/* ——— left toolbar ——— */
const ToolBtn = ({ title, children, disabled, onClick, className = "" }) => (
  <button
    title={title}
    onClick={onClick}
    disabled={disabled}
    className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 ${
      disabled ? "opacity-40 cursor-not-allowed" : ""
    } ${className}`}
  >
    <span className="text-base leading-none">{children}</span>
  </button>
);

function LeftToolbar({
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  atZoomMin,
  atZoomMax,
  isCollapsed,
  onToggle,
  isMobile,
}) {
  // On mobile, show collapsible version
  if (isMobile && isCollapsed) {
    return (
      <button
        onClick={onToggle}
        className="flex items-center justify-center w-12 h-12 rounded-full bg-green-600 text-white shadow-lg hover:bg-green-700 transition-all duration-200"
        title="Open Tools"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Close button for mobile */}
      {isMobile && (
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-full py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-200 mb-1"
          title="Close Tools"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 12H4"
            />
          </svg>
          <span className="text-xs ml-1">Close</span>
        </button>
      )}
      <div className="flex gap-2">
        <ToolBtn title="Undo" onClick={onUndo} disabled={!canUndo}>
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h10a8 8 0 018 8v0M3 10l4 4m-4-4l4-4"
            />
          </svg>
          <span className="text-[11px] mt-1">undo</span>
        </ToolBtn>
        <ToolBtn title="Redo" onClick={onRedo} disabled={!canRedo}>
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14 10l4-4m0 0l-4-4m4 4H6a8 8 0 00-8 8v0"
            />
          </svg>
          <span className="text-[11px] mt-1">redo</span>
        </ToolBtn>
      </div>
      <div className="h-px bg-gray-200 my-1" />

      <div className="h-px bg-gray-200 my-1" />
      <div className="flex gap-2">
        <ToolBtn title="Zoom In" onClick={onZoomIn} disabled={atZoomMax}>
          <div className="flex flex-col items-center">
            <span className="text-xl">+</span>
            <span className="text-[11px] mt-1">Zoom in</span>
          </div>
        </ToolBtn>

        <ToolBtn title="Zoom Out" onClick={onZoomOut} disabled={atZoomMin}>
          <div className="flex flex-col items-center">
            <span className="text-xl">-</span>
            <span className="text-[11px] mt-1">Zoom out</span>
          </div>
        </ToolBtn>
      </div>

      <ToolBtn title="Reset Zoom & Transformations" onClick={onZoomReset}>
        <div className="flex justify-center items-center">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </div>
        <span className="text-[11px] mt-1">Reset All</span>
      </ToolBtn>
    </div>
  );
}

function TopToolbar({
  product,
  view,
  setView,
  zoom,
  onBack,
  onAddToCart,
  selectedColorKey,
}) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between p-3 sm:p-4 bg-white border-b border-gray-200 gap-3 sm:gap-0">
      <div className="flex items-center w-full sm:w-auto justify-between sm:justify-start gap-2 sm:gap-6">
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-gray-800 text-sm whitespace-nowrap"
        >
          ← Back
        </button>
        <div className="hidden md:block text-sm text-gray-600">
          Editing:{" "}
          <span className="font-semibold">{product?.name || "Tee"}</span>
          {" • "}
          <span className="capitalize">{selectedColorKey}</span>
        </div>
        <div className="flex gap-2">
          <button
            className={`px-3 py-1 text-xs rounded ${
              view === "front"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
            onClick={() => setView("front")}
          >
            Front
          </button>
          <button
            className={`px-3 py-1 text-xs rounded ${
              view === "back"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
            onClick={() => setView("back")}
          >
            Back
          </button>
        </div>
        <div className="hidden sm:block text-xs text-gray-500 whitespace-nowrap">
          Zoom: {Math.round(zoom * 100)}%
        </div>
      </div>

      <div className="flex flex-col items-end w-full sm:w-auto">
        <Button
          onClick={onAddToCart}
          className="w-full sm:w-auto bg-green-600 text-white hover:bg-green-700 text-sm py-2"
        >
          Add to Cart
        </Button>
        <p className="text-xs text-gray-500 mt-1">
          Single side: Rs 1200 • Both sides: Rs 1600
        </p>
      </div>
    </div>
  );
}

/* ——— product browser ——— */
const ph =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='360' height='450'%3E%3Crect width='360' height='450' fill='%23f1f5f9'/%3E%3Ctext x='180' y='230' font-family='Arial' font-size='14' fill='%2364748b' text-anchor='middle'%3E👕 Product%3C/text%3E%3C/svg%3E";

function getProductImage(p, side = "front", colorKey) {
  const key = colorKey || p.defaultColor || "white";
  return p?.colors?.[key]?.[side] || ph;
}

function ProductBrowse({ onSelect }) {
  const items = Object.values(PRODUCTS).flat();
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <Container className="py-8">
      <div className="text-center mb-8 animate-fade-in-up">
        <h1 className="text-4xl font-bold text-slate-800 mb-3">
          Browse Our Products
        </h1>
        <p className="text-slate-600">
          Hover to see the back • Click to customize
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {items.map((p, index) => {
          const side = hoveredId === p.id ? "back" : "front";
          const src = getProductImage(p, side, p.defaultColor);
          // Calculate stagger delay - 100ms increment per card
          const delayClass = `delay-${Math.min(index * 100, 500)}`;
          return (
            <Card
              key={p.id}
              className={`p-5 hover:shadow-xl transition-all duration-300 cursor-pointer animate-fade-in-up ${delayClass} hover:-translate-y-2`}
              onClick={() => onSelect(p)}
              onMouseEnter={() => setHoveredId(p.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div className="aspect-[4/5] bg-slate-100 rounded-xl mb-4 overflow-hidden">
                <img
                  src={src}
                  alt={p.name}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src = ph;
                  }}
                />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-slate-800 text-base mb-2">
                  {p.name}
                </h3>
              </div>
            </Card>
          );
        })}
      </div>
    </Container>
  );
}

/* ——— helpers ——— */
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const makeId = () => Math.random().toString(36).slice(2, 9);

/* ——— Background Removal Utility ——— */
const removeBackground = async (imageFile) => {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        // Create canvas
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw image
        ctx.drawImage(img, 0, 0);

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Simple background removal algorithm
        // This detects the dominant background color (usually corners) and makes it transparent
        const corners = [
          { x: 0, y: 0 },
          { x: canvas.width - 1, y: 0 },
          { x: 0, y: canvas.height - 1 },
          { x: canvas.width - 1, y: canvas.height - 1 },
        ];

        // Get average color of corners as background color
        let bgR = 0,
          bgG = 0,
          bgB = 0;
        corners.forEach((corner) => {
          const idx = (corner.y * canvas.width + corner.x) * 4;
          bgR += data[idx];
          bgG += data[idx + 1];
          bgB += data[idx + 2];
        });
        bgR = Math.round(bgR / corners.length);
        bgG = Math.round(bgG / corners.length);
        bgB = Math.round(bgB / corners.length);

        // Threshold for color similarity (adjustable)
        const threshold = 40;

        // Process each pixel
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Calculate color difference
          const diff = Math.sqrt(
            Math.pow(r - bgR, 2) + Math.pow(g - bgG, 2) + Math.pow(b - bgB, 2)
          );

          // If pixel is similar to background color, make it transparent
          if (diff < threshold) {
            data[i + 3] = 0; // Set alpha to 0 (transparent)
          }
        }

        // Put modified image data back
        ctx.putImageData(imageData, 0, 0);

        // Convert canvas to blob URL
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          resolve(url);
        }, "image/png");
      };

      img.src = e.target.result;
    };

    reader.readAsDataURL(imageFile);
  });
};

/* ====== shapes/templates + text palette (same as before) ====== */
const SHAPE_KINDS = [
  { kind: "rect", label: "Square" },
  { kind: "rounded", label: "Rounded" },
  { kind: "circle", label: "Circle" },
  { kind: "oval", label: "Oval" },
  { kind: "triangle", label: "Triangle" },
  { kind: "diamond", label: "Diamond" },
  { kind: "star", label: "Star" },
  { kind: "heart", label: "Heart" },
  { kind: "pentagon", label: "Pentagon" },
  { kind: "hexagon", label: "Hexagon" },
  { kind: "arrowRight", label: "Arrow" },
  { kind: "line", label: "Line" },
];
const TEMPLATE_GALLERY = [
  { id: "t1", label: "Badge", src: "/T-Designs/1.png" },
  { id: "t2", label: "Waves", src: "/T-Designs/2.png" },
  { id: "t3", label: "Sunset", src: "/T-Designs/3.png" },
  { id: "t4", label: "Skull", src: "/T-Designs/4.png" },
  { id: "t5", label: "Sport", src: "/T-Designs/5.png" },
  { id: "t6", label: "Floral", src: "/T-Designs/6.png" },
  { id: "t7", label: "Floral", src: "/T-Designs/7.png" },
  { id: "t8", label: "Floral", src: "/T-Designs/8.png" },
  { id: "t9", label: "Floral", src: "/T-Designs/9.png" },
  { id: "t10", label: "Floral", src: "/T-Designs/10.png" },
  { id: "t11", label: "Floral", src: "/T-Designs/11.png" },
  { id: "t12", label: "Floral", src: "/T-Designs/12.png" },
  { id: "t13", label: "Floral", src: "/T-Designs/13.png" },
  { id: "t14", label: "Floral", src: "/T-Designs/14.png" },
  { id: "t15", label: "Floral", src: "/T-Designs/15.png" },
  { id: "t16", label: "Floral", src: "/T-Designs/16.png" },
  { id: "t17", label: "Floral", src: "/T-Designs/17.png" },
  { id: "t18", label: "Floral", src: "/T-Designs/18.png" },
  { id: "t19", label: "Floral", src: "/T-Designs/19.png" },
  { id: "t20", label: "Floral", src: "/T-Designs/20.png" },
  { id: "t21", label: "Floral", src: "/T-Designs/21.png" },
  { id: "t22", label: "Floral", src: "/T-Designs/22.png" },
  { id: "t23", label: "Floral", src: "/T-Designs/23.png" },
  { id: "t24", label: "Floral", src: "/T-Designs/24.png" },
  { id: "t25", label: "Floral", src: "/T-Designs/25.png" },
  { id: "t26", label: "Floral", src: "/T-Designs/26.png" },
  { id: "t27", label: "Floral", src: "/T-Designs/27.png" },
  { id: "t28", label: "Floral", src: "/T-Designs/28.png" },
  { id: "t29", label: "Floral", src: "/T-Designs/29.png" },
  { id: "t30", label: "Floral", src: "/T-Designs/30.png" },
  { id: "t31", label: "Floral", src: "/T-Designs/31.png" },
  { id: "t32", label: "Floral", src: "/T-Designs/32.png" },
  { id: "t33", label: "Floral", src: "/T-Designs/33.png" },
  { id: "t34", label: "Floral", src: "/T-Designs/34.png" },
  { id: "t35", label: "Floral", src: "/T-Designs/35.png" },
  { id: "t36", label: "Floral", src: "/T-Designs/36.png" },
  { id: "t37", label: "Floral", src: "/T-Designs/37.png" },
  { id: "t38", label: "Floral", src: "/T-Designs/38.png" },
  { id: "t39", label: "Floral", src: "/T-Designs/39.png" },
  { id: "t40", label: "Floral", src: "/T-Designs/40.png" },
  { id: "t41", label: "Floral", src: "/T-Designs/41.png" },
  { id: "t42", label: "Floral", src: "/T-Designs/42.png" },
  { id: "t43", label: "Floral", src: "/T-Designs/43.png" },
  { id: "t44", label: "Floral", src: "/T-Designs/44.png" },
  { id: "t45", label: "Floral", src: "/T-Designs/45.png" },
  { id: "t46", label: "Floral", src: "/T-Designs/46.png" },
  { id: "t47", label: "Floral", src: "/T-Designs/47.png" },
  { id: "t48", label: "Floral", src: "/T-Designs/48.png" },
  { id: "t49", label: "Floral", src: "/T-Designs/49.png" },
  { id: "t50", label: "Floral", src: "/T-Designs/50.png" },
  { id: "t51", label: "Floral", src: "/T-Designs/51.png" },
  { id: "t52", label: "Floral", src: "/T-Designs/52.png" },
  { id: "t53", label: "Floral", src: "/T-Designs/53.png" },
  { id: "t54", label: "Floral", src: "/T-Designs/54.png" },
  { id: "t55", label: "Floral", src: "/T-Designs/55.png" },
  { id: "t56", label: "Floral", src: "/T-Designs/56.png" },
  { id: "t57", label: "Floral", src: "/T-Designs/57.png" },
  { id: "t58", label: "Floral", src: "/T-Designs/58.png" },
  { id: "t59", label: "Floral", src: "/T-Designs/59.png" },
  { id: "t60", label: "Floral", src: "/T-Designs/60.png" },
  { id: "t61", label: "Floral", src: "/T-Designs/61.png" },
  { id: "t62", label: "Floral", src: "/T-Designs/62.png" },
  { id: "t63", label: "Floral", src: "/T-Designs/63.png" },
  { id: "t64", label: "Floral", src: "/T-Designs/64.png" },
  { id: "t65", label: "Floral", src: "/T-Designs/65.png" },
  { id: "t66", label: "Floral", src: "/T-Designs/66.png" },
  { id: "t67", label: "Floral", src: "/T-Designs/67.png" },
  { id: "t68", label: "Floral", src: "/T-Designs/68.png" },
  { id: "t69", label: "Floral", src: "/T-Designs/69.png" },
  { id: "t70", label: "Floral", src: "/T-Designs/70.png" },
  { id: "t71", label: "Floral", src: "/T-Designs/71.png" },
  { id: "t72", label: "Floral", src: "/T-Designs/72.png" },
  { id: "t73", label: "Floral", src: "/T-Designs/73.png" },
  { id: "t74", label: "Floral", src: "/T-Designs/74.png" },
  { id: "t75", label: "Floral", src: "/T-Designs/75.png" },
  { id: "t76", label: "Floral", src: "/T-Designs/76.png" },
  { id: "t77", label: "Floral", src: "/T-Designs/77.png" },
  { id: "t78", label: "Floral", src: "/T-Designs/78.png" },
  { id: "t79", label: "Floral", src: "/T-Designs/79.png" },
  { id: "t80", label: "Floral", src: "/T-Designs/80.png" },
  { id: "t81", label: "Floral", src: "/T-Designs/81.png" },
  { id: "t82", label: "Floral", src: "/T-Designs/82.png" },
  { id: "t83", label: "Floral", src: "/T-Designs/83.png" },
  { id: "t84", label: "Floral", src: "/T-Designs/84.png" },
  { id: "t85", label: "Floral", src: "/T-Designs/85.png" },
  { id: "t86", label: "Floral", src: "/T-Designs/86.png" },
  { id: "t87", label: "Floral", src: "/T-Designs/87.png" },
  { id: "t88", label: "Floral", src: "/T-Designs/88.png" },
  { id: "t89", label: "Floral", src: "/T-Designs/89.png" },
  { id: "t90", label: "Floral", src: "/T-Designs/90.png" },
  { id: "t91", label: "Floral", src: "/T-Designs/91.png" },
  { id: "t92", label: "Floral", src: "/T-Designs/92.png" },
];

const FONT_OPTIONS = [
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Helvetica", value: "Helvetica, Arial, sans-serif" },
  { label: "Trebuchet MS", value: '"Trebuchet MS", Arial, sans-serif' },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
  { label: "Georgia", value: 'Georgia, "Times New Roman", serif' },
  { label: "Times New Roman", value: '"Times New Roman", Times, serif' },
  { label: "Courier New", value: '"Courier New", Courier, monospace' },
  { label: "Lucida Console", value: '"Lucida Console", Monaco, monospace' },
  { label: "Impact", value: "Impact, Charcoal, sans-serif" },
  { label: "Comic Sans MS", value: '"Comic Sans MS", cursive, sans-serif' },
];
const TEXT_PALETTE = [
  "#111827",
  "#000000",
  "#ffffff",
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#22d3ee",
  "#a3e635",
  "#7c3aed",
];

/* ——— shape icon + renderer (same as before) ——— */
function ShapeIcon({ kind }) {
  const C = 24,
    center = C / 2,
    R = 9;
  const poly = (n, rot = 0) =>
    Array.from({ length: n }, (_, i) => {
      const a = ((Math.PI * 2) / n) * i - Math.PI / 2 + rot;
      return `${center + R * Math.cos(a)},${center + R * Math.sin(a)}`;
    }).join(" ");
  if (kind === "rect")
    return <rect x="6" y="6" width="12" height="12" rx="0" />;
  if (kind === "rounded")
    return <rect x="6" y="6" width="12" height="12" rx="3" />;
  if (kind === "circle") return <circle cx={center} cy={center} r="9" />;
  if (kind === "oval")
    return <ellipse cx={center} cy={center} rx="10" ry="7" />;
  if (kind === "triangle") return <polygon points={`${center},6 18,18 6,18`} />;
  if (kind === "diamond")
    return (
      <polygon points={`${center},5 19,${center} ${center},19 5,${center}`} />
    );
  if (kind === "pentagon") return <polygon points={poly(5)} />;
  if (kind === "hexagon") return <polygon points={poly(6)} />;
  if (kind === "star") return <polygon points={poly(5, Math.PI / 5)} />;
  if (kind === "heart")
    return (
      <path d="M12 19s-6-3.4-6-8.2S10 5 12 8c2-3 6-1.2 6 2.8S12 19 12 19z" />
    );
  if (kind === "arrowRight")
    return (
      <path
        d="M5 12h8M9 8l6 4-6 4"
        strokeWidth="2"
        stroke="currentColor"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  if (kind === "line")
    return (
      <line
        x1="6"
        y1="12"
        x2="18"
        y2="12"
        strokeWidth="2"
        stroke="currentColor"
      />
    );
  return null;
}
function renderShapeSVG(s) {
  const size = s.size,
    stroke = s.kind === "line" || s.kind === "arrowRight" ? s.color : "none";
  const strokeWidth = s.kind === "line" || s.kind === "arrowRight" ? 6 : 0;
  const fill = s.kind === "line" || s.kind === "arrowRight" ? "none" : s.color;
  const vb =
    s.kind === "line" || s.kind === "arrowRight"
      ? `0 0 ${size * 1.6} ${size}`
      : `0 0 ${size} ${size}`;
  const W = s.kind === "line" || s.kind === "arrowRight" ? size * 1.6 : size;
  const H = size;
  const center = size / 2;
  const poly = (n, rot = 0, r = (size / 2) * 0.9) =>
    Array.from({ length: n }, (_, i) => {
      const a = ((Math.PI * 2) / n) * i - Math.PI / 2 + rot;
      return `${center + r * Math.cos(a)},${center + r * Math.sin(a)}`;
    }).join(" ");
  let shapeEl = null;
  switch (s.kind) {
    case "rect":
      shapeEl = <rect x="0" y="0" width={size} height={size} rx="0" />;
      break;
    case "rounded":
      shapeEl = <rect x="0" y="0" width={size} height={size} rx={size * 0.2} />;
      break;
    case "circle":
      shapeEl = <circle cx={center} cy={center} r={size / 2} />;
      break;
    case "oval":
      shapeEl = (
        <ellipse cx={center} cy={center} rx={size * 0.55} ry={size * 0.38} />
      );
      break;
    case "triangle":
      shapeEl = <polygon points={`${center},0 ${size},${size} 0,${size}`} />;
      break;
    case "diamond":
      shapeEl = (
        <polygon
          points={`${center},0 ${size},${center} ${center},${size} 0,${center}`}
        />
      );
      break;
    case "pentagon":
      shapeEl = <polygon points={poly(5)} />;
      break;
    case "hexagon":
      shapeEl = <polygon points={poly(6)} />;
      break;
    case "star":
      shapeEl = <polygon points={poly(5, Math.PI / 5, size / 2)} />;
      break;
    case "heart":
      shapeEl = (
        <path
          transform={`scale(${size / 24})`}
          d="M12 19s-6-3.4-6-8.2S10 5 12 8c2-3 6-1.2 6 2.8S12 19 12 19z"
        />
      );
      break;
    case "arrowRight": {
      const y = H / 2,
        shaftL = W * 0.55,
        headH = H * 0.6;
      shapeEl = (
        <>
          <line x1={W * 0.1} y1={y} x2={shaftL} y2={y} />
          <polygon
            points={`${shaftL},${y - headH / 2} ${W * 0.9},${y} ${shaftL},${
              y + headH / 2
            }`}
            fill={s.color}
            stroke="none"
          />
        </>
      );
      break;
    }
    case "line":
      shapeEl = <line x1={W * 0.1} y1={H / 2} x2={W * 0.9} y2={H / 2} />;
      break;
    default:
      shapeEl = null;
  }
  return (
    <svg
      width={W}
      height={H}
      viewBox={vb}
      style={{ display: "block" }}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {shapeEl}
    </svg>
  );
}

/* ——— CANVAS ——— */
function ShirtMock({
  product,
  view,
  zoom,
  sideState,
  onDragImage,
  onDragText,
  onDragShape,
  onDragDecal,
  onCommitDrag,
  setImageScale,
  setDecalScale,
  setImageRotate,
  setDecalRotate,
  onDeleteImage,
  onDeleteDecal,
  onSelectShape,
  selectedShapeId, // Added missing prop
  selectedDecalId,
  onSelectDecal,
  selectedColorKey,
  isTextSelected,
  onSelectText,
  setTextSize,
  setShapeSize,
  setTextRotate,
  setShapeRotate,
  onDeleteText,
  onDeleteShape,
}) {
  const base = selectedColorKey
    ? view === "front"
      ? getProductImage(product, "front", selectedColorKey)
      : getProductImage(product, "back", selectedColorKey)
    : getProductImage(product, "front", product?.defaultColor);

  const areaRef = useRef(null);
  const dragRef = useRef({
    type: null,
    itemId: null,
    startX: 0,
    startY: 0,
    startLeft: 50,
    startTop: 50,
    rect: null,
  });

  const startDrag = (type, e, itemId = null) => {
    e.preventDefault();
    const rect = areaRef.current.getBoundingClientRect();
    const x = e.clientX ?? e.touches?.[0]?.clientX;
    const y = e.clientY ?? e.touches?.[0]?.clientY;
    let startLeft = 50,
      startTop = 50;
    if (type === "image") {
      startLeft = sideState.image.left ?? 50;
      startTop = sideState.image.top ?? 50;
    } else if (type === "text") {
      startLeft = sideState.text.left ?? 50;
      startTop = sideState.text.top ?? 50;
    } else if (type === "shape") {
      const s = sideState.shapes.find((s) => s.id === itemId);
      if (s) {
        startLeft = s.left ?? 50;
        startTop = s.top ?? 50;
      }
    } else if (type === "decal") {
      const d = sideState.decals.find((d) => d.id === itemId);
      if (d) {
        startLeft = d.left ?? 50;
        startTop = d.top ?? 50;
      }
    }
    dragRef.current = {
      type,
      itemId,
      startX: x,
      startY: y,
      startLeft,
      startTop,
      rect,
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", endDrag, { once: true });
  };

  const onMove = (e) => {
    e.preventDefault(); // Prevent page scroll during drag
    const { type, itemId, startX, startY, startLeft, startTop, rect } =
      dragRef.current;
    if (!type) return;
    const dx = ((e.clientX - startX) / rect.width) * 100;
    const dy = ((e.clientY - startY) / rect.height) * 100;
    const left = clamp(startLeft + dx, 5, 95);
    const top = clamp(startTop + dy, 5, 95);
    if (type === "image") onDragImage(left, top);
    if (type === "text") onDragText(left, top);
    if (type === "shape") onDragShape(itemId, left, top);
    if (type === "decal") onDragDecal(itemId, left, top);
  };
  const endDrag = () => {
    onCommitDrag();
    dragRef.current.type = null;
    window.removeEventListener("pointermove", onMove);
  };

  const img = sideState.image;
  const txt = sideState.text;
  const shapes = sideState.shapes;
  const decals = sideState.decals;

  const renderShape = (s) => (
    <div
      key={s.id}
      className="absolute"
      style={{
        left: `${s.left}%`,
        top: `${s.top}%`,
        transform: "translate(-50%, -50%)",
        touchAction: "none", // Prevent page scroll on mobile
      }}
    >
      <div
        className="relative group"
        style={{
          transform: `rotate(${s.rotate || 0}deg)`,
          transformOrigin: "center",
          touchAction: "none",
          userSelect: "none",
          WebkitUserDrag: "none",
        }}
        onPointerDown={(e) => {
          e.preventDefault();
          onSelectShape(s.id);
          startDrag("shape", e, s.id);
        }}
        onTouchStart={(e) => {
          if (e.touches.length === 1) e.preventDefault();
        }}
      >
        <div
            className="cursor-grab active:cursor-grabbing"
            style={{
                width: `${s.size}px`,
                height: `${s.size}px`,
                position: 'relative',
            }}
        >
             {/* Bounding Box */}
            {s.id === selectedShapeId && (
                <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none"></div>
            )}
             {/* Shape SVG */}
            <div className="w-full h-full pointer-events-none" style={{ color: s.color }}>
                {renderShapeSVG({ ...s, size: s.size })}
            </div>
        </div>


        {/* Controls - Only show when selected */}
        {s.id === selectedShapeId && (
          <>
            {/* Delete Button - Top Left */}
            <button
              className="absolute w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow-lg hover:bg-red-600 z-10 cursor-pointer"
              style={{
                top: `-12px`,
                left: `-12px`,
                touchAction: "none",
              }}
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDeleteShape(s.id);
              }}
            >
              ✕
            </button>

            {/* Rotate Handle - Top Right */}
            <div
              className="absolute w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs shadow-lg hover:bg-green-600 z-10 cursor-grab"
              style={{
                top: `-12px`,
                right: `-12px`,
                touchAction: "none",
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                const container = e.currentTarget.closest(".relative");
                const rect = container.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const startAngle =
                  (Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180) / Math.PI;
                const startRotation = s.rotate || 0;

                const onRotateMove = (mv) => {
                  mv.preventDefault();
                  const currentAngle =
                    (Math.atan2(mv.clientY - centerY, mv.clientX - centerX) * 180) / Math.PI;
                  const angleDiff = currentAngle - startAngle;
                  setShapeRotate(s.id, startRotation + angleDiff);
                };
                const onRotateEnd = () => {
                  window.removeEventListener("pointermove", onRotateMove);
                  window.removeEventListener("pointerup", onRotateEnd);
                  onCommitDrag();
                };
                window.addEventListener("pointermove", onRotateMove);
                window.addEventListener("pointerup", onRotateEnd, { once: true });
              }}
            >
              ↻
            </div>

            {/* Scale Handle - Bottom Right */}
            <div
              className="absolute w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs shadow-lg hover:bg-blue-600 z-10 cursor-grab"
              style={{
                bottom: `-12px`,
                right: `-12px`,
                touchAction: "none",
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                const startX = e.clientX;
                const startSize = s.size;
                const onScaleMove = (mv) => {
                  mv.preventDefault();
                  const delta = (mv.clientX - startX) * 2;
                  setShapeSize(s.id, Math.max(10, startSize + delta));
                };
                const onScaleEnd = () => {
                  window.removeEventListener("pointermove", onScaleMove);
                  window.removeEventListener("pointerup", onScaleEnd);
                  onCommitDrag();
                };
                window.addEventListener("pointermove", onScaleMove);
                window.addEventListener("pointerup", onScaleEnd, { once: true });
              }}
            >
              ⇲
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderDecal = (d) => (
    <div
      key={d.id}
      className="absolute"
      style={{
        left: `${d.left}%`,
        top: `${d.top}%`,
        transform: "translate(-50%, -50%)",
        touchAction: "none", // Prevent page scroll on mobile
      }}
    >
      <div
        className="relative group"
        style={{
          transform: `rotate(${d.rotate || 0}deg)`,
          transformOrigin: "center",
          touchAction: "none", // Prevent page scroll
          userSelect: "none",
          WebkitUserDrag: "none",
        }}
        onPointerDown={(e) => {
          e.preventDefault(); // Prevent default touch behaviors
          onSelectDecal(d.id);
          startDrag("decal", e, d.id);
        }}
        onTouchStart={(e) => {
          // Prevent page scroll on touch devices
          if (e.touches.length === 1) {
            e.preventDefault();
          }
        }}
      >
        {/* Main container that scales with the template */}
        <div
          className="relative cursor-grab active:cursor-grabbing"
          style={{
            width: `${d.scale * 180}px`,
            height: `${d.scale * 180}px`,
            touchAction: "none",
          }}
        >
          {/* Bounding Box - Now properly scales with template */}
          {d.id === selectedDecalId && (
            <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none"></div>
          )}

          {/* Decal Image */}
          <img
            src={d.src}
            alt="template"
            className="w-full h-full object-contain drop-shadow-lg pointer-events-none"
            draggable={false}
            onError={(e) => {
              e.currentTarget.src =
                'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="120"><rect width="100%" height="100%" fill="%23f3f4f6"/></svg>';
            }}
          />
        </div>

        {/* Control Icons - Only show when selected */}
        {d.id === selectedDecalId && (
          <>
            {/* Delete Button - Top Left */}
            <button
              className="absolute w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow-lg hover:bg-red-600 z-10 cursor-pointer"
              style={{
                transform: `rotate(-${d.rotate || 0}deg)`,
                top: `${-12 - d.scale * 5}px`,
                left: `${-12 - d.scale * 5}px`,
                touchAction: "none",
              }}
              onClick={(e) => {
                e.stopPropagation();
                onDeleteDecal(d.id);
              }}
            >
              ✕
            </button>

            {/* Rotate Handle - Top Right (Drag to rotate) */}
            <div
              className="absolute w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs shadow-lg hover:bg-green-600 z-10 cursor-grab"
              style={{
                transform: `rotate(-${d.rotate || 0}deg)`,
                top: `${-12 - d.scale * 5}px`,
                right: `${-12 - d.scale * 5}px`,
                touchAction: "none",
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                e.preventDefault();

                const container = e.currentTarget.closest(".relative");
                const containerRect = container.getBoundingClientRect();
                const centerX = containerRect.left + containerRect.width / 2;
                const centerY = containerRect.top + containerRect.height / 2;

                const startAngle =
                  (Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180) /
                  Math.PI;
                const startRotation = d.rotate || 0;

                const onRotateMove = (moveEvent) => {
                  moveEvent.preventDefault();
                  const currentAngle =
                    (Math.atan2(
                      moveEvent.clientY - centerY,
                      moveEvent.clientX - centerX
                    ) *
                      180) /
                    Math.PI;
                  let angleDiff = currentAngle - startAngle;

                  // Smooth rotation with proper angle wrapping
                  if (angleDiff > 180) angleDiff -= 360;
                  if (angleDiff < -180) angleDiff += 360;

                  const newRotation = startRotation + angleDiff;
                  setDecalRotate(d.id, newRotation);
                };

                const onRotateEnd = () => {
                  window.removeEventListener("pointermove", onRotateMove);
                  window.removeEventListener("pointerup", onRotateEnd);
                  onCommitDrag();
                };

                window.addEventListener("pointermove", onRotateMove);
                window.addEventListener("pointerup", onRotateEnd, {
                  once: true,
                });
              }}
            >
              ↻
            </div>

            {/* Scale Handle - Bottom Right (Drag to scale) */}
            <div
              className="absolute w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs shadow-lg hover:bg-blue-600 z-10 cursor-grab"
              style={{
                transform: `rotate(-${d.rotate || 0}deg)`,
                bottom: `${-12 - d.scale * 5}px`,
                right: `${-12 - d.scale * 5}px`,
                touchAction: "none",
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                const startX = e.clientX;
                const startScale = d.scale;

                const onScaleMove = (moveEvent) => {
                  moveEvent.preventDefault();
                  const deltaX = moveEvent.clientX - startX;
                  const scaleDelta = deltaX * 0.005;
                  const newScale = Math.max(
                    0.2,
                    Math.min(startScale + scaleDelta, 2)
                  );
                  setDecalScale(d.id, newScale);
                };

                const onScaleEnd = () => {
                  window.removeEventListener("pointermove", onScaleMove);
                  window.removeEventListener("pointerup", onScaleEnd);
                  onCommitDrag();
                };

                window.addEventListener("pointermove", onScaleMove);
                window.addEventListener("pointerup", onScaleEnd, {
                  once: true,
                });
              }}
            >
              ⇲
            </div>
          </>
        )}

        {/* Bottom controls removed - redundant with corner controls */}
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex justify-center items-center p-8">
      <div className="relative" style={{ transform: `scale(${zoom})` }}>
        <div
          ref={areaRef}
          id="shirt-preview"
          className="relative aspect-[3/4] w-[80vw] sm:w-96 bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden"
          style={{
            touchAction: "none", // Prevent page scroll during manipulation
          }}
        >
          <div className="absolute top-4 left-4 bg-gray-800 text-white px-2 py-1 rounded text-xs font-semibold uppercase">
            {view}
          </div>

          {/* Base tee for selected color & side */}
          <img
            src={base}
            alt="tee"
            className="w-full h-full object-contain select-none pointer-events-none"
            onError={(e) => {
              e.currentTarget.src = ph;
            }}
          />

          {/* Order: shapes → image → decals → text */}
          {shapes.map(renderShape)}

          {img.src && (
            <div
              className="absolute"
              style={{
                left: `${img.left}%`,
                top: `${img.top}%`,
                transform: "translate(-50%, -50%)",
                touchAction: "none", // Prevent page scroll on mobile
              }}
            >
              <div
                className="relative group"
                style={{
                  transform: `rotate(${img.rotate || 0}deg)`,
                  transformOrigin: "center",
                  touchAction: "none",
                  userSelect: "none",
                }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  startDrag("image", e);
                }}
                onTouchStart={(e) => {
                  if (e.touches.length === 1) {
                    e.preventDefault();
                  }
                }}
              >
                {/* Main container that scales with the image */}
                <div
                  className="relative cursor-grab active:cursor-grabbing"
                  style={{
                    width: `${img.scale * 180}px`,
                    height: `${img.scale * 180}px`,
                    touchAction: "none",
                  }}
                >
                  {/* Bounding Box - Shows when uploaded */}
                  <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none"></div>

                  {/* Uploaded Image */}
                  <img
                    src={img.src}
                    alt="design"
                    className="w-full h-full object-contain drop-shadow-lg pointer-events-none"
                    // Removed maxWidth constraint to allow full zoom
                    draggable={false}
                  />
                </div>

                {/* Control Icons - Interactive handles */}
                <>
                  {/* Delete Button - Top Left */}
                  <button
                    className="absolute w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow-lg hover:bg-red-600 z-10 cursor-pointer"
                    style={{
                      transform: `rotate(-${img.rotate || 0}deg)`,
                      top: `${-12 - img.scale * 5}px`,
                      left: `${-12 - img.scale * 5}px`,
                      touchAction: "none",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteImage();
                    }}
                  >
                    ✕
                  </button>

                  {/* Rotate Handle - Top Right (Drag to rotate) */}
                  <div
                    className="absolute w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs shadow-lg hover:bg-green-600 z-10 cursor-grab"
                    style={{
                      transform: `rotate(-${img.rotate || 0}deg)`,
                      top: `${-12 - img.scale * 5}px`,
                      right: `${-12 - img.scale * 5}px`,
                      touchAction: "none",
                    }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();

                      const container = e.currentTarget.closest(".relative");
                      const containerRect = container.getBoundingClientRect();
                      const centerX =
                        containerRect.left + containerRect.width / 2;
                      const centerY =
                        containerRect.top + containerRect.height / 2;

                      const startAngle =
                        (Math.atan2(e.clientY - centerY, e.clientX - centerX) *
                          180) /
                        Math.PI;
                      const startRotation = img.rotate || 0;

                      const onRotateMove = (moveEvent) => {
                        moveEvent.preventDefault();
                        const currentAngle =
                          (Math.atan2(
                            moveEvent.clientY - centerY,
                            moveEvent.clientX - centerX
                          ) *
                            180) /
                          Math.PI;
                        let angleDiff = currentAngle - startAngle;

                        // Smooth rotation with proper angle wrapping
                        if (angleDiff > 180) angleDiff -= 360;
                        if (angleDiff < -180) angleDiff += 360;

                        const newRotation = startRotation + angleDiff;
                        setImageRotate(newRotation);
                      };

                      const onRotateEnd = () => {
                        window.removeEventListener("pointermove", onRotateMove);
                        window.removeEventListener("pointerup", onRotateEnd);
                        onCommitDrag();
                      };

                      window.addEventListener("pointermove", onRotateMove);
                      window.addEventListener("pointerup", onRotateEnd, {
                        once: true,
                      });
                    }}
                  >
                    ↻
                  </div>

                  {/* Scale Handle - Bottom Right (Drag to scale) */}
                  <div
                    className="absolute w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs shadow-lg hover:bg-blue-600 z-10 cursor-grab"
                    style={{
                      transform: `rotate(-${img.rotate || 0}deg)`,
                      bottom: `${-12 - img.scale * 5}px`,
                      right: `${-12 - img.scale * 5}px`,
                      touchAction: "none",
                    }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      const startX = e.clientX;
                      const startScale = img.scale;

                      const onScaleMove = (moveEvent) => {
                        moveEvent.preventDefault();
                        const deltaX = moveEvent.clientX - startX;
                        const scaleDelta = deltaX * 0.005;
                        const newScale = Math.max(
                          0.2,
                          Math.min(startScale + scaleDelta, 2)
                        );
                        setImageScale(newScale);
                      };

                      const onScaleEnd = () => {
                        window.removeEventListener("pointermove", onScaleMove);
                        window.removeEventListener("pointerup", onScaleEnd);
                        onCommitDrag();
                      };

                      window.addEventListener("pointermove", onScaleMove);
                      window.addEventListener("pointerup", onScaleEnd, {
                        once: true,
                      });
                    }}
                  >
                    ⇲
                  </div>
                </>
              </div>
            </div>
          )}

          {decals.map(renderDecal)}

          {txt.value && (
            <div
              className="absolute"
              style={{
                left: `${txt.left}%`,
                top: `${txt.top}%`,
                transform: "translate(-50%, -50%)",
                touchAction: "none", // Prevent page scroll on mobile
              }}
            >
              <div
                className="relative group"
                style={{
                  touchAction: "none",
                  userSelect: "none",
                   transform: `rotate(${txt.rotate || 0}deg)`,
                   transformOrigin: "center",
                }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  onSelectText(); // Select text
                  startDrag("text", e);
                }}
                onTouchStart={(e) => {
                  if (e.touches.length === 1) e.preventDefault();
                }}
              >
                <div 
                   className="cursor-grab active:cursor-grabbing p-2 relative"
                   style={{ minWidth: '50px', minHeight: '20px' }}
                >
                     {/* Bounding Box */}
                    {isTextSelected && (
                        <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none"></div>
                    )}
                    
                    <div
                      className="text-center select-none pointer-events-none"
                      style={{
                        fontSize: `${txt.size}px`,
                        lineHeight: 1.1,
                        whiteSpace: "pre-wrap",
                        fontFamily: txt.font,
                        fontWeight: txt.bold ? 700 : 400,
                        fontStyle: txt.italic ? "italic" : "normal",
                        textDecoration: txt.underline ? "underline" : "none",
                        color: txt.color,
                        textShadow: '0px 2px 4px rgba(0,0,0,0.1)'
                      }}
                    >
                      {txt.value}
                    </div>
                </div>

                {/* Controls - Only show when selected */}
                {isTextSelected && (
                  <>
                    {/* Delete Button - Top Left */}
                    <button
                      className="absolute w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow-lg hover:bg-red-600 z-10 cursor-pointer"
                      style={{
                        top: `-12px`,
                        left: `-12px`,
                        touchAction: "none",
                      }}
                      onPointerDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDeleteText();
                      }}
                    >
                      ✕
                    </button>

                    {/* Rotate Handle - Top Right */}
                    <div
                      className="absolute w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs shadow-lg hover:bg-green-600 z-10 cursor-grab"
                      style={{
                        top: `-12px`,
                        right: `-12px`,
                        touchAction: "none",
                      }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                         const container = e.currentTarget.closest(".relative");
                        const rect = container.getBoundingClientRect();
                        const centerX = rect.left + rect.width / 2;
                        const centerY = rect.top + rect.height / 2;
                        const startAngle =
                          (Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180) / Math.PI;
                        const startRotation = txt.rotate || 0;

                        const onRotateMove = (mv) => {
                          mv.preventDefault();
                          const currentAngle =
                            (Math.atan2(mv.clientY - centerY, mv.clientX - centerX) * 180) / Math.PI;
                          const angleDiff = currentAngle - startAngle;
                          setTextRotate(startRotation + angleDiff);
                        };
                        const onRotateEnd = () => {
                          window.removeEventListener("pointermove", onRotateMove);
                          window.removeEventListener("pointerup", onRotateEnd);
                          onCommitDrag();
                        };
                        window.addEventListener("pointermove", onRotateMove);
                        window.addEventListener("pointerup", onRotateEnd, { once: true });
                      }}
                    >
                      ↻
                    </div>

                    {/* Scale Handle - Bottom Right */}
                    <div
                      className="absolute w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs shadow-lg hover:bg-blue-600 z-10 cursor-grab"
                      style={{
                        bottom: `-12px`,
                        right: `-12px`,
                        touchAction: "none",
                      }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                         const startX = e.clientX;
                        const startSize = txt.size;
                        const onScaleMove = (mv) => {
                          mv.preventDefault();
                          const delta = (mv.clientX - startX) * 0.5;
                          setTextSize(Math.max(12, startSize + delta));
                        };
                        const onScaleEnd = () => {
                          window.removeEventListener("pointermove", onScaleMove);
                          window.removeEventListener("pointerup", onScaleEnd);
                          onCommitDrag();
                        };
                        window.addEventListener("pointermove", onScaleMove);
                        window.addEventListener("pointerup", onScaleEnd, { once: true });
                      }}
                    >
                      ⇲
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ——— RIGHT PANEL ——— */
function RightPanel({
  activeTab,
  design,
  view,
  setActiveTab,
  setSideImage,
  setSideText,
  setImageScaleSide,
  setTextSizeSide,
  setTextStyleSide,
  addShapeSide,
  selectedShape,
  setSelectedShapeColor,
  setSelectedShapeSize,
  addDecalSide,
  selectedDecal,
  setSelectedDecalScale,
  setImageRotateSide,
  setSelectedShapeRotate,
  setSelectedDecalRotate,
  selectedColorKey,
  setSelectedColorKey,
  selectedSize,
  setSelectedSize,
}) {
  const [textDraft, setTextDraft] = useState("");
  const [uploadDialogState, setUploadDialogState] = useState({ isOpen: false, file: null });

  const ProductOptions = () => (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-slate-700 mb-2">
        Select Color
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {COLOR_OPTIONS.map((c, index) => (
          <button
            key={c.key}
            title={c.label}
            onClick={() => setSelectedColorKey(c.key)}
            className={`h-8 rounded border animate-pop-in transition-all duration-200 hover:scale-105 active:scale-95 ${
              selectedColorKey === c.key
                ? "border-blue-600 text-blue-700 bg-blue-50 shadow-sm"
                : "border-gray-300 text-gray-700 bg-white hover:border-blue-400"
            } flex items-center gap-2 justify-center`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <span
              className="w-5 h-5 border border-gray-300 rounded-sm transition-transform"
              style={{ backgroundColor: c.color }}
            ></span>
            <span>{c.label}</span>
          </button>
        ))}
      </div>
      <div className="text-xs text-gray-500 mt-2">
        Colors: Red, Black, White, Blue. (Default: White)
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-2">
          Select Size
        </h3>
        <div className="flex gap-2">
          {["S", "M", "L", "XL"].map((s, index) => (
            <button
              key={s}
              onClick={() => setSelectedSize(s)}
              className={`flex-1 h-9 rounded border font-medium text-sm animate-slide-up-fade transition-all duration-200 hover:scale-105 active:scale-95 ${
                selectedSize === s
                  ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                  : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
              }`}
              style={{ animationDelay: `${(index + 4) * 50}ms` }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if (activeTab === "images") {
    const img = design[view].image;
    return (
      <div className="w-full lg:max-w-sm bg-white rounded-xl p-4 sm:p-6 border border-gray-200 h-full overflow-y-auto">
        <button
          onClick={() => setActiveTab("welcome")}
          className="mb-4 text-sm text-blue-600 hover:underline"
        >
          ← Back
        </button>
        <ProductOptions />
        <h2 className="text-xl font-bold mb-6">Add Images</h2>
        <div className="space-y-5">
          <div className="grid place-items-center rounded-xl border-2 border-dashed border-gray-300 p-8 text-center">
            <div>
              <div className="text-4xl mb-4">📷</div>
              <div className="font-semibold mb-2">Upload Image</div>
              <div className="text-gray-500 text-sm mb-4">PNG/JPG</div>
                <label className="cursor-pointer bg-gray-100 px-4 py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors">
                Choose File
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                       setUploadDialogState({ isOpen: true, file: f });
                       // Reset file input value so same file can be selected again if cancelled
                       e.target.value = '';
                    }
                  }}
                />
              </label>

              {/* Image Upload Dialog */}
              <ImageUploadDialog
                isOpen={uploadDialogState.isOpen}
                file={uploadDialogState.file}
                onClose={() => setUploadDialogState({ isOpen: false, file: null })}
                onApply={(url) => {
                  setSideImage(view, url);
                  setUploadDialogState({ isOpen: false, file: null });
                  toast.success("Image added successfully!");
                }}
              />
            </div>
          </div>

          {img.src && (
            <>
              <div>
                <h4 className="font-semibold mb-2">Image Size</h4>
                <input
                  type="range"
                  min={10}
                  max={500}
                  value={Math.round(img.scale * 100)}
                  onChange={(e) =>
                    setImageScaleSide(view, Number(e.target.value) / 100)
                  }
                  className="w-full"
                />
              </div>
              <div>
                <h4 className="font-semibold mb-2">Rotation</h4>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs text-gray-500 w-12">-360°</span>
                  <input
                    type="range"
                    min={-360}
                    max={360}
                    value={Math.round(img.rotate || 0)}
                    onChange={(e) =>
                      setImageRotateSide(view, Number(e.target.value))
                    }
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-500 w-12">360°</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Degrees:</span>
                  <input
                    type="number"
                    min={-360}
                    max={360}
                    value={Math.round(img.rotate || 0)}
                    onChange={(e) =>
                      setImageRotateSide(view, Number(e.target.value))
                    }
                    className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                  <span className="text-sm text-gray-700">°</span>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Tip: Drag and rotate from the on-canvas bubble.
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  if (activeTab === "text") {
    const txt = design[view].text;
    return (
      <div className="w-full lg:max-w-sm bg-white rounded-xl p-4 sm:p-6 border border-gray-200 h-full overflow-y-auto">
        <button
          onClick={() => setActiveTab("welcome")}
          className="mb-4 text-sm text-blue-600 hover:underline"
        >
          ← Back
        </button>
        <ProductOptions />
        <h2 className="text-xl font-bold mb-6">Add Text</h2>

        <textarea
          value={textDraft}
          onChange={(e) => setTextDraft(e.target.value)}
          placeholder="Enter your text..."
          className="w-full h-28 p-3 border border-gray-300 rounded-lg resize-none"
        />
        <Button
          className="mt-3 w-full bg-blue-600 text-white hover:bg-blue-700"
          onClick={() => {
            if (textDraft.trim()) {
              setSideText(view, textDraft.trim());
              setTextDraft("");
            }
          }}
          disabled={!textDraft.trim()}
        >
          Add to Design
        </Button>

        {txt.value && (
          <div className="mt-6 space-y-5">
            <div>
              <h4 className="font-semibold mb-2">Font</h4>
              <select
                value={txt.font}
                onChange={(e) =>
                  setTextStyleSide(view, { font: e.target.value })
                }
                className="w-full border border-gray-300 rounded-md p-2"
              >
                {FONT_OPTIONS.map((f) => (
                  <option
                    key={f.label}
                    value={f.value}
                    style={{ fontFamily: f.value }}
                  >
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Size</h4>
              <input
                type="range"
                min={12}
                max={96}
                value={txt.size}
                onChange={(e) => setTextSizeSide(view, Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <h4 className="font-semibold mb-2">Style</h4>
              <div className="flex gap-2">
                <Button
                  className={`px-3 ${txt.bold ? "bg-gray-900 text-white" : ""}`}
                  onClick={() => setTextStyleSide(view, { bold: !txt.bold })}
                >
                  B
                </Button>
                <Button
                  className={`px-3 italic ${
                    txt.italic ? "bg-gray-900 text-white" : ""
                  }`}
                  onClick={() =>
                    setTextStyleSide(view, { italic: !txt.italic })
                  }
                >
                  I
                </Button>
                <Button
                  className={`px-3 underline ${
                    txt.underline ? "bg-gray-900 text-white" : ""
                  }`}
                  onClick={() =>
                    setTextStyleSide(view, { underline: !txt.underline })
                  }
                >
                  U
                </Button>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Color</h4>
              <div className="grid grid-cols-8 gap-2 mb-3">
                {TEXT_PALETTE.map((hex) => (
                  <button
                    key={hex}
                    className="h-8 w-8 rounded-lg ring-1 ring-gray-300 hover:ring-gray-400"
                    style={{ backgroundColor: hex }}
                    onClick={() => setTextStyleSide(view, { color: hex })}
                  />
                ))}
              </div>
              <input
                type="color"
                value={txt.color}
                onChange={(e) =>
                  setTextStyleSide(view, { color: e.target.value })
                }
                className="h-9 w-full rounded border border-gray-300"
              />
            </div>
            <div>
              <h4 className="font-semibold mb-2">Rotation</h4>
              <input
                type="range"
                min={-180}
                max={180}
                value={Math.round(txt.rotate || 0)}
                onChange={(e) =>
                  setTextStyleSide(view, { rotate: Number(e.target.value) })
                }
                className="w-full"
              />
            </div>
            <div className="text-xs text-gray-500">
              Tip: Drag/rotate on the tee. Delete from the on-canvas bubble.
            </div>
          </div>
        )}
      </div>
    );
  }

  if (activeTab === "shapes") {
    const palette = [
      "#111827",
      "#ef4444",
      "#f59e0b",
      "#10b981",
      "#3b82f6",
      "#8b5cf6",
      "#ec4899",
      "#ffffff",
      "#000000",
      "#7c3aed",
      "#a3e635",
      "#22d3ee",
    ];
    return (
      <div className="w-full lg:max-w-sm bg-white rounded-xl p-4 sm:p-6 border border-gray-200 h-full overflow-y-auto">
        <button
          onClick={() => setActiveTab("welcome")}
          className="mb-4 text-sm text-blue-600 hover:underline"
        >
          ← Back
        </button>
        <ProductOptions />
        <h2 className="text-xl font-bold mb-4">Add Shapes</h2>
        <div className="grid grid-cols-4 gap-3 mb-6">
          {SHAPE_KINDS.map((s) => (
            <button
              key={s.kind}
              onClick={() => addShapeSide(view, s.kind)}
              className="aspect-square rounded-lg border border-gray-200 hover:bg-gray-50 grid place-items-center"
              title={`Add ${s.label}`}
            >
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                className="text-gray-700 fill-current"
              >
                <ShapeIcon kind={s.kind} />
              </svg>
            </button>
          ))}
        </div>
        {selectedShape ? (
          <div className="space-y-5">
            <div className="text-sm text-gray-600">
              Active shape:{" "}
              <span className="font-semibold">{selectedShape.kind}</span>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Size</h4>
              <input
                type="range"
                min={16}
                max={320}
                value={Math.round(selectedShape.size)}
                onChange={(e) => setSelectedShapeSize(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <h4 className="font-semibold mb-2">Color</h4>
              <div className="grid grid-cols-8 gap-2 mb-3">
                {palette.map((hex) => (
                  <button
                    key={hex}
                    className="h-8 w-8 rounded-lg ring-1 ring-gray-300 hover:ring-gray-400"
                    style={{ backgroundColor: hex }}
                    onClick={() => setSelectedShapeColor(hex)}
                  />
                ))}
              </div>
              <input
                type="color"
                value={selectedShape.color}
                onChange={(e) => setSelectedShapeColor(e.target.value)}
                className="h-9 w-full rounded border border-gray-300"
              />
            </div>
            <div>
              <h4 className="font-semibold mb-2">Rotation</h4>
              <input
                type="range"
                min={-180}
                max={180}
                value={Math.round(selectedShape.rotate || 0)}
                onChange={(e) => setSelectedShapeRotate(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="text-xs text-gray-500">
              Tip: Drag the shape on the tee to move it. Rotate here or in the
              bubble. Delete from its bubble.
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  if (activeTab === "templates") {
    return (
      <div className="w-full lg:max-w-sm bg-white rounded-xl p-4 sm:p-6 border border-gray-200 h-full overflow-y-auto">
        <button
          onClick={() => setActiveTab("welcome")}
          className="mb-4 text-sm text-blue-600 hover:underline"
        >
          ← Back
        </button>
        <ProductOptions />
        <h2 className="text-xl font-bold mb-4">Add Templates</h2>
        <div className="grid grid-cols-3 gap-3">
          {TEMPLATE_GALLERY.map((t, index) => (
            <button
              key={t.id}
              title={`Add ${t.label}`}
              onClick={() => addDecalSide(view, t.src)}
              className="aspect-square rounded-lg border border-gray-200 overflow-hidden hover:bg-gray-50 animate-fade-in-scale transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95"
              style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
            >
              <img
                src={t.src}
                alt={t.label}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src =
                    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="100%" height="100%" fill="%23f3f4f6"/></svg>';
                }}
              />
            </button>
          ))}
        </div>
        {selectedDecal ? (
          <div className="mt-6 space-y-5">
            <div>
              <h4 className="font-semibold mb-2">Template Size</h4>
              <input
                type="range"
                min={10}
                max={500}
                value={Math.round((selectedDecal.scale || 1) * 100)}
                onChange={(e) =>
                  setSelectedDecalScale(Number(e.target.value) / 100)
                }
                className="w-full"
              />
            </div>
            <div>
              <h4 className="font-semibold mb-2">Rotation</h4>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs text-gray-500 w-12">-360°</span>
                <input
                  type="range"
                  min={-360}
                  max={360}
                  value={Math.round(selectedDecal.rotate || 0)}
                  onChange={(e) =>
                    setSelectedDecalRotate(Number(e.target.value))
                  }
                  className="flex-1"
                />
                <span className="text-xs text-gray-500 w-12">360°</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Degrees:</span>
                <input
                  type="number"
                  min={-360}
                  max={360}
                  value={Math.round(selectedDecal.rotate || 0)}
                  onChange={(e) =>
                    setSelectedDecalRotate(Number(e.target.value))
                  }
                  className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                />
                <span className="text-sm text-gray-700">°</span>
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Tip: Drag/rotate on the tee. Delete from its on-canvas bubble.
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="w-full lg:max-w-sm bg-white rounded-xl p-4 sm:p-6 border border-gray-200 h-full overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">Welcome to the Design Studio.</h2>
      <ProductOptions />
      <p className="text-gray-600 mb-6">
        Get started by choosing an option below:
      </p>
      <div className="space-y-3">
        <button
          onClick={() => setActiveTab("images")}
          className="w-full text-left"
        >
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <div className="flex items-center gap-3">
              <span className="text-xl">📷</span>
              <div>
                <div className="font-semibold">Add Images</div>
                <div className="text-sm text-gray-600">Upload your image</div>
              </div>
            </div>
            <span>›</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab("text")}
          className="w-full text-left"
        >
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <div className="flex items-center gap-3">
              <span className="text-xl">T</span>
              <div>
                <div className="font-semibold">Add Text</div>
                <div className="text-sm text-gray-600">Type anything</div>
              </div>
            </div>
            <span>›</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab("shapes")}
          className="w-full text-left"
        >
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <div className="flex items-center gap-3">
              <span className="text-xl">⬛</span>
              <div>
                <div className="font-semibold">Add Shapes</div>
                <div className="text-sm text-gray-600">Choose & customize</div>
              </div>
            </div>
            <span>›</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab("templates")}
          className="w-full text-left"
        >
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <div className="flex items-center gap-3">
              <span className="text-xl">🎨</span>
              <div>
                <div className="font-semibold">Add Templates</div>
                <div className="text-sm text-gray-600">
                  Pick from your gallery
                </div>
              </div>
            </div>
            <span>›</span>
          </div>
        </button>
      </div>
    </div>
  );
}

/* ——— MAIN ——— */
export default function CustomShirtDesigner() {
  const [mode, setMode] = useState("browse");
  const [product, setProduct] = useState(null);
  const [activeTab, setActiveTab] = useState("welcome");
  const [view, setView] = useState("front");
  const [zoom, setZoom] = useState(1.0);

  // Selected color for this product (drives which front/back images load)
  const [selectedColorKey, setSelectedColorKey] = useState("white");
  const [selectedSize, setSelectedSize] = useState("M");

  // Mobile toolbar collapse state
  const [toolbarCollapsed, setToolbarCollapsed] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(mobile);
      // Auto-collapse on mobile initial load
      if (mobile) {
        setRightPanelCollapsed(true);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleFullReset = () => {
    // زوم ری سیٹ
    setZoom(1.0);

    // منتخب ٹیمپلیٹ کی روٹیشن اور سائز ری سیٹ
    if (selectedDecalId) {
      setDecalScale(selectedDecalId, 1);
      setDecalRotate(selectedDecalId, 0);
    }

    // منتخب شے کی روٹیشن اور سائز ری سیٹ
    if (selectedShapeId) {
      setShapeSize(selectedShapeId, 90);
      setShapeRotate(selectedShapeId, 0);
    }

    // امیج کی روٹیشن اور سائز ری سیٹ
    if (design[view].image.src) {
      const next = {
        ...design,
        [view]: {
          ...design[view],
          image: {
            ...design[view].image,
            scale: 1,
            rotate: 0,
          },
        },
      };
      setDesign(next);
      snapshot(next);
    }

    // ٹیکسٹ کی روٹیشن ری سیٹ
    if (design[view].text.value) {
      const next = {
        ...design,
        [view]: {
          ...design[view],
          text: {
            ...design[view].text,
            rotate: 0,
          },
        },
      };
      setDesign(next);
      snapshot(next);
    }

    // تمام ٹیمپلیٹس کی روٹیشن اور سائز ری سیٹ
    if (design[view].decals.length > 0) {
      const next = {
        ...design,
        [view]: {
          ...design[view],
          decals: design[view].decals.map((decal) => ({
            ...decal,
            scale: 1,
            rotate: 0,
          })),
        },
      };
      setDesign(next);
      snapshot(next);
    }

    // تمام شکلوں کی روٹیشن اور سائز ری سیٹ
    if (design[view].shapes.length > 0) {
      const next = {
        ...design,
        [view]: {
          ...design[view],
          shapes: design[view].shapes.map((shape) => ({
            ...shape,
            size: 90,
            rotate: 0,
          })),
        },
      };
      setDesign(next);
      snapshot(next);
    }
  };

  // Design state (front/back layers)
  const blankSide = {
    image: { src: null, left: 50, top: 50, scale: 1, rotate: 0 },
    text: {
      value: "",
      left: 50,
      top: 50,
      size: 28,
      rotate: 0,
      font: "Arial, Helvetica, sans-serif",
      bold: false,
      italic: false,
      underline: false,
      color: "#000000",
    },
    shapes: [],
    decals: [],
  };
  const [design, setDesign] = useState({
    front: { ...blankSide },
    back: { ...blankSide },
  });

  // Selections
  const [selectedShapeId, setSelectedShapeId] = useState(null);
  const [selectedDecalId, setSelectedDecalId] = useState(null);
  const [isTextSelected, setIsTextSelected] = useState(false); // New text selection state

  // Undo/redo
  const [history, setHistory] = useState([
    { front: { ...blankSide }, back: { ...blankSide } },
  ]);
  const [hIndex, setHIndex] = useState(0);
  const snapshot = (next) => {
    const snap = JSON.parse(JSON.stringify(next));
    const arr = history.slice(0, hIndex + 1).concat(snap);
    setHistory(arr);
    setHIndex(arr.length - 1);
  };

  const selectProduct = (p) => {
    setProduct(p);
    setMode("design");
    setActiveTab("welcome");
    setView("front");
    setSelectedShapeId(null);
    setSelectedDecalId(null);
    setIsTextSelected(false);
    setSelectedColorKey(p.defaultColor || "white"); // initialize color from product
    setSelectedSize("M");
    const resetDesign = {
      front: { ...blankSide },
      back: { ...blankSide },
    };
    setDesign(resetDesign);

    setHistory([resetDesign]);
    setHIndex(0);
  };

  // Mutators — image/text
  const setSideImage = (side, url) => {
    const next = {
      ...design,
      [side]: {
        ...design[side],
        image: { ...design[side].image, src: url, scale: 1, rotate: 0 },
        text: { ...design[side].text, value: "" }, // Clear text
        shapes: [], // Clear shapes
        decals: [], // Clear templates
      },
    };
    setDesign(next);
    snapshot(next);
    snapshot(next);
    setSelectedDecalId(null); // Clear selection
    setSelectedShapeId(null);
    setIsTextSelected(false);
  };
  const setSideText = (side, value) => {
    const next = {
      ...design,
      [side]: {
        ...design[side],
        text: { ...design[side].text, value },
        image: { ...design[side].image, src: null }, // Clear image
        shapes: [], // Clear shapes
        decals: [], // Clear templates
      },
    };
    setDesign(next);
    snapshot(next);
  };

  const moveImage = (left, top) =>
    setDesign((d) => ({
      ...d,
      [view]: { ...d[view], image: { ...d[view].image, left, top } },
    }));
  const moveText = (left, top) =>
    setDesign((d) => ({
      ...d,
      [view]: { ...d[view], text: { ...d[view].text, left, top } },
    }));
  const commitMove = () => snapshot(design);

  const setImageScale = (val) => {
    const next = {
      ...design,
      [view]: { ...design[view], image: { ...design[view].image, scale: val } },
    };
    setDesign(next);
    snapshot(next);
  };
  const setTextSize = (val) => {
    const next = {
      ...design,
      [view]: { ...design[view], text: { ...design[view].text, size: val } },
    };
    setDesign(next);
    snapshot(next);
  };
  const setImageRotate = (val) => {
    const next = {
      ...design,
      [view]: {
        ...design[view],
        image: { ...design[view].image, rotate: val },
      },
    };
    setDesign(next);
    snapshot(next);
  };
  const setTextRotate = (val) => {
    const next = {
      ...design,
      [view]: { ...design[view], text: { ...design[view].text, rotate: val } },
    };
    setDesign(next);
    snapshot(next);
  };

  const setImageScaleSide = (side, val) => {
    const next = {
      ...design,
      [side]: { ...design[side], image: { ...design[side].image, scale: val } },
    };
    setDesign(next);
    snapshot(next);
  };
  const setTextSizeSide = (side, val) => {
    const next = {
      ...design,
      [side]: { ...design[side], text: { ...design[side].text, size: val } },
    };
    setDesign(next);
    snapshot(next);
  };
  const setTextStyleSide = (side, patch) => {
    const next = {
      ...design,
      [side]: { ...design[side], text: { ...design[side].text, ...patch } },
    };
    setDesign(next);
    snapshot(next);
  };
  const setImageRotateSide = (side, val) => {
    const next = {
      ...design,
      [side]: {
        ...design[side],
        image: { ...design[side].image, rotate: val },
      },
    };
    setDesign(next);
    snapshot(next);
  };

  // Shapes
  const addShapeSide = (side, kind) => {
    const newShape = {
      id: makeId(),
      kind,
      left: 50,
      top: 50,
      size: 90,
      color: "#111827",
      rotate: 0,
    };
    const next = {
      ...design,
      [side]: {
        ...design[side],
        shapes: [newShape], // Replace existing shapes (exclusivity)
        image: { ...design[side].image, src: null }, // Clear image
        text: { ...design[side].text, value: "" }, // Clear text
        decals: [], // Clear templates
      },
    };
    setDesign(next);
    snapshot(next);
    if (side === view) {
      setSelectedShapeId(newShape.id);
      setSelectedDecalId(null);
      setIsTextSelected(false);
    }
  };
  const onSelectShape = (id) => {
    setSelectedShapeId(id);
    setSelectedDecalId(null);
    setIsTextSelected(false);
  };
  const moveShape = (id, left, top) =>
    setDesign((d) => {
      const side = d[view];
      const shapes = side.shapes.map((s) =>
        s.id === id ? { ...s, left, top } : s
      );
      return { ...d, [view]: { ...side, shapes } };
    });
  const setShapeSize = (id, size) => {
    const next = { ...design };
    next[view] = {
      ...next[view],
      shapes: next[view].shapes.map((s) => (s.id === id ? { ...s, size } : s)),
    };
    setDesign(next);
    snapshot(next);
  };
  const setShapeRotate = (id, rotate) => {
    const next = { ...design };
    next[view] = {
      ...next[view],
      shapes: next[view].shapes.map((s) =>
        s.id === id ? { ...s, rotate } : s
      ),
    };
    setDesign(next);
    snapshot(next);
  };
  const setSelectedShapeSize = (size) => {
    if (selectedShapeId) setShapeSize(selectedShapeId, size);
  };
  const setSelectedShapeRotate = (rotate) => {
    if (selectedShapeId) setShapeRotate(selectedShapeId, rotate);
  };
  const setSelectedShapeColor = (color) => {
    if (!selectedShapeId) return;
    const next = { ...design };
    next[view] = {
      ...next[view],
      shapes: next[view].shapes.map((s) =>
        s.id === selectedShapeId ? { ...s, color } : s
      ),
    };
    setDesign(next);
    snapshot(next);
  };
  const onDeleteShape = (id) => {
    const next = { ...design };
    next[view] = {
      ...next[view],
      shapes: next[view].shapes.filter((s) => s.id !== id),
    };
    setDesign(next);
    snapshot(next);
    if (selectedShapeId === id) setSelectedShapeId(null);
  };
  
  const onSelectText = () => {
    setIsTextSelected(true);
    setSelectedShapeId(null);
    setSelectedDecalId(null);
  };
  const onDeleteText = () => {
      setSideText(view, "");
      setIsTextSelected(false);
  };

  // Templates
  // Templates - Remove decal only from current view
  const addDecalSide = (side, src) => {
    const newDecal = {
      id: makeId(),
      src,
      left: 50,
      top: 50,
      scale: 1,
      rotate: 0,
    };

    // If adding to current view, replace all decals. If adding to other view, keep existing
    const next = {
      ...design,
      [side]: {
        ...design[side],
        decals: [newDecal], // Always replace with new decal
        image: { ...design[side].image, src: null }, // Clear image
        text: { ...design[side].text, value: "" }, // Clear text
        shapes: [], // Clear shapes
      },
    };

    setDesign(next);
    snapshot(next);
    if (side === view) {
      setSelectedDecalId(newDecal.id);
      setSelectedShapeId(null);
      setIsTextSelected(false);
    }
  };
  const onSelectDecal = (id) => {
    setSelectedDecalId(id);
    setSelectedShapeId(null);
    setIsTextSelected(false);
  };
  const moveDecal = (id, left, top) =>
    setDesign((d) => {
      const side = d[view];
      const decals = side.decals.map((i) =>
        i.id === id ? { ...i, left, top } : i
      );
      return { ...d, [view]: { ...side, decals } };
    });
  const setDecalScale = (id, scale) => {
    const next = { ...design };
    next[view] = {
      ...next[view],
      decals: next[view].decals.map((i) => (i.id === id ? { ...i, scale } : i)),
    };
    setDesign(next);
    snapshot(next);
  };
  const setDecalRotate = (id, rotate) => {
    const next = { ...design };
    next[view] = {
      ...next[view],
      decals: next[view].decals.map((i) =>
        i.id === id ? { ...i, rotate } : i
      ),
    };
    setDesign(next);
    snapshot(next);
  };
  const setSelectedDecalRotate = (rotate) => {
    if (selectedDecalId) setDecalRotate(selectedDecalId, rotate);
  };
  const setSelectedDecalScale = (scale) => {
    if (selectedDecalId) setDecalScale(selectedDecalId, scale);
  };
  const onDeleteDecal = (id) => {
    const next = { ...design };
    next[view] = {
      ...next[view],
      decals: next[view].decals.filter((i) => i.id !== id),
    };
    setDesign(next);
    snapshot(next);
    if (selectedDecalId === id) setSelectedDecalId(null);
  };

  // Undo/redo
  const undo = () => {
    if (hIndex > 0) {
      const i = hIndex - 1;
      setHIndex(i);
      setDesign(history[i]);
    }
  };
  const redo = () => {
    if (hIndex < history.length - 1) {
      const i = hIndex + 1;
      setHIndex(i);
      setDesign(history[i]);
    }
  };

  const selectedShape =
    design[view].shapes.find((s) => s.id === selectedShapeId) || null;
  const selectedDecal =
    design[view].decals.find((d) => d.id === selectedDecalId) || null;

  // Price
  // Replace computeCustomPrice with this
  const computeCustomPrice = () => {
    const hasFront =
      design.front.image?.src ||
      design.front.text?.value ||
      design.front.shapes.length > 0 ||
      design.front.decals.length > 0;

    const hasBack =
      design.back.image?.src ||
      design.back.text?.value ||
      design.back.shapes.length > 0 ||
      design.back.decals.length > 0;

    if (hasFront && hasBack) {
      return 1600; // both sides
    }
    if (hasFront || hasBack) {
      return 1200; // only one side
    }
    return 800; // nothing designed yet
  };



  // 2. Improved handleAddToCart function - NOW SAVES TO BACKEND!
  const handleAddToCart = async () => {
    try {
      console.log("🎨 Starting cart add process...");

      // Check if user is logged in
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login to add items to cart");
        localStorage.setItem("redirectAfterLogin", "/custom-shirt-designer");
        setTimeout(() => {
          window.location.href = "/Login";
        }, 800);
        return;
      }

      // Show loading toast
      const loadingToast = toast.loading("Preparing your custom design...");

      // 🔥 NEW: Capture BOTH front and back design previews
      console.log("📸 Capturing front and back design images...");

      // Helper function to capture a specific side using canvas rendering
      // Uses proper object-contain logic to match screen display
      const captureSide = async (sideView) => {
        try {
          const sideDesign = design[sideView];
          const baseImageUrl = getProductImage(product, sideView, selectedColorKey);

          // Canvas dimensions - same 3:4 aspect ratio as screen
          const W = 600;
          const H = 800;
          
          // Screen container dimensions for calculating ratios
          const SCREEN_W = 384; // w-96
          const SCREEN_H = 512; // 3:4 aspect
          
          // Base size for images/decals on screen (from renderDecal: scale * 180)
          const SCREEN_ELEMENT_BASE = 180;

          const canvas = document.createElement("canvas");
          canvas.width = W;
          canvas.height = H;
          const ctx = canvas.getContext("2d");
          if (!ctx) return null;

          const loadImage = (src) =>
            new Promise((resolve) => {
              if (!src) return resolve(null);
              const img = new Image();
              img.crossOrigin = "anonymous";
              img.onload = () => resolve(img);
              img.onerror = () => resolve(null);
              img.src = src;
            });

          // Load base product image
          const baseImg = await loadImage(baseImageUrl);

          // Fill background
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, W, H);

          // Draw base product with object-contain logic (matches CSS object-contain)
          if (baseImg) {
            const imgAspect = baseImg.width / baseImg.height;
            const canvasAspect = W / H;
            let drawW, drawH, drawX, drawY;
            
            if (imgAspect > canvasAspect) {
              // Image is wider - fit to width
              drawW = W;
              drawH = W / imgAspect;
              drawX = 0;
              drawY = (H - drawH) / 2;
            } else {
              // Image is taller - fit to height
              drawH = H;
              drawW = H * imgAspect;
              drawX = (W - drawW) / 2;
              drawY = 0;
            }
            ctx.drawImage(baseImg, drawX, drawY, drawW, drawH);
          }

          // Scaling factor from screen to canvas
          const scaleX = W / SCREEN_W;

          // Helper to convert percentage to canvas pixels
          const pctToPx = (pctX, pctY) => [
            (pctX / 100) * W,
            (pctY / 100) * H
          ];

          // Draw uploaded image
          // Draw uploaded image
          if (sideDesign?.image?.src) {
            const designImg = await loadImage(sideDesign.image.src);
            if (designImg) {
              const imgConf = sideDesign.image;
              
              // CRITICAL: On screen, images use a SQUARE container with object-contain
              // Container is: scale * 180 x scale * 180 (SQUARE)
              // Image fits INSIDE this square using object-contain
              const screenContainerSize = SCREEN_ELEMENT_BASE * (imgConf.scale || 1);
              const canvasContainerSize = screenContainerSize * scaleX;
              
              // Apply object-contain logic within the SQUARE container
              const imgAspect = designImg.width / designImg.height; // width/height ratio
              let drawW, drawH;
              
              if (imgAspect > 1) {
                // Image is wider than tall - fit to width
                drawW = canvasContainerSize;
                drawH = canvasContainerSize / imgAspect;
              } else {
                // Image is taller than wide - fit to height
                drawH = canvasContainerSize;
                drawW = canvasContainerSize * imgAspect;
              }

              const [cx, cy] = pctToPx(imgConf.left ?? 50, imgConf.top ?? 50);

              ctx.save();
              ctx.translate(cx, cy);
              if (imgConf.rotate) ctx.rotate((Math.PI / 180) * imgConf.rotate);
              ctx.drawImage(designImg, -drawW / 2, -drawH / 2, drawW, drawH);
              ctx.restore();
            }
          }

          // Draw text
          if (sideDesign?.text?.value) {
            const t = sideDesign.text;
            const [tx, ty] = pctToPx(t.left ?? 50, t.top ?? 50);
            // Scale font size proportionally
            const fontSize = (t.size || 28) * scaleX;

            ctx.save();
            ctx.translate(tx, ty);
            if (t.rotate) ctx.rotate((Math.PI / 180) * t.rotate);

            const fontStyle = [
              t.italic ? "italic" : "",
              t.bold ? "bold" : "",
              `${fontSize}px`,
              t.font || "Arial"
            ].filter(Boolean).join(" ");

            ctx.font = fontStyle;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = t.color || "#111827";
            ctx.fillText(t.value, 0, 0);
            ctx.restore();
          }

          // Draw shapes
          if (sideDesign?.shapes?.length > 0) {
            for (const shape of sideDesign.shapes) {
              const [sx, sy] = pctToPx(shape.left ?? 50, shape.top ?? 50);
              // Scale shape size proportionally
              const size = (shape.size || 90) * scaleX;

              ctx.save();
              ctx.translate(sx, sy);
              if (shape.rotate) ctx.rotate((Math.PI / 180) * shape.rotate);
              ctx.fillStyle = shape.color || "#111827";

              if (shape.kind === "circle") {
                ctx.beginPath();
                ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
                ctx.fill();
              } else if (shape.kind === "triangle") {
                ctx.beginPath();
                ctx.moveTo(0, -size / 2);
                ctx.lineTo(size / 2, size / 2);
                ctx.lineTo(-size / 2, size / 2);
                ctx.closePath();
                ctx.fill();
              } else {
                // Default: rectangle/square
                ctx.fillRect(-size / 2, -size / 2, size, size);
              }
              ctx.restore();
            }
          }

          // Draw decals/templates
          if (sideDesign?.decals?.length > 0) {
            for (const decal of sideDesign.decals) {
              const decalImg = await loadImage(decal.src);
              if (decalImg) {
                const [dx, dy] = pctToPx(decal.left ?? 50, decal.top ?? 50);
                
                // CRITICAL: On screen, decals use a SQUARE container with object-contain
                // Container is: scale * 180 x scale * 180 (SQUARE)
                // Image fits INSIDE this square using object-contain
                const screenContainerSize = SCREEN_ELEMENT_BASE * (decal.scale || 1);
                const canvasContainerSize = screenContainerSize * scaleX;
                
                // Apply object-contain logic within the SQUARE container
                const imgAspect = decalImg.width / decalImg.height; // width/height ratio
                let drawW, drawH;
                
                if (imgAspect > 1) {
                  // Image is wider than tall - fit to width
                  drawW = canvasContainerSize;
                  drawH = canvasContainerSize / imgAspect;
                } else {
                  // Image is taller than wide - fit to height
                  drawH = canvasContainerSize;
                  drawW = canvasContainerSize * imgAspect;
                }

                ctx.save();
                ctx.translate(dx, dy);
                if (decal.rotate) ctx.rotate((Math.PI / 180) * decal.rotate);
                ctx.drawImage(decalImg, -drawW / 2, -drawH / 2, drawW, drawH);
                ctx.restore();
              }
            }
          }

          return canvas.toDataURL("image/png");
        } catch (err) {
          console.error(`❌ Error capturing ${sideView}:`, err);
          return null;
        }
      };

      // Capture both views
      const frontImage = await captureSide("front");
      const backImage = await captureSide("back");

      if (!frontImage && !backImage) {
        toast.error("Could not capture design preview", { id: loadingToast });
        console.error("❌ Failed to capture any preview");
        return;
      }

      console.log("✅ Design images captured:", {
        hasFront: !!frontImage,
        hasBack: !!backImage,
      });



      // Build the title with color
      const colorLabel =
        COLOR_OPTIONS.find((c) => c.key === selectedColorKey)?.label ||
        selectedColorKey;
      const title = `${product?.name || "Custom Tee"} — ${colorLabel}`;

      const price = computeCustomPrice();

      // Collect all images (filter out nulls)
      const allImages = [frontImage, backImage].filter(Boolean);
      const mainPreview = frontImage || backImage; // Use front as main, fallback to back

      // Prepare cart item for backend
      const cartItem = {
        productId: `custom-${product?.id || "x"}-${Date.now()}`,
        id: `custom-tee-${product?.id || "x"}-${Date.now()}`,
        name: title,
        description: title,

        // CRITICAL: Use captured previews
        image: mainPreview,
        imageUrls: allImages, // All captured design images
        customPreview: mainPreview,

        // Price and metadata
        sellingPrice: price,
        price: price,
        quantity: 1,
        size: selectedSize,

        // Mark as custom
        isCustom: true,
        source: "custom-shirt",
        sellerType: "Store",

        // Store product and design info
        productMeta: {
          id: product?.id,
          name: product?.name,
          color: selectedColorKey,
          colorLabel: colorLabel,
        },
        designData: {
          front: design.front,
          back: design.back,
          color: selectedColorKey,
          capturedAt: new Date().toISOString(),
        },
      };

      console.log("🛒 Preparing cart item:", {
        hasPreview: !!cartItem.customPreview,
        imageUrlsCount: cartItem.imageUrls?.length,
        price: cartItem.price,
        designDataKeys: Object.keys(cartItem.designData),
      });

      // Save preview images to backend to avoid localStorage quota issues
      try {
        console.log("📤 Saving custom design previews to server...");
        const previewResponse = await api.post("/custom-designs/preview", {
          designId: cartItem.id,
          frontImage: frontImage,
          backImage: backImage,
          productName: title,
        });

        if (previewResponse.data.success) {
          const serverUrls = previewResponse.data.imageUrls || [];
          console.log("✅ Previews saved to server:", serverUrls);

          // Update cart item to use server URLs instead of data URIs
          if (serverUrls.length > 0) {
            cartItem.customPreview = serverUrls[0];
            cartItem.image = serverUrls[0];
            cartItem.imageUrls = serverUrls;
          }
        }
      } catch (saveError) {
        console.warn(
          "⚠️ Failed to save previews to server, using data URIs:",
          saveError
        );
        // Continue with data URIs if server save fails
      }

      // Send to backend API
      const response = await api.post("/cart", cartItem);

      if (response.data.success) {
        console.log("✅ Added to backend cart successfully");

        // Also update localStorage for immediate UI feedback
        const existing = readStorage("cart");
        existing.push(cartItem);
        writeStorage("cart", existing);

        // Show success toast
        toast.success(`${title} added to cart!`, { id: loadingToast });

        // Redirect to cart after short delay
        setTimeout(() => {
          window.location.href = "/cart";
        }, 800);
      } else {
        toast.error("Failed to add to cart", { id: loadingToast });
      }
    } catch (e) {
      console.error("❌ Add-to-cart error:", e);

      if (e.response?.status === 401) {
        toast.error("Please login to add items to cart");
        localStorage.setItem("redirectAfterLogin", "/custom-shirt-designer");
        setTimeout(() => {
          window.location.href = "/Login";
        }, 800);
      } else {
        toast.error(
          e.response?.data?.error ||
            "Could not add item to cart. Please try again."
        );
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {mode === "browse" ? (
        <ProductBrowse onSelect={selectProduct} />
      ) : (
        <div className="flex flex-col h-screen">
          <TopToolbar
            product={product}
            view={view}
            setView={(v) => {
              setView(v);
              setSelectedShapeId(null);
              setSelectedDecalId(null);
            }}
            zoom={zoom}
            onBack={() => {
              setMode("browse");
              setProduct(null);
              setSelectedShapeId(null);
              setSelectedDecalId(null);
            }}
            onAddToCart={handleAddToCart}
            selectedColorKey={selectedColorKey}
          />
          <div className="flex flex-col lg:flex-row flex-1 overflow-hidden relative">
            {/* Left Toolbar - Collapsible on mobile / Always visible on Desktop */}
            <div
              className={`z-10 lg:relative absolute left-4 top-4 lg:left-auto lg:top-auto lg:shadow-none lg:rounded-none transition-all duration-200 ${
                isMobile && toolbarCollapsed
                  ? ""
                  : "p-2 sm:p-4 bg-gray-50 border-r border-gray-200 shadow-lg rounded-xl"
              }`}
            >
              <LeftToolbar
                onUndo={undo}
                onRedo={redo}
                canUndo={hIndex > 0}
                canRedo={hIndex < history.length - 1}
                onZoomIn={() => setZoom((z) => Math.min(z + 0.05, 1.25))}
                onZoomOut={() => setZoom((z) => Math.max(z - 0.05, 0.6))}
                onZoomReset={handleFullReset}
                atZoomMin={zoom <= 0.6}
                atZoomMax={zoom >= 1.25}
                isCollapsed={toolbarCollapsed}
                onToggle={() => setToolbarCollapsed(!toolbarCollapsed)}
                isMobile={isMobile}
              />
            </div>

            {/* Center Canvas */}
            <div className="flex-1 flex justify-center items-center p-4 sm:p-8 bg-slate-100 overflow-hidden relative">
              <ShirtMock
                product={product}
                view={view}
                zoom={zoom}
                sideState={design[view]}
                onDragImage={(l, t) => moveImage(l, t)}
                onDragText={(l, t) => moveText(l, t)}
                onDragShape={(id, l, t) => moveShape(id, l, t)}
                onDragDecal={(id, l, t) => moveDecal(id, l, t)}
                onCommitDrag={commitMove}
                setImageScale={setImageScale}
                setTextSize={setTextSize}
                setShapeSize={setShapeSize}
                setDecalScale={setDecalScale}
                setImageRotate={setImageRotate}
                setTextRotate={setTextRotate}
                setShapeRotate={setShapeRotate}
                setDecalRotate={setDecalRotate}
                onDeleteImage={() => {
                  const next = {
                    ...design,
                    [view]: {
                      ...design[view],
                      image: {
                        src: null,
                        left: 50,
                        top: 50,
                        scale: 1,
                        rotate: 0,
                      },
                    },
                  };
                  setDesign(next);
                  snapshot(next);
                }}
                onDeleteText={onDeleteText}
                onDeleteShape={onDeleteShape}
                onDeleteDecal={onDeleteDecal}
                selectedShapeId={selectedShapeId}
                onSelectShape={onSelectShape}
                selectedDecalId={selectedDecalId}
                onSelectDecal={onSelectDecal}
                selectedColorKey={selectedColorKey}
                isTextSelected={isTextSelected}
                onSelectText={onSelectText}
              />
            </div>

            {/* Right Panel - Stacked Bottom / Side Right */}
            <div
              className={`w-full lg:w-96 bg-gray-50 border-t lg:border-t-0 lg:border-l border-gray-200 shadow-xl lg:shadow-none z-20 flex flex-col transition-all duration-300 ${
                isMobile
                  ? rightPanelCollapsed
                    ? "h-10"
                    : "h-[45vh]"
                  : "h-auto"
              }`}
            >
              {/* Mobile Collapse Toggle */}
              {isMobile && (
                <button
                  onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
                  className="w-full h-10 flex items-center justify-center bg-gray-100 border-b border-gray-200 text-gray-600 hover:text-gray-900 shadow-sm"
                >
                  {rightPanelCollapsed ? (
                    <>
                      <span className="mr-2 text-xl font-bold">+</span> Open
                      Tools
                    </>
                  ) : (
                    <>
                      <span className="mr-2 text-xl font-bold">−</span> Minimize
                      Tools
                    </>
                  )}
                </button>
              )}

              <div
                className={`flex-1 overflow-y-auto p-4 sm:p-6 ${
                  isMobile && rightPanelCollapsed ? "hidden" : ""
                }`}
              >
                <RightPanel
                  activeTab={activeTab}
                  design={design}
                  view={view}
                  setActiveTab={setActiveTab}
                  setSideImage={setSideImage}
                  setSideText={setSideText}
                  setImageScaleSide={setImageScaleSide}
                  setTextSizeSide={setTextSizeSide}
                  setTextStyleSide={setTextStyleSide}
                  addShapeSide={addShapeSide}
                  selectedShape={selectedShape}
                  setSelectedShapeColor={setSelectedShapeColor}
                  setSelectedShapeSize={setSelectedShapeSize}
                  addDecalSide={addDecalSide}
                  selectedDecal={selectedDecal}
                  setSelectedDecalScale={setSelectedDecalScale}
                  setImageRotateSide={setImageRotateSide}
                  setSelectedShapeRotate={setSelectedShapeRotate}
                  setSelectedDecalRotate={setSelectedDecalRotate}
                  selectedColorKey={selectedColorKey}
                  setSelectedColorKey={setSelectedColorKey}
                  selectedSize={selectedSize}
                  setSelectedSize={setSelectedSize}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
