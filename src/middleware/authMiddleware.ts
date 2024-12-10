import Admin from "../models/Admin";
import User from "../models/User";
import jwt from "jsonwebtoken";
import redisClient from "../config/redis";
import { NextFunction, Request, Response } from "express";

// Extend Express Request object
declare global {
    namespace Express {
        interface Request {
            token?: string;
            user?: {
                id: string;
                email: string;
                role: "sender" | "traveler" | "admin";
            };
            admin?: {
                id: string;
                username: string;
            };
        }
    }
}

// Helper: Verify token
const verifyToken = async (token: string): Promise<jwt.JwtPayload | null> => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as jwt.JwtPayload;
        const redisKey = `auth:${decoded.id}:token`; // Structure Redis key with user ID
        const storedToken = await redisClient.get(redisKey);

        if (!storedToken || storedToken !== token) {
            console.warn("Token mismatch or not found in Redis");
            return null;
        }
        return decoded;
    } catch (error) {
        console.error("Error verifying token:", error);
        return null;
    }
};

// Middleware: Authenticate user/admin based on role
export const authenticate = (role?: "user" | "admin") => async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const token =
            req.headers.authorization?.startsWith("Bearer ")
                ? req.headers.authorization.split(" ")[1]
                : req.cookies?.access_token;

        if (!token) {
            res.status(401).json({ success: false, message: "Unauthorized: Missing token" });
            return;
        }

        const decoded = await verifyToken(token);
        if (!decoded) {
            res.status(401).json({ success: false, message: "Unauthorized: Invalid or expired token" });
            return;
        }

        if (role === "user") {
            const user = await User.findById(decoded.id).select("-password");
            if (!user) {
                res.status(404).json({ success: false, message: "User not found" });
                return;
            }

            req.token = token;
            req.user = {
                id: user._id.toString(),
                email: user.email,
                role: user.role as "sender" | "traveler" | "admin",
            };
            console.log("Authenticated user:", req.user);
        } else if (role === "admin") {
            const admin = await Admin.findById(decoded.id).select("-password");
            if (!admin) {
                res.status(404).json({ success: false, message: "Admin not found" });
                return;
            }

            req.token = token;
            req.admin = {
                id: admin._id.toString(),
                username: admin.username,
            };
            console.log("Authenticated admin:", req.admin);
        } else if (role && decoded.role !== role) {
            res.status(403).json({ success: false, message: "Forbidden: Insufficient permissions" });
            return;
        }

        next();
    } catch (error) {
        console.error("Authentication middleware error:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred during authentication",
        });
    }
};
