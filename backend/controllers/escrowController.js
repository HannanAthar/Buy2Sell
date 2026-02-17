// controllers/escrowController.js
import Order from "../models/Order.js";
import Designer from "../models/Designer.js";
import Reseller from "../models/Reseller.js";
import {
  transferToConnectedAccount,
  refundPayment,
  getConnectAccountStatus,
} from "../services/stripeConnectService.js";
import {
  sendEmail,
  buyerTemplates,
  adminTemplates,
} from "../services/emailService.js";

/**
 * Release funds to seller (escrow release)
 * POST /api/escrow/release/:orderId
 * Requires: admin role or automated trigger
 */
export const releaseFunds = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Validate order is in a state that allows fund release
    if (order.status !== "PAID_HELD" && order.status !== "DELIVERED") {
      return res.status(400).json({
        error: `Cannot release funds. Order status must be PAID_HELD or DELIVERED, but is ${order.status}`,
      });
    }

    // Check if already released
    if (order.payment.transferId) {
      return res.status(400).json({
        error: "Funds have already been released for this order",
        transferId: order.payment.transferId,
      });
    }

    // Branch by payment method
    let transferResult;
    if (order.payment.method === "card") {
      // ✅ Stripe card: do real Stripe Connect transfer

      // Validate required payment info
      if (!order.payment.paymentIntentId) {
        return res.status(400).json({
          error: "Order does not have a PaymentIntent ID",
        });
      }

      if (!order.payment.sellerConnectAccountId) {
        return res.status(400).json({
          error: "Seller does not have a Stripe Connect account set up",
        });
      }

      // Check seller's Connect account status
      try {
        const accountStatus = await getConnectAccountStatus(
          order.payment.sellerConnectAccountId
        );
        if (!accountStatus.chargesEnabled || !accountStatus.payoutsEnabled) {
          return res.status(400).json({
            error: "Seller's Stripe Connect account is not fully set up",
            accountStatus,
          });
        }
      } catch (accountErr) {
        console.error("Error checking Connect account:", accountErr);
        return res.status(400).json({
          error: "Invalid seller Connect account",
          details: accountErr.message,
        });
      }

      // Calculate transfer amount (grand total minus platform fee if any)
      // For now, transfer full amount. You can add platform fee logic here.
      const transferAmount = Math.round(order.totals.grandTotal * 100); // Convert to paise

      console.log(`💸 Releasing funds for order ${orderId}`);
      console.log(`💰 Amount: ${transferAmount} paise (${order.totals.grandTotal} ${order.totals.currency})`);
      console.log(`📦 Destination: ${order.payment.sellerConnectAccountId}`);

      let transfer;
      if (order.payment.sellerConnectAccountId.startsWith("acct_mock_")) {
        console.log("💰 [MOCK] Bypassing real Stripe transfer for mock account.");
        transfer = {
          id: `tr_mock_${Date.now()}`,
          amount: transferAmount,
          currency: order.totals.currency || "pkr",
        };
      } else {
        // Create transfer to seller's connected account
        transfer = await transferToConnectedAccount({
          accountId: order.payment.sellerConnectAccountId,
          amount: transferAmount,
          currency: order.totals.currency || "pkr",
          metadata: {
            orderId: orderId.toString(),
            buyerEmail: order.buyerEmail,
          },
        });
      }

      console.log(`✅ Transfer created: ${transfer.id}`);

      // Update order with transfer ID and status
      order.payment.transferId = transfer.id;
      order.status = "RELEASED";
      await order.save();

      transferResult = {
        id: transfer.id,
        amount: transfer.amount / 100,
        currency: transfer.currency,
      };
    } else if (order.payment.method === "wallet") {
      // 💰 Wallet: logical escrow only (manual payout outside Stripe)
      console.log(`💸 Marking wallet order ${orderId} as RELEASED (manual payout)`);
      order.status = "RELEASED";
      await order.save();

      transferResult = {
        id: null,
        amount: order.totals.grandTotal,
        currency: order.totals.currency,
      };
    } else {
      return res.status(400).json({
        error: "Escrow release is only supported for card and wallet payments",
      });
    }

    // Send notification email to seller
    try {
      // Find seller email
      const firstItem = order.items[0];
      let sellerEmail = null;

      if (firstItem?.sellerId && firstItem?.sellerType) {
        const sellerType = firstItem.sellerType.toLowerCase();
        if (sellerType === "designer") {
          const designer = await Designer.findById(firstItem.sellerId);
          sellerEmail = designer?.email;
        } else if (sellerType === "reseller") {
          const reseller = await Reseller.findById(firstItem.sellerId);
          sellerEmail = reseller?.email;
        }
      }

      if (sellerEmail) {
        // You can create a seller email template here
        console.log(`📧 Funds released notification would be sent to: ${sellerEmail}`);
      }
    } catch (emailErr) {
      console.error("Error sending release notification:", emailErr);
      // Don't fail the release if email fails
    }

    res.json({
      success: true,
      message: "Funds released successfully",
      order: {
        id: order._id,
        status: order.status,
        transferId: transfer.id,
      },
      transfer: transferResult,
    });
  } catch (error) {
    console.error("Error releasing funds:", error);
    res.status(500).json({
      error: "Failed to release funds",
      message: error.message,
    });
  }
};

