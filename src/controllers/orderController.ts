import ActivityLog from "../models/ActivityLog";
import Notification from "../models/Notification";
import Order, { IOrder } from "../models/Order";
import User from "../models/User";
import mongoose from "mongoose";
import sendEmail from "../utils/sendEmail";
import { Request, Response } from "express";
import { cleanupCloudinaryFiles } from "../utils/cloudinaryUtils";
import { emailTemplate } from "../utils/emailTemplates";
import { createOrderValidationSchema } from "../validations/order.validation";
import { sendNotification } from "../websocketServer";

// Helper: Log activity
const logActivity = async (userId: string, action: string, message: string) => {
    try {
        await ActivityLog.create({ userId, action, message });
    } catch (error) {
        console.error("Error logging activity:", error);
    }
};

// Helper: Create and send a notification with email
const createAndSendNotification = async (
    userId: string | mongoose.Types.ObjectId,
    type: "order_created" | "order_deleted" | "order_updated",
    message: string,
    data: { orderId: string; trackingNumber?: string }
): Promise<void> => {
    try {
        const notification = await Notification.create({
            userId,
            type,
            message,
            data,
            read: false,
        });

        sendNotification(userId.toString(), {
            type,
            message: notification.message,
            data: notification.data,
        });

        const user = await User.findById(userId).select("email");
        if (user?.email) {
            let plainTextEmail = "";
            let htmlEmail = "";

            if (type === "order_created") {
                plainTextEmail = `
Hi there,

Your order has been created successfully.

- Tracking Number: ${data.trackingNumber}

You can view your order details here: ${process.env.APP_URL}/orders/${data.orderId}

If you have any questions, feel free to contact us at ladxofficial@gmail.com.
                `;

                htmlEmail = emailTemplate({
                    title: "Your Order Has Been Created",
                    body: `
                        <p>Hi there,</p>
                        <p>Your order has been created successfully:</p>
                        <div style="background: #f9f9f9; padding: 10px; border-radius: 5px; margin-bottom: 20px;">
                            <p><strong>Tracking Number:</strong> ${data.trackingNumber}</p>
                        </div>
                        <p>
                            <a href="${process.env.APP_URL}/orders/${data.orderId}" 
                               style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px;
                               text-decoration: none; border-radius: 5px;">
                               View Your Order
                            </a>
                        </p>
                    `,
                    footer: `If you have any questions, feel free to contact us at <a href="mailto:ladxofficial@gmail.com" style="color: #4CAF50;">ladxofficial@gmail.com</a>.`,
                });
            } else if (type === "order_deleted") {
                plainTextEmail = `
Hi there,

Your order has been deleted successfully.

If you have any questions, feel free to contact us at ladxofficial@gmail.com.
                `;

                htmlEmail = emailTemplate({
                    title: "Your Order Has Been Deleted",
                    body: `
                        <p>Hi there,</p>
                        <p>Your order has been deleted successfully.</p>
                    `,
                    footer: `If you have any questions, feel free to contact us at <a href="mailto:ladxofficial@gmail.com" style="color: #4CAF50;">ladxofficial@gmail.com</a>.`,
                });
            }

            await sendEmail(user.email, message, plainTextEmail, htmlEmail);
        }
    } catch (error) {
        console.error("Error creating or sending notification:", error);
    }
};

// Create a new order with images

export const createOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({ success: false, message: "Authentication required" });
            return;
        }

        if (req.user?.role !== "sender") {
            res.status(403).json({ success: false, message: "Unauthorized: Only senders can create orders" });
            return;
        }

        // Process uploaded images
        const uploadedImages = req.files
            ? (req.files as Express.Multer.File[]).map((file) => ({
                url: file.path, // Cloudinary URL
                publicId: file.filename, // Cloudinary public ID
            }))
            : [];

        // Validate input fields using Joi schema
        const validation = createOrderValidationSchema.validate(req.body, { abortEarly: false });
        if (validation.error) {
            res.status(400).json({
                message: "Validation error",
                details: validation.error.details.map((err) => ({
                    message: err.message,
                    field: err.context?.label,
                })),
            });
            return;
        }

        // Create the order
        const order = (await Order.create({
            userId,
            images: uploadedImages,
            ...req.body,
        })) as IOrder;

        // Send notification
        await createAndSendNotification(
            userId,
            "order_created",
            `Your order with tracking number ${order.trackingNumber} has been created successfully.`,
            { orderId: order._id.toString(), trackingNumber: order.trackingNumber }
        );

        // Respond with success
        res.status(201).json({
            success: true,
            message: "Order created successfully",
            data: {
                orderId: order._id,
                trackingNumber: order.trackingNumber,
                status: order.status,
                priority: order.priority,
                images: order.images,
            },
        });
    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({ success: false, message: "Internal server error occurred." });
    }
};



