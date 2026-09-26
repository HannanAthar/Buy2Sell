import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

const ProductContext = createContext();

// Helper to convert backend image paths to full URLs
const getImageUrl = (imagePath) => {
  if (!imagePath) return "/placeholder.svg";
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  const baseURL = "http://localhost:5000";
  const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
  return `${baseURL}${cleanPath}`;
};

// Helper to process product with proper image URLs
const processProduct = (product) => {
  if (!product) return product;
  const images = Array.isArray(product.images) ? product.images : [];
  return {
    ...product,
    images: images.map(getImageUrl),
    imageUrls: images.map(getImageUrl),
    image: product.image ? getImageUrl(product.image) : null,
    sizeChartUrl: product.sizeChart ? getImageUrl(product.sizeChart) : null,
  };
};

export const ProductProvider = ({ children }) => {
  // This platform is a custom clothing studio — all products are custom products.
  const [customProducts, setCustomProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("📡 Fetching custom products from backend...");
      const response = await api.get("/products");
      console.log("📦 Raw API Response:", response.data);

      if (response.data && response.data.products) {
        const products = response.data.products;
        console.log(`✅ Received ${products.length} products from MongoDB`);

        const processed = products.map(processProduct);
        setCustomProducts(processed);

        if (processed.length > 0) {
          console.log("👕 Sample product:", {
            id: processed[0]._id,
            name: processed[0].name,
            price: processed[0].price,
            sellerType: processed[0].sellerType,
          });
        }
      } else {
        console.warn("⚠️ No products array in response");
        setCustomProducts([]);
      }
    } catch (err) {
      console.error("❌ Error fetching products:", err.message, err.response?.data);
      setError(err.response?.data?.error || err.message || "Failed to load products");
      setCustomProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const refreshProducts = () => {
    console.log("🔄 Refreshing products...");
    fetchProducts();
  };

  const value = {
    // Legacy aliases kept so existing components don't crash
    designerProducts: [],
    resellerProducts: [],
    // All real products
    customProducts,
    loading,
    error,
    refreshProducts,
    // Legacy stubs
    addDesignerProduct: async () => {},
    addResellerProduct: async () => {},
    updateDesignerProductAt: async () => {},
    updateResellerProductAt: async () => {},
    deleteDesignerProductAt: async () => {},
    deleteResellerProductAt: async () => {},
  };

  return (
    <ProductContext.Provider value={value}>{children}</ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error("useProducts must be used within ProductProvider");
  }
  return context;
};

export default ProductContext;
