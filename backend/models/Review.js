import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  product: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  // 'designer' field for aggregation. Populated if sellerType is Designer.
  designer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Designer', 
    required: false 
  },
  // 'reseller' field for aggregation. Populated if sellerType is Reseller.
  reseller: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Reseller', 
    required: false 
  },
  rating: { 
    type: Number, 
    required: true,
    min: 1,
    max: 5,
    validate: {
      validator: Number.isInteger,
      message: 'Rating must be an integer between 1-5'
    }
  },
  comment: { 
    type: String, 
    default: '' 
  },
  // Reviewer Identity (captured at review time)
  reviewerName: {
    type: String,
    required: true
  },
  reviewerRole: {
    type: String,
    enum: ['buyer', 'designer', 'reseller'],
    required: true
  },
  orderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order' 
  }, 
  source: { 
    type: String, 
    enum: ['product_page', 'order_history'], 
    default: 'product_page' 
  },
  isVisible: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true 
});

// UNIQUE CONSTRAINT
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

export default mongoose.model('Review', reviewSchema);
