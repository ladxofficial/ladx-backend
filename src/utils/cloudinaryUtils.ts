import cloudinary from "../config/cloudinary";
import { Express } from "express";

/**
 * Deletes files from Cloudinary using their publicId.
 * @param publicIds Array of Cloudinary publicIds to delete.
 */
export const cleanupCloudinaryFiles = async (publicIds: string[]): Promise<void> => {
    try {
        if (!publicIds || publicIds.length === 0) return;

        // Delete multiple resources
        await cloudinary.api.delete_resources(publicIds);
        console.log("Deleted Cloudinary files:", publicIds);
    } catch (error) {
        console.error("Error cleaning up Cloudinary files:", error);
    }
};


