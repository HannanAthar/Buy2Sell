// routes/escrowRoutes.js
import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  releaseFunds,
  refundOrder,
  disputeOrder,
  getEscrowStatus,
} from "../controllers/escrowController.js";

const router = express.Router();

// Get escrow status for an order
router.get("/status/:orderId", protect(["admin", "buyer", "designer", "reseller"]), getEscrowStatus);

// Release funds to seller (admin only, or can be automated)
router.post("/release/:orderId", protect(["admin"]), releaseFunds);

// Refund an order (admin only)
router.post("/refund/:orderId", protect(["admin"]), refundOrder);

// Dispute an order (buyer or admin)
router.post("/dispute/:orderId", protect(["admin", "buyer"]), disputeOrder);

export default router;
