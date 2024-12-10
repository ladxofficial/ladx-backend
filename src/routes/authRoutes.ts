import express from "express";
import { authenticate } from "../middleware/authMiddleware";
import { validateRequest } from "../middleware/validateRequest";

import {
    login,
    signUp,
    verifyOTP,
    resendOTP,
    logout,
    forgotPassword,
    resetPassword, // Added logout controller
} from "../controllers/authController";

import {
    signUpValidationSchema,
    otpValidationSchema,
    loginValidationSchema,
    resendOtpValidationSchema,
} from "../validations/user.validation";

const router = express.Router();

// Public Auth Routes with Validation Middleware
router.post("/signup", validateRequest(signUpValidationSchema), signUp);
router.post("/login", validateRequest(loginValidationSchema), login);
router.post("/verify-otp", validateRequest(otpValidationSchema), verifyOTP);
router.post("/resend-otp", validateRequest(resendOtpValidationSchema), resendOTP);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Logout Route (Requires Authentication)
router.post("/logout", authenticate("user"), logout);

// Example Protected Route
router.post("/protected-route-example", authenticate("user"), (req, res) => {
    res.status(200).json({
        success: true,
        message: "You accessed a protected route!",
        user: req.user,
    });
});

export default router;
