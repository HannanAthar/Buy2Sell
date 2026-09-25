// models/Product.js - ES6 Module for MongoDB Atlas
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  description: {
    type: String,
    required: false
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    lowercase: true,
    index: true
  },
  tags: String,

  // Images (file paths from multer upload)
  images: [{
    type: String,
    required: true
  }],
  sizeChart: String,

  // Pricing
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  originalPrice: Number,
  isOnSale: {
    type: Boolean,
    default: false
  },
  salePercentage: {
    type: Number,
    min: [1, 'Sale percentage must be at least 1%'],
    max: [90, 'Sale percentage cannot exceed 90%']
  },
  salePrice: Number,

  // Inventory
  stock: {
    type: Number,
    required: [true, 'Stock is required'],
    default: 1,
    min: [0, 'Stock cannot be negative']
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true
  },

  // Product Details
  size: String,
  color: String,
  material: String,
  fabric: String,
  stitching: String,
  pieceCount: String,

  // Gender Classification
  gender: {
    type: String,
    enum: ['Men', 'Women', 'Unisex'],
    default: 'Unisex',
    index: true
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved', // Auto-approved for custom
    index: true
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },

  // Ratings
  averageRating: {
    type: Number,
    default: 0,
    index: true
  },
  ratingCount: {
    type: Number,
    default: 0
  },

  // Stock Adjustment Tracking
  stockAdjustments: [{
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    quantity: Number,
    type: {
      type: String,
      enum: ['decrement', 'restore', 'manual']
    },
    reason: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
}, {
  timestamps: true
});

// Indexes for faster queries
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ category: 1, gender: 1, isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });

// Text index for search
productSchema.index({
  name: 'text',
  description: 'text',
  tags: 'text'
});

// Pre-save hook to ensure full URLs
productSchema.pre('save', function(next) {
  if (this.images && this.images.length > 0) {
    this.images = this.images.map(img => {
      if (typeof img === 'string' && !img.startsWith('http') && !img.startsWith('/')) {
         if (img.includes('buy2sell') || img.length > 20) { 
             return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME || 'dnnkoqxct'}/image/upload/${img}`;
         }
      }
      return img;
    });
  }
  next();
});

const Product = mongoose.model('Product', productSchema);
export default Product;