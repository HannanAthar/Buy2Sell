import express from 'express';
import { submitReview, getProductRating, getDesignerReviews, getResellerReviews, getUserRating } from '../controllers/reviewController.js';
import { protect } from '../middlewares/authMiddleware.js'; // Assuming auth middleware exists

const router = express.Router();

// router.post('/submit', protect, submitReview);
router.post('/submit', protect(), submitReview);
router.get('/product/:productId', getProductRating);
router.get('/designer/my-reviews', protect(), getDesignerReviews);
router.get('/reseller/my-reviews', protect(), getResellerReviews);
router.get('/user/:productId', protect(), getUserRating);

export default router;
