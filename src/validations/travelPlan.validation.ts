import Joi from "joi";

export const createTravelPlanValidationSchema = Joi.object({
    origin: Joi.string().required().messages({
        "any.required": "Origin is required.",
    }),
    destination: Joi.string().required().messages({
        "any.required": "Destination is required.",
    }),
    travelDate: Joi.date().iso().required().messages({
        "any.required": "Travel date is required.",
        "date.format": "Travel date must be a valid ISO date.",
    }),
    capacity: Joi.number().integer().min(1).required().messages({
        "any.required": "Capacity is required.",
        "number.base": "Capacity must be a number.",
        "number.min": "Capacity must be at least 1.",
    }),
    availableWeight: Joi.number().min(0).required().messages({
        "any.required": "Available weight is required.",
        "number.base": "Available weight must be a number.",
        "number.min": "Available weight must be at least 0.",
    }),
    flightNumber: Joi.string().optional(),
    departureTime: Joi.date().iso().optional(),
    arrivalTime: Joi.date().iso().optional(),
    airlineName: Joi.string().optional(),
});


export const travelPlanIdValidationSchema = Joi.object({
    id: Joi.string().required().messages({
        "string.empty": "Travel plan ID is required.",
    }),
});

export const updateTravelPlanValidationSchema = Joi.object({
    capacity: Joi.number().integer().min(1).optional(),
    availableWeight: Joi.number().min(1).optional(),
    flightNumber: Joi.string().optional(),
    departureTime: Joi.date().optional(),
    arrivalTime: Joi.date().optional(),
    airlineName: Joi.string().min(3).max(100).optional(),
});

