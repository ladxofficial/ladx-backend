import { NextFunction, Request, Response } from "express";
import { kycValidationSchema } from "../validations/kyc.validation";

export const validateKYC = (req: Request, res: Response, next: NextFunction): void => {
    console.log("Received body:", req.body); // Debugging log
    const { error } = kycValidationSchema.validate(req.body, { abortEarly: false });
    if (error) {
        res.status(400).json({
            success: false,
            message: "Validation error: Please correct the fields below.",
            details: error.details.map((err) => ({
                message: err.message,
                field: err.context?.key,
            })),
        });
    } else {
        next();
    }
};

