import Product from "../models/Product.js"
import Cart from "../models/Cart.js"
import Wishlist from "../models/Wishlist.js"
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { markProductAsAvailable } from '../utils/stockUtils.js';
import { clearCache, invalidateProductCache } from '../middlewares/cacheMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CREATE - Add new product
export const createProduct = async (req, res, next) => {
  try {
    console.log('📦 Received product creation request');
    console.log('HEADERS content-type:', req.headers['content-type']);
    console.log('FILES:', req.files);
    console.log('BODY:', req.body);

    const {
      name,
      description,
      price,
      category,
      gender, // NEW
      stock = 1,
      sku,
      size,
      color,
      material,
      fabric,
      stitching,
      pieceCount,
      tags,
      listingType = 'sale',
      isOnSale = false,
      salePercentage,
      salePrice,
      rentPrice,
      rentDuration,
      securityDeposit,
      condition,
      hasAuthenticity,
      originalPrice
    } = req.body;

    // DEBUG: Log user info
    console.log('👤 User info:', req.user);

    // Validation
    if (!name || !description || !price || !category) {
      return res.status(400).json({ error: "Name, description, price, and category are required." });
    }

    // Gender validation for specific categories
    if (['clothes', 'clothing', 'bags', 'shoes', 'footwear'].includes(category.toLowerCase())) {
      if (!gender) {
        // Optional: enforce strictly or just warn. For now let's default to Unisex if missing to avoid breaking old clients
        // But optimally we should require it.
        // req.body.gender = 'Unisex'; 
      }
    }

    if (Number(price) < 0) {
      return res.status(400).json({ error: "Price cannot be negative." });
    }

    if (Number(stock) < 0) {
      return res.status(400).json({ error: "Stock cannot be negative." });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "At least one product image is required." });
    }

    // Only admin can create products in the custom clothing platform
    const userRole = req.user.role;
    if (userRole !== 'admin') {
      return res.status(403).json({ error: "Only admins can add products." });
    }
    const sellerName = 'Admin';

    // Process images - files are already saved by multer (Cloudinary)
    const images = req.files.map((file) => file.path);

    console.log('✅ Images processed:', images);

    // Create product
    const product = new Product({
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : Number(price), // Use passed originalPrice if available
      category: category.toLowerCase(),
      gender: gender || 'Unisex', // NEW: Default to Unisex
      stock: Number(stock),
      sku: sku ? sku.trim().toUpperCase() : undefined,
      size: size || undefined,
      color: color ? color.trim() : undefined,
      material: material ? material.trim() : undefined,
      fabric: fabric ? fabric.trim() : undefined,
      stitching: stitching || undefined,
      pieceCount: pieceCount || undefined,
      tags: tags || undefined,
      images,
      sellerId: req.user.id,
      sellerType: 'Admin',
      sellerName: sellerName,
      listingType: listingType || 'sale',
      isOnSale: isOnSale === 'true' || isOnSale === true,
      salePercentage: salePercentage ? Number(salePercentage) : undefined,
      salePrice: salePrice ? Number(salePrice) : undefined,
      rentPrice: rentPrice || undefined,
      rentDuration: rentDuration || undefined,
      securityDeposit: securityDeposit || undefined,
      condition: condition || undefined,
      hasAuthenticity: hasAuthenticity === 'true' || hasAuthenticity === true,
      isActive: true,
      status: 'pending'
    });

    await product.save();

    // Invalidate product cache
    invalidateProductCache();

    console.log('✅ Product saved to MongoDB:', product._id);

    res.status(201).json({
      success: true,
      message: "Product created successfully!",
      product,
    });
  } catch (err) {
    console.error('❌ Product creation error:', err);

    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ error: errors.join(", ") });
    }
    if (err.code === 11000) {
      return res.status(400).json({ error: "SKU already exists. Please use a unique SKU." });
    }

    next(err);
  }
};

