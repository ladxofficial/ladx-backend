import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

dotenv.config();

// Cloudinary test configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
    api_key: process.env.CLOUDINARY_API_KEY || '',
    api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

const testCloudinaryConnection = async () => {
    try {
        const result = await cloudinary.uploader.upload(
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HgAGgwJ/lK3Q6wAAAABJRU5ErkJggg==",
            { folder: "test" }
        );
        console.log("Cloudinary connection successful:", result.secure_url);
    } catch (error) {
        console.error("Cloudinary connection error:", error);
    }
};

testCloudinaryConnection();
