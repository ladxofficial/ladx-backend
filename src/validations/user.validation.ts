import Joi from "joi";

// Common reusable schemas
const userIdSchema = Joi.string()
    .required()
    .messages({ "string.empty": "User ID is required." });

const roleSchema = Joi.string()
    .valid("sender", "traveler", "admin")
    .required()
    .messages({
        "string.empty": "Role is required.",
        "any.only": "Role must be one of: sender, traveler, admin.",
    });

const passwordSchema = Joi.string()
    .min(8)
    .required()
    .messages({
        "string.min": "Password must be at least 8 characters long.",
        "string.empty": "Password is required.",
    });

const emailSchema = Joi.string()
    .email()
    .required()
    .messages({
        "string.email": "Email must be a valid email address.",
        "string.empty": "Email is required.",
    });

const phoneNumberSchema = Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .required()
    .messages({
        "string.pattern.base": "Phone number must be a valid international format (E.164).",
        "string.empty": "Phone number is required.",
    });

// Validation for user signup
export const signUpValidationSchema = Joi.object({
    fullName: Joi.string()
        .min(3)
        .max(50)
        .required()
        .messages({
            "string.min": "Full name must be at least 3 characters long.",
            "string.max": "Full name cannot exceed 50 characters.",
            "string.empty": "Full name is required.",
        }),
    email: emailSchema,
    country: Joi.string()
        .min(2)
        .required()
        .messages({
            "string.min": "Country must be at least 2 characters long.",
            "string.empty": "Country is required.",
        }),
    state: Joi.string()
        .min(2)
        .required()
        .messages({
            "string.min": "State must be at least 2 characters long.",
            "string.empty": "State is required.",
        }),
    phoneNumber: phoneNumberSchema,
    gender: Joi.string()
        .valid("Male", "Female", "Other")
        .required()
        .messages({
            "any.only": "Gender must be one of: Male, Female, Other.",
            "string.empty": "Gender is required.",
        }),
    password: passwordSchema,
    confirmPassword: Joi.string()
        .valid(Joi.ref("password"))
        .required()
        .messages({
            "any.only": "Passwords do not match.",
            "string.empty": "Confirm password is required.",
        }),
});

// Validation for OTP verification
export const otpValidationSchema = Joi.object({
    userId: userIdSchema,
    otp: Joi.string()
        .length(6)
        .required()
        .messages({
            "string.length": "OTP must be exactly 6 digits.",
            "string.empty": "OTP is required.",
        }),
});

// Validation for user login
export const loginValidationSchema = Joi.object({
    email: emailSchema,
    password: passwordSchema,
});

// Validation for selecting a role
export const selectRoleValidationSchema = Joi.object({
    userId: userIdSchema,
    role: roleSchema,
});

// Validation for updating a role

export const updateRoleValidationSchema = Joi.object({
    role: Joi.string()
        .valid("sender", "traveler", "admin")
        .required()
        .messages({
            "any.only": "Role must be one of sender, traveler, or admin",
        }),
});


export const updateUserProfileSchema = Joi.object({
    fullName: Joi.string().min(2).max(100).optional(),
    country: Joi.string().optional(),
    state: Joi.string().optional(),
    phoneNumber: Joi.string()
        .pattern(/^\+?[1-9]\d{1,14}$/)
        .optional()
        .messages({
            "string.pattern.base": "Invalid phone number format",
        }),
    password: Joi.string().min(6).optional(),
});


export const resendOtpValidationSchema = Joi.object({
    userId: Joi.string().required().messages({
        "any.required": "User ID is required",
    }),
});



