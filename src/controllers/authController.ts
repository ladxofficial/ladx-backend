import ActivityLog from "../models/ActivityLog";
import User from "../models/User";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import redisClient from "../config/redis";
import sendEmail from "../utils/sendEmail";
import { Request, Response } from "express";
import { emailTemplate } from "../utils/emailTemplates";
import { generateOTP } from "../utils/generateOtp";

// Helper: Generate JWT Token and Save in Redis
const generateToken = async (userId: string, email: string, role: string): Promise<string> => {
    const token = jwt.sign({ id: userId, email, role }, process.env.JWT_SECRET as string, {
        expiresIn: "7d", // Token expires in 7 days
    });

    const redisKey = `auth:${userId}:token`;
    await redisClient.set(redisKey, token, { EX: 7 * 24 * 60 * 60 }); // Save with 7-day expiry
    return token;
};

// Helper: Handle Errors
// Helper: Handle Errors
const handleError = (res: Response, error: unknown, message: string) => {
    let errorMessage = message;

    if (error instanceof Error) {
        // If `error` is an instance of the Error class
        errorMessage = error.message;
    } else if (typeof error === "string") {
        // If `error` is a string
        errorMessage = error;
    }

    console.error(message, error); // Log the full error object for debugging
    res.status(500).json({ success: false, message: errorMessage });
};


// Helper: Log Activity
const logActivity = async (userId: string, action: string, entity: string, entityId: string | null, metadata: Record<string, any> = {}) => {
    try {
        await ActivityLog.create({
            userId,
            action,
            entity,
            entityId,
            metadata,
        });
    } catch (error) {
        console.error("Error logging activity:", error);
    }
};

// **SIGN UP**
// **SIGN UP**
export const signUp = async (req: Request, res: Response): Promise<void> => {
    const { fullName, email, country, state, phoneNumber, gender, password, confirmPassword } = req.body;

    try {
        if (password !== confirmPassword) {
            res.status(400).json({ success: false, message: "Passwords do not match" });
            return;
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            res.status(400).json({ success: false, message: "User already exists" });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = generateOTP();
        const otpExpires = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes

        const tempUserId = new Date().getTime().toString(); // Generate temp user ID
        const userData = {
            id: tempUserId, // Ensure the `id` matches what's saved in Redis
            fullName,
            email,
            country,
            state,
            phoneNumber,
            gender,
            password: hashedPassword,
            otp,
            otpExpires,
        };

        const redisKey = `tempUser:${tempUserId}`;
        await redisClient.set(redisKey, JSON.stringify(userData), { EX: 10 * 60 });

        const emailContent = emailTemplate({
            title: "Verify Your Account",
            body: `
                <p>Hi ${fullName},</p>
                <p>Thank you for signing up! Use the OTP below to verify your email address:</p>
                <h2>${otp}</h2>
                <p>This OTP is valid for the next 10 minutes.</p>
            `,
            footer: `If you have any questions, feel free to contact us at <a href="mailto:ladxofficial@gmail.com">ladxofficial@gmail.com</a>.`,
        });

        await sendEmail(email, "Verify Your Account - OTP", `Your OTP is: ${otp}`, emailContent);
        res.status(201).json({
            success: true,
            message: "OTP sent to your email. Please verify.",
            userId: tempUserId, // Return `tempUserId` as `userId` in the response
        });
    } catch (error) {
        handleError(res, error, "Error during OTP verification");
    }
};


// **RESEND OTP**
export const resendOTP = async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.body;

    if (!userId) {
        console.error("UserId not provided in request");
        res.status(400).json({ success: false, message: "UserId is required." });
        return;
    }

    try {
        const redisKey = `tempUser:${userId}`;
        const tempUserData = await redisClient.get(redisKey);

        if (!tempUserData) {
            console.error(`No data found for UserId: ${userId}`);
            res.status(400).json({ success: false, message: "User not found or OTP expired. Please sign up again." });
            return;
        }

        const user = JSON.parse(tempUserData);
        const newOtp = generateOTP();
        user.otp = newOtp;
        user.otpExpires = Date.now() + 10 * 60 * 1000;

        await redisClient.set(redisKey, JSON.stringify(user), { EX: 10 * 60 });

        const emailContent = emailTemplate({
            title: "Your New OTP Code",
            body: `
                <p>Hi ${user.fullName},</p>
                <p>Your new OTP code is below:</p>
                <h2>${newOtp}</h2>
                <p>This OTP is valid for the next 10 minutes.</p>
            `,
            footer: `If you have any questions, feel free to contact us.`,
        });

        await sendEmail(user.email, "Your New OTP Code", `Your OTP is: ${newOtp}`, emailContent);
        res.status(200).json({ success: true, message: "New OTP sent to your email." });
    } catch (error) {
        console.error("Error during resend OTP:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
};


// **VERIFY OTP**
export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
    const { userId, otp } = req.body;

    try {
        const redisKey = `tempUser:${userId}`;
        const tempUserData = await redisClient.get(redisKey);

        if (!tempUserData) {
            res.status(400).json({ success: false, message: "User not found or OTP expired" });
            return;
        }

        const user = JSON.parse(tempUserData);

        if (user.otp !== otp || Date.now() > user.otpExpires) {
            res.status(400).json({ success: false, message: "Invalid or expired OTP" });
            return;
        }

        // Create a new user in the database
        const newUser = new User({
            fullName: user.fullName,
            email: user.email,
            country: user.country,
            state: user.state,
            phoneNumber: user.phoneNumber,
            gender: user.gender,
            password: user.password,
            isVerified: true,
        });

        await newUser.save();

        // Generate JWT token
        const token = await generateToken(newUser._id.toString(), newUser.email, newUser.role);

        // Set token in the cookies
        res.cookie("access_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // Cookie valid for 7 days
        });

        // Log activity
        await logActivity(newUser._id.toString(), "Verify OTP", "user", newUser._id.toString(), { email: newUser.email });

        // Clear Redis data
        await redisClient.del(redisKey);

        // Respond with success
        res.status(200).json({
            success: true,
            message: "User verified successfully",
            user: {
                id: newUser._id.toString(),
                fullName: newUser.fullName,
                email: newUser.email,
                role: newUser.role,
            },
        });
    } catch (error) {
        handleError(res, error, "Error during OTP verification");
    }
};



