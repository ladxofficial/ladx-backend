import express from "express";
import { submitKYC } from "../controllers/kycController";
import { fetchKYCSubmissions } from "../controllers/kycController";
import { authenticate } from "../middleware/authMiddleware";
import { uploadIdentityDocument } from "../middleware/upload";
import { validateKYC } from "../middleware/validateKyc";

const router = express.Router();
router.post(
    "/",
    authenticate("user"), // Authentication middleware
    uploadIdentityDocument, // Multer middleware to handle file uploads
    validateKYC, // Validate KYC form data
    submitKYC // Submit KYC logic
);



// Admin endpoint to fetch KYC submissions
router.get("/", authenticate("admin"), fetchKYCSubmissions);

export default router;
