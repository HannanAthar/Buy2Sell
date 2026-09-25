// routes/orderRoutes.js
import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
    createOfflineOrder,
    getMyOrders,
    getMySales,
    updateOrderStatus,
} from "../controllers/orderController.js";

const router = express.Router();

// COD + Wallet orders
router.post(
    "/",
    protect(["buyer", "designer", "reseller"]),
    createOfflineOrder
);

// Designer/Reseller's sales orders
router.get(
    "/sales",
    protect(["designer", "reseller"]),
    getMySales
);

// Buyer’s own orders
router.get(
    "/my",
    protect(["buyer", "designer", "reseller"]),
    getMyOrders
);

// Seller update status (Admin also uses this via alias)
router.patch(
    "/:id/status",
    protect(["admin", "designer", "reseller"]),
    updateOrderStatus
);

// GET /stripe-success
router.get("/stripe-success", async (req, res) => {
    try {
        const session_id = req.query.session_id;

        if (!session_id)
            return res.status(400).json({ success: false, message: "Missing session_id" });

        const stripe = new (await import("stripe")).default(
            process.env.STRIPE_SECRET_KEY
        );

        // Retrieve the Stripe session
        const session = await stripe.checkout.sessions.retrieve(session_id);

        const paid =
            session.payment_status === "paid" ||
            session.status === "complete" ||
            session.status === "completed";

        if (!paid) {
            return res.json({ success: true, paid: false });
        }

        const Order = (await import("../models/Order.js")).default;
        const PendingOrder = (await import("../models/PendingOrder.js")).default;
        const Cart = (await import("../models/Cart.js")).default;

        // Check if order already exists
        const existing = await Order.findOne({
            "payment.stripeSessionId": session_id,
        });

        if (existing) {
            console.log("✅ Order already exists:", existing._id);
            return res.json({ success: true, paid: true, orderId: existing._id });
        }

        // Get pending order ID from session metadata
        const { pendingOrderId, buyerId, buyerEmail } = session.metadata || {};

        if (!pendingOrderId) {
            console.error("❌ No pendingOrderId in session metadata");
            return res.json({ success: true, paid: true, warning: "No pending order data" });
        }

        // Retrieve pending order
        const pendingOrder = await PendingOrder.findOne({ sessionId: pendingOrderId });

        if (!pendingOrder) {
            console.error("❌ Pending order not found:", pendingOrderId);
            return res.json({ success: true, paid: true, warning: "Pending order not found" });
        }

        console.log("💾 Creating order from pending data...");

        // Initialize escrow transfers
                
        const escrowTransfers = [];
        for (const item of pendingOrder.items) {
            if (item.sellerId && (item.sellerType === 'designer' || item.sellerType === 'reseller')) {
                let stripeConnectAccountId = null;
                if (item.sellerType === 'designer') {
                    const d = await Designer.findById(item.sellerId);
                    stripeConnectAccountId = d?.stripeConnectAccountId;
                } else if (item.sellerType === 'reseller') {
                    const r = await Reseller.findById(item.sellerId);
                    stripeConnectAccountId = r?.stripeConnectAccountId;
                }

                escrowTransfers.push({
                    sellerId: item.sellerId,
                    sellerType: item.sellerType,
                    stripeAccountId: stripeConnectAccountId,
                    amount: Math.round(item.lineTotal * 100),
                    currency: pendingOrder.totals.currency || 'pkr',
                    status: 'pending',
                });
            }
        }

        // Create the order
        const order = await Order.create({
            buyerId: buyerId || null,
            buyerEmail: pendingOrder.buyerEmail || session.customer_email,
            items: pendingOrder.items,
            totals: pendingOrder.totals,
            shippingAddress: pendingOrder.shippingAddress,
            payment: {
                method: "card",
                status: "paid",
                stripeSessionId: session_id,
            },
            escrow: {
                status: "held",
                transferGroup: session.metadata?.transferGroup,
                transfers: escrowTransfers,
            },
            status: "PAID_HELD",
        });

        console.log("✅ Order created:", order._id);

        // Clear cart if user is logged in
        if (buyerId) {
            await Cart.findOneAndUpdate(
                { userId: buyerId },
                { $set: { items: [] } }
            );
            console.log("🗑️ Cart cleared");
        }

        // Delete pending order
        await PendingOrder.deleteOne({ sessionId: pendingOrderId });
        console.log("🗑️ Pending order deleted");

        // --- Send Confirmation Email ---
        try {
            const { sendEmail, buyerTemplates, adminTemplates } = await import("../services/emailService.js");

            // 1) Buyer confirmation
            const buyerTmpl = buyerTemplates.orderConfirmation(order.buyerEmail, order);
            await sendEmail(buyerTmpl);

            // 2) Optional high-value admin alert
            const amount = order.totals?.grandTotal || 0;
            if (process.env.ADMIN_ALERT_EMAIL && amount >= 50000) {
                const adminTmpl = adminTemplates.highValueTransaction(process.env.ADMIN_ALERT_EMAIL, {
                    amount,
                    orderId: order._id,
                    buyerEmail: order.buyerEmail,
                });
                await sendEmail(adminTmpl);
            }
            console.log("📧 Order confirmation email sent");
        } catch (mailErr) {
            console.error("❌ Order created but email failed:", mailErr.message);
        }

        return res.json({ success: true, paid: true, orderId: order._id });
    } catch (err) {
        console.error("❌ Stripe verify error:", err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
