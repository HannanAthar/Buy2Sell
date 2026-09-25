import User from "../models/User.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Review from "../models/Review.js";
import { recalculateProductRating, updateDesignerRating, updateResellerRating } from "./reviewController.js";
import mongoose from "mongoose";
import {
  createConnectAccount,
  getConnectAccountStatus,
  createAccountLink,
} from "../services/stripeConnectService.js";

/* ---------- DASHBOARD ---------- */
export const getDashboardStats = async (req, res) => {
  try {
    const [buyers, products, orders] = await Promise.all([
      User.countDocuments({ role: "buyer" }),
      Product.countDocuments(),
      Order.countDocuments(),
    ]);

    const totalRentProducts = await Product.countDocuments({
      listingType: "rent",
    });
    const totalSaleProducts = await Product.countDocuments({
      listingType: "sale",
    });

    res.json({
      buyers,
      products,
      orders,
      rentProducts: totalRentProducts,
      saleProducts: totalSaleProducts,
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({ message: "Dashboard stats failed", error: err.message });
  }
};

// ---------- DESIGNERS (Legacy - returns empty, models removed) ----------
export const getDesigners = async (req, res) => {
  // Designer model has been removed as part of the platform pivot to Custom Clothing Studio.
  res.json([]);
};

// ---------- RESELLERS (Legacy - returns empty, models removed) ----------
export const getResellers = async (req, res) => {
  // Reseller model has been removed as part of the platform pivot to Custom Clothing Studio.
  res.json([]);
};

/* ---------- PRODUCTS ---------- */
export const getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 12, q, sellerType, listingType, status } = req.query;

    // Build query filters
    const query = {};

    // Filter by seller type (Designer, Reseller, Admin)
    if (sellerType && sellerType !== 'all') {
      query.sellerType = sellerType;
    }

    // Filter by specific seller (ID or Name) - use OR logic
    if (req.query.sellerId || req.query.sellerName) {
      const sellerConditions = [];

      if (req.query.sellerId) {
        sellerConditions.push({ sellerId: req.query.sellerId });
      }

      if (req.query.sellerName) {
        sellerConditions.push({ sellerName: req.query.sellerName });
      }

      // Match either sellerId OR sellerName
      if (sellerConditions.length > 0) {
        query.$or = sellerConditions;
      }
    }



    // Filter by listing type (sale, rent)
    if (listingType && listingType !== 'all') {
      query.listingType = listingType;
    }

    // Filter by status (pending, approved, rejected)
    if (status && status !== 'all') {
      query.status = status;
    }

    // Search by name, description, or category
    if (q && q.trim()) {
      const searchRegex = { $regex: q.trim(), $options: 'i' };
      const searchConditions = [
        { name: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
        { sellerName: searchRegex }
      ];

      // Add ID search if valid ObjectId
      if (mongoose.Types.ObjectId.isValid(q.trim())) {
        searchConditions.push({ _id: q.trim() });
      }

      // If we already have $or for seller filtering, combine with $and
      if (query.$or) {
        query.$and = [
          { $or: query.$or },
          { $or: searchConditions }
        ];
        delete query.$or;
      } else {
        query.$or = searchConditions;
      }
    }


    console.log('📦 Admin Products Query:', query);

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Product.countDocuments(query);

    const products = await Product.find(query)
      .select('name category price stock sellerType sellerName isActive status createdAt images image listingType rejectionReason averageRating ratingCount rentPrice isOnSale salePrice description')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    console.log(`✅ Found ${products.length} products (total: ${total})`);

    res.json({
      products,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (err) {
    console.error("Product fetch error:", err);
    res.status(500).json({ message: "Product fetch failed", error: err.message });
  }
};

/* ---------- USERS (BUYERS ONLY) ---------- */
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({ role: "buyer" })
      .select("fullName email phone bio address location profileImage isVerified isActive createdAt")
      .lean();

    res.json(users);
  } catch (err) {
    console.error("User fetch error:", err);
    res.status(500).json({ message: "User fetch failed", error: err.message });
  }
};

// ---------- HELPER: BATCH FETCH SELLERS (Legacy stub - Designer/Reseller removed) ----------
export const adminGetBatchedSellers = async (req, res) => {
  // Designer and Reseller models have been removed. Returns empty result.
  res.json({});
};

// ADMIN: Create product
export const adminCreateProduct = async (req, res) => {
  try {
    const data = req.body;

    // Handle uploaded files
    if (req.files && req.files.length > 0) {
      const paths = req.files.map((f) => f.path.replace(/\\/g, "/"));
      data.images = paths;
      data.image = paths[0]; // Set primary image
    }

    if (!data.name || !data.price || !data.category) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const product = await Product.create({
      ...data,
      isActive: true,
    });

    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ADMIN: Update product
export const adminUpdateProduct = async (req, res) => {
  try {
    const updates = { ...req.body };

    // MERGE images:
    // 1. Existing images (strings) sent as 'images' in body
    // 2. New uploads (files) in req.files
    let finalImages = [];

    // Collect existing strings
    if (updates.images) {
      const existing = Array.isArray(updates.images)
        ? updates.images
        : [updates.images];
      finalImages = [...existing];
    } else if (req.headers["content-type"]?.includes("multipart")) {
      // If multipart but no 'images' text field, it effectively means cleared (or only new files)
      // We will assign finalImages as is (empty) then add files.
    } else {
      // If JSON and no images field, we assume no update to images is intended? 
      // Wait, normally PUT expects full resource or we use PATCH.
      // Assuming we rely on finding 'images' in updates. If undefined, we might skip updating it?
      // But Mongoose findByIdAndUpdate with { ...updates } will unset it if we pass undefined? No, keys must exist.
      // If updates.images is undefined, it won't be in the object passed to mongo.
    }

    // Append new files
    if (req.files && req.files.length > 0) {
      const newPaths = req.files.map((f) => f.path.replace(/\\/g, "/"));
      finalImages = [...finalImages, ...newPaths];

      // Force update if we have files
      updates.images = finalImages;
    } else if (updates.images) {
      // If we had images in body (even if no new files), we update structure
      updates.images = finalImages;
    }

    // Sync primary image
    if (updates.images && updates.images.length > 0) {
      updates.image = updates.images[0];
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ success: true, product: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ADMIN: Delete product
export const adminDeleteProduct = async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ADMIN: Toggle active / inactive OR update status (Approve/Reject)
export const adminToggleProductStatus = async (req, res) => {
  try {
    const { status, isActive, rejectionReason } = req.body;

    // Validation: if rejecting, require rejection reason
    if (status === 'rejected') {
      if (!rejectionReason || rejectionReason.trim().length < 10) {
        return res.status(400).json({
          error: "Rejection reason is required and must be at least 10 characters long."
        });
      }
    }

    const updates = {};
    if (status) updates.status = status;
    if (isActive !== undefined) updates.isActive = isActive;

    // If rejecting, add rejection metadata
    if (status === 'rejected') {
      updates.rejectionReason = rejectionReason.trim();
      updates.rejectedBy = req.user?.id || null;
      updates.rejectionDate = new Date();
    }

    // If approving, clear any previous rejection data
    if (status === 'approved') {
      updates.rejectionReason = null;
      updates.rejectedBy = null;
      updates.rejectionDate = null;
    }

    console.log(`🔧 Admin updating product ${req.params.id}:`, updates);

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Product not found" });
    }

    console.log('✅ Product status updated:', updated.status);

    res.json({ success: true, product: updated });
  } catch (err) {
    console.error("Admin toggle product status error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ---------- DESIGNER CRUD (Legacy stubs - model removed) ----------
export const adminUpdateDesigner = async (req, res) => {
  res.status(410).json({ message: "Designer management has been removed from this platform." });
};
export const adminToggleDesignerStatus = async (req, res) => {
  res.status(410).json({ message: "Designer management has been removed from this platform." });
};
export const adminDeleteDesigner = async (req, res) => {
  res.status(410).json({ message: "Designer management has been removed from this platform." });
};

// ---------- RESELLER CRUD (Legacy stubs - model removed) ----------
export const adminUpdateReseller = async (req, res) => {
  res.status(410).json({ message: "Reseller management has been removed from this platform." });
};
export const adminToggleResellerStatus = async (req, res) => {
  res.status(410).json({ message: "Reseller management has been removed from this platform." });
};
export const adminDeleteReseller = async (req, res) => {
  res.status(410).json({ message: "Reseller management has been removed from this platform." });
};

// Helper: pick only allowed fields for user update
const pickUserUpdateFields = (body) => {
  const allowed = ["fullName", "email", "phone", "isVerified", "isActive", "address", "location"];
  const updates = {};
  allowed.forEach((key) => {
    if (body[key] !== undefined) updates[key] = body[key];
  });
  return updates;
};

// ADMIN: Update user (buyer)
export const adminUpdateUser = async (req, res) => {
  try {
    const updates = pickUserUpdateFields(req.body);

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select("fullName email phone address location isVerified isActive createdAt");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error("Admin update user error:", err);
    res.status(500).json({ message: "Update failed", error: err.message });
  }
};

// ADMIN: Activate / deactivate user
export const adminToggleUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true, runValidators: true }
    ).select("fullName email phone isVerified isActive createdAt");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      success: true,
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
      user,
    });
  } catch (err) {
    console.error("Admin toggle user status error:", err);
    res.status(500).json({ message: "Status update failed", error: err.message });
  }
};

// ADMIN: Delete user
export const adminDeleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (err) {
    console.error("Admin delete user error:", err);
    res.status(500).json({ message: "Delete failed", error: err.message });
  }
};

// ---------------- REVIEWS ----------------

export const getSellerReviews = async (req, res) => {
  try {
    const { sellerId, sellerType, productId } = req.query;

    // Support product reviews OR seller reviews
    if (productId) {
      // Fetch reviews for a specific product
      const reviews = await Review.find({ product: productId })
        .populate('user', 'fullName email')
        .populate('product', 'name images')
        .sort({ createdAt: -1 })
        .lean();

      return res.json(reviews);
    }

    // Original seller reviews logic
    if (!sellerId) {
      return res.status(400).json({ message: "Seller ID or Product ID is required" });
    }

    const query = {};
    if (sellerType === 'Designer') {
      query.designer = sellerId;
    } else if (sellerType === 'Reseller') {
      query.reseller = sellerId;
    } else {
      return res.status(400).json({ message: "Seller Type (Designer/Reseller) is required" });
    }

    const reviews = await Review.find(query)
      .populate('user', 'fullName email')
      .populate('product', 'name images')
      .sort({ createdAt: -1 })
      .lean();

    res.json(reviews);
  } catch (error) {
    console.error("Admin Get Reviews Error:", error);
    res.status(500).json({ message: "Failed to fetch reviews", error: error.message });
  }
};

export const adminToggleReviewVisibility = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Toggle (if undefined, treat as true -> false)
    const current = review.isVisible !== false;
    review.isVisible = !current;

    await review.save();

    // Trigger Recalculation
    if (review.product) await recalculateProductRating(review.product);
    if (review.designer) await updateDesignerRating(review.designer);
    if (review.reseller) await updateResellerRating(review.reseller);

    res.json({
      success: true,
      message: `Review is now ${review.isVisible ? 'Visible' : 'Hidden'}`,
      review
    });
  } catch (error) {
    console.error("Toggle Review Visibility Error:", error);
    res.status(500).json({ message: "Failed to update review", error: error.message });
  }
};

