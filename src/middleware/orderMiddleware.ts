import cloudinary from "../config/cloudinary";
import multer from "multer";
import { NextFunction, Request, Response } from "express";
import { CloudinaryStorage } from "multer-storage-cloudinary";

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "order_images",
        resource_type: "image",
        allowed_formats: ["jpg", "jpeg", "png"],
        transformation: [{ quality: "auto" }],
    } as unknown as Record<string, unknown>,
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
}).array("images", 5); // Allow up to 5 images

export const orderMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    upload(req, res, (err: any) => {
        if (err instanceof multer.MulterError) {
            res.status(400).json({ success: false, message: err.message });
        } else if (err) {
            res.status(400).json({ success: false, message: err.message });
        } else {
            next();
        }
    });
};
