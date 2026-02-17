import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Designer from "../models/Designer.js";
import Reseller from "../models/Reseller.js";
import { sendEmail, buyerTemplates, adminTemplates } from "../services/emailService.js";
import {
  decrementStockForOrder,
  restoreStockForOrder,
  markProductAsRented
} from "../utils/stockUtils.js";

export const createOfflineOrder = async (req, res) => {
  try {
    const {
      items,
      totals,
      shippingAddress,
      paymentMethod,
      walletType,
      walletNumber,
      walletTxnId,
      rentalAgreement
    } = req.body;

    // --- basic validation ---
    if (!items?.length) {
      return res.status(400).json({ error: "No items in order." });
    }


    // --- RENTAL VALIDATION ---
    for (const item of items) {
      // Skip custom/unknown products
      if (!item.productId || typeof item.productId !== 'string' || item.productId.startsWith('custom-')) continue;

      const product = await Product.findById(item.productId);
      // Check if this specific product is already rented
      if (product && product.listingType === 'rent' && product.rentalStatus === 'rented') {
        return res.status(400).json({
          error: `Item "${product.name}" is already rented and cannot be ordered.`
        });
      }
    }

    if (!totals?.grandTotal) {
      return res.status(400).json({ error: "Totals not provided." });
    }
    if (!shippingAddress?.email) {
      return res
        .status(400)
        .json({ error: "Shipping / contact details missing." });
    }

    const buyerId = req.user?.id || null;
    const buyerEmail = shippingAddress.email;

    // --- normalize items for OrderItemSchema ---
    const NORMAL_TYPES = ["designer", "reseller", "custom", "Store"];

    const normalizedItems = await Promise.all(items.map(async (raw, idx) => {
      const item = { ...raw };

      const isCustomItem = !!item.isCustom || item.source === "custom-shirt";

      // 1) PRODUCT ID: remove fake IDs for custom items so Mongoose
      //    does NOT try to cast "custom-2-..." to ObjectId
      if (isCustomItem) {
        if (
          typeof item.productId === "string" &&
          item.productId.startsWith("custom-")
        ) {
          delete item.productId;
        }
        // Custom items belong to Admin
        item.sellerName = "Admin (Platform)";
      }

      // 2) sellerType: fix lowercase "store" → "Store"
      if (item.sellerType) {
        const lower = String(item.sellerType).toLowerCase();
        if (lower === "store") {
          item.sellerType = "Store";
        }

        if (!NORMAL_TYPES.includes(item.sellerType)) {
          // fallback
          item.sellerType = isCustomItem ? "custom" : undefined;
        }
      } else if (isCustomItem) {
        item.sellerType = "custom";
      }

      // 3) Fetch sellerName from Product if not already set and has productId
      if (!item.sellerName && item.productId && typeof item.productId === 'string' && !item.productId.startsWith('custom-')) {
        try {
          const product = await Product.findById(item.productId).select('sellerName sellerType').lean();
          if (product) {
            item.sellerName = product.sellerName || null;
            // Also sync sellerType if missing
            if (!item.sellerType && product.sellerType) {
              item.sellerType = product.sellerType;
            }
          }
        } catch (err) {
          console.warn(`Could not fetch product ${item.productId} for seller name:`, err.message);
        }
      }

      // 4) quantity
      const qty = Number(item.quantity) > 0 ? Number(item.quantity) : 1;
      item.quantity = qty;

      // 5) prices → OrderItemSchema requires unitPrice & lineTotal
      const unitPrice =
        item.unitPrice ??
        item.price ??
        item.sellingPrice ??
        0;

      item.unitPrice = unitPrice;
      item.lineTotal =
        item.lineTotal != null ? item.lineTotal : unitPrice * qty;

      return item;
    }));

    // --- Normalize payment method ---
    const normalizedPaymentMethod = (paymentMethod || "").toLowerCase();

    // --- Calculate Escrow for Wallet Orders ---
    const escrowTransfers = [];
    let escrowStatus = "none";

    console.log(`Processing Order with Payment: ${normalizedPaymentMethod}`);

    if (normalizedPaymentMethod === "wallet") {
      escrowStatus = "held"; // Wallet payments are explicitly held

      const sellerTransfersMap = new Map();
      let totalSellerItemAmount = 0;

      for (const item of normalizedItems) {
        if (item.sellerId && (item.sellerType === 'designer' || item.sellerType === 'reseller')) {
          const sid = item.sellerId.toString();
          const current = sellerTransfersMap.get(sid) || {
            sellerId: item.sellerId,
            sellerType: item.sellerType,
            itemTotal: 0
          };
          current.itemTotal += (item.lineTotal || 0);
          totalSellerItemAmount += (item.lineTotal || 0);
          sellerTransfersMap.set(sid, current);
        }
      }

      for (const [sid, data] of sellerTransfersMap) {
        let stripeConnectAccountId = null;
        try {
          if (data.sellerType === 'designer') {
            const d = await Designer.findById(data.sellerId);
            stripeConnectAccountId = d?.stripeConnectAccountId;
          } else if (data.sellerType === 'reseller') {
            const r = await Reseller.findById(data.sellerId);
            stripeConnectAccountId = r?.stripeConnectAccountId;
          }
        } catch (err) {
          console.error(`Failed to fetch seller for escrow: ${sid}`, err);
        }

        // Calculate Share: 90% of items + proportional shipping
        const shippingFee = Number(totals.shipping || 0);
        const shareOfShipping = totalSellerItemAmount > 0
          ? (data.itemTotal / totalSellerItemAmount) * shippingFee
          : 0;

        const totalPayout = (data.itemTotal * 0.9) + shareOfShipping;

        escrowTransfers.push({
          sellerId: data.sellerId,
          sellerType: data.sellerType,
          stripeAccountId: stripeConnectAccountId,
          amount: Math.round(totalPayout * 100), // in cents
          currency: (totals.currency || 'pkr').toLowerCase(),
          status: 'pending',
          itemTotal: data.itemTotal,
          shippingShare: shareOfShipping
        });
      }
    }

    // --- determine initial payment + order status (escrow rules) ---
    let paymentStatus = "pending";
    let orderStatus = "placed";

    if (normalizedPaymentMethod === "wallet") {
      // Wallet: treat as paid + held in escrow (manual payout later)
      paymentStatus = "paid";
      orderStatus = "PAID_HELD";
    } else if (normalizedPaymentMethod === "cod") {
      // COD: keep as pending/placed (no escrow)
      paymentStatus = "pending";
      orderStatus = "placed";
    }

    // --- create order document ---
    const order = await Order.create({
      buyerId,
      buyerEmail,
      items: normalizedItems,
      totals,
      shippingAddress,
      payment: {
        method: normalizedPaymentMethod,
        status: paymentStatus,
        walletType: normalizedPaymentMethod === "wallet" ? walletType : null,
        walletNumber: normalizedPaymentMethod === "wallet" ? walletNumber : null,
        walletTxnId: normalizedPaymentMethod === "wallet" ? walletTxnId : null,
      },
      escrow: {
        status: escrowStatus,
        transfers: escrowTransfers,
        transferGroup: normalizedPaymentMethod === "wallet" ? `wallet_${Date.now()}` : null
      },
      rentalAgreement,
      status: orderStatus,
    });

    // --- emails (same logic as before) ---
    try {
      // 1) Buyer confirmation
      const buyerTmpl = buyerTemplates.orderConfirmation(buyerEmail, order);
      await sendEmail(buyerTmpl);

      // 2) Optional high-value admin alert
      const amount = order.totals?.grandTotal || 0;
      const adminEmail = process.env.ADMIN_ALERT_EMAIL || buyerTmpl.to;

      if (adminEmail && amount >= 50000) {
        const adminTmpl = adminTemplates.highValueTransaction(adminEmail, {
          amount,
          orderId: order._id,
          buyerEmail,
        });
        await sendEmail(adminTmpl);
      }
    } catch (mailErr) {
      console.error("Order created but email failed:", mailErr.message);
    }



    return res.status(201).json({ order });
  } catch (err) {
    console.error("createOfflineOrder error:", err);
    return res
      .status(500)
      .json({ error: "Failed to create order", message: err.message });
  }
};

