import Joi from "joi";
import { ORDER_PRIORITY, ORDER_STATUS } from "../models/Order";

export const createOrderValidationSchema = Joi.object({
    packageName: Joi.string().required().trim().messages({
        "string.empty": "Package name is required",
        "any.required": "Package name is required",
    }),
    packageDetails: Joi.string().required().trim().messages({
        "string.empty": "Package details are required",
        "any.required": "Package details are required",
    }),
    itemDescription: Joi.string().required().trim().messages({
        "string.empty": "Item description is required",
        "any.required": "Item description is required",
    }),
    packageValue: Joi.number().required().min(0).messages({
        "number.base": "Package value must be a number",
        "number.min": "Package value cannot be negative",
        "any.required": "Package value is required",
    }),
    quantityInKg: Joi.number().required().min(0).messages({
        "number.base": "Quantity must be a number",
        "number.min": "Quantity cannot be negative",
        "any.required": "Quantity is required",
    }),
    price: Joi.number().required().min(0).messages({
        "number.base": "Price must be a number",
        "number.min": "Price cannot be negative",
        "any.required": "Price is required",
    }),
    addressSendingFrom: Joi.string().required().trim().messages({
        "string.empty": "Sending address is required",
        "any.required": "Sending address is required",
    }),
    addressDeliveringTo: Joi.string().required().trim().messages({
        "string.empty": "Delivery address is required",
        "any.required": "Delivery address is required",
    }),
    receiverName: Joi.string().required().trim().messages({
        "string.empty": "Receiver name is required",
        "any.required": "Receiver name is required",
    }),
    receiverPhone: Joi.string()
        .required()
        .pattern(/^\+?[1-9]\d{1,14}$/)
        .messages({
            "string.empty": "Receiver phone is required",
            "string.pattern.base": "Invalid phone number format",
            "any.required": "Receiver phone is required",
        }),
    priority: Joi.string()
        .valid(...Object.values(ORDER_PRIORITY))
        .default(ORDER_PRIORITY.STANDARD)
        .messages({
            "any.only": "Priority must be either Standard or Express",
        }),
    specialInstructions: Joi.string()
        .optional()
        .max(500)
        .trim()
        .messages({
            "string.max": "Special instructions cannot exceed 500 characters",
        }),
});

export const updateOrderValidationSchema = Joi.object({
    packageName: Joi.string().optional().trim(),
    packageDetails: Joi.string().optional().trim(),
    itemDescription: Joi.string().optional().trim(),
    packageValue: Joi.number().optional().min(0),
    quantityInKg: Joi.number().optional().min(0),
    price: Joi.number().optional().min(0),
    addressSendingFrom: Joi.string().optional().trim(),
    addressDeliveringTo: Joi.string().optional().trim(),
    receiverName: Joi.string().optional().trim(),
    receiverPhone: Joi.string()
        .optional()
        .pattern(/^\+?[1-9]\d{1,14}$/)
        .messages({ "string.pattern.base": "Invalid phone number format" }),
    status: Joi.string()
        .valid(...Object.values(ORDER_STATUS))
        .optional()
        .messages({
            "any.only": "Invalid order status",
        }),
    priority: Joi.string()
        .valid(...Object.values(ORDER_PRIORITY))
        .optional()
        .messages({
            "any.only": "Priority must be either Standard or Express",
        }),
    specialInstructions: Joi.string()
        .optional()
        .max(500)
        .trim()
        .messages({
            "string.max": "Special instructions cannot exceed 500 characters",
        }),
    trackingNumber: Joi.string().optional().trim().messages({
        "string.empty": "Tracking number cannot be empty",
    }),
});
