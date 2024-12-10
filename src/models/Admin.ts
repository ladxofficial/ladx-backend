import mongoose, { Document, Schema } from "mongoose";

// models/Admin.ts

export interface IAdmin extends Document {
    _id: mongoose.Types.ObjectId;
    username: string;
    password: string;
}

const adminSchema = new Schema<IAdmin>({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

export default mongoose.model<IAdmin>('Admin', adminSchema);