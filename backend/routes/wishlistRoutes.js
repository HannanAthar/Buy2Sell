import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { getWishlist, addToWishlist, removeFromWishlist } from '../controllers/wishlistController.js';

const router = express.Router();

router.get('/', protect(['buyer', 'designer', 'reseller']), getWishlist);
router.post('/', protect(['buyer', 'designer', 'reseller']), addToWishlist);
router.delete('/:productId', protect(['buyer', 'designer', 'reseller']), removeFromWishlist);

export default router;