// Get orders where the logged-in user is THE SELLER (for designer/reseller dashboards)
export const getMySales = async (req, res) => {
  try {
    const sellerId = req.user?.id;

    if (!sellerId) {
      return res.status(401).json({ error: "Login required" });
    }

    // Find all orders that contain at least one item where sellerId matches
    const orders = await Order.find({
      "items.sellerId": sellerId
    }).sort({ createdAt: -1 });

    console.log(`💰 Found ${orders.length} sales orders for seller:`, sellerId);

    res.json({ orders });
  } catch (err) {
    console.error("getMySales error:", err);
    res.status(500).json({ error: "Failed to fetch sales orders" });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const buyerId = req.user?.id;
    const userEmail = req.user?.email;

    if (!buyerId && !userEmail) {
      return res.status(401).json({ error: "Login required" });
    }

    // 🔥 FIX: Search by both buyerId AND buyerEmail (for Stripe orders)
    const query = {
      $or: [
        { buyerId: buyerId },
        { buyerEmail: userEmail }
      ]
    };

    const orders = await Order.find(query).sort({ createdAt: -1 });
    console.log(`📦 Found ${orders.length} orders for user:`, userEmail);

    res.json({ orders });
  } catch (err) {
    console.error("getMyOrders error:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

// For admin dashboard (optional)
// Get Order Stats (Revenue, Status Counts)
export const adminGetOrderStats = async (req, res) => {
  try {
    const stats = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: { $toDouble: "$totals.grandTotal" } },
          placed: {
            $sum: { $cond: [{ $eq: ["$status", "placed"] }, 1, 0] }
          },
          confirmed: {
            $sum: { $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0] }
          },
          shipped: {
            $sum: { $cond: [{ $eq: ["$status", "shipped"] }, 1, 0] }
          },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] }
          },
          held: {
            $sum: { $cond: [{ $eq: ["$status", "PAID_HELD"] }, 1, 0] }
          }
        }
      }
    ]);

    const data = stats[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      placed: 0,
      confirmed: 0,
      shipped: 0,
      completed: 0,
      cancelled: 0,
      held: 0
    };

    res.json(data);
  } catch (err) {
    console.error("adminGetOrderStats error:", err);
    res.status(500).json({ error: "Failed to fetch order stats" });
  }
};

