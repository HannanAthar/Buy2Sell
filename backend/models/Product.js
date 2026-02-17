// models/Product.js - ES6 Module for MongoDB Atlas
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  // Basic Info (matching productController expectations)
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

  // Gender Classification (for Clothing, Bags, Shoes)
  gender: {
    type: String,
    enum: ['Men', 'Women', 'Unisex'],
    default: 'Unisex',
    index: true
  },

  // Listing Type
  listingType: {
    type: String,
    enum: ['sale', 'rent', 'custom'],
    default: 'sale'
  },
  rentPrice: String,
  rentDuration: String,
  securityDeposit: String,

  // Seller Info
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: function () {
      // sellerId is not required for Admin custom products
      return this.sellerType !== 'Admin';
    },
    index: true,
    refPath: "sellerType", // dynamic ref: Designer or Reseller
  },
  sellerType: {
    type: String,
    enum: ["Designer", "Reseller", "Admin"],
    required: [true, "Seller type is required"],
  },

  sellerName: String,

  // Reseller-specific
  condition: String,
  hasAuthenticity: Boolean,

  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },

  // Rejection Metadata (for transparent rejection workflow)
  rejectionReason: {
    type: String,
    default: null
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  rejectionDate: {
    type: Date,
    default: null
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

  // Stock Adjustment Tracking (Audit Trail)
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

  // Rental Status Tracking
  rentalStatus: {
    type: String,
    enum: ['available', 'rented'],
    default: 'available',
    index: true
  },
  currentRental: {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    renterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    startDate: Date,
    endDate: Date,
    status: {
      type: String,
      enum: ['active', 'completed']
    }
  },
  rentalHistory: [{
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    renterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    startDate: Date,
    endDate: Date,
    returnedDate: Date,
    status: {
      type: String,
      enum: ['completed', 'ongoing']
    }
  }]
}, {
  timestamps: true
});

// Indexes for faster queries
productSchema.index({ sellerId: 1, sellerType: 1 });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ category: 1, gender: 1, isActive: 1 }); // NEW: Gender filtering
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ listingType: 1, rentalStatus: 1 }); // Rental queries

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
      // If it's a raw Cloudinary public ID or versioned string that doesn't start with http
      if (typeof img === 'string' && !img.startsWith('http') && !img.startsWith('/')) {
         // Assume it's a Cloudinary path if it doesn't look like a local path
         // But be careful not to break local paths like /uploads/...
         if (img.includes('buy2sell') || img.length > 20) { 
             return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME || 'dnnkoqxct'}/image/upload/${img}`;
         }
      }
      return img;
    });
  }
  next();
});

// ES6 default export (THIS IS THE KEY CHANGE!)
const Product = mongoose.model('Product', productSchema);
export default Product;