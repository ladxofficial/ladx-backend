import * as Sentry from "@sentry/node";
import ActivityLog from "./models/ActivityLog";
import Joi from "joi";
import adminRoutes from "./routes/adminRoutes";
import authRoutes from "./routes/authRoutes";
import connectDB from "./config/db";
import cookieParser from "cookie-parser";
import cors from "cors";
import dashboardRoutes from "./routes/dashboardRoutes";
import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import fs from "fs";
import helmet from "helmet";
import http from "http";
import kycRoutes from "./routes/kyc.routes";
import notificationRoutes from "./routes/notificationRoutes";
import orderRoutes from "./routes/orderRoutes";
import path from "path";
import rateLimit from "express-rate-limit";
import travelPlanRoutes from "./routes/travelPlanRoutes";
import userRoutes from "./routes/userRoutes";
import winston from "winston";
import { handleWebSocketUpgrade } from "./websocketServer";

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 10000;

// Initialize Sentry
Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
});

// Connect to Database
connectDB();

// Trust proxy - must be first
app.set("trust proxy", 1);

// Logging setup
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: "error.log", level: "error" }),
        new winston.transports.File({ filename: "combined.log" }),
    ],
});

// Helper: Log user activity
const logActivity = async (userId: string, action: string, message: string): Promise<void> => {
    try {
        await ActivityLog.create({ userId, action, message });
        logger.info(`Activity logged for user ${userId}: ${action}`);
    } catch (error) {
        logger.error("Error logging activity:", error);
    }
};

// Security middleware
app.use(
    helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
    })
);

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        const xForwardedFor = req.headers["x-forwarded-for"];
        const ip = typeof xForwardedFor === "string"
            ? xForwardedFor.split(",")[0].trim()
            : req.ip || "unknown";
        return ip;
    },
    handler: (_req, res) => {
        res.status(429).json({
            success: false,
            message: "Too many requests, please try again later.",
        });
    },
});

app.use(limiter);

// CORS configuration
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://ladx-7h6y.vercel.app",
    "https://ladx-admin-beta.vercel.app",
];

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                logger.warn(`Blocked origin: ${origin}`);
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true, // Allow credentials (cookies)
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    })
);

// Parse cookies
app.use(cookieParser());

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
    logger.info({
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        origin: req.headers.origin || "undefined",
        ip: req.ip,
        "x-forwarded-for": req.headers["x-forwarded-for"],
        "content-type": req.headers["content-type"],
        "authorization": req.headers.authorization ? "present" : "absent",
    });
    next();
});

// Input validation middleware
const validationMiddleware = (
    schema: Joi.ObjectSchema
): ((req: Request, res: Response, next: NextFunction) => void) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }
        next();
    };
};

// Body parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static files setup
const frontendBuildPath = path.join(__dirname, "build");
if (fs.existsSync(frontendBuildPath)) {
    app.use(express.static(frontendBuildPath));
}

// Mount API routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/kyc", kycRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/notification", notificationRoutes);
app.use("/api/v1/travel-plans", travelPlanRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);

// Example route with validation middleware
app.post(
    "/api/v1/example",
    validationMiddleware(
        Joi.object({
            exampleField: Joi.string().required(),
        })
    ),
    async (req: Request, res: Response) => {
        await logActivity(req.user?.id || "anonymous", "Example API Call", "Example API executed successfully.");
        res.status(200).json({ success: true, data: req.body });
    }
);

// Health check endpoint
app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// API 404 handler
app.use("/api", (req: Request, res: Response) => {
    logger.warn(`404 Not Found: ${req.method} ${req.path}`);
    res.status(404).json({
        success: false,
        message: `Cannot ${req.method} ${req.path}`,
    });
});

// SPA fallback
app.get("*", (_req: Request, res: Response) => {
    const indexPath = path.join(frontendBuildPath, "index.html");
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).json({
            success: false,
            message: "Not Found",
        });
    }
});

// Error handling
interface ErrorResponse {
    success: boolean;
    message: string;
    error?: string;
}

interface CustomError extends Error {
    status?: number;
}

app.use((err: CustomError, req: Request, res: Response<ErrorResponse>, _next: NextFunction) => {
    Sentry.captureException(err); // Log error to Sentry
    logger.error("Error:", {
        message: err.message,
        stack: err.stack,
        status: err.status,
    });

    const statusCode = err.status || 500;
    res.status(statusCode).json({
        success: false,
        message: "Something went wrong!",
        error: process.env.NODE_ENV === "development" ? err.message : "Internal server error",
    });
});

// WebSocket handling
server.on("upgrade", (req, socket, head) => {
    console.log(`WebSocket upgrade requested from ${req.headers.origin || "unknown origin"}`);
    handleWebSocketUpgrade(req, socket, head);
});

// Graceful shutdown
process.on("SIGINT", async () => {
    console.log("SIGINT received: Closing server...");
    server.close(() => {
        console.log("Server closed.");
    });
    process.exit(0);
});

// Start server
server.listen(PORT, () => {
    logger.info(`
===========================================
🚀 Server running on port ${PORT}
⚡️ Environment: ${process.env.NODE_ENV || "development"}
🔐 Trust proxy: enabled
🌐 CORS origins: ${allowedOrigins.join(", ")}
===========================================
   `);
});

export default app;