// READ - Get all products (with filters)
export const getAllProducts = async (req, res, next) => {
  try {
    const { category, minPrice, maxPrice, search, page = 1, limit = 500, sellerType, gender } = req.query;

    // PUBLIC VIEW: Only show active AND approved products
    // Products with zero stock are auto-hidden (isActive = false)
    const filter = { isActive: true, status: 'approved' };

    if (category) {
      filter.category = category.toLowerCase();
    }

    // Gender filter
    if (gender) {
      if (Array.isArray(gender)) {
        filter.gender = { $in: gender };
      } else {
        filter.gender = gender;
      }
    }

    if (sellerType) {
      filter.sellerType = sellerType;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (search) {
      filter.$text = { $search: search };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const products = await Product.find(filter)
      .lean() // Convert to plain objects for caching compatibility
      .limit(Number(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(filter);

    console.log(`📦 Loaded ${products.length} products (total: ${total})`);

    res.json({
      success: true,
      products,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error("Get products error:", err);
    next(err);
  }
};

// READ - Get single product
export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    res.json({
      success: true,
      product,
    });
  } catch (err) {
    console.error("Get product error:", err);
    next(err);
  }
};

// READ - Get seller's products
// READ - Get seller's products
export const getSellerProducts = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userType = req.user.role;
    const { page = 1, limit = 500 } = req.query;

    console.log(`🔍 getSellerProducts: Fetching for UserID: ${userId} (Strict ID Mode)`);

    const skip = (Number(page) - 1) * Number(limit);

    // 🔥 STRICT ID-BASED QUERY
    // We removed the fallback to sellerName because it caused data mixing for users with same names.
    const query = {
      sellerId: userId
    };

    console.log('🔍 MongoDB Query:', JSON.stringify(query));

    const products = await Product.find(query)
      .limit(Number(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(query);

    console.log(`📦 Loaded ${products.length} products for seller ${userId}`);

    res.json({
      success: true,
      products,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error("Get seller products error:", err);
    next(err);
  }
};

// UPDATE - Edit product
export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updates = req.body;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    // Check ownership
    if (product.sellerId.toString() !== userId) {
      return res.status(403).json({ error: "You can only edit your own products." });
    }

    // Update fields
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined && updates[key] !== null) {
        product[key] = updates[key];
      }
    });

    // Special handling for stock updates
    // If stock is updated to > 0, ensure product is visible again
    if (updates.stock !== undefined) {
      const newStock = Number(updates.stock);
      
      // If stock exists, make visible
      if (newStock > 0) {
        product.isActive = true;
      } 
      // If stock is 0 and NOT rental, hide it
      // (Rentals stay visible even at 0 stock to show "ALREADY RENTED")
      else if (newStock === 0 && product.listingType !== 'rent') {
        product.isActive = false;
      }
    }

    // Handle new images if uploaded
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => file.path);
      product.images = newImages;
    }

    product.updatedAt = new Date();
    await product.save();

    // Invalidate product cache
    clearCache('/api/products');

    console.log('✅ Product updated:', product._id);

    res.json({
      success: true,
      message: "Product updated successfully!",
      product,
    });
  } catch (err) {
    console.error("Product update error:", err);
    next(err);
  }
};

// DELETE - Remove product
export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    // Check ownership
    if (product.sellerId.toString() !== userId) {
      return res.status(403).json({ error: "You can only delete your own products." });
    }

    // Delete images from filesystem
    if (product.images && product.images.length > 0) {
      product.images.forEach(imagePath => {
        // imagePath is like '/uploads/filename.jpg'
        if (imagePath.startsWith('/uploads/')) {
          const filename = imagePath.split('/uploads/')[1];
          const absolutePath = path.join(__dirname, '../uploads', filename);
          fs.unlink(absolutePath, (err) => {
            if (err) console.error(`Failed to delete image ${absolutePath}:`, err);
          });
        }
      });
    }

    await Product.findByIdAndDelete(id);

    // Invalidate product cache
    clearCache('/api/products');

    // Remove from Carts and Wishlists
    await Cart.updateMany({}, { $pull: { items: { productId: id } } });
    await Wishlist.updateMany({}, { $pull: { products: id } });

    console.log('🗑️ Product deleted:', id);

    res.json({
      success: true,
      message: "Product deleted successfully!",
    });
  } catch (err) {
    console.error("Product delete error:", err);
    next(err);
  }
};

