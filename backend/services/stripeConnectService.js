// services/stripeConnectService.js
import Stripe from "stripe";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

/**
 * Create a Stripe Connect Express account for a seller
 * @param {Object} sellerData - Seller information
 * @param {String} sellerData.email - Seller email
 * @param {String} sellerData.fullName - Seller full name
 * @param {String} sellerData.phone - Seller phone
 * @returns {Promise<Object>} - Stripe account object with account ID and onboarding URL
 */
export const createConnectAccount = async (sellerData) => {
  try {
    const account = await stripe.accounts.create({
      type: "express",
      country: "PK", // Pakistan
      email: sellerData.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: "individual",
      metadata: {
        sellerId: sellerData.sellerId || "",
        sellerType: sellerData.sellerType || "",
        fullName: sellerData.fullName || "",
      },
    });

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${FRONTEND_URL}/seller/connect/refresh`,
      return_url: `${FRONTEND_URL}/seller/connect/success`,
      type: "account_onboarding",
    });

    return {
      accountId: account.id,
      onboardingUrl: accountLink.url,
      account,
    };
  } catch (error) {
    console.error("Error creating Stripe Connect account:", error);
    throw error;
  }
};

/**
 * Get the status of a Connect account
 * @param {String} accountId - Stripe Connect account ID
 * @returns {Promise<Object>} - Account status information
 */
export const getConnectAccountStatus = async (accountId) => {
  try {
    const account = await stripe.accounts.retrieve(accountId);
    
    return {
      accountId: account.id,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      status: account.charges_enabled && account.payouts_enabled ? "enabled" : "pending",
    };
  } catch (error) {
    console.error("Error retrieving Stripe Connect account:", error);
    throw error;
  }
};

/**
 * Create a new account link for onboarding or updating account
 * @param {String} accountId - Stripe Connect account ID
 * @returns {Promise<String>} - Account link URL
 */
export const createAccountLink = async (accountId) => {
  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${FRONTEND_URL}/seller/connect/refresh`,
      return_url: `${FRONTEND_URL}/seller/connect/success`,
      type: "account_onboarding",
    });

    return accountLink.url;
  } catch (error) {
    console.error("Error creating account link:", error);
    throw error;
  }
};

/**
 * Transfer funds to a connected account
 * @param {Object} transferData - Transfer information
 * @param {String} transferData.accountId - Destination Stripe Connect account ID
 * @param {Number} transferData.amount - Amount in smallest currency unit (paise for PKR)
 * @param {String} transferData.currency - Currency code (default: "pkr")
 * @param {String} transferData.metadata.orderId - Order ID for reference
 * @returns {Promise<Object>} - Transfer object
 */
export const transferToConnectedAccount = async (transferData) => {
  try {
    const { accountId, amount, currency = "pkr", metadata = {} } = transferData;

    // Create transfer to connected account
    const transfer = await stripe.transfers.create({
      amount: Math.round(amount),
      currency: currency.toLowerCase(),
      destination: accountId,
      metadata: {
        ...metadata,
        transfer_type: "escrow_release",
      },
    });

    return transfer;
  } catch (error) {
    console.error("Error transferring to connected account:", error);
    throw error;
  }
};

/**
 * Create a refund for a payment
 * @param {String} paymentIntentId - Stripe PaymentIntent ID
 * @param {Number} amount - Amount to refund (optional, defaults to full refund)
 * @returns {Promise<Object>} - Refund object
 */
export const refundPayment = async (paymentIntentId, amount = null) => {
  try {
    // Retrieve the payment intent to get the charge ID
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    const refundParams = {
      payment_intent: paymentIntentId,
    };

    if (amount) {
      refundParams.amount = Math.round(amount);
    }

    const refund = await stripe.refunds.create(refundParams);

    return refund;
  } catch (error) {
    console.error("Error creating refund:", error);
    throw error;
  }
};

/**
 * Retrieve payment intent details
 * @param {String} paymentIntentId - Stripe PaymentIntent ID
 * @returns {Promise<Object>} - PaymentIntent object
 */
export const getPaymentIntent = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    console.error("Error retrieving payment intent:", error);
    throw error;
  }
};
