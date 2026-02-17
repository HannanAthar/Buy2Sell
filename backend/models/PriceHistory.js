import mongoose from "mongoose";

const priceHistorySchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  oldPrice: { type: Number, required: true },
  newPrice: { type: Number, required: true },
  changedBy: { type: mongoose.Schema.Types.ObjectId }, // admin/seller id
}, { timestamps: true });

priceHistorySchema.index({ product: 1, createdAt: -1 });

export default mongoose.model("PriceHistory", priceHistorySchema);
