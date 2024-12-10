import { NextFunction, Request, Response } from "express";
import { Schema } from "joi";

export const validateRequest = (schema: Schema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const { error } = schema.validate(req.body, { abortEarly: false });
        if (error) {
            res.status(400).json({
                message: "Validation error",
                details: error.details.map((err) => ({
                    message: err.message,
                    field: err.context?.key,
                })),
            });
            return;
        }
        next();
    };
};
