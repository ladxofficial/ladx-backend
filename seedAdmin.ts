import Admin from "./src/models/Admin";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const connectDB = async (): Promise<void> => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is not defined in the environment variables.");
        }
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error}`);
        process.exit(1);
    }
};

const seedAdmin = async (): Promise<void> => {
    await connectDB();

    try {
        const username = "ladx";
        const password = "ladx2024";

        const existingAdmin = await Admin.findOne({ username });
        const hashedPassword = await bcrypt.hash(password, 10);

        if (!existingAdmin) {
            await Admin.create({ username, password: hashedPassword });
            console.log(`Admin created: ${username}`);
        } else {
            existingAdmin.password = hashedPassword;
            await existingAdmin.save();
            console.log(`Admin password updated to: ${password}`);
        }
    } catch (error) {
        console.error("Failed to seed admin:", error);
    } finally {
        process.exit(); // Ensure the process exits
    }
};

seedAdmin();
