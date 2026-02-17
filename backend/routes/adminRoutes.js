import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  getDashboardStats,
  getDesigners,
  getResellers,
  getProducts,
  getUsers,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  adminToggleProductStatus,
  adminUpdateDesigner,
  adminToggleDesignerStatus,
  adminDeleteDesigner,
  adminUpdateReseller,
  adminToggleResellerStatus,
  adminDeleteReseller,
  adminUpdateUser,
  adminToggleUserStatus,
  adminDeleteUser,
  adminCreateConnectAccount,
  adminGetConnectAccountStatus,
  adminGetAccountLink,
  adminGetEscrowOrders,
  getSellerReviews,
  adminToggleReviewVisibility,
  adminDeleteReview,
  adminGetBatchedSellers
} from "../controllers/adminController.js";

import { getSalesReport, getTopProducts } from "../controllers/reportController.js";

import { uploadProductFiles } from "../middlewares/uploadMiddleware.js";
import {
  releaseEscrow,
  adminGetAllOrders,
  adminGetOrderStats,
  adminUpdateOrderStatus,
  adminDeleteOrder,
  confirmCODPayment
} from "../controllers/orderController.js";
import { getAdminWallet } from "../controllers/walletController.js";

const router = express.Router();

router.get("/dashboard/stats", protect(["admin"]), getDashboardStats);
router.post("/sellers/batch", protect(["admin"]), adminGetBatchedSellers);
router.get("/designers", protect(["admin"]), getDesigners);
router.get("/resellers", protect(["admin"]), getResellers);
router.get("/products", protect(["admin"]), getProducts);
router.get("/users", protect(["admin"]), getUsers);
router.post("/products", protect(["admin"]), uploadProductFiles, adminCreateProduct);
router.put("/products/:id", protect(["admin"]), uploadProductFiles, adminUpdateProduct);
router.delete("/products/:id", protect(["admin"]), adminDeleteProduct);
router.patch("/products/:id/status", protect(["admin"]), adminToggleProductStatus);

// DESIGNER CRUD
router.put("/designers/:id", protect(["admin"]), adminUpdateDesigner);
router.patch("/designers/:id/status", protect(["admin"]), adminToggleDesignerStatus);
router.delete("/designers/:id", protect(["admin"]), adminDeleteDesigner);

// RESELLER CRUD
router.put("/resellers/:id", protect(["admin"]), adminUpdateReseller);
router.patch("/resellers/:id/status", protect(["admin"]), adminToggleResellerStatus);
router.delete("/resellers/:id", protect(["admin"]), adminDeleteReseller);

// USER CRUD
router.put("/users/:id", protect(["admin"]), adminUpdateUser);
router.patch("/users/:id/status", protect(["admin"]), adminToggleUserStatus);
router.delete("/users/:id", protect(["admin"]), adminDeleteUser);

// REVIEW MODERATION
router.get("/reviews", protect(["admin"]), getSellerReviews);
router.patch("/reviews/:id/status", protect(["admin"]), adminToggleReviewVisibility);
router.delete("/reviews/:id", protect(["admin"]), adminDeleteReview);

// ORDER MANAGEMENT
router.get("/orders/stats", protect(["admin"]), adminGetOrderStats);
router.get("/orders", protect(["admin"]), adminGetAllOrders);
router.patch("/orders/:id/status", protect(["admin"]), adminUpdateOrderStatus);
router.delete("/orders/:id", protect(["admin"]), adminDeleteOrder);

// STRIPE CONNECT & ESCROW
router.post("/connect/create", protect(["admin"]), adminCreateConnectAccount);
router.get("/connect/status", protect(["admin"]), adminGetConnectAccountStatus);
router.get("/connect/link", protect(["admin"]), adminGetAccountLink);
router.get("/escrow/orders", protect(["admin"]), adminGetEscrowOrders);
router.post("/escrow/release/:orderId", protect(["admin"]), releaseEscrow);

// REPORTS
router.get("/reports/sales", protect(["admin"]), getSalesReport);
router.get("/reports/top-products", protect(["admin"]), getTopProducts);

router.get("/wallet", protect(["admin"]), getAdminWallet);

// COD PAYMENT MGT
router.post("/orders/cod/:orderId/confirm", protect(["admin"]), confirmCODPayment);

export default router;