export const adminDeleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findByIdAndDelete(id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Trigger Recalculation
    if (review.product) await recalculateProductRating(review.product);
    if (review.designer) await updateDesignerRating(review.designer);
    if (review.reseller) await updateResellerRating(review.reseller);

    res.json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    console.error("Delete Review Error:", error);
    res.status(500).json({ message: "Failed to delete review", error: error.message });
  }
};

// ---------- ESCROW & STRIPE CONNECT ----------

// ADMIN: Create Stripe Connect account (Legacy - Designer/Reseller removed)
export const adminCreateConnectAccount = async (req, res) => {
  res.status(410).json({ message: "Stripe Connect for third-party sellers is deprecated." });
};

// ADMIN: Get Connect account status (Legacy stub)
export const adminGetConnectAccountStatus = async (req, res) => {
  res.status(410).json({ message: "Stripe Connect for third-party sellers is deprecated." });
};

// ADMIN: Get account link for onboarding (Legacy stub)
export const adminGetAccountLink = async (req, res) => {
  res.status(410).json({ message: "Stripe Connect for third-party sellers is deprecated." });
};

// ADMIN: Get orders with escrow status
export const adminGetEscrowOrders = async (req, res) => {
  try {
    const { status } = req.query;

    const query = {
      "payment.method": "card",
      "payment.paymentIntentId": { $exists: true },
    };

    // Filter by escrow status if provided
    if (status) {
      const escrowStatuses = ["PAID_HELD", "SHIPPED", "DELIVERED", "RELEASED", "DISPUTED", "REFUNDED"];
      if (escrowStatuses.includes(status)) {
        query.status = status;
      }
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .select("_id buyerEmail items totals status payment.createdAt payment.paymentIntentId payment.transferId payment.sellerConnectAccountId")
      .lean();

    // Count by status
    const stats = {
      PAID_HELD: await Order.countDocuments({ ...query, status: "PAID_HELD" }),
      SHIPPED: await Order.countDocuments({ ...query, status: "SHIPPED" }),
      DELIVERED: await Order.countDocuments({ ...query, status: "DELIVERED" }),
      RELEASED: await Order.countDocuments({ ...query, status: "RELEASED" }),
      DISPUTED: await Order.countDocuments({ ...query, status: "DISPUTED" }),
      REFUNDED: await Order.countDocuments({ ...query, status: "REFUNDED" }),
    };

    res.json({
      orders,
      stats,
      total: orders.length,
    });
  } catch (err) {
    console.error("Admin get escrow orders error:", err);
    res.status(500).json({ message: "Failed to get escrow orders", error: err.message });
  }
};
