import express from "express";
import { searchOrders } from "../controllers/orderController";
import { authenticate } from "../middleware/authMiddleware";
import { orderMiddleware } from "../middleware/orderMiddleware";
import { validateRequest } from "../middleware/validateRequest";

import {
    createOrderValidationSchema,
    updateOrderValidationSchema,
} from "../validations/order.validation";

import {
    createOrder,
    updateOrder,
    deleteOrder,
    getAllOrders,
    getOrderById,
    trackOrder,
} from "../controllers/orderController";

const router = express.Router();

router.get("/search", authenticate("user"), searchOrders);


// Route: Create a new order
router.post(
    "/",
    authenticate("user"),
    orderMiddleware, // Handle file uploads for order creation
    validateRequest(createOrderValidationSchema),
    createOrder
);

// Route: Update an existing order
router.patch(
    "/:orderId",
    authenticate("user"),
    orderMiddleware, // Allow file uploads for updating order images
    validateRequest(updateOrderValidationSchema),
    updateOrder
);

// Other routes remain unchanged
router.delete("/:orderId", authenticate("user"), deleteOrder);
router.get("/", authenticate("user"), getAllOrders);
router.get("/:orderId", authenticate("user"), getOrderById);
router.get("/track/:trackingNumber", authenticate("user"), trackOrder);

export default router;
