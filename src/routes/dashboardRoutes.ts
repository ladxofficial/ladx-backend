import express from "express";
import { authenticate } from "../middleware/authMiddleware";

import {
    getTravelersCount,
    getSendersCount,
    getPackagesDeliveredCount,
    getDashboardStats,
    getRecentActivity,
} from "../controllers/dashboardController";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate("admin")); // Ensure only admins can access dashboard routes

// Route: Get count of travelers
router.get("/travelers-count", getTravelersCount);

// Route: Get count of senders
router.get("/senders-count", getSendersCount);

// Route: Get count of delivered packages
router.get("/delivered-count", getPackagesDeliveredCount);

// Route: Get dashboard statistics
router.get("/stats", getDashboardStats);

// Route: Get recent activity
router.get("/recent-activity", getRecentActivity);

export default router;
