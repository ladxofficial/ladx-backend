import dotenv from "dotenv";
import { createClient } from "redis";

// Load environment variables from .env file
dotenv.config();

const redisClient = createClient({
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || "6379", 10), // Default to Redis standard port if not specified
    },
});

// Redis error handling
redisClient.on("error", (err) => {
    console.error("Error connecting to Redis:", err);
});

// Connect to Redis
(async () => {
    try {
        await redisClient.connect();
        console.log("Connected to Redis!");
    } catch (err) {
        console.error("Error during Redis connection:", err);
    }
})();

export default redisClient;
