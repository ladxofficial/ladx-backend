import mongoose, { Document, Schema, Types } from "mongoose";

const IDENTITY_TYPES = ["national_id", "passport", "drivers_license"] as const;
const KYC_STATUS = ["Pending", "Approved", "Rejected"] as const;

export interface IKYC extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    residentialAddress: string;
    workAddress: string;
    identityDocument: string;
    identityType: typeof IDENTITY_TYPES[number];
    status: typeof KYC_STATUS[number];
    createdAt: Date;
    updatedAt: Date;
}

const KYCSchema = new Schema<IKYC>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            immutable: true,
        },
        residentialAddress: {
            type: String,
            required: true,
            minlength: 5,
            maxlength: 255,
        },
        workAddress: {
            type: String,
            required: true,
            minlength: 5,
            maxlength: 255,
        },
        identityDocument: {
            type: String,
            required: true,
        },
        identityType: {
            type: String,
            enum: IDENTITY_TYPES,
            required: true,
        },
        status: {
            type: String,
            enum: KYC_STATUS,
            default: "Pending",
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

export default mongoose.model<IKYC>("KYC", KYCSchema);
