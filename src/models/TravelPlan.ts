import mongoose, { Document, Schema, Types } from "mongoose";

export interface ITravelPlan extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    origin: string;
    destination: string;
    travelDate: Date;
    capacity: number;
    availableWeight: number;
    flightNumber: string;
    departureTime: Date;
    arrivalTime: Date;
    airlineName: string;
    status: "Scheduled" | "In Progress" | "Completed";
    isMatched: boolean;
    matchedOrders: Types.ObjectId[]; // IDs of matched orders
    createdAt: Date;
    updatedAt: Date;
}

const TravelPlanSchema = new Schema<ITravelPlan>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        origin: { type: String, required: true },
        destination: { type: String, required: true },
        travelDate: { type: Date, required: true },
        capacity: { type: Number, required: true },
        availableWeight: { type: Number, required: true },
        flightNumber: { type: String, required: true },
        departureTime: { type: Date, required: true },
        arrivalTime: { type: Date, required: true },
        airlineName: { type: String, required: true },
        status: { type: String, enum: ["Scheduled", "In Progress", "Completed"], default: "Scheduled" },
        isMatched: { type: Boolean, default: false },
        matchedOrders: [{ type: Schema.Types.ObjectId, ref: "Order" }],
    },
    { timestamps: true }
);

export default mongoose.model<ITravelPlan>("TravelPlan", TravelPlanSchema);
