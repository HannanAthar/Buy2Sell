// models/Order.js
import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.Mixed, // Allow both ObjectId and String for custom products
      required: false, // Not required for custom products
    },
    name: { type: String, required: true },
    image: String,
    imageUrls: [String], // Array of image URLs
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    lineTotal: { type: Number, required: true },
    sellerType: {
      type: String,
      enum: ["custom", "Store"],
      required: false,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
    },
    sellerName: String, // Store seller name for display in admin panel

    // Custom design fields
    isCustom: { type: Boolean, default: false },
    source: String, // e.g., "custom-shirt"

    // Custom design data (front/back layers)
    designData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // Product metadata for custom items
    productMeta: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // Custom preview image (base64 or URL)
    customPreview: String,

    // Additional product details
    size: String,
    color: String,
    description: String,

    // Rental Info
    isRent: { type: Boolean, default: false },
    rentDays: Number,
    rentPrice: Number,
  },
  { _id: false }
);

const TotalsSchema = new mongoose.Schema(
  {
    subtotal: { type: Number, required: true },
    shipping: { type: Number, default: 0 },
    serviceFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    currency: { type: String, default: "pkr" },
  },
  { _id: false }
);

const ShippingSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine: { type: String, required: true },
    city: { type: String, required: true },
    state: String,
    country: { type: String, default: "Pakistan" },
    postalCode: String,
  },
  { _id: false }
);

const PaymentSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      enum: ["cod", "wallet", "card"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    // for card
    stripeSessionId: String,
    // Stripe Connect escrow fields
    paymentIntentId: String, // Stripe PaymentIntent ID (charge created on platform)
    chargeId: String, // Stripe Charge ID (for reference)
    transferId: String, // Stripe Transfer ID (when funds released to seller)
    sellerConnectAccountId: String, // Stripe Connect account ID for seller
    // for wallet
    walletType: { type: String, enum: ["jazzcash", "easypaisa", null], default: null },
    walletNumber: String,
    walletTxnId: String,
  },
  { _id: false }
);

const RentalAgreementSchema = new mongoose.Schema({
  cnic: String,
  frontImage: String,
  backImage: String,
  accepted: Boolean,
  acceptedAt: Date,
  depositAmount: Number,
  depositBaseTotal: Number,
  depositReceipt: String,
  paymentMethod: String,
}, { _id: false });

const OrderSchema = new mongoose.Schema(
  {
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // you can make this required if buyer login is mandatory
    },
    buyerEmail: { type: String, required: true },

    items: { type: [OrderItemSchema], required: true },
    totals: { type: TotalsSchema, required: true },
    shippingAddress: { type: ShippingSchema, required: true },
    payment: { type: PaymentSchema, required: true },
    rentalAgreement: { type: RentalAgreementSchema, required: false },

    escrow: {
      status: {
        type: String,
        enum: ["none", "held", "releasing", "released", "failed"],
        default: "none",
      },
      transferGroup: String,
      transfers: [
        {
          sellerId: mongoose.Schema.Types.ObjectId,
          sellerType: String, // 'custom' | 'Store'
          stripeAccountId: String,
          amount: Number, // cents
          currency: { type: String, default: "pkr" },
          transferId: String,
          status: {
            type: String,
            enum: ["pending", "completed", "failed"],
            default: "pending",
          },
          failureMessage: String,
          createdAt: { type: Date, default: Date.now },
        },
      ],
    },

    status: {
      type: String,
      enum: [
        "placed",
        "processing",
        "confirmed",
        "PAID_HELD",      // Payment received, funds held in escrow
        "SHIPPED",        // Order shipped by seller
        "DELIVERED",      // Order delivered to buyer
        "RELEASED",       // Funds released to seller
        "DISPUTED",       // Dispute opened, hold funds
        "REFUNDED",       // Refunded to buyer
        "shipped",        // Legacy status (keeping for backward compat)
        "completed",
        "delivered",      // Added "delivered" specifically as requested
        "cancelled"
      ],
      default: "placed",
    },
  },
  { timestamps: true }
);

// Indexes for faster dashboard and admin queries
OrderSchema.index({ buyerId: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ 'items.sellerId': 1, status: 1 });
OrderSchema.index({ createdAt: -1 });

const Order = mongoose.model("Order", OrderSchema);
export default Order;
