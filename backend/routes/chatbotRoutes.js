// routes/chatbotRoutes.js - Public routes for chatbot AI assistant
import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  searchProducts,
  getProductDetails,
  getProductStock,
  getDesignerInfo,
  getResellerInfo,
  getCustomizationGuide,
  getRegistrationGuide,
  searchDesigners,
  getAllDesigners,
  searchResellers,
  getTopRatedDesigners
} from '../controllers/chatbotController.js';
import { processAIQuery } from '../controllers/geminiChatbotController.js';

const router = express.Router();

// Rate limiting: 30 requests per minute per IP
const chatbotLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30,
  message: {
    error: 'Too many requests from this IP. Please try again in a minute.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all chatbot routes
router.use(chatbotLimiter);

// AI-powered query processing (Gemini)
router.post('/ai/query', processAIQuery);

// Product queries
router.get('/search', searchProducts);
router.get('/product/:id', getProductDetails);
router.get('/product/:id/stock', getProductStock);

// Designer & Reseller information
router.get('/designer/:id', getDesignerInfo);
router.get('/reseller/:id', getResellerInfo);
router.get('/designers/search', searchDesigners);
router.get('/designers/all', getAllDesigners);
router.get('/designers/top-rated', getTopRatedDesigners);
router.get('/resellers/search', searchResellers);

// Platform guides
router.get('/guides/customization', getCustomizationGuide);
router.get('/guides/registration/:type', getRegistrationGuide);

export default router;
