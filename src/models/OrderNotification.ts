import Notification from "./Notification";
import { Model, Schema } from "mongoose";
import { INotificationBase } from "./Notification";

// Order Notification Interface
export interface IOrderNotification extends INotificationBase {
    type: "order_created" | "order_updated" | "order_deleted" | "order_matched";
}

// Order Notification Schema
const OrderNotificationSchema = new Schema<IOrderNotification>({
    type: {
        type: String,
        enum: ["order_created", "order_updated", "order_deleted", "order_matched"],
        required: true,
    },
});

export const OrderNotification: Model<IOrderNotification> =
    Notification.discriminator<IOrderNotification>("OrderNotification", OrderNotificationSchema);