export const adminGetAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;

    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      const searchRegex = { $regex: search, $options: "i" };
      query.$or = [
        { _id: isValidObjectId(search) ? search : undefined },
        { buyerEmail: searchRegex },
        { "shippingAddress.fullName": searchRegex },
        { "items.name": searchRegex }
      ].filter(Boolean);
    }

    const count = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      orders,
      page: Number(page),
      pages: Math.ceil(count / limit),
      total: count
    });
  } catch (err) {
    console.error("adminGetAllOrders error:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

// Helper for ObjectId check
const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// Update order status (Admin or Seller)
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Updated valid statuses including escrow statuses
    const validStatuses = [
      "placed",
      "processing",
      "confirmed",
      "PAID_HELD",      // Escrow: payment received, funds held
      "SHIPPED",        // Escrow: order shipped by seller
      "DELIVERED",      // Escrow: order delivered to buyer
      "RELEASED",       // Escrow: funds released to seller
      "DISPUTED",       // Escrow: dispute opened
      "REFUNDED",       // Escrow: refunded to buyer
      "shipped",        // Legacy status (keeping for backward compat)
      "completed",
      "cancelled"
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: "Invalid status value",
        validStatuses
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Authorization: Admin or Seller involved in the order
    if (userRole !== "admin") {
      // Check if this user is a seller for any item in the order
      // Using loose equality for ID check to be safe (string vs ObjectId)
      const isSeller = order.items.some(
        (item) =>
          item.sellerId &&
          (item.sellerId.toString() === userId || item.sellerId === userId)
      );

      // Buyers can only update to DELIVERED or DISPUTED for their orders
      const isBuyer = order.buyerId && order.buyerId.toString() === userId;

      if (!isSeller && !isBuyer) {
        return res
          .status(403)
          .json({ error: "Not authorized to update this order" });
      }

      // Restrict status transitions for non-admin users
      if (isBuyer && status !== "DELIVERED" && status !== "DISPUTED") {
        return res
          .status(403)
          .json({ error: "Buyers can only mark orders as DELIVERED or DISPUTED" });
      }

      if (isSeller && !["SHIPPED", "processing"].includes(status)) {
        return res
          .status(403)
          .json({ error: "Sellers can only update status to SHIPPED or processing" });
      }
    }

    // Additional validation: Can't update to RELEASED via this endpoint (use escrow/release)
    if (status === "RELEASED") {
      return res.status(400).json({
        error: "Cannot set status to RELEASED directly. Use /api/escrow/release/:orderId endpoint"
      });
    }

    // Additional validation: Can't update to REFUNDED via this endpoint (use escrow/refund)
    if (status === "REFUNDED") {
      return res.status(400).json({
        error: "Cannot set status to REFUNDED directly. Use /api/escrow/refund/:orderId endpoint"
      });
    }

    const previousStatus = order.status;
    const stockMessages = [];
    const rentalMessages = [];

    // STOCK MANAGEMENT LOGIC
    // Decrement stock when order is shipped or completed
    // Decrement stock when order is shipped, completed, or delivered
    const isShippedOrCompleted = ["shipped", "completed", "delivered", "released", "shipped"].includes(status.toLowerCase());
    const wasShippedOrCompleted = ["shipped", "completed", "delivered", "released", "shipped"].includes(previousStatus.toLowerCase());

    if (isShippedOrCompleted && !wasShippedOrCompleted) {

      console.log(`📦 Processing stock decrement for order ${id} (Status: ${previousStatus} → ${status})`);

      const stockResult = await decrementStockForOrder(order.items, order._id);

      if (stockResult.decremented.length > 0) {
        stockMessages.push(`Stock decremented for ${stockResult.decremented.length} item(s)`);
        stockResult.decremented.forEach(item => {
          stockMessages.push(`  - ${item.name}: -${item.quantity} (New stock: ${item.newStock})`);
        });
      }

      if (stockResult.skipped.length > 0) {
        console.log(`⏭️ Skipped ${stockResult.skipped.length} items:`, stockResult.skipped);
      }

      if (stockResult.errors.length > 0) {
        console.error(`❌ Stock errors:`, stockResult.errors);
        return res.status(400).json({
          error: "Stock adjustment failed",
          details: stockResult.errors
        });
      }

      // RENTAL STATUS LOGIC
      // Mark rental products as rented when order is shipped
      for (const item of order.items) {
        if (item.isRent && item.productId && !item.isCustom) {
          try {
            const rentalInfo = {
              orderId: order._id,
              renterId: order.buyerId,
              startDate: new Date(),
              endDate: item.rentDays ? new Date(Date.now() + item.rentDays * 24 * 60 * 60 * 1000) : null
            };

            await markProductAsRented(item.productId, rentalInfo);
            rentalMessages.push(`Product "${item.name}" marked as rented`);
            console.log(`🏷️ Rental product marked: ${item.name}`);
          } catch (error) {
            console.error(`Failed to mark rental product ${item.name}:`, error.message);
            // Don't fail the entire operation if rental marking fails
          }
        }
      }
    }

    // STOCK RESTORATION LOGIC
    // Restore stock when order is cancelled
    if (status === "cancelled" && previousStatus !== "cancelled") {
      console.log(`🔄 Processing stock restoration for cancelled order ${id}`);

      const restoreResult = await restoreStockForOrder(order._id, order.items);

      if (restoreResult.restored.length > 0) {
        stockMessages.push(`Stock restored for ${restoreResult.restored.length} item(s)`);
        restoreResult.restored.forEach(item => {
          stockMessages.push(`  - ${item.name}: +${item.quantity} (New stock: ${item.newStock})`);
        });
      }

      if (restoreResult.skipped.length > 0) {
        console.log(`⏭️ Skipped restoration for ${restoreResult.skipped.length} items:`, restoreResult.skipped);
      }

      if (restoreResult.errors.length > 0) {
        console.error(`❌ Restoration errors:`, restoreResult.errors);
        // Log but don't fail - cancellation should still proceed
      }
    }

    // Update order status
    order.status = status;
    await order.save();

    // Build response message
    let message = "Order status updated";
    const details = {};

    if (stockMessages.length > 0) {
      details.stockChanges = stockMessages;
    }

    if (rentalMessages.length > 0) {
      details.rentalUpdates = rentalMessages;
    }

    console.log(`✅ Order ${id} status updated: ${previousStatus} → ${status}`);

    res.json({
      message,
      order,
      details: Object.keys(details).length > 0 ? details : undefined
    });
  } catch (err) {
    console.error("updateOrderStatus error:", err);
    res.status(500).json({ error: "Failed to update order status" });
  }
};

// Alias for backward compatibility if needed, though we will update routes to use updateOrderStatus
export const adminUpdateOrderStatus = updateOrderStatus;


// Admin: Delete order
export const adminDeleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    await Order.findByIdAndDelete(id);

    res.json({ message: "Order deleted successfully" });
  } catch (err) {
    console.error("adminDeleteOrder error:", err);
    res.status(500).json({ error: "Failed to delete order" });
  }
};

