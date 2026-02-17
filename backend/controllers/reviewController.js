import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Designer from '../models/Designer.js';
import Reseller from '../models/Reseller.js';
import User from '../models/User.js'; // Assuming regular users rate

// --- HELPER WRAPPERS ---
export const recalculateProductRating = async (productId) => {
  // Only count visible reviews
  const reviews = await Review.find({ product: productId, isVisible: { $ne: false } });
  const count = reviews.length;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  const avg = count > 0 ? sum / count : 0;

  await Product.findByIdAndUpdate(productId, {
    averageRating: avg,
    ratingCount: count
  });
  return { averageRating: avg, ratingCount: count };
};

export const updateDesignerRating = async (designerId) => {
  if (!designerId) return;
  
  // Only count visible reviews for stats
  const reviews = await Review.find({ designer: designerId, isVisible: { $ne: false } });
  const count = reviews.length;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  const avg = count > 0 ? sum / count : 0;
  const totalReviews = reviews.filter(r => r.comment && r.comment.trim().length > 0).length;

  await Designer.findByIdAndUpdate(designerId, {
    averageRating: avg,
    ratingCount: count,
    totalReviews: totalReviews
  });
};

export const updateResellerRating = async (resellerId) => {
  if (!resellerId) return;
  
  // Only count visible reviews for stats
  const reviews = await Review.find({ reseller: resellerId, isVisible: { $ne: false } });
  const count = reviews.length;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  const avg = count > 0 ? sum / count : 0;
  const totalReviews = reviews.filter(r => r.comment && r.comment.trim().length > 0).length;

  await Reseller.findByIdAndUpdate(resellerId, {
    averageRating: avg,
    ratingCount: count,
    totalReviews: totalReviews
  });
};


// --- CONTROLLERS ---

// --- CONTROLLERS ---

export const submitReview = async (req, res) => {
  console.log('🚀 [submitReview] REQUEST RECEIVED');
  console.log('🚀 [submitReview] Headers:', req.headers.authorization ? 'Auth present' : 'No auth');
  console.log('🚀 [submitReview] User:', req.user ? req.user._id : 'No user');
  console.log('🚀 [submitReview] Body:', req.body);
  
  try {
    // Database operations require time for: save review → update product stats → update designer stats
    // Express default timeout (2 minutes) is sufficient
    
    const { productId, rating, comment, orderId, source } = req.body;
    const userId = req.user._id;

    console.log('📝 [submitReview] Payload:', { productId, rating, userId });

    // 1. Validate Input
    if (!productId || !rating) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: productId and rating',
        code: 'VALIDATION_ERROR' 
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false, 
        message: 'Rating must be between 1 and 5',
        code: 'INVALID_RATING' 
      });
    }

    // 2. Validate Product & Self-Rating
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (String(product.sellerId) === String(userId)) {
      return res.status(400).json({ 
        success: false,
        message: 'You cannot rate your own product',
        code: 'SELF_RATING_NOT_ALLOWED'
      });
    }

    // 3. Upsert Review (Find existing or create new)
    let review = await Review.findOne({ product: productId, user: userId });
    let isNew = false;

    if (review) {
      console.log('🔄 [submitReview] Updating existing review...');
      review.rating = rating;
      review.comment = comment || review.comment; // Update comment only if provided
      review.updatedAt = new Date();
      if (source) review.source = source;
      // Update reviewer info in case name changed
      review.reviewerName = req.user.fullName;
      review.reviewerRole = req.user.role;
      await review.save();
    } else {
      console.log('🆕 [submitReview] Creating new review...');
      isNew = true;
      review = new Review({
        user: userId,
        product: productId,
        designer: product.sellerType === 'Designer' ? product.sellerId : null,
        reseller: product.sellerType === 'Reseller' ? product.sellerId : null,
        rating,
        comment: comment || '',
        source: source || 'product_page',
        // If orderId is passed, save it
        orderId: orderId || null,
        // Capture reviewer identity at submission time
        reviewerName: req.user.fullName,
        reviewerRole: req.user.role
      });
      await review.save();
    }

    // 4. Update Aggregates (Async - don't block response too long if possible, but keep it simple for now)
    
    // Product Stats
    console.log('CALC [submitReview] Updating Product Stats...');
    const productStats = await recalculateProductRating(productId);

    // Designer Stats (if applicable)
    if (product.sellerType === 'Designer' && product.sellerId) {
      console.log('CALC [submitReview] Updating Designer Stats...');
      await updateDesignerRating(product.sellerId);
    }

    // Reseller Stats (if applicable)
    if (product.sellerType === 'Reseller' && product.sellerId) {
      console.log('CALC [submitReview] Updating Reseller Stats...');
      await updateResellerRating(product.sellerId);
    }

    console.log('✅ [submitReview] Success');
    return res.status(200).json({
      success: true,
      message: 'Rating submitted successfully',
      review,
      productRating: productStats
    });

  } catch (error) {
    console.error('❌ [submitReview] Error:', error);
    if (error.code === 11000) { 
      return res.status(409).json({ 
        success: false,
        message: 'Duplicate rating detected', 
        code: 'DUPLICATE_RATING' 
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid data format',
        code: 'VALIDATION_ERROR'
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
};

export const getProductRating = async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Get product stats
    const product = await Product.findById(productId).select('averageRating ratingCount');
    if (!product) return res.status(404).json({ error: 'Product not found' });

    // Get reviews
    // Get reviews (exclude hidden)
    const reviews = await Review.find({ product: productId, isVisible: { $ne: false } })
      .populate('user', 'name fullName email') // Populate user info
      .sort({ createdAt: -1 });

    res.status(200).json({
      averageRating: product.averageRating || 0,
      ratingCount: product.ratingCount || 0,
      reviews
    });
  } catch (error) {
    console.error('Get Product Rating Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getDesignerReviews = async (req, res) => {
  try {
    const designerId = req.user._id; 
    // Assuming the user is logged in as a designer and req.user has the ID

    // Verify role or user existence if needed
    // Fetch stats from Designer model
    const designer = await Designer.findById(designerId);
    if (!designer) return res.status(404).json({ error: 'Designer not found' });

    // Fetch reviews
    // Fetch reviews (exclude hidden)
    const reviews = await Review.find({ designer: designerId, isVisible: { $ne: false } })
      .populate('product', 'name images')
      .populate('user', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      reviews,
      stats: {
        averageRating: designer.averageRating || 0,
        totalRatings: designer.ratingCount || 0,
        totalReviews: designer.totalReviews || 0
      }
    });

  } catch (error) {
    console.error('Get Designer Reviews Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Route for specific user rating on a product (for My Orders)
export const getUserRating = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;
    const review = await Review.findOne({ product: productId, user: userId });
    res.json({ rating: review ? review.rating : 0 });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching user rating' });
  }
};

export const getResellerReviews = async (req, res) => {
  try {
    const resellerId = req.user._id; 
    // Assuming the user is logged in as a reseller and req.user has the ID

    // Fetch stats from Reseller model
    const reseller = await Reseller.findById(resellerId);
    if (!reseller) return res.status(404).json({ error: 'Reseller not found' });

    // Fetch reviews
    // Fetch reviews (exclude hidden)
    const reviews = await Review.find({ reseller: resellerId, isVisible: { $ne: false } })
      .populate('product', 'name images')
      .populate('user', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      reviews,
      stats: {
        averageRating: reseller.averageRating || 0,
        totalRatings: reseller.ratingCount || 0,
        totalReviews: reseller.totalReviews || 0
      }
    });

  } catch (error) {
    console.error('Get Reseller Reviews Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
