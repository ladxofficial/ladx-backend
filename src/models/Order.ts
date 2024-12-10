import mongoose, { Document, Schema, Types } from "mongoose";

export const ORDER_STATUS = {
    IN_PROCESS: "In Process",
    CONFIRMED: "Confirmed",
    IN_TRANSIT: "In Transit",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
} as const;

export const ORDER_PRIORITY = {
    STANDARD: "Standard",
    EXPRESS: "Express",
} as const;

interface ICloudinaryImage {
    url: string;
    publicId: string;
}

export interface IOrder extends Document {
    _id: mongoose.Types.ObjectId;
    userId: Types.ObjectId;
    packageName: string;
    packageDetails: string;
    itemDescription: string;
    packageValue: number;
    quantityInKg: number;
    price: number;
    addressSendingFrom: string;
    addressDeliveringTo: string;
    receiverName: string;
    receiverPhone: string;
    images: ICloudinaryImage[];
    status: typeof ORDER_STATUS[keyof typeof ORDER_STATUS];
    priority: typeof ORDER_PRIORITY[keyof typeof ORDER_PRIORITY];
    trackingNumber: string;
    estimatedDeliveryDate?: Date;
    specialInstructions?: string;
    createdAt: Date;
    updatedAt: Date;
}

const CloudinaryImageSchema = new Schema<ICloudinaryImage>(
    {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
    },
    { _id: false }
);

const OrderSchema = new Schema<IOrder>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        packageName: { type: String, required: true, maxlength: 100 },
        packageDetails: { type: String, required: true, maxlength: 500 },
        itemDescription: { type: String, required: true, maxlength: 1000 },
        packageValue: { type: Number, required: true, min: 0 },
        quantityInKg: { type: Number, required: true, min: 0 },
        price: { type: Number, required: true, min: 0 },
        addressSendingFrom: { type: String, required: true },
        addressDeliveringTo: { type: String, required: true },
        receiverName: { type: String, required: true },
        receiverPhone: { type: String, required: true },
        images: { type: [CloudinaryImageSchema], default: [] },
        status: {
            type: String,
            enum: Object.values(ORDER_STATUS),
            default: ORDER_STATUS.IN_PROCESS,
        },
        priority: {
            type: String,
            enum: Object.values(ORDER_PRIORITY),
            default: ORDER_PRIORITY.STANDARD,
        },
        trackingNumber: { type: String, unique: true },
        estimatedDeliveryDate: { type: Date },
        specialInstructions: { type: String, maxlength: 500 },
    },
    { timestamps: true }
);

OrderSchema.pre("save", function (next) {
    if (!this.trackingNumber) {
        this.trackingNumber = `TRK${Date.now()}${Math.floor(Math.random() * 10000)}`;
    }
    next();
});

export default mongoose.model<IOrder>("Order", OrderSchema);
