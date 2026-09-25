import express from 'express';
import Review from '../models/Review.js';
import Product from '../models/Product.js';

const router = express.Router();

// DIAGNOSTIC: Check if ratings exist in DB
router.get('/check-ratings/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId });
    const product = await Product.findById(req.params.productId);
    
    res.json({
      success: true,
      reviewCount: reviews.length,
      reviews: reviews.map(r => ({
        user: r.user,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt
      })),
      productAggregates: {
        averageRating: product?.averageRating || 0,
        ratingCount: product?.ratingCount || 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DIAGNOSTIC: Check designer aggregates
router.get('/check-designer/:designerId', async (req, res) => {
  try {
    const designer = await Designer.findById(req.params.designerId);
    const reviews = await Review.find({ designer: req.params.designerId });
    
    res.json({
      success: true,
      designer: {
        id: designer._id,
        name: designer.fullName,
        averageRating: designer.averageRating || 0,
        ratingCount: designer.ratingCount || 0,
        totalReviews: designer.totalReviews || 0
      },
      actualReviews: {
        count: reviews.length,
        ratings: reviews.map(r => r.rating)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DIAGNOSTIC: Force recalculate for specific designer
router.post('/recalculate-designer/:designerId', async (req, res) => {
  try {
    const designerId = req.params.designerId;
    
    // Find all reviews for this designer
    const reviews = await Review.find({ designer: designerId });
    const count = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = count > 0 ? sum / count : 0;
    const totalReviews = reviews.filter(r => r.comment && r.comment.trim().length > 0).length;
    
    // Update designer document
    const updated = await Designer.findByIdAndUpdate(
      designerId,
      {
        averageRating: avg,
        ratingCount: count,
        totalReviews: totalReviews
      },
      { new: true }
    );
    
    res.json({
      success: true,
      message: 'Designer rating recalculated',
      designer: {
        id: updated._id,
        name: updated.fullName,
        averageRating: updated.averageRating,
        ratingCount: updated.ratingCount,
        totalReviews: updated.totalReviews
      },
      calculation: {
        reviewsFound: count,
        sum: sum,
        average: avg
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
