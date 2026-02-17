import express from "express";
import {
    getAdminCustomProducts,
    getAdminCustomProduct,
    createAdminCustomProduct,
    updateAdminCustomProduct,
    deleteAdminCustomProduct,
    getFeaturedCustomProducts,
    getAllCustomProducts,
} from "../controllers/adminCustomProductController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { uploadCustomProductFiles, validateFileContent } from "../middlewares/uploadMiddleware.js";
// import { optimizeImages } from "../middlewares/imageOptimizer.js";

const router = express.Router();

// Public routes (for homepage and gallery)
router.get("/featured", getFeaturedCustomProducts);
router.get("/all", getAllCustomProducts);

// Admin routes - require admin role
router.get("/", protect(["admin"]), getAdminCustomProducts);
router.get("/:id", protect(["admin"]), getAdminCustomProduct);
router.post("/", protect(["admin"]), uploadCustomProductFiles, validateFileContent, createAdminCustomProduct);
router.put("/:id", protect(["admin"]), uploadCustomProductFiles, validateFileContent, updateAdminCustomProduct);
router.delete("/:id", protect(["admin"]), deleteAdminCustomProduct);

export default router;