/**
 * 🔒 ESCROW: Release Funds to Seller(s)
 * Admin-only
 */
export const releaseEscrow = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.payment.method !== "card" && order.payment.method !== "wallet" && order.payment.method !== "cod") {
      return res.status(400).json({ error: "Only Stripe, Wallet, and COD payments can be released via this system" });
    }

    // Allow retry if status is 'failed'
    if (order.payment.status !== "paid" || (order.escrow.status !== "held" && order.escrow.status !== "failed")) {
      return res.status(400).json({ error: "Payment must be 'paid' and escrow status must be 'held' or 'failed' to release funds." });
    }

    // Must be completed or delivered
    if (!["completed", "delivered", "DELIVERED"].includes(order.status)) {
      return res.status(400).json({ error: "Order must be completed or delivered before releasing funds" });
    }

    const { Stripe } = await import("stripe");
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    order.escrow.status = "releasing";
    await order.save();

    let allSuccessful = true;
    for (const transfer of order.escrow.transfers) {
      if (transfer.status === "completed") continue;

      try {
        // 🔥 FIX: Recalculate correct amount (90% + shipping share) before releasing
        // logic: (myItemGross * 0.9) + myShippingShare
        const sid = transfer.sellerId?.toString();
        const myItems = order.items.filter(i => (i.sellerId || "").toString() === sid);
        const myItemTotal = myItems.reduce((sum, item) => sum + (item.lineTotal || 0), 0);
        const totalGrossItems = order.items.reduce((sum, i) => sum + (i.lineTotal || 0), 0);
        const shipping = Number(order.totals?.shipping || 0);
        const myShippingShare = totalGrossItems > 0 ? (myItemTotal / totalGrossItems) * shipping : 0;

        const correctAmountCents = Math.round(((myItemTotal * 0.9) + myShippingShare) * 100);

        // Update transfer object so DB record is fixed after release
        transfer.amount = correctAmountCents;

        // 🔥 FIX: Handle Missing Stripe Account -> Treat as Manual/Mock Payout
        if (!transfer.stripeAccountId) {
          console.warn(`⚠️  Missing Stripe Account ID for seller ${transfer.sellerId}. Marking as manually settled.`);
          transfer.transferId = `manual_${Date.now()}`;
          transfer.status = "completed";
          transfer.createdAt = new Date();
          transfer.notes = "No Stripe account connected. Funds released manually/mocked.";
          continue;
        }

        // 🔥 FIX: Handle Mock accounts for testing
        if (transfer.stripeAccountId.startsWith("acct_mock_")) {
          console.log(`💰 [MOCK] Bypassing real Stripe transfer for mock account: ${transfer.stripeAccountId}`);
          transfer.transferId = `tr_mock_${Date.now()}`;
          transfer.status = "completed";
          transfer.createdAt = new Date();
          continue;
        }

        const stripeTransfer = await stripe.transfers.create({
          amount: correctAmountCents,
          currency: transfer.currency || "pkr",
          destination: transfer.stripeAccountId,
          transfer_group: order.escrow.transferGroup,
          metadata: {
            orderId: order._id.toString(),
            sellerId: transfer.sellerId.toString(),
          },
        });

        transfer.transferId = stripeTransfer.id;
        transfer.status = "completed";
        transfer.createdAt = new Date();
      } catch (err) {
        console.error(`❌ Transfer failed for seller ${transfer.sellerId}:`, err.message);
        transfer.status = "failed";
        transfer.failureMessage = err.message;
        allSuccessful = false;
      }
    }

    order.escrow.status = allSuccessful ? "released" : "failed";

    await order.save();

    res.json({
      message: allSuccessful ? "All funds released successfully" : "Some transfers failed",
      order
    });
  } catch (err) {
    console.error("❌ releaseEscrow error:", err);
    res.status(500).json({ error: "Failed to release escrow funds", message: err.message });
  }
};

