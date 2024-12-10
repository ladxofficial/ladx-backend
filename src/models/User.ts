import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { Document, Schema, Types, model } from "mongoose";

// IUser interface
export interface IUser {
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
    resetPasswordToken?: string;
    resetPasswordExpires?: Date;
    kyc?: Types.ObjectId;
}

// IUserDocument extends both IUser and Mongoose Document
export interface IUserDocument extends IUser, Document {
    _id: Types.ObjectId; // Explicitly type `_id`
    comparePassword(candidatePassword: string): Promise<boolean>;
}

// Schema definition
const UserSchema = new Schema<IUserDocument>(
    {
        fullName: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        country: { type: String, required: true },
        state: { type: String, required: true },
        phoneNumber: { type: String, required: true },
        gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
        password: { type: String, required: true },
        role: { type: String, enum: ["sender", "traveler", "admin"], default: "sender" },
        isVerified: { type: Boolean, default: false },
        otp: { type: String },
        otpExpires: { type: Date },
        resetPasswordToken: { type: String, select: false }, // Reset password token
        resetPasswordExpires: { type: Date, select: false }, // Expiration date for reset password token
        kyc: { type: Schema.Types.ObjectId, ref: "KYC" },
    },
    { timestamps: true }
);

// Middleware to hash password before saving
UserSchema.pre<IUserDocument>("save", async function (next) {
    if (!this.isModified("password")) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        if (error instanceof mongoose.Error) {
            next(error); // Pass the Mongoose error
        } else {
            next(new Error("An unknown error occurred during password hashing")); // Wrap unknown errors
        }
    }
});


// Method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

export default model<IUserDocument>("User", UserSchema);
