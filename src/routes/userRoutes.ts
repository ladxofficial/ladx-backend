import express from "express";
import { authenticate } from "../middleware/authMiddleware";
import { validateRequest } from "../middleware/validateRequest";
import { updateUserProfileSchema } from "../validations/user.validation";

import {
    getUserProfile,
    updateRole,
    getSenders,
    getTravelers,
    updateUserProfile,
} from "../controllers/userController";

const router = express.Router();

// Route: Get user profile
router.get("/profile", authenticate("user"), getUserProfile);

// Route: Update user role (self-service)
router.patch("/role", authenticate("user"), updateRole);

// Route: Update user profile
router.patch(
    "/update-profile",
    authenticate("user"), // Authentication for profile updates
    validateRequest(updateUserProfileSchema), // Validate input data
    updateUserProfile
);

// Route: Get all senders
router.get("/senders", authenticate("admin"), getSenders);

// Route: Get all travelers
router.get("/travelers", authenticate("admin"), getTravelers);

export default router;
