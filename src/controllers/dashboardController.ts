import Order from "../models/Order";
import TravelPlan from "../models/TravelPlan";
import User from "../models/User";
import { Request, Response } from "express";
import { ORDER_STATUS } from "../models/Order";

export const getTravelersCount = async (_req: Request, res: Response): Promise<void> => {
    try {
        const count = await User.countDocuments({ role: "traveler" });

        res.status(200).json({
            success: true,
            data: { travelersCount: count },
        });
    } catch (error) {
        console.error("Error fetching travelers count:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching travelers count",
        });
    }
};

export const getSendersCount = async (_req: Request, res: Response): Promise<void> => {
    try {
        const count = await User.countDocuments({ role: "sender" });

        res.status(200).json({
            success: true,
            data: { sendersCount: count },
        });
    } catch (error) {
        console.error("Error fetching senders count:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching senders count",
        });
    }
};


export const getPackagesDeliveredCount = async (_req: Request, res: Response): Promise<void> => {
    try {
        const count = await Order.countDocuments({ status: ORDER_STATUS.DELIVERED });

        res.status(200).json({
            success: true,
            data: { packagesDeliveredCount: count },
        });
    } catch (error) {
        console.error("Error fetching packages delivered count:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching packages delivered count",
        });
    }
};

export const getDashboardStats = async (_req: Request, res: Response): Promise<void> => {
    try {
        const [travelersCount, sendersCount, deliveredCount, totalOrders, pendingOrders] = await Promise.all([
            User.countDocuments({ role: "traveler" }),
            User.countDocuments({ role: "sender" }),
            Order.countDocuments({ status: ORDER_STATUS.DELIVERED }),
            Order.countDocuments(),
            Order.countDocuments({ status: ORDER_STATUS.IN_PROCESS }),
        ]);

        const deliveryRate = totalOrders
            ? ((deliveredCount / totalOrders) * 100).toFixed(2)
            : "0";

        res.status(200).json({
            success: true,
            data: {
                travelers: travelersCount,
                senders: sendersCount,
                deliveredPackages: deliveredCount,
                totalOrders,
                pendingOrders,
                deliveryRate,
            },
        });
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching dashboard statistics",
        });
    }
};


export const getRecentActivity = async (_req: Request, res: Response): Promise<void> => {
    try {
        const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate("userId", "fullName email");

        const recentTravelPlans = await TravelPlan.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate("userId", "fullName email");

        res.status(200).json({
            success: true,
            data: {
                recentOrders,
                recentTravelPlans,
            },
        });
    } catch (error) {
        console.error("Error fetching recent activity:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching recent activity",
        });
    }
};
