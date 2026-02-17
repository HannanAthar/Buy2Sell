import express from 'express';
import { saveCustomDesignPreview, getCustomDesignPreview } from '../controllers/customDesignController.js';

const router = express.Router();

// Save custom design preview
router.post('/preview', saveCustomDesignPreview);

// Get custom design preview
router.get('/preview/:designId', getCustomDesignPreview);

export default router;
