import mongoose, { Document, Model, Schema } from "mongoose";

// Base Notification Interface
export interface INotificationBase extends Document {
    userId: mongoose.Types.ObjectId;
    type: string; // Specific to the discriminator
    message: string;
    data: Record<string, any>;
    read: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// Base Notification Schema
const NotificationSchema = new Schema<INotificationBase>(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        type: { type: String, required: true },
        message: { type: String, required: true },
        data: { type: Schema.Types.Mixed, default: {} },
        read: { type: Boolean, default: false },
    },
    {
        timestamps: true,
        discriminatorKey: "category", // Use 'category' as the key to distinguish types
    }
);

const Notification = mongoose.model<INotificationBase>("Notification", NotificationSchema);

export default Notification;