// **LOGIN**
export const login = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            res.status(404).json({ success: false, message: "User not found" });
            return;
        }

        if (!user.isVerified) {
            res.status(403).json({ success: false, message: "Please verify your account" });
            return;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(400).json({ success: false, message: "Invalid credentials" });
            return;
        }

        const token = await generateToken(user._id.toString(), user.email, user.role);

        res.cookie("access_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        await logActivity(user._id.toString(), "Login", "user", user._id.toString(), { email });

        res.status(200).json({
            success: true,
            message: "Login successful",
            user: {
                id: user._id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
            },
        });
    } catch (error) {
        handleError(res, error, "Error during login");
    }
};

// **LOGOUT**
export const logout = async (req: Request, res: Response): Promise<void> => {
    try {
        const token = req.cookies.access_token;

        if (!token) {
            res.status(400).json({ success: false, message: "Token is required for logout" });
            return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
        const redisKey = `auth:${decoded.id}:token`;

        await redisClient.del(redisKey);
        res.clearCookie("access_token");

        await logActivity(decoded.id, "Logout", "user", decoded.id, {});

        res.status(200).json({ success: true, message: "Logged out successfully" });
    } catch (error) {
        handleError(res, error, "Error during logout");
    }
};



// **FORGOT PASSWORD**
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            res.status(404).json({ success: false, message: "User not found" });
            return;
        }

        // Generate a password reset token
        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
        const resetTokenExpires = Date.now() + 10 * 60 * 1000; // Token valid for 10 minutes

        user.resetPasswordToken = resetTokenHash;
        user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

        await user.save();

        // Send reset password email
        const resetUrl = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
        const emailContent = emailTemplate({
            title: "Reset Your Password",
            body: `
                <p>Hi ${user.fullName},</p>
                <p>You requested to reset your password. Click the link below to reset it:</p>
                <a href="${resetUrl}" target="_blank">${resetUrl}</a>
                <p>This link will expire in 10 minutes.</p>
            `,
            footer: `If you didn't request this, please ignore this email.`,
        });

        await sendEmail(user.email, "Reset Your Password", "Reset Password Instructions", emailContent);

        res.status(200).json({ success: true, message: "Password reset instructions sent to your email." });
    } catch (error) {
        handleError(res, error, "Error during forgot password");
    }
};

// **RESET PASSWORD**
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
    const { token, newPassword } = req.body;

    try {
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }, // Token must not be expired
        });

        if (!user) {
            res.status(400).json({ success: false, message: "Invalid or expired password reset token" });
            return;
        }

        // Update user's password
        user.password = await bcrypt.hash(newPassword, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        // Log activity
        await logActivity(user._id.toString(), "Reset Password", "user", user._id.toString(), { email: user.email });

        res.status(200).json({ success: true, message: "Password reset successfully. Please log in." });
    } catch (error) {
        handleError(res, error, "Error during password reset");
    }
};

