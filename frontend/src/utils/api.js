// frontend/src/utils/api.js
import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,
});

// Add auth token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle response errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem("token");
            localStorage.removeItem("role");
            window.location.href = "/Login";
        }
        return Promise.reject(error);
    }
);

// ============= ORDER APIs =============

export const orderAPI = {
    // Get user's orders
    getMyOrders: async () => {
        try {
            const response = await api.get("/orders/my");
            return response.data;
        } catch (error) {
            console.error("Error fetching orders:", error);
            throw error;
        }
    },

    // Create offline order (COD/Wallet)
    createOfflineOrder: async (orderData) => {
        try {
            const response = await api.post("/orders", orderData);
            return response.data;
        } catch (error) {
            console.error("Error creating order:", error);
            throw error;
        }
    },
};

// ============= CART APIs =============

export const cartAPI = {
    // Get user's cart
    getCart: async () => {
        try {
            const response = await api.get("/cart");
            return response.data;
        } catch (error) {
            console.error("Error fetching cart:", error);
            throw error;
        }
    },

    // Add item to cart
    addToCart: async (item) => {
        try {
            const response = await api.post("/cart", item);
            return response.data;
        } catch (error) {
            console.error("Error adding to cart:", error);
            throw error;
        }
    },

    // Update cart item quantity
    updateCartItem: async (itemId, quantity) => {
        try {
            const response = await api.put(`/cart/${itemId}`, { quantity });
            return response.data;
        } catch (error) {
            console.error("Error updating cart item:", error);
            throw error;
        }
    },

    // Remove item from cart
    removeFromCart: async (itemId) => {
        try {
            const response = await api.delete(`/cart/${itemId}`);
            return response.data;
        } catch (error) {
            console.error("Error removing from cart:", error);
            throw error;
        }
    },

    // Clear entire cart
    clearCart: async () => {
        try {
            const response = await api.delete("/cart");
            return response.data;
        } catch (error) {
            console.error("Error clearing cart:", error);
            throw error;
        }
    },
};

export default api;
