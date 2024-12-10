import Joi from "joi";

const IDENTITY_TYPES = ["national_id", "passport", "drivers_license"] as const;

export const kycValidationSchema = Joi.object({
    residential_address: Joi.string().min(5).max(255).required().messages({
        "any.required": "Residential address is required.",
        "string.min": "Residential address must be at least 5 characters.",
        "string.max": "Residential address cannot exceed 255 characters.",
    }),
    work_address: Joi.string().min(5).max(255).required().messages({
        "any.required": "Work address is required.",
        "string.min": "Work address must be at least 5 characters.",
        "string.max": "Work address cannot exceed 255 characters.",
    }),
    identity_type: Joi.string()
        .valid(...IDENTITY_TYPES)
        .required()
        .messages({
            "any.required": "Identity type is required.",
            "any.only": `Identity type must be one of ${IDENTITY_TYPES.join(", ")}.`,
        }),
});
