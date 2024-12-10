import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is not defined in environment variables");
        }
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error instanceof Error ? error.message : error}`);
        process.exit(1); // Exit process with failure
    }
};

export default connectDB;
