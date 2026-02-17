// routes/paymentRoutes.js
import express from "express";
import { createStripeCheckout, createConnectOnboarding } from "../controllers/paymentController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Stripe Checkout (frontend → backend)
router.post("/create-checkout-session", createStripeCheckout);

// Stripe Connect Onboarding (Designers/Resellers)
router.post("/connect/onboarding", protect(["designer", "reseller"]), createConnectOnboarding);

export default router;