// Soft-delete an order (mark as cancelled)
export const deleteOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const { orderId } = req.params;

        const order = (await Order.findById(orderId)) as IOrder | null;
        if (!order) {
            res.status(404).json({ success: false, message: "Order not found" });
            return;
        }

        order.status = "Cancelled";
        await order.save();

        await createAndSendNotification(
            order.userId.toString(),
            "order_deleted",
            `Your order with tracking number ${order.trackingNumber} has been deleted.`,
            { orderId: order._id.toString() }
        );

        await logActivity(order.userId.toString(), "Delete Order", `Deleted order with ID ${order._id}`);

        res.status(200).json({
            success: true,
            message: "Order deleted successfully",
            data: { orderId: order._id },
        });
    } catch (error) {
        console.error("Error deleting order:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error occurred.",
        });
    }
};

// Update an existing order
export const updateOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId);
        if (!order) {
            res.status(404).json({ success: false, message: "Order not found" });
            return;
        }

        if (["Delivered", "Cancelled"].includes(order.status)) {
            res.status(400).json({
                success: false,
                message: "Cannot update an order with Delivered or Cancelled status.",
            });
            return;
        }

        const uploadedImages = req.files
            ? (req.files as Express.Multer.File[]).map((file) => ({
                url: file.path,
                publicId: file.filename,
            }))
            : [];

        const oldImagePublicIds = order.images.map((image: { publicId: string }) => image.publicId);

        Object.assign(order, req.body);
        order.images.push(...uploadedImages);
        await order.save();

        if (uploadedImages.length > 0) {
            await cleanupCloudinaryFiles(oldImagePublicIds);
        }

        await createAndSendNotification(
            req.user?.id!,
            "order_updated",
            `Order with tracking number ${order.trackingNumber} has been updated.`,
            { orderId: order._id.toString() } // Convert _id to string
        );

        await logActivity(req.user?.id!, "Update Order", `Updated order with ID ${order._id.toString()}`); // Convert _id to string

        res.status(200).json({
            success: true,
            message: "Order updated successfully",
            data: order,
        });
    } catch (error) {
        console.error("Error updating order:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error occurred.",
        });
    }
};



// Get all orders (excluding cancelled)
export const getAllOrders = async (_req: Request, res: Response): Promise<void> => {
    try {
        const orders = await Order.find({ status: { $ne: "Cancelled" } }).populate("userId", "fullName email");
        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ success: false, message: "Internal server error occurred." });
    }
};

// Fetch all orders with search and filter capabilities
export const searchOrders = async (req: Request, res: Response): Promise<void> => {
    try {
        const { trackingNumber, status, priority, dateFrom, dateTo, page = "1", limit = "10" } = req.query;

        // Build dynamic filter
        const filter: Record<string, any> = {};
        if (trackingNumber) filter.trackingNumber = trackingNumber;
        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        if (dateFrom || dateTo) {
            filter.createdAt = {
                ...(dateFrom ? { $gte: new Date(dateFrom as string) } : {}),
                ...(dateTo ? { $lte: new Date(dateTo as string) } : {}),
            };
        }

        // Pagination
        const pageNumber = parseInt(page as string, 10);
        const pageSize = parseInt(limit as string, 10);
        const skip = (pageNumber - 1) * pageSize;

        // Fetch orders
        const orders = await Order.find(filter)
            .skip(skip)
            .limit(pageSize)
            .sort({ createdAt: -1 });

        // Count total documents
        const total = await Order.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: orders,
            pagination: {
                total,
                page: pageNumber,
                limit: pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        });
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while fetching orders.",
        });
    }
};


// Get an order by ID
export const getOrderById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId).populate("userId", "fullName email");
        if (!order) {
            res.status(404).json({ success: false, message: "Order not found" });
            return;
        }

        res.status(200).json({ success: true, data: order });
    } catch (error) {
        console.error("Error fetching order by ID:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error occurred.",
        });
    }
};



// Track an order by tracking number
export const trackOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const { trackingNumber } = req.params;

        const order = await Order.findOne({ trackingNumber }).populate("userId", "fullName email");
        if (!order) {
            res.status(404).json({ success: false, message: "Order not found" });
            return;
        }

        res.status(200).json({
            success: true,
            data: order,
            message: `Order with tracking number ${trackingNumber} is currently at status: ${order.status}.`,
        });
    } catch (error) {
        console.error("Error tracking order:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error occurred.",
        });
    }
};
