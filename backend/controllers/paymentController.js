// controllers/paymentController.js

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";
import Order from "../models/Order.js";
import PendingOrder from "../models/PendingOrder.js";
import Product from "../models/Product.js";
import {
  sendEmail,
  buyerTemplates,
  adminTemplates,
} from "../services/emailService.js";
import { decrementStockForOrder } from "../utils/stockUtils.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ .env is in backend/, one level up from controllers/
dotenv.config({ path: path.join(__dirname, "..", ".env") });


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

/**
 * 0) Create Stripe Connect Onboarding Link
 * For Designers and Resellers
 */
export const createConnectOnboarding = async (req, res) => {
  try {
    const { id, role, email, fullName } = req.user;
    let seller;

    if (role === "designer") {
      seller = await Designer.findById(id);
    } else if (role === "reseller") {
      seller = await Reseller.findById(id);
    }

    if (!seller) {
      return res.status(404).json({ error: "Seller profile not found" });
    }

    let accountId = seller.stripeConnectAccountId;

    // Create account if not exists
    if (!accountId) {
      try {
        const account = await stripe.accounts.create({
          type: "express",
          email: email,
          metadata: { sellerId: id, role },
          capabilities: {
            transfers: { requested: true },
          },
        });
        accountId = account.id;
        seller.stripeConnectAccountId = accountId;
        seller.stripeConnectAccountStatus = "pending";
        await seller.save();
      } catch (stripeErr) {
        // 🔥 FIX: Handle the case where Connect is not enabled on the Stripe dashboard
        if (stripeErr.message.includes("signed up for Connect")) {
          console.warn("⚠️ Stripe Connect not enabled on dashboard. Using MOCK account for testing.");
          accountId = `acct_mock_${id.toString().slice(-12)}`;
          seller.stripeConnectAccountId = accountId;
          seller.stripeConnectAccountStatus = "enabled"; // Auto-enable mock
          await seller.save();

          return res.json({
            url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/dashboard?payout_setup=success&mock=true`,
            isMock: true
          });
        }
        throw stripeErr;
      }
    }

    // Create account link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/dashboard?payout_setup=refresh`,
      return_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/dashboard?payout_setup=success`,
      type: "account_onboarding",
    });

    res.json({ url: accountLink.url });
  } catch (err) {
    console.error("❌ createConnectOnboarding error:", err);
    res.status(500).json({ error: "Failed to create onboarding link", message: err.message });
  }
};


export const createStripeCheckout = async (req, res) => {
  try {
    const { items, totals, shippingAddress } = req.body;

    if (!items?.length || !totals?.grandTotal || !shippingAddress?.email) {
      return res.status(400).json({ error: "Missing order / customer data" });
    }

    // --- RENTAL VALIDATION ---
    for (const item of items) {
      // Skip custom/unknown products
      if (!item.productId && !item.id && !item._id) continue;
      const pid = item.productId || item.id || item._id;
      if (typeof pid !== 'string' || pid.startsWith('custom-')) continue;

      const product = await Product.findById(pid);
      if (product && product.listingType === 'rent' && product.rentalStatus === 'rented') {
        return res.status(400).json({
          error: `Item "${product.name}" is already rented and cannot be ordered.`
        });
      }
    }



    const buyerId = req.user?.id || null;
    const buyerEmail = shippingAddress.email;

    const line_items = items.map((item) => ({
      price_data: {
        currency: (totals.currency || "pkr").toLowerCase(),
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round(Number(item.unitPrice || 0) * 100),
      },
      quantity: item.quantity || 1,
    }));

    if (totals.shipping) {
      line_items.push({
        price_data: {
          currency: (totals.currency || "pkr").toLowerCase(),
          product_data: { name: "Shipping" },
          unit_amount: Math.round(Number(totals.shipping) * 100),
        },
        quantity: 1,
      });
    }

    if (totals.serviceFee) {
      line_items.push({
        price_data: {
          currency: (totals.currency || "pkr").toLowerCase(),
          product_data: { name: "Service Fee" },
          unit_amount: Math.round(Number(totals.serviceFee) * 100),
        },
        quantity: 1,
      });
    }

    // 🔥 FIX: Remove large base64 images from metadata to avoid Stripe's 500KB limit
    const itemsForMetadata = items.map(item => {
      const cleanItem = { ...item };

      // Remove base64 image data (starts with 'data:image/')
      if (cleanItem.image && cleanItem.image.startsWith('data:image/')) {
        cleanItem.image = '[BASE64_REMOVED]';
      }
      if (cleanItem.customPreview && cleanItem.customPreview.startsWith('data:image/')) {
        cleanItem.customPreview = '[BASE64_REMOVED]';
      }
      if (cleanItem.imageUrls && Array.isArray(cleanItem.imageUrls)) {
        cleanItem.imageUrls = cleanItem.imageUrls.map(url =>
          url && url.startsWith('data:image/') ? '[BASE64_REMOVED]' : url
        );
      }

      // Also remove large designData if present
      if (cleanItem.designData) {
        cleanItem.designData = { ...cleanItem.designData };
        // Keep structure but remove image data
        if (cleanItem.designData.front?.image?.src && cleanItem.designData.front.image.src.startsWith('data:image/')) {
          cleanItem.designData.front.image.src = '[BASE64_REMOVED]';
        }
        if (cleanItem.designData.back?.image?.src && cleanItem.designData.back.image.src.startsWith('data:image/')) {
          cleanItem.designData.back.image.src = '[BASE64_REMOVED]';
        }
      }

      return cleanItem;
    });

    console.log('📦 Creating Stripe session with', items.length, 'items');
    console.log('💰 Total amount:', totals.grandTotal, totals.currency);

    // 🔥 SAVE order data to temporary collection (auto-expires in 1 hour)
    const tempSessionId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await PendingOrder.create({
      sessionId: tempSessionId,
      buyerId: buyerId || null,
      buyerEmail,
      items,
      totals,
      shippingAddress,
    });
    console.log('💾 Saved pending order:', tempSessionId);

    // 🔥 FIX: Store only essential info in metadata (Stripe has 500 char limit per field)
    // We'll retrieve full order data from the cart/database in the webhook
    const transferGroup = `order_${tempSessionId}`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: buyerEmail,
      line_items,
      payment_intent_data: {
        transfer_group: transferGroup,
      },
      success_url: `${FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/checkout?canceled=1`,
      metadata: {
        buyerId: buyerId || "",
        buyerEmail,
        pendingOrderId: tempSessionId,
        transferGroup: transferGroup,
        itemCount: items.length.toString(),
        totalAmount: totals.grandTotal.toString(),
        // Store shipping address separately (each field under 500 chars)
        shippingName: shippingAddress.fullName || "",
        shippingEmail: shippingAddress.email || "",
        shippingPhone: shippingAddress.phone || "",
        shippingAddress: shippingAddress.addressLine || "",
        shippingCity: shippingAddress.city || "",
        shippingPostal: shippingAddress.postalCode || "",
      },
    });

    console.log('✅ Stripe session created:', session.id);

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("❌ createStripeCheckout error:", err);
    console.error("Error details:", err.message);
    return res
      .status(500)
      .json({ error: "Failed to create Stripe session", message: err.message });
  }
};

/**
 * 2) Webhook – Stripe calls this when payment succeeds
 * Here we actually CREATE the order (only when paid).
 *
 * IMPORTANT:
 * - The /api/payments/webhook route in index.js must use express.raw({ type: "application/json" })
 */
export const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body, // raw body (Buffer)
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("⚠️  Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      // If already created, don't create again
      const existing = await Order.findOne({
        "payment.stripeSessionId": session.id,
      });
      if (existing) {
        console.log("Order already exists for session:", session.id);
        return res.json({ received: true });
      }

      const {
        buyerId = "",
        buyerEmail = "",
        pendingOrderId,
        itemCount,
        totalAmount,
        shippingName,
        shippingEmail,
        shippingPhone,
        shippingAddress: shippingAddr,
        shippingCity,
        shippingPostal,
      } = session.metadata || {};

      console.log('📦 Webhook received for:', buyerEmail, 'Session:', session.id);
      console.log('🔍 Looking for pending order:', pendingOrderId);

      // 🔥 FIX: Retrieve order data from PendingOrder collection
      let items = [];
      let totalsData = null;
      let shippingData = null;

      try {
        const pendingOrder = await PendingOrder.findOne({ sessionId: pendingOrderId });

        if (pendingOrder) {
          items = pendingOrder.items || [];

          // 🔥 Normalize items to ensure productId exists for stock decrement
          items = items.map(item => {
            if (!item.productId && (item.id || item._id)) {
              return { ...item, productId: item.id || item._id };
            }
            return item;
          });
          totalsData = pendingOrder.totals;
          shippingData = pendingOrder.shippingAddress;
          console.log('✅ Retrieved pending order with', items.length, 'items');

          // Delete the pending order after retrieving
          await PendingOrder.deleteOne({ sessionId: pendingOrderId });
          console.log('🗑️ Deleted pending order');
        } else {
          console.warn('⚠️ No pending order found for:', pendingOrderId);
          return res.json({ received: true, warning: 'No pending order found' });
        }
      } catch (err) {
        console.error('❌ Error retrieving pending order:', err);
        return res.json({ received: true, error: 'Failed to retrieve pending order' });
      }

      // Use data from PendingOrder, fallback to metadata if needed
      const shippingAddress = shippingData || {
        fullName: shippingName || "",
        email: shippingEmail || buyerEmail || session.customer_email,
        phone: shippingPhone || "",
        addressLine: shippingAddr || "",
        city: shippingCity || "",
        state: "",
        country: "Pakistan",
        postalCode: shippingPostal || "",
      };

      const totals = totalsData || {
        subtotal: Number(totalAmount) || 0,
        shipping: 0,
        serviceFee: 0,
        discount: 0,
        grandTotal: Number(totalAmount) || 0,
        currency: "pkr",
      };

      if (!items.length || !totals?.grandTotal || !shippingAddress?.email) {
        console.error("❌ Webhook missing order data – not creating order.");
        console.error("Items:", items.length, "Total:", totals?.grandTotal, "Email:", shippingAddress?.email);
        return res.json({ received: true, error: 'Incomplete order data' });
      } else {
        const email = shippingAddress.email;

        console.log('💾 Creating order for:', email, 'Items:', items.length, 'Total:', totals.grandTotal);

        // 🔒 ESCROW FLOW: Retrieve PaymentIntent from session
        let paymentIntentId = null;
        let chargeId = null;
        const transferGroup = session.metadata?.transferGroup;

        try {
          if (session.payment_intent) {
            paymentIntentId = session.payment_intent;
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
            if (paymentIntent.latest_charge) {
              chargeId = paymentIntent.latest_charge;
            }
            console.log('✅ Retrieved PaymentIntent:', paymentIntentId);
          }
        } catch (err) {
          console.error('⚠️ Error retrieving PaymentIntent:', err.message);
        }

        // Initialize escrow transfers based on items
        const escrowTransfers = [];
        const sellerTransfersMap = new Map();
        let totalSellerItemAmount = 0;

        for (const item of items) {
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
            console.error(`Failed to fetch seller for Stripe escrow: ${sid}`, err);
          }

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
            currency: totals.currency || 'pkr',
            status: 'pending',
            itemTotal: data.itemTotal,
            shippingShare: shareOfShipping
          });
        }

        const order = await Order.create({
          buyerId: buyerId || null,
          buyerEmail: email,
          items,
          totals,
          shippingAddress,
          payment: {
            method: "card",
            status: "paid",
            stripeSessionId: session.id,
            paymentIntentId: paymentIntentId || null,
            chargeId: chargeId || null,
          },
          escrow: {
            status: "held",
            transferGroup: transferGroup,
            transfers: escrowTransfers,
          },
          status: "PAID_HELD",
        });

        // 🔔 Emails for Stripe order
        try {
          // 1) Order confirmation
          const confirmTmpl = buyerTemplates.orderConfirmation(email, order);
          await sendEmail(confirmTmpl);

          // 2) Payment successful
          const paymentTmpl = buyerTemplates.paymentSuccessful(email, order);
          await sendEmail(paymentTmpl);

          // 🔥 FIXED: Decrement stock immediately for paid orders
          try {
            // Use 'items' (normalized) instead of 'order.items' to ensure productId is present
            // and not lost during Mongoose schema casting/validation if optional
            await decrementStockForOrder(items, order._id);
          } catch (stockErr) {
            console.error("Stock decrement failed for Stripe order:", stockErr);
          }

          // 3) Optional admin alert for high-value transactions
          const amount = order.totals?.grandTotal || 0;
          const adminEmail =
            process.env.ADMIN_ALERT_EMAIL || process.env.SENDGRID_FROM_EMAIL;

          if (adminEmail && amount >= 50000) {
            const adminTmpl = adminTemplates.highValueTransaction(adminEmail, {
              amount,
              orderId: order._id,
              buyerEmail: email,
            });
            await sendEmail(adminTmpl);
          }
        } catch (mailErr) {
          console.error("Stripe order created but email failed:", mailErr.message);
        }
      }
    }

    return res.json({ received: true });
  } catch (err) {
    console.error("stripeWebhook handler error:", err);
    return res.status(500).end();
  }
};
