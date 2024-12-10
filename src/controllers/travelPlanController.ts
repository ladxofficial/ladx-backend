import TravelPlan from "../models/TravelPlan";
import User from "../models/User";
import sendEmail from "../utils/sendEmail";
import verifyFlightNumber from "../utils/verifyFlightNumber";
import { Request, Response } from "express";
import { TravelPlanNotification } from "../models/TravelPlanNotification";
import { logActivity } from "../utils/activityLogger";
import { emailTemplate } from "../utils/emailTemplates";
import { sendNotification } from "../websocketServer";

// Helper: Create and send a travel plan notification
export const createAndSendTravelPlanNotification = async (
    userId: string,
    type: "travel_plan_created" | "travel_plan_updated" | "travel_plan_deleted" | "travel_plan_matched",
    message: string,
    data: {
        travelPlanId: string;
        origin: string;
        destination: string;
        flightNumber?: string;
        departureTime?: string;
        arrivalTime?: string;
    }
): Promise<void> => {
    try {
        // Create notification in the database
        const notification = await TravelPlanNotification.create({
            userId,
            type,
            message,
            data,
            read: false,
        });

        // Send notification via WebSocket
        sendNotification(userId, {
            type,
            message: notification.message,
            data: notification.data,
        });

        // Fetch user email and send email notification
        const user = await User.findById(userId).select("email");
        if (user?.email) {
            let plainTextEmail = "";
            let htmlEmail = "";

            if (type === "travel_plan_deleted") {
                // Messaging for deleted travel plans
                plainTextEmail = `
Hi there,

Your travel plan has been successfully removed from our system.

- Origin: ${data.origin}
- Destination: ${data.destination}

If you have any questions, feel free to contact us at ladxofficial@gmail.com.
                `;

                htmlEmail = emailTemplate({
                    title: "Your Travel Plan Has Been Deleted",
                    body: `
                        <p>Hi there,</p>
                        <p>Your travel plan has been successfully removed from our system:</p>
                        <div style="background: #f9f9f9; padding: 10px; border-radius: 5px; margin-bottom: 20px;">
                            <p><strong>Origin:</strong> ${data.origin}</p>
                            <p><strong>Destination:</strong> ${data.destination}</p>
                        </div>
                    `,
                    footer: `If you have any questions, feel free to contact us at <a href="mailto:ladxofficial@gmail.com" style="color: #4CAF50;">ladxofficial@gmail.com</a>.`,
                });
            } else {
                // Default messaging for other types (e.g., created, updated)
                plainTextEmail = `
Hi there,

We're excited to share the details of your travel plan:

- Origin: ${data.origin}
- Destination: ${data.destination}
${data.flightNumber ? `- Flight Number: ${data.flightNumber}` : ""}
${data.departureTime ? `- Departure Time: ${data.departureTime}` : ""}
${data.arrivalTime ? `- Arrival Time: ${data.arrivalTime}` : ""}

Please note: You will hear from us when your travel plan is matched with an order.

You can view your travel plan here: ${process.env.APP_URL}/travel-plans/${data.travelPlanId}

If you have any questions, feel free to contact us at ladxofficial@gmail.com.
                `;

                htmlEmail = emailTemplate({
                    title: "Your Travel Plan Details",
                    body: `
                        <p>Hi there,</p>
                        <p>We're excited to share the details of your travel plan:</p>
                        <div style="background: #f9f9f9; padding: 10px; border-radius: 5px; margin-bottom: 20px;">
                            <p><strong>Origin:</strong> ${data.origin}</p>
                            <p><strong>Destination:</strong> ${data.destination}</p>
                            ${data.flightNumber ? `<p><strong>Flight Number:</strong> ${data.flightNumber}</p>` : ""}
                            ${data.departureTime ? `<p><strong>Departure Time:</strong> ${data.departureTime}</p>` : ""}
                            ${data.arrivalTime ? `<p><strong>Arrival Time:</strong> ${data.arrivalTime}</p>` : ""}
                        </div>
                        <p>
                            <a href="${process.env.APP_URL}/travel-plans/${data.travelPlanId}" 
                               style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px;
                               text-decoration: none; border-radius: 5px;">
                               View Your Travel Plan
                            </a>
                        </p>
                    `,
                    footer: `If you have any questions, feel free to contact us at <a href="mailto:ladxofficial@gmail.com" style="color: #4CAF50;">ladxofficial@gmail.com</a>.`,
                });
            }

            // Send email with the correct template
            await sendEmail(user.email, type === "travel_plan_deleted" ? "Your Travel Plan Has Been Deleted" : "Your Travel Plan Details", plainTextEmail, htmlEmail);
        }
    } catch (error) {
        console.error("Error creating or sending travel plan notification:", error);
    }
};



// Create a new travel plan
export const createTravelPlan = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId || req.user?.role !== "traveler") {
            res.status(403).json({ success: false, message: "Unauthorized: Only travelers can create travel plans." });
            return;
        }

        const {
            origin,
            destination,
            travelDate,
            capacity,
            availableWeight,
            flightNumber,
            departureTime,
            arrivalTime,
            airlineName,
        } = req.body;

        // Validate flight number with mock
        if (flightNumber) {
            console.log("Mocking flight verification...");
            const isFlightValid = await verifyFlightNumber(flightNumber, travelDate);
            if (!isFlightValid) {
                res.status(400).json({
                    success: false,
                    message: "Invalid flight number or flight details not found. Please verify your input.",
                });
                return;
            }
        }

        // Create a new travel plan
        const newTravelPlan = await TravelPlan.create({
            userId,
            origin,
            destination,
            travelDate,
            capacity,
            availableWeight,
            flightNumber,
            departureTime,
            arrivalTime,
            airlineName,
        });

        // Send notification for the created travel plan
        await createAndSendTravelPlanNotification(
            userId,
            "travel_plan_created",
            "Your travel plan has been created successfully.",
            {
                travelPlanId: newTravelPlan._id.toString(),
                origin,
                destination,
                flightNumber,
                departureTime,
                arrivalTime,
            }
        );

        // Log activity
        await logActivity(userId, "create", "travel_plan", newTravelPlan._id.toString(), {
            origin,
            destination,
            travelDate,
        });

        res.status(201).json({
            success: true,
            message: "Travel plan created successfully",
            data: newTravelPlan,
        });
    } catch (error) {
        console.error("Error creating travel plan:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while creating the travel plan.",
        });
    }
};




// Fetch all travel plans for the logged-in user
export const getUserTravelPlans = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({ success: false, message: "Authentication required" });
            return;
        }

        const travelPlans = await TravelPlan.find({ userId });

        // Log the activity
        await logActivity(userId, "fetch_all", "travel_plan", undefined, {
            count: travelPlans.length,
        });

        res.status(200).json({
            success: true,
            data: travelPlans,
        });
    } catch (error) {
        console.error("Failed to fetch travel plans:", error);
        res.status(500).json({ success: false, message: "Failed to fetch travel plans", error });
    }
};

// Fetch a single travel plan for the logged-in user by ID
export const getTravelPlanByIdForUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({ success: false, message: "Authentication required" });
            return;
        }

        const travelPlan = await TravelPlan.findOne({ _id: id, userId });

        if (!travelPlan) {
            res.status(404).json({ success: false, message: "Travel plan not found" });
            return;
        }

        // Log the activity
        await logActivity(userId, "fetch", "travel_plan", id, { origin: travelPlan.origin, destination: travelPlan.destination });

        res.status(200).json({
            success: true,
            data: travelPlan,
        });
    } catch (error) {
        console.error("Failed to fetch travel plan:", error);
        res.status(500).json({ success: false, message: "Failed to fetch travel plan", error });
    }
};

// Update a travel plan
export const updateTravelPlan = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({ success: false, message: "Authentication required" });
            return;
        }

        const updates = req.body;

        const travelPlan = await TravelPlan.findOneAndUpdate(
            { _id: id, userId },
            updates,
            { new: true, runValidators: true }
        );

        if (!travelPlan) {
            res.status(404).json({ success: false, message: "Travel plan not found" });
            return;
        }

        // Use updated travel plan details to send a notification email
        await createAndSendTravelPlanNotification(
            userId,
            "travel_plan_updated",
            "Your travel plan has been updated successfully.",
            {
                travelPlanId: travelPlan._id.toString(),
                origin: travelPlan.origin,
                destination: travelPlan.destination,
                flightNumber: travelPlan.flightNumber,
                departureTime: travelPlan.departureTime?.toISOString(),
                arrivalTime: travelPlan.arrivalTime?.toISOString(),
            }
        );

        // Log the activity
        await logActivity(userId, "update", "travel_plan", id, updates);

        res.status(200).json({
            success: true,
            message: "Travel plan updated successfully",
            data: travelPlan,
        });
    } catch (error) {
        console.error("Failed to update travel plan:", error);
        res.status(500).json({ success: false, message: "Failed to update travel plan", error });
    }
};

export const deleteTravelPlan = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({ success: false, message: "Authentication required" });
            return;
        }

        const travelPlan = await TravelPlan.findOneAndDelete({ _id: id, userId });

        if (!travelPlan) {
            res.status(404).json({ success: false, message: "Travel plan not found" });
            return;
        }

        // Send notification with a delete-specific message
        await createAndSendTravelPlanNotification(
            userId,
            "travel_plan_deleted",
            "Your travel plan has been successfully removed from our system.",
            {
                travelPlanId: travelPlan._id.toString(),
                origin: travelPlan.origin,
                destination: travelPlan.destination,
            }
        );

        // Log the delete activity
        await logActivity(userId, "delete", "travel_plan", id, {
            origin: travelPlan.origin,
            destination: travelPlan.destination,
        });

        res.status(200).json({
            success: true,
            message: "Travel plan has been successfully deleted.",
        });
    } catch (error) {
        console.error("Failed to delete travel plan:", error);
        res.status(500).json({ success: false, message: "An error occurred while trying to delete the travel plan." });
    }
};


// Fetch a travel plan by ID for general users or admins
export const getTravelPlanById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const travelPlan = await TravelPlan.findById(id).populate("userId", "fullName email");

        if (!travelPlan) {
            res.status(404).json({ success: false, message: "Travel plan not found" });
            return;
        }

        // Log the activity
        await logActivity(travelPlan.userId.toString(), "fetch_by_id", "travel_plan", id, {});

        res.status(200).json({
            success: true,
            message: "Travel plan fetched successfully",
            data: travelPlan,
        });
    } catch (error) {
        console.error("Error fetching travel plan by ID:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch travel plan",
        });
    }
};

export const searchTravelPlans = async (req: Request, res: Response): Promise<void> => {
    try {
        const { origin, destination, travelDateFrom, travelDateTo, page = "1", limit = "10" } = req.query;

        // Build dynamic filter
        const filter: Record<string, any> = {};
        if (origin) filter.origin = { $regex: new RegExp(origin as string, "i") }; // Case-insensitive regex
        if (destination) filter.destination = { $regex: new RegExp(destination as string, "i") }; // Case-insensitive regex
        if (travelDateFrom || travelDateTo) {
            filter.travelDate = {
                ...(travelDateFrom ? { $gte: new Date(travelDateFrom as string) } : {}),
                ...(travelDateTo ? { $lte: new Date(travelDateTo as string) } : {}),
            };
        }

        // Pagination
        const pageNumber = parseInt(page as string, 10);
        const pageSize = parseInt(limit as string, 10);
        const skip = (pageNumber - 1) * pageSize;

        console.log("Filter used:", filter);
        console.log("Pagination:", { page: pageNumber, limit: pageSize, skip });

        // Fetch travel plans
        const travelPlans = await TravelPlan.find(filter)
            .skip(skip)
            .limit(pageSize)
            .sort({ travelDate: 1 });

        // Count total documents
        const total = await TravelPlan.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: travelPlans,
            pagination: {
                total,
                page: pageNumber,
                limit: pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        });
    } catch (error) {
        console.error("Error fetching travel plans:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while fetching travel plans.",
        });
    }
};

