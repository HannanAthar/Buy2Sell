// routes/productRoutes.js - ES6 Module
import express from 'express';
import Product from '../models/Product.js';
import * as productController from '../controllers/productController.js';
import { uploadProductFiles, validateFileContent } from '../middlewares/uploadMiddleware.js';
// import { optimizeImages } from '../middlewares/imageOptimizer.js';
import { protect, optionalAuth } from '../middlewares/authMiddleware.js';

import { cacheMiddleware } from '../middlewares/cacheMiddleware.js';

const router = express.Router();

// CREATE - Upload new product (Designer/Reseller)
router.post('/',
  protect(['designer', 'reseller']),
  uploadProductFiles,
  validateFileContent,
  // optimizeImages,
  productController.createProduct
);

// TEMP TEST ROUTE
router.post('/test-upload', uploadProductFiles, (req, res) => {
  console.log('🧪 Test Upload Route Hit');
  console.log('Files:', req.files);
  res.json({ success: true, files: req.files });
});

// READ - Get all products (Public - for marketplace)
router.get('/', optionalAuth, cacheMiddleware({ ttl: 300, prefix: 'products' }), productController.getAllProducts);

// READ - Get logged-in seller's products (Protected)
router.get('/my/products',
  protect(['designer', 'reseller']),
  productController.getSellerProducts
);

// READ - Get single product by ID (Public)
router.get('/:id', optionalAuth, cacheMiddleware({ ttl: 300, prefix: 'product' }), productController.getProductById);

// UPDATE - Edit product (Protected - owner only)
router.put('/:id',
  protect(['designer', 'reseller']),
  uploadProductFiles,
  validateFileContent,
  // optimizeImages,
  productController.updateProduct
);

// DELETE - Remove product (Protected - owner only)
router.delete('/:id',
  protect(['designer', 'reseller']),
  productController.deleteProduct
);

// RENTAL MANAGEMENT - Get rental history
router.get('/:id/rental-history',
  protect(['designer', 'reseller', 'admin']),
  productController.getRentalHistory
);

// RENTAL MANAGEMENT - Mark product as available
router.post('/:id/mark-available',
  protect(['designer', 'reseller']),
  productController.markAsAvailable
);

// ADMIN routes
router.get('/admin/list',
  protect(['admin']),
  productController.adminGetAllProducts
);

router.patch('/admin/:id/status',
  protect(['admin']),
  productController.adminUpdateProductStatus
);

router.post('/admin/batch-classify-gender',
  protect(['admin']),
  productController.batchClassifyGender
);

// ES6 default export
export default router;