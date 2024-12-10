import ActivityLog from "../models/ActivityLog";
import KYC from "../models/KYC";
import User from "../models/User";
import cloudinary from "../config/cloudinary";
import { Request, Response } from "express";

// Constants
const KYC_STATUS = ["Pending", "Approved", "Rejected"] as const;

// Helper: Log activity
const logActivity = async (userId: string, action: string, message: string) => {
    try {
        await ActivityLog.create({ userId, action, message });
    } catch (error) {
        console.error("Error logging activity:", error);
    }
};

// Helper: Extract publicId from Cloudinary file path
const extractPublicId = (filePath: string): string | null => {
    try {
        const parts = filePath.split("/");
        const fileName = parts.pop();
        return fileName?.split(".")[0] || null; // Extract publicId (file name without extension)
    } catch {
        return null;
    }
};

// Controller: Submit KYC
export const submitKYC = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized: Missing user ID." });
            return;
        }

        if (!req.file || !req.file.path) {
            res.status(400).json({
                success: false,
                message: "No identity document uploaded. Please attach a valid file.",
            });
            return;
        }

        const { residential_address, work_address, identity_type } = req.body;

        // Check if KYC already exists
        const existingKYC = await KYC.findOne({ userId });
        if (existingKYC) {
            res.status(409).json({ success: false, message: "KYC already submitted." });
            return;
        }

        // Create and save the KYC document
        const kyc = new KYC({
            userId,
            residentialAddress: residential_address,
            workAddress: work_address,
            identityDocument: req.file.path,
            identityType: identity_type,
            status: "Pending",
        });

        await kyc.save();

        // Link the KYC document to the user
        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ success: false, message: "User not found." });
            return;
        }
        user.kyc = kyc._id;
        await user.save();

        // Log activity
        await logActivity(userId, "Submit KYC", "User submitted KYC successfully.");

        res.status(201).json({
            success: true,
            message: "KYC submitted successfully.",
            data: {
                kycId: kyc._id,
                documentUrl: req.file.path,
                status: kyc.status,
            },
        });
    } catch (error) {
        console.error("Error submitting KYC:", error);

        // Cleanup the uploaded file on Cloudinary if an error occurs
        if (req.file?.path) {
            const publicId = extractPublicId(req.file.path);
            if (publicId) {
                try {
                    await cloudinary.uploader.destroy(publicId);
                } catch (cleanupError) {
                    console.error("Error cleaning up Cloudinary file:", cleanupError);
                }
            }
        }

        res.status(500).json({
            success: false,
            message: "An error occurred while processing the KYC submission.",
        });
    }
};

// Controller: Fetch KYC Submissions
interface KYCQuery {
    status?: typeof KYC_STATUS[number];
    page?: string;
    limit?: string;
}

export const fetchKYCSubmissions = async (
    req: Request<{}, {}, {}, KYCQuery>, // Explicitly type `req.query`
    res: Response
): Promise<void> => {
    try {
        const { status, page = "1", limit = "10" } = req.query;

        // Validate status
        if (status && !KYC_STATUS.includes(status)) {
            res.status(400).json({
                success: false,
                message: `Invalid status. Allowed statuses: ${KYC_STATUS.join(", ")}`,
            });
            return;
        }

        // Build a filter object
        const filter: Record<string, any> = {};
        if (status) filter.status = status;

        // Pagination options
        const pageNumber = parseInt(page, 10);
        const pageSize = parseInt(limit, 10);
        const skip = (pageNumber - 1) * pageSize;

        // Fetch KYC submissions with pagination
        const kycSubmissions = await KYC.find(filter)
            .populate("userId", "email role") // Populate user details
            .skip(skip)
            .limit(pageSize)
            .sort({ createdAt: -1 }); // Sort by most recent

        // Get the total count for pagination metadata
        const total = await KYC.countDocuments(filter);

        // Log activity
        await logActivity(req.user?.id || "system", "Fetch KYC Submissions", "Admin fetched KYC submissions.");

        res.status(200).json({
            success: true,
            data: kycSubmissions,
            pagination: {
                total,
                page: pageNumber,
                limit: pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        });
    } catch (error) {
        console.error("Error fetching KYC submissions:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while fetching KYC submissions.",
        });
    }
};
