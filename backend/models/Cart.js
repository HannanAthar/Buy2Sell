// models/Cart.js
import mongoose from "mongoose";

const CartItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: false, // Not required for custom products
    },
    name: { type: String, required: true },
    image: String,
    imageUrls: [String], // Array of image URLs
    price: { type: Number, required: true },
    sellingPrice: { type: Number }, // Alternative price field
    quantity: { type: Number, required: true, min: 1, default: 1 },
    sellerType: {
      type: String,
      enum: ["custom", "Store"],
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    // Additional product details
    size: String,
    color: String,
    description: String,

    // Custom design fields
    isCustom: { type: Boolean, default: false },
    source: String, // e.g., "custom-shirt"
    cartId: mongoose.Schema.Types.Mixed, // Unique cart identifier

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
  },
  { _id: true }
);

const CartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [CartItemSchema],
  },
  { timestamps: true }
);



const Cart = mongoose.model("Cart", CartSchema);
export default Cart;
