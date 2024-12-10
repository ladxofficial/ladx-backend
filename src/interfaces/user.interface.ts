import { Document, Types } from "mongoose";

export interface IUser {
    _id: string | Types.ObjectId;
    fullName: string;
    email: string;
    country: string;
    state: string;
    phoneNumber: string;
    gender: "Male" | "Female" | "Other";
    password: string;
    role: "sender" | "traveler" | "admin";
    isVerified: boolean;
    otp?: string;
    otpExpires?: Date;
    kycDocument?: string;
    kyc?: Types.ObjectId;
}

// Extend Document for Mongoose-specific features and methods
export interface IUserDocument extends Document {
    fullName: string;
    email: string;
    country: string;
    state: string;
    phoneNumber: string;
    gender: "Male" | "Female" | "Other";
    password: string;
    role: "sender" | "traveler" | "admin";
    isVerified: boolean;
    otp?: string;
    otpExpires?: Date;
    kycDocument?: string;
    kyc?: Types.ObjectId;

    comparePassword(candidatePassword: string): Promise<boolean>;
    isAdmin: boolean;
}
