import express from "express";
import { searchTravelPlans } from "../controllers/travelPlanController";
import { authenticate } from "../middleware/authMiddleware";
import { validateRequest } from "../middleware/validateRequest";

import {
    createTravelPlanValidationSchema,
    updateTravelPlanValidationSchema,
} from "../validations/travelPlan.validation";

import {
    createTravelPlan,
    getUserTravelPlans,
    getTravelPlanByIdForUser,
    getTravelPlanById,
    updateTravelPlan,
    deleteTravelPlan,
} from "../controllers/travelPlanController";

const router = express.Router();

router.get("/search", authenticate("user"), searchTravelPlans);


// Route: Create a travel plan
router.post("/", authenticate("user"), validateRequest(createTravelPlanValidationSchema), createTravelPlan);

// Route: Get travel plans for the logged-in user
router.get("/", authenticate("user"), getUserTravelPlans);

// Route: Get a specific travel plan for the logged-in user
router.get("/user/:id", authenticate("user"), getTravelPlanByIdForUser);

// Route: Get a travel plan by ID
router.get("/:id", authenticate("user"), getTravelPlanById);

// Route: Update a travel plan
router.patch("/:id", authenticate("user"), validateRequest(updateTravelPlanValidationSchema), updateTravelPlan);

// Route: Delete a travel plan
router.delete("/:id", authenticate("user"), deleteTravelPlan);

export default router;