// ADMIN - Get all products
export const adminGetAllProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, sellerType, isActive, status, listingType, q } = req.query;

    const filter = {};

    if (sellerType && sellerType !== 'all') {
      filter.sellerType = sellerType;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (listingType && listingType !== 'all') {
      filter.listingType = listingType;
    }

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const products = await Product.find(filter)
      .limit(Number(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(filter);

    const stats = {
      totalProducts: await Product.countDocuments(),
      activeProducts: await Product.countDocuments({ isActive: true }),
      designerProducts: await Product.countDocuments({ sellerType: "Designer" }),
      resellerProducts: await Product.countDocuments({ sellerType: "Reseller" }),
      pendingProducts: await Product.countDocuments({ status: "pending" }),
    };

    res.json({
      success: true,
      products,
      stats,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error("Admin get products error:", err);
    next(err);
  }
};

// ADMIN - Update product status (Approve/Reject/Toggle Active)
export const adminUpdateProductStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, isActive, rejectionReason } = req.body;

    console.log(`🔧 Admin updating product ${id}:`, { status, isActive, rejectionReason });

    // Validation: if rejecting, require rejection reason
    if (status === 'rejected') {
      if (!rejectionReason || rejectionReason.trim().length < 10) {
        return res.status(400).json({ 
          error: "Rejection reason is required and must be at least 10 characters long." 
        });
      }
    }

    const updates = {};
    if (status) updates.status = status;
    if (isActive !== undefined) updates.isActive = isActive;

    // If rejecting, add rejection metadata
    if (status === 'rejected') {
      updates.rejectionReason = rejectionReason.trim();
      updates.rejectedBy = req.user?.id || null;
      updates.rejectionDate = new Date();
    }

    // If approving, clear any previous rejection data
    if (status === 'approved') {
      updates.rejectionReason = null;
      updates.rejectedBy = null;
      updates.rejectionDate = null;
    }

    const product = await Product.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    console.log('✅ Product status updated:', product.status);

    res.json({
      success: true,
      message: status === 'rejected' 
        ? "Product rejected successfully with documented reason." 
        : "Product status updated successfully!",
      product,
    });
  } catch (err) {
    console.error("Admin update product status error:", err);
    next(err);
  }
};

// GET /api/products/:id/rental-history
// Get rental history for a product
export const getRentalHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Authorization: Only the product owner or admin can view rental history
    const isOwner = product.sellerId && product.sellerId.toString() === userId;
    const isAdmin = req.user?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to view rental history' });
    }

    if (product.listingType !== 'rent') {
      return res.status(400).json({ error: 'This product is not available for rent' });
    }

    // Populate rental history with user details
    const rentalHistory = product.rentalHistory || [];
    
    res.json({
      productId: product._id,
      productName: product.name,
      currentRental: product.currentRental,
      rentalHistory: rentalHistory
    });

  } catch (error) {
    console.error('getRentalHistory error:', error);
    res.status(500).json({ error: 'Failed to fetch rental history' });
  }
};

// POST /api/products/:id/mark-available
// Mark a rented product as available (for designers/resellers)
export const markAsAvailable = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Authorization: Only the product owner can mark as available
    const isOwner = product.sellerId && product.sellerId.toString() === userId;

    if (!isOwner) {
      return res.status(403).json({ error: 'Not authorized to update this product' });
    }

    if (product.listingType !== 'rent') {
      return res.status(400).json({ error: 'This product is not a rental item' });
    }

    // REMOVED CHECK: if (product.rentalStatus === 'available')
    // Reason: Sometimes state gets out of sync (stock=0 but status=available, or vice versa).
    // The "Relist" button should behave as a "Force Reset" to ensure everything is correct.

    console.log(`[DEBUG] markAsAvailable called for ID: ${id}`);
    
    // Get stock quantity to restore (Safely handle potentially undefined req.body)
    const body = req.body || {};
    const stockQty = body.stock || 1;
    
    console.log(`[DEBUG] Determined stockQty: ${stockQty}`);

    // Pass stockQty to the utility function
    const updatedProduct = await markProductAsAvailable(id, stockQty);

    res.json({
      success: true,
      message: 'Product is now listed and available for rent',
      product: updatedProduct
    });

  } catch (error) {
    console.error('markAsAvailable error:', error);
    // Return specific error message if available
    res.status(500).json({ error: error.message || 'Failed to mark product as available' });
  }
};

