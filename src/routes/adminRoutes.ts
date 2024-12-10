import express from "express";
import { authenticate } from "../middleware/authMiddleware";
import { asyncHandler } from "../utils/asyncHandler";

import {
    adminLogin,
    fetchAllOrders,
    fetchAllTravelPlans,
    matchOrderWithTravelPlan,
    updateOrderStatus,
    updateTravelPlanStatus,
} from "../controllers/adminController";

const router = express.Router();

// Route: Admin login
router.post("/login", asyncHandler(adminLogin));

// Routes protected by admin authentication
router.use(authenticate("admin")); // Ensure all routes below are accessible only to admins

// Route: Fetch all orders
router.get("/orders", asyncHandler(fetchAllOrders));

// Route: Fetch all travel plans
router.get("/travel-plans", asyncHandler(fetchAllTravelPlans));

// Route: Match an order with a travel plan
router.post("/match", asyncHandler(matchOrderWithTravelPlan));

// Route: Update order status
router.patch("/orders/:id", asyncHandler(updateOrderStatus));

// Route: Update travel plan status
router.patch("/travel-plans/:id", asyncHandler(updateTravelPlanStatus));

export default router;
