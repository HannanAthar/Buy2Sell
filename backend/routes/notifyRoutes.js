// backend/routes/notifyRoutes.js
import express from "express";
import { sendEmail, buyerTemplates } from "../services/emailService.js";


const router = express.Router();

/**
 * POST /api/notify/order
 * body: { customerEmail, customerName, orderId, total }
 */
router.post("/order", async (req, res) => {
  try {
    const { customerEmail, customerName, orderId, total } = req.body;

    if (!customerEmail || !orderId || !total) {
      return res.status(400).json({
        success: false,
        message: "customerEmail, orderId and total are required",
      });
    }

   const { subject, html } = buyerTemplates.orderConfirmation(customerEmail, {
  _id: orderId,
  totals: { grandTotal: amount },
  payment: { method: "cod" },
  shippingAddress: {},
  items: [],
});

await sendEmail({
  to: customerEmail,
  subject,
  html,
});


    return res.json({
      success: true,
      message: "Order confirmation email sent successfully",
    });
  } catch (err) {
    console.error("Notify /order email error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to send order confirmation email",
      error: err.message,
    });
  }
});

export default router;