/**
 * Confirm COD Payment Received (Admin)
 * Transitions COD order to PAID_HELD status and initializes escrow.
 */
export const confirmCODPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.payment.method !== "cod") {
      return res.status(400).json({ error: "Only COD orders can be confirmed manually" });
    }

    if (order.payment.status === "paid") {
      return res.status(400).json({ error: "Payment already confirmed" });
    }

    // Check if status is completed/delivered before collecting money? 
    // Usually COD is collected on delivery.
    // Let's assume Admin marks it when the courier confirms delivery+cash.

    // Initialize Escrow Data for COD (similar to Offline Order but now realized)
    const escrowTransfers = [];

    // Import helper if needed or recreate logic
    // We need to iterate items to calculate transfers
    // We haven't normalized items here but they should be in DB format already

    const sellerTransfersMap = new Map();
    let totalSellerItemTotal = 0;

    for (const item of order.items) {
      if (item.sellerId && (item.sellerType === 'designer' || item.sellerType === 'reseller')) {
        const sid = item.sellerId.toString();
        const current = sellerTransfersMap.get(sid) || {
          sellerId: item.sellerId,
          sellerType: item.sellerType,
          itemTotal: 0
        };
        current.itemTotal += (item.lineTotal || 0);
        totalSellerItemTotal += (item.lineTotal || 0);
        sellerTransfersMap.set(sid, current);
      }
    }

    for (const [sid, data] of sellerTransfersMap) {
      // Dynamically import models
      const { default: Designer } = await import("../models/Designer.js");
      const { default: Reseller } = await import("../models/Reseller.js");

      let stripeConnectAccountId = null;
      if (data.sellerType === 'designer') {
        const d = await Designer.findById(data.sellerId);
        stripeConnectAccountId = d?.stripeConnectAccountId;
      } else if (data.sellerType === 'reseller') {
        const r = await Reseller.findById(data.sellerId);
        stripeConnectAccountId = r?.stripeConnectAccountId;
      }

      const shippingFee = Number(order.totals?.shipping || 0);
      const shareOfShipping = totalSellerItemTotal > 0
        ? (data.itemTotal / totalSellerItemTotal) * shippingFee
        : 0;

      const totalPayout = (data.itemTotal * 0.9) + shareOfShipping;

      escrowTransfers.push({
        sellerId: data.sellerId,
        sellerType: data.sellerType,
        stripeAccountId: stripeConnectAccountId,
        amount: Math.round(totalPayout * 100), // cents
        currency: order.totals.currency || 'pkr',
        status: 'pending',
        itemTotal: data.itemTotal,
        shippingShare: shareOfShipping
      });
    }

    // Update Order
    order.payment.status = "paid";
    // We keep status as is (e.g. 'completed' or 'delivered') or force it?
    // If it was 'delivered', now it is 'DELIVERED' + 'PAID'.
    // Actually the main status enum: PAID_HELD is usually an interim status before delivery for Stripe.
    // For COD, if it's already delivered, we might just want to set escrow.status = 'held' 
    // so it shows up in Release queue.

    order.escrow = {
      status: "held",
      transferGroup: `cod_${order._id}`,
      transfers: escrowTransfers
    };

    await order.save();

    res.json({ message: "COD Payment confirmed, funds held in escrow", order });

  } catch (err) {
    console.error("confirmCODPayment error:", err);
    res.status(500).json({ error: "Failed to confirm payment" });
  }
};

