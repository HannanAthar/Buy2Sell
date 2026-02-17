import express from 'express';
import { uploadDesignerFiles, validateFileContent } from '../middlewares/uploadMiddleware.js';
import { optimizeImages } from '../middlewares/imageOptimizer.js';
import { registerDesigner, getDesignerProfile, updateDesignerProfile } from '../controllers/designerController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register/designer', uploadDesignerFiles, validateFileContent, optimizeImages, registerDesigner);

// Profile routes
router.get('/profile', protect(['designer']), getDesignerProfile);
router.put('/profile', protect(['designer']), uploadDesignerFiles, validateFileContent, optimizeImages, updateDesignerProfile);

// Wallet
import { getSellerWallet } from "../controllers/walletController.js";
router.get('/wallet', protect(['designer']), getSellerWallet);

export default router;
