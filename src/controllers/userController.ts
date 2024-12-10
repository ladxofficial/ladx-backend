import KYC from "../models/KYC";
import User from "../models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import redisClient from "../config/redis";
import { Request, Response } from "express";

// Helper Function: Save session in Redis
const TOKEN_EXPIRY = 24 * 60 * 60; // 1 day in seconds

const updateRedisSession = async (token: string, user: any) => {
    const sessionData = JSON.stringify({
        id: user._id,
        email: user.email,
        role: user.role,
    });
    await redisClient.set(token, sessionData, { EX: TOKEN_EXPIRY }); // 1-day expiration
};


export const updateRole = async (req: Request, res: Response): Promise<void> => {
    try {
        const { role } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized: User not authenticated" });
            return;
        }

        if (!["sender", "traveler", "admin"].includes(role)) {
            res.status(400).json({ success: false, message: "Invalid role provided" });
            return;
        }

        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ success: false, message: "User not found" });
            return;
        }

        // Update role
        user.role = role;
        await user.save();

        // Regenerate token with updated role
        const newToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET as string, { expiresIn: "1d" });

        const redisKey = `auth:${userId}:token`;
        await redisClient.set(redisKey, newToken, { EX: 24 * 60 * 60 });

        res.status(200).json({
            success: true,
            message: "Role updated successfully",
            user: {
                id: user._id.toString(),
                email: user.email,
                fullName: user.fullName,
                role: user.role,
            },
            token: newToken, // Return the new token for immediate use
        });
    } catch (error) {
        console.error("Error in updateRole:", error);
        res.status(500).json({ success: false, message: "Internal server error while updating role" });
    }
};



// Get User Profile
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const user = await User.findById(userId).select("-password");
        if (!user) {
            res.status(404).json({ success: false, message: "User not found" });
            return;
        }

        const kyc = user.kyc ? await KYC.findById(user.kyc) : null;

        res.status(200).json({
            success: true,
            user: {
                ...user.toObject(),
                kyc,
            },
        });
    } catch (error) {
        console.error("Error fetching profile:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// Get All Senders
export const getSenders = async (_req: Request, res: Response): Promise<void> => {
    try {
        const senders = await User.find({ role: "sender" }).select("-password");
        res.status(200).json({
            success: true,
            data: senders,
        });
    } catch (error) {
        console.error("Error fetching senders:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// Get All Travelers
export const getTravelers = async (_req: Request, res: Response): Promise<void> => {
    try {
        const travelers = await User.find({ role: "traveler" }).select("-password");
        res.status(200).json({
            success: true,
            data: travelers,
        });
    } catch (error) {
        console.error("Error fetching travelers:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// Update User Profile
export const updateUserProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { fullName, country, state, phoneNumber, password } = req.body;

        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ success: false, message: "User not found" });
            return;
        }

        if (fullName) user.fullName = fullName;
        if (country) user.country = country;
        if (state) user.state = state;
        if (phoneNumber) {
            if (!/^\+?[1-9]\d{1,14}$/.test(phoneNumber)) {
                res.status(400).json({ success: false, message: "Invalid phone number format" });
                return;
            }
            user.phoneNumber = phoneNumber;
        }

        if (password) {
            if (password.length < 6) {
                res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
                return;
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            user.password = hashedPassword;
        }

        await user.save();

        const token = req.cookies.access_token; // Retrieve token from cookies
        if (token) {
            await updateRedisSession(token, user); // Update Redis session
        }

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: {
                id: user._id,
                fullName: user.fullName,
                country: user.country,
                state: user.state,
                phoneNumber: user.phoneNumber,
            },
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
