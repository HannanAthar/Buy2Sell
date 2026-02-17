import express from 'express';
import {
  submitContactMessage,
  getAllMessages,
  updateMessageStatus,
  deleteMessage
} from '../controllers/contactController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public route
router.post('/', submitContactMessage);

// Admin routes
router.get('/', protect(['admin']), getAllMessages);
router.put('/:id/status', protect(['admin']), updateMessageStatus);
router.delete('/:id', protect(['admin']), deleteMessage);

export default router;
