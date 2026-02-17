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
  const [designerProducts, setDesignerProducts] = useState([]);
  const [resellerProducts, setResellerProducts] = useState([]);
  const [customProducts, setCustomProducts] = useState([]); // New state for custom products
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔥 FIX: Fetch ALL products from backend
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("📡 Fetching ALL products from backend...");

      const response = await api.get("/products");

      console.log("📦 Raw API Response:", response.data);

      if (response.data && response.data.products) {
        const products = response.data.products;

        console.log(
          `✅ Received ${products.length} total products from MongoDB`
        );

        // Process all products to add full image URLs
        const productsWithFullUrls = products.map(processProduct);

        // 🔥 FIX: Improved separation logic - check multiple fields
        const designers = productsWithFullUrls.filter((p) => {
          // Check if product is designer type
          const isDesignerType =
            p.sellerType === "Designer" ||
            p.role === "designer" ||
            p.userType === "designer";

          // Check if has designer-specific fields
          const hasDesignerFields = p.brandName && !p.wardrobeName;

          return isDesignerType || hasDesignerFields;
        });

        const resellers = productsWithFullUrls.filter((p) => {
          // Check if product is reseller type
          const isResellerType =
            p.sellerType === "Reseller" ||
            p.role === "reseller" ||
            p.userType === "reseller";

          // Check if has reseller-specific fields
          const hasResellerFields = p.wardrobeName && !p.brandName;

          return isResellerType || hasResellerFields;
        });

        const customs = productsWithFullUrls.filter((p) => {
          return (
            p.sellerType === "Store" ||
            p.source === "custom-shirt" ||
            p.isCustom === true ||
            p.productType === "custom-style"
          );
        });

        console.log(`✅ Separated: ${designers.length} designer products`);
        console.log(`✅ Separated: ${resellers.length} reseller products`);
        console.log(`✅ Separated: ${customs.length} custom products`);

        // 🔥 CRITICAL: Always set the state with ALL products from DB
        setDesignerProducts(designers);
        setResellerProducts(resellers);
        setCustomProducts(customs);

        // Debug: Log first product of each type
        if (designers.length > 0) {
          console.log("🎨 First designer product:", {
            id: designers[0]._id,
            title: designers[0].title || designers[0].description,
            brand: designers[0].brandName,
            images: designers[0].images?.length,
          });
        }

        if (resellers.length > 0) {
          console.log("🏪 First reseller product:", {
            id: resellers[0]._id,
            title: resellers[0].title || resellers[0].description,
            wardrobe: resellers[0].wardrobeName,
            images: resellers[0].images?.length,
          });
        }
      } else {
        console.warn("⚠️ No products array in response");
        setDesignerProducts([]);
        setResellerProducts([]);
        setCustomProducts([]);
      }
    } catch (err) {
      console.error("❌ Error fetching products:", err);
      console.error("❌ Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setError(
        err.response?.data?.error || err.message || "Failed to load products"
      );
      setDesignerProducts([]);
      setResellerProducts([]);
      setCustomProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    console.log(
      "🚀 ProductContext mounted - fetching ALL products from MongoDB"
    );
    fetchProducts();
  }, []);

  // 🔥 FIX: After adding product, refetch ALL products to stay in sync
  const addDesignerProduct = async (product) => {
    try {
      console.log("➕ Adding designer product...");
      const response = await api.post("/products", {
        ...product,
        role: "designer",
        userType: "designer",
        sellerType: "Designer",
      });

      if (response.data && response.data.product) {
        console.log("✅ Designer product added to MongoDB");
        // 🔥 Refetch ALL products to ensure sync
        await fetchProducts();
        return processProduct(response.data.product);
      }
    } catch (err) {
      console.error("❌ Error adding designer product:", err);
      throw err;
    }
  };

  // 🔥 FIX: After adding product, refetch ALL products to stay in sync
  const addResellerProduct = async (product) => {
    try {
      console.log("➕ Adding reseller product...");
      const response = await api.post("/products", {
        ...product,
        role: "reseller",
        userType: "reseller",
        sellerType: "Reseller",
      });

      if (response.data && response.data.product) {
        console.log("✅ Reseller product added to MongoDB");
        // 🔥 Refetch ALL products to ensure sync
        await fetchProducts();
        return processProduct(response.data.product);
      }
    } catch (err) {
      console.error("❌ Error adding reseller product:", err);
      throw err;
    }
  };

  // Update designer product by index
  const updateDesignerProductAt = async (index, updates) => {
    try {
      const product = designerProducts[index];
      if (!product || !product._id) {
        console.warn("⚠️ No product found at index", index);
        return;
      }

      console.log(`🔄 Updating designer product ${product._id}...`);
      const response = await api.put(`/products/${product._id}`, updates);

      if (response.data && response.data.product) {
        console.log("✅ Designer product updated in MongoDB");
        // Refetch to ensure sync
        await fetchProducts();
      }
    } catch (err) {
      console.error("❌ Error updating designer product:", err);
      throw err;
    }
  };

  // Update reseller product by index
  const updateResellerProductAt = async (index, updates) => {
    try {
      const product = resellerProducts[index];
      if (!product || !product._id) {
        console.warn("⚠️ No product found at index", index);
        return;
      }

      console.log(`🔄 Updating reseller product ${product._id}...`);
      const response = await api.put(`/products/${product._id}`, updates);

      if (response.data && response.data.product) {
        console.log("✅ Reseller product updated in MongoDB");
        // Refetch to ensure sync
        await fetchProducts();
      }
    } catch (err) {
      console.error("❌ Error updating reseller product:", err);
      throw err;
    }
  };

  // Delete designer product by index
  const deleteDesignerProductAt = async (index) => {
    try {
      const product = designerProducts[index];
      if (!product || !product._id) {
        console.warn("⚠️ No product found at index", index);
        return;
      }

      console.log(`🗑️ Deleting designer product ${product._id}...`);
      await api.delete(`/products/${product._id}`);

      console.log("✅ Designer product deleted from MongoDB");
      // Refetch to ensure sync
      await fetchProducts();
    } catch (err) {
      console.error("❌ Error deleting designer product:", err);
      throw err;
    }
  };

  // Delete reseller product by index
  const deleteResellerProductAt = async (index) => {
    try {
      const product = resellerProducts[index];
      if (!product || !product._id) {
        console.warn("⚠️ No product found at index", index);
        return;
      }

      console.log(`🗑️ Deleting reseller product ${product._id}...`);
      await api.delete(`/products/${product._id}`);

      console.log("✅ Reseller product deleted from MongoDB");
      // Refetch to ensure sync
      await fetchProducts();
    } catch (err) {
      console.error("❌ Error deleting reseller product:", err);
      throw err;
    }
  };

  // Refresh products manually
  const refreshProducts = () => {
    console.log("🔄 Manually refreshing ALL products from MongoDB...");
    fetchProducts();
  };

  const value = {
    designerProducts,
    resellerProducts,
    customProducts,
    loading,
    error,
    addDesignerProduct,
    addResellerProduct,
    updateDesignerProductAt,
    updateResellerProductAt,
    deleteDesignerProductAt,
    deleteResellerProductAt,
    refreshProducts,
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
