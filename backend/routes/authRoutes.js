import express from 'express';
import { loginDesigner, loginReseller, loginUser, forgotPassword, resetPassword } from '../controllers/authController.js';
import { authLimiter, passwordResetLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

// Login routes with rate limiting (5 attempts per 15 min)
router.post('/login/designer', authLimiter, loginDesigner);
router.post('/login/reseller', authLimiter, loginReseller);
router.post('/login/user', authLimiter, loginUser);

// Password reset routes with stricter rate limiting (3 attempts per 15 min)
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/reset-password', passwordResetLimiter, resetPassword);

// 🔒 SECURITY: Logout endpoint - clears HttpOnly cookie
router.post('/logout', (req, res) => {
  res.clearCookie('access_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;