import express from 'express';
import { uploadResellerFiles, validateFileContent } from '../middlewares/uploadMiddleware.js';
import { optimizeImages } from '../middlewares/imageOptimizer.js';
import { registerReseller, getResellerProfile, updateResellerProfile } from '../controllers/resellerController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register/reseller', uploadResellerFiles, validateFileContent, optimizeImages, registerReseller);

// Profile routes
router.get('/profile', protect(['reseller']), getResellerProfile);
router.put('/profile', protect(['reseller']), uploadResellerFiles, validateFileContent, optimizeImages, updateResellerProfile);

// Wallet
import { getSellerWallet } from "../controllers/walletController.js";
router.get('/wallet', protect(['reseller']), getSellerWallet);

export default router;
