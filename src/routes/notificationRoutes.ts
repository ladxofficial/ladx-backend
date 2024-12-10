import express from "express";
import { getNotifications, markAsRead } from "../controllers/notificationController";
import { authenticate } from "../middleware/authMiddleware";

const router = express.Router();

// Get notifications for the logged-in user
router.get("/", authenticate("user"), getNotifications);

// Mark notifications as read
router.post("/read", authenticate("user"), markAsRead);

export default router;
