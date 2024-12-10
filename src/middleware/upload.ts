import cloudinary from "../config/cloudinary";
import multer from "multer";
import { NextFunction, Request, Response } from "express";
import { CloudinaryStorage } from "multer-storage-cloudinary";

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "kyc_documents",
        resource_type: "image",
        allowed_formats: ["jpg", "jpeg", "png", "pdf"],
        transformation: [{ quality: "auto" }],
    } as Record<string, unknown>,
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ["image/jpeg", "image/png", "application/pdf"];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Unsupported file type. Allowed types are JPG, PNG, and PDF."));
        }
    },
}).single("identity_document");

export const uploadIdentityDocument = (req: Request, res: Response, next: NextFunction): void => {
    upload(req, res, (err: any) => {
        console.log("Form data:", req.body); // Debug parsed form data
        console.log("Uploaded file:", req.file); // Debug uploaded file info

        if (err instanceof multer.MulterError) {
            res.status(400).json({ success: false, message: `Multer error: ${err.message}` });
        } else if (err) {
            res.status(400).json({ success: false, message: err.message });
        } else {
            next();
        }
    });
};


