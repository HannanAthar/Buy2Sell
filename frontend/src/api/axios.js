// src/api/axios.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true,
});

// Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    console.log('📤 Request:', config.method?.toUpperCase(), config.url);

    // Don't attach token to login/register endpoints
    const publicEndpoints = ['/admin/auth/login', '/auth/login', '/auth/register', '/auth/signup'];
    const isPublicEndpoint = publicEndpoints.some(endpoint => config.url?.includes(endpoint));

    if (isPublicEndpoint) {
      console.log('🌐 Public endpoint - no token needed');
      console.log('📦 Request data:', config.data);
      return config;
    }

    // Check if this is an admin route
    const isAdminRoute = config.url?.startsWith('/admin');

    // For admin routes, prioritize adminToken
    const token = isAdminRoute
      ? localStorage.getItem("adminToken")
      : localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`🔑 Token Attached (${isAdminRoute ? 'Admin' : 'User'}):`, token.substring(0, 15) + "...");
    } else {
      console.warn('⚠️ No token found in localStorage for', config.url);
    }

    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    console.log('✅ Response:', response.status, response.config.url);
    console.log('📦 Response data:', response.data);
    return response;
  },
  (error) => {
    console.error('❌ Response error:', error.response?.status, error.config?.url);
    console.error('❌ Error data:', error.response?.data);

    // Handle specific error cases
    if (error.response?.status === 401) {
      console.log('🔒 Unauthorized - clearing tokens');
      // Don't auto-clear tokens here, let the component handle it
    }

    return Promise.reject(error);
  }
);

export default api;