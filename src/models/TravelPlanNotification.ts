import Notification from "./Notification";
import { Model, Schema } from "mongoose";
import { INotificationBase } from "./Notification";

// Travel Plan Notification Interface
export interface ITravelPlanNotification extends INotificationBase {
    type:
    | "travel_plan_created"
    | "travel_plan_updated"
    | "travel_plan_deleted"
    | "travel_plan_matched";
}

// Travel Plan Notification Schema
const TravelPlanNotificationSchema = new Schema<ITravelPlanNotification>({
    type: {
        type: String,
        enum: [
            "travel_plan_created",
            "travel_plan_updated",
            "travel_plan_deleted",
            "travel_plan_matched",
        ],
        required: true,
    },
});

export const TravelPlanNotification: Model<ITravelPlanNotification> =
    Notification.discriminator<ITravelPlanNotification>("TravelPlanNotification", TravelPlanNotificationSchema);
