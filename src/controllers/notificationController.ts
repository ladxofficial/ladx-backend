import ActivityLog from "../models/ActivityLog";
import Notification from "../models/Notification";
import { Request, Response } from "express";

// Helper: Log activity
const logActivity = async (userId: string, action: string, message: string) => {
    try {
        await ActivityLog.create({ userId, action, message });
    } catch (error) {
        console.error("Error logging activity:", error);
    }
};

// Helper: Create a notification
export const createNotification = async (
    userId: string,
    type: "order_created" | "order_deleted" | "order_matched",
    message: string,
    data: Record<string, any> = {}
): Promise<void> => {
    try {
        await Notification.create({ userId, type, message, data });

        // Log activity
        await logActivity(userId, `Notification: ${type}`, message);
    } catch (error) {
        console.error("Error creating notification:", error);
    }
};

// Get notifications for the logged-in user
export const getNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized: User not authenticated" });
            return;
        }

        const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });

        // Log activity
        await logActivity(userId, "Fetch Notifications", "User fetched their notifications");

        res.status(200).json({ success: true, data: notifications });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ success: false, message: "Failed to fetch notifications" });
    }
};

// Mark notifications as read
export const markAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { notificationIds } = req.body;

        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized: User not authenticated" });
            return;
        }

        if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
            res.status(400).json({ success: false, message: "Invalid notification IDs" });
            return;
        }

        const result = await Notification.updateMany(
            { _id: { $in: notificationIds }, userId },
            { $set: { read: true } }
        );

        // Log activity
        await logActivity(userId, "Mark Notifications as Read", `User marked ${result.modifiedCount} notifications as read`);

        res.status(200).json({ success: true, message: "Notifications marked as read" });
    } catch (error) {
        console.error("Error marking notifications as read:", error);
        res.status(500).json({ success: false, message: "Failed to mark notifications as read" });
    }
};

// Delete notifications
export const deleteNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { notificationIds } = req.body;

        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized: User not authenticated" });
            return;
        }

        if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
            res.status(400).json({ success: false, message: "Invalid notification IDs" });
            return;
        }

        const result = await Notification.deleteMany({
            _id: { $in: notificationIds },
            userId,
        });

        // Log activity
        await logActivity(userId, "Delete Notifications", `User deleted ${result.deletedCount} notifications`);

        res.status(200).json({ success: true, message: "Notifications deleted successfully" });
    } catch (error) {
        console.error("Error deleting notifications:", error);
        res.status(500).json({ success: false, message: "Failed to delete notifications" });
    }
};