// ADMIN - Batch Classify Gender (Automated Rule-Based)
export const batchClassifyGender = async (req, res, next) => {
  try {
    console.log("🚀 Starting Batch Gender Classification...");
    
    // 1. Fetch all Designer and Reseller products
    // We strictly exclude 'Admin' (Custom) products as requested
    const products = await Product.find({
      sellerType: { $in: ['Designer', 'Reseller'] }
    });

    console.log(`📦 Found ${products.length} products to analyze.`);

    let stats = {
      total: products.length,
      updatedToMen: 0,
      updatedToWomen: 0,
      updatedToUnisex: 0,
      errors: 0
    };

    // 2. Define Keywords
    const womenKeywords = [
      'women', 'woman', 'female', 'girl', 'girls', 'lady', 'ladies', 'bride', 'bridal',
      'kurti', 'abaya', 'maxi', 'gown', 'saree', 'skirt', 'blouse', 'dupatta',
      'heels', 'wedge', 'pump', 'purse', 'handbag', 'tote', 'clutch'
    ];
    
    // Categories that imply women
    const womenCategories = ['heels', 'bags', 'purses', 'dresses', 'skirts', 'gowns', 'tops', 'women\'s fashion'];

    const menKeywords = [
      'men', 'man', 'male', 'boy', 'boys', 'gent', 'gents',
      'tuxedo', 'sherwani', 'kurta', 'waistcoat'
    ];
    
    // Categories that imply men
    const menCategories = ['suits', 'men\'s fashion'];

    // 3. Helper to check text
    const hasKeyword = (text, keywords) => {
      if (!text) return false;
      const lower = text.toLowerCase();
      // Use regex boundries to avoid partial matches like 'women' in 'women's' (fine) but 'he' in 'the' (bad)
      // Simple includes check is often enough if keywords are distinct, but let's be safer with token matching
      const tokens = lower.split(/[^a-z0-9]+/); 
      return keywords.some(k => tokens.includes(k) || lower.includes(` ${k} `) || lower.startsWith(`${k} `) || lower.endsWith(` ${k}`));
    };

    for (const p of products) {
      try {
        let newGender = 'Unisex'; // Default
        let reason = 'Default';

        const category = (p.category || '').toLowerCase();
        const name = (p.name || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        const tags = (p.tags || '').toLowerCase();
        const fullText = `${name} ${desc} ${tags}`;

        // RULE 1: CATEGORY CHECK (High Priority)
        if (womenCategories.some(c => category.includes(c))) {
           newGender = 'Women';
           reason = `Category match: ${category}`;
        } else if (menCategories.some(c => category.includes(c))) {
           newGender = 'Men';
           reason = `Category match: ${category}`;
        } 
        // RULE 2: KEYWORD CHECK
        else {
           const matchesWomen = hasKeyword(fullText, womenKeywords);
           const matchesMen = hasKeyword(fullText, menKeywords);

           if (matchesWomen && !matchesMen) {
             newGender = 'Women';
             reason = 'Keyword match (Women)';
           } else if (matchesMen && !matchesWomen) {
             newGender = 'Men';
             reason = 'Keyword match (Men)';
           } else if (matchesWomen && matchesMen) {
             newGender = 'Unisex'; // Ambiguous
             reason = 'Conflicting keywords';
           }
        }

        // Update if changed
        if (p.gender !== newGender) {
          p.gender = newGender;
          await p.save();
          
          if (newGender === 'Men') stats.updatedToMen++;
          else if (newGender === 'Women') stats.updatedToWomen++;
          else stats.updatedToUnisex++;
        } else {
          // Count as "updated" to correct bucket even if no change, for reporting? 
          // Or just ignore. Let's strictly track updates.
          // Actually user wants verification. Let's track distribution of ALL processed
        }

      } catch (err) {
        console.error(`Error processing product ${p._id}:`, err);
        stats.errors++;
      }
    }

    console.log("✅ Batch Classification Completed:", stats);

    res.json({
      success: true,
      message: "Batch Classification Completed",
      stats
    });

  } catch (err) {
    console.error("Batch classification error:", err);
    next(err);
  }
};