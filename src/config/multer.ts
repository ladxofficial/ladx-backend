import cloudinary from "./cloudinary";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";

// Define Cloudinary storage
const storage = new CloudinaryStorage({
    cloudinary,
    params: async (_req, file) => ({
        folder: "orders",
        resource_type: "image",
        public_id: `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, "")}`,
    }),
});

// Multer configuration
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit: 5MB per file
}).array("images", 5); // Max 5 images

export default upload;
