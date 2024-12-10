import mongoose, { Document, Schema } from "mongoose";

export interface IActivityLog extends Document {
    userId: mongoose.Types.ObjectId;
    action: string;
    entity: string;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        action: { type: String, required: true },
        entity: { type: String, required: true }, // Ensure `entity` is required
        metadata: { type: Schema.Types.Mixed, default: {} },
    },
    { timestamps: true }
);

export default mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema);