/**
 * Refund an order (before or after release)
 * POST /api/escrow/refund/:orderId
 * Requires: admin role
 */
export const refundOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason, amount } = req.body; // Optional partial refund amount

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Check if already refunded
    if (order.status === "REFUNDED") {
      return res.status(400).json({
        error: "Order has already been refunded",
      });
    }

    // Validate payment method
    if (order.payment.method !== "card") {
      return res.status(400).json({
        error: "Refunds are only supported for card payments",
      });
    }

    if (!order.payment.paymentIntentId) {
      return res.status(400).json({
        error: "Order does not have a PaymentIntent ID",
      });
    }

    const refundAmount = amount
      ? Math.round(amount * 100) // Convert to paise
      : null; // Full refund if not specified

    console.log(`💸 Processing refund for order ${orderId}`);
    if (refundAmount) {
      console.log(`💰 Partial refund amount: ${refundAmount} paise`);
    } else {
      console.log(`💰 Full refund: ${order.totals.grandTotal} ${order.totals.currency}`);
    }

    // Create refund
    const refund = await refundPayment(
      order.payment.paymentIntentId,
      refundAmount
    );

    console.log(`✅ Refund created: ${refund.id}`);

    // Update order status
    order.status = "REFUNDED";
    await order.save();

    // Send refund notification email
    try {
      const refundTmpl = buyerTemplates.refundProcessed
        ? buyerTemplates.refundProcessed(order.buyerEmail, order, refund)
        : null;
      if (refundTmpl) {
        await sendEmail(refundTmpl);
      }
    } catch (emailErr) {
      console.error("Error sending refund notification:", emailErr);
    }

    res.json({
      success: true,
      message: "Refund processed successfully",
      order: {
        id: order._id,
        status: order.status,
      },
      refund: {
        id: refund.id,
        amount: refund.amount / 100,
        currency: refund.currency,
        status: refund.status,
      },
    });
  } catch (error) {
    console.error("Error processing refund:", error);
    res.status(500).json({
      error: "Failed to process refund",
      message: error.message,
    });
  }
};

/**
 * Mark order as disputed (holds funds)
 * POST /api/escrow/dispute/:orderId
 * Requires: admin or buyer
 */
export const disputeOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Only allow disputes on orders with held funds
    if (order.status !== "PAID_HELD" && order.status !== "SHIPPED" && order.status !== "DELIVERED") {
      return res.status(400).json({
        error: `Cannot dispute order. Current status: ${order.status}`,
      });
    }

    order.status = "DISPUTED";
    await order.save();

    // Notify admin about dispute
    try {
      const adminEmail =
        process.env.ADMIN_ALERT_EMAIL || process.env.SENDGRID_FROM_EMAIL;
      if (adminEmail) {
        // You can create an admin dispute template here
        console.log(`📧 Dispute notification would be sent to admin: ${adminEmail}`);
      }
    } catch (emailErr) {
      console.error("Error sending dispute notification:", emailErr);
    }

    res.json({
      success: true,
      message: "Order marked as disputed",
      order: {
        id: order._id,
        status: order.status,
      },
    });
  } catch (error) {
    console.error("Error disputing order:", error);
    res.status(500).json({
      error: "Failed to dispute order",
      message: error.message,
    });
  }
};

/**
 * Get escrow status for an order
 * GET /api/escrow/status/:orderId
 */
export const getEscrowStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId).select(
      "status payment totals createdAt items"
    );

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const escrowStatus = {
      orderId: order._id,
      status: order.status,
      paymentStatus: order.payment.status,
      paymentIntentId: order.payment.paymentIntentId,
      transferId: order.payment.transferId,
      sellerConnectAccountId: order.payment.sellerConnectAccountId,
      amount: order.totals.grandTotal,
      currency: order.totals.currency,
      createdAt: order.createdAt,
      canRelease:
        (order.status === "PAID_HELD" || order.status === "DELIVERED") &&
        !order.payment.transferId &&
        order.payment.sellerConnectAccountId,
      canRefund:
        order.status !== "REFUNDED" &&
        order.payment.method === "card" &&
        order.payment.paymentIntentId,
      canDispute:
        order.status === "PAID_HELD" ||
        order.status === "SHIPPED" ||
        order.status === "DELIVERED",
    };

    // If seller has Connect account, check its status
    if (order.payment.sellerConnectAccountId) {
      try {
        const accountStatus = await getConnectAccountStatus(
          order.payment.sellerConnectAccountId
        );
        escrowStatus.sellerAccountStatus = accountStatus;
      } catch (err) {
        escrowStatus.sellerAccountStatus = {
          error: "Unable to retrieve account status",
        };
      }
    }

    res.json(escrowStatus);
  } catch (error) {
    console.error("Error getting escrow status:", error);
    res.status(500).json({
      error: "Failed to get escrow status",
      message: error.message,
    });
  }
};
