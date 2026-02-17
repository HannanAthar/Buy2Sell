import express from 'express';
import { registerUser, getUserProfile, updateUserProfile } from '../controllers/userController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { uploadLogo, validateFileContent } from '../middlewares/uploadMiddleware.js';
import { optimizeImages } from '../middlewares/imageOptimizer.js';


const router = express.Router();

router.post('/register', registerUser);
router.get('/profile', protect(['buyer']), getUserProfile);
router.put('/profile', protect(['buyer']), uploadLogo, validateFileContent, optimizeImages, updateUserProfile);

export default router;
