import Admin from "../models/Admin";
import Order from "../models/Order";
import TravelPlan from "../models/TravelPlan";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";

export const adminLogin = async (req: Request, res: Response): Promise<void> => {
    const { username, password } = req.body;

    try {
        const admin = await Admin.findOne({ username });

        if (!admin) {
            res.status(401).json({ success: false, message: "Invalid credentials" });
            return;
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            res.status(401).json({ success: false, message: "Invalid credentials" });
            return;
        }

        const token = jwt.sign(
            { id: admin._id, role: "admin" },
            process.env.JWT_SECRET as string,
            { expiresIn: "1d" }
        );

        res.status(200).json({ success: true, message: "Login successful", token });
    } catch (error) {
        console.error("Error during admin login:", error);
        res.status(500).json({ success: false, message: "An error occurred during login" });
    }
};



export const fetchAllOrders = async (_req: Request, res: Response): Promise<void> => {
    try {
        const orders = await Order.find()
            .populate("userId", "fullName email")
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ success: false, message: "Failed to fetch orders" });
    }
};


export const fetchAllTravelPlans = async (_req: Request, res: Response): Promise<void> => {
    try {
        const travelPlans = await TravelPlan.find()
            .populate("userId", "fullName email")
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: travelPlans });
    } catch (error) {
        console.error("Error fetching travel plans:", error);
        res.status(500).json({ success: false, message: "Failed to fetch travel plans" });
    }
};


export const matchOrderWithTravelPlan = async (req: Request, res: Response): Promise<void> => {
    const { orderId, travelPlanId } = req.body;

    try {
        const order = await Order.findById(orderId);
        const travelPlan = await TravelPlan.findById(travelPlanId);

        if (!order || !travelPlan) {
            res.status(404).json({ success: false, message: "Order or Travel Plan not found" });
            return;
        }

        // Update order and travel plan
        order.status = "In Transit"; // Example status
        await order.save();

        travelPlan.isMatched = true;
        travelPlan.matchedOrders = [...(travelPlan.matchedOrders || []), orderId];
        await travelPlan.save();

        res.status(200).json({
            success: true,
            message: "Order matched with travel plan successfully",
            data: { order, travelPlan },
        });
    } catch (error) {
        console.error("Error matching order with travel plan:", error);
        res.status(500).json({ success: false, message: "Failed to match order with travel plan" });
    }
};


export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const order = await Order.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        ).populate("userId", "fullName email");

        if (!order) {
            res.status(404).json({ success: false, message: "Order not found" });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Order status updated successfully",
            data: order,
        });
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ success: false, message: "Failed to update order status" });
    }
};

export const updateTravelPlanStatus = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const travelPlan = await TravelPlan.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        ).populate("userId", "fullName email");

        if (!travelPlan) {
            res.status(404).json({ success: false, message: "Travel plan not found" });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Travel plan status updated successfully",
            data: travelPlan,
        });
    } catch (error) {
        console.error("Error updating travel plan status:", error);
        res.status(500).json({ success: false, message: "Failed to update travel plan status" });
    }
};
