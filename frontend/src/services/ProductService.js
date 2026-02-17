// productService.js - API calls to your MongoDB backend

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Get auth token
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Compress image before upload
const compressImage = (base64, quality = 0.7, maxWidth = 1200) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxWidth) {
          width = (width * maxWidth) / height;
          height = maxWidth;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(base64);
    img.src = base64;
  });
};

// Product Service
export const productService = {
  // Create Designer Product
  async createDesignerProduct(productData) {
    try {
      console.log('🚀 Uploading designer product to MongoDB...');
      
      // Compress images before sending
      if (productData.imageUrls && productData.imageUrls.length > 0) {
        console.log('🖼️ Compressing images...');
        productData.imageUrls = await Promise.all(
          productData.imageUrls.map(img => compressImage(img, 0.7, 1200))
        );
      }

      const response = await fetch(`${API_BASE_URL}/products/designer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(productData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create product');
      }

      const result = await response.json();
      console.log('✅ Product uploaded successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Upload failed:', error);
      throw error;
    }
  },

  // Create Reseller Product
  async createResellerProduct(productData) {
    try {
      console.log('🚀 Uploading reseller product to MongoDB...');
      
      // Compress images before sending
      if (productData.imageUrls && productData.imageUrls.length > 0) {
        console.log('🖼️ Compressing images...');
        productData.imageUrls = await Promise.all(
          productData.imageUrls.map(img => compressImage(img, 0.7, 1200))
        );
      }

      const response = await fetch(`${API_BASE_URL}/products/reseller`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(productData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create product');
      }

      const result = await response.json();
      console.log('✅ Product uploaded successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Upload failed:', error);
      throw error;
    }
  },

  // Get Designer Products (for specific user)
  async getDesignerProducts(ownerId) {
    try {
      const response = await fetch(`${API_BASE_URL}/products/designer/${ownerId}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch products');
      
      const products = await response.json();
      console.log(`📦 Loaded ${products.length} designer products`);
      return products;
    } catch (error) {
      console.error('❌ Failed to load products:', error);
      return [];
    }
  },

  // Get Reseller Products (for specific user)
  async getResellerProducts(ownerId) {
    try {
      const response = await fetch(`${API_BASE_URL}/products/reseller/${ownerId}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch products');
      
      const products = await response.json();
      console.log(`📦 Loaded ${products.length} reseller products`);
      return products;
    } catch (error) {
      console.error('❌ Failed to load products:', error);
      return [];
    }
  },

  // Get All Products (for marketplace)
  async getAllProducts(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`${API_BASE_URL}/products?${queryParams}`);

      if (!response.ok) throw new Error('Failed to fetch products');
      
      const products = await response.json();
      console.log(`📦 Loaded ${products.length} total products`);
      return products;
    } catch (error) {
      console.error('❌ Failed to load products:', error);
      return [];
    }
  },

  // Update Product
  async updateProduct(productId, updates, productType = 'designer') {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${productType}/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) throw new Error('Failed to update product');
      
      const result = await response.json();
      console.log('✅ Product updated');
      return result;
    } catch (error) {
      console.error('❌ Update failed:', error);
      throw error;
    }
  },

  // Delete Product
  async deleteProduct(productId, productType = 'designer') {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${productType}/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete product');
      
      console.log('✅ Product deleted');
      return true;
    } catch (error) {
      console.error('❌ Delete failed:', error);
      throw error;
    }
  }
};

export default productService;