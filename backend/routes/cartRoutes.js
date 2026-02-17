// routes/cartRoutes.js
import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
} from "../controllers/cartController.js";

const router = express.Router();

// All cart routes require authentication
router.get("/", protect(["buyer", "designer", "reseller"]), getCart);
router.post("/", protect(["buyer", "designer", "reseller"]), addToCart);
router.put("/:itemId", protect(["buyer", "designer", "reseller"]), updateCartItem);
router.delete("/:itemId", protect(["buyer", "designer", "reseller"]), removeFromCart);
router.delete("/", protect(["buyer", "designer", "reseller"]), clearCart);

export default router;
