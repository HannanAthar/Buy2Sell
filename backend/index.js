// backend/index.js
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


dotenv.config({ path: path.join(__dirname, ".env") });

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';




import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import customDesignRoutes from './routes/customDesignRoutes.js';

import adminAuthRoutes from "./routes/adminAuthRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import adminCustomProductRoutes from "./routes/adminCustomProductRoutes.js";

import productRoutes from './routes/productRoutes.js';

import { protect } from './middlewares/authMiddleware.js';
import paymentRoutes from './routes/paymentRoutes.js';
import notifyRoutes from "./routes/notifyRoutes.js";

import reviewRoutes from './routes/reviewRoutes.js';
import diagnosticRoutes from './routes/diagnosticRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import escrowRoutes from "./routes/escrowRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";

import { stripeWebhook } from "./controllers/paymentController.js";

const app = express();

app.set('trust proxy', 1);

// 🔒 SECURITY HEADERS (helmet)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://js.stripe.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.stripe.com", "http://localhost:5000", "https://generativelanguage.googleapis.com", process.env.BACKEND_URL].filter(Boolean),
      frameSrc: ["'self'", "https://js.stripe.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: { action: 'deny' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xContentTypeOptions: true,
  xDnsPrefetchControl: { allow: false },
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// 🔒 CORS Configuration (environment-based)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ⚡ PERFORMANCE: Gzip compression
app.use(compression());

// 🛡️ SECURITY: Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs (Relaxed for active usage)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

/**
 * 🔴 STRIPE WEBHOOK – must be BEFORE any body parser
 * This route receives raw body, not JSON.
 */
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

/**
 * BODY PARSERS
 * 🔒 SECURITY: Limit body size to prevent DoS attacks
 */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());

/**
 * ASSETS
 */
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '30d',
  etag: true
}));

/**
 * API ROUTES
 */

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/custom-designs', customDesignRoutes);

app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/contact', contactRoutes); // For admin access to messages
app.use('/api/admin/custom-products', adminCustomProductRoutes);
app.use('/api/custom-products', adminCustomProductRoutes); // Public routes

app.use('/api/products', productRoutes);
app.use('/api/payments', paymentRoutes);
app.use("/api/notify", notifyRoutes);

app.use('/api/reviews', reviewRoutes);
app.use('/api/diagnostic', diagnosticRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/escrow', escrowRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check, etc...

/**
 * HEALTH CHECK
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    service: 'Buy2Sell Backend'
  });
});

// Protected test routes

app.get('/api/protected/user', protect(['buyer']), (req, res) => {
  res.json({ message: 'This route is accessible by buyers only', user: req.user });
});
app.get('/api/protected/all', protect(['buyer']), (req, res) => {
  res.json({ message: 'This route is accessible by all user types', user: req.user });
});

// 🔒 SECURITY: Error handlers (must be LAST)
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
app.use(notFoundHandler); // 404 handler
app.use(errorHandler);    // Global error handler


/**
 * MONGODB CONNECTION WITH POOLING
 */
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_CONN || process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_CONN not found in environment variables.");
  process.exit(1);
}

// Connection options with pooling
const mongoOptions = {
  maxPoolSize: 10,           // Maximum number of connections in the pool
  minPoolSize: 5,            // Minimum number of connections
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

// Query performance monitoring
mongoose.set('debug', (collectionName, method, query, doc, options) => {
  // This is called before the query executes
  const startTime = Date.now();

  // Return a function that will be called after query completes
  return () => {
    const duration = Date.now() - startTime;
    if (duration > 100) { // Log slow queries (>100ms)
      console.warn(`🐢 SLOW QUERY (${duration}ms): ${collectionName}.${method}`, {
        query: JSON.stringify(query).substring(0, 200)
      });
    }
  };
});

// Memory usage monitoring (every 60 seconds)
setInterval(() => {
  const used = process.memoryUsage();
  const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
  if (heapUsedMB > 200) { // Warn if heap > 200MB
    console.warn(`⚠️ High memory usage: ${heapUsedMB}MB heap`);
  }
}, 60000);

// Import cacheService for graceful shutdown
import cacheService from './services/cacheService.js';

mongoose
  .connect(MONGO_URI, mongoOptions)
  .then(() => {
    console.log(`✅ Connected to MongoDB (Pool: min=${mongoOptions.minPoolSize}, max=${mongoOptions.maxPoolSize})`);
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Monitor connection events
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 ${signal} received. Starting graceful shutdown...`);

  try {
    await mongoose.disconnect();
    console.log('✅ MongoDB disconnected');

    await cacheService.disconnect();
    console.log('✅ Redis disconnected');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error during shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

export default app;
