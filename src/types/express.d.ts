import { Request } from "express";

declare module "express-serve-static-core" {
    interface Request {
        user?: { id: string; email?: string; role: string }; // Optional email
        admin?: { id: string; username: string }; // Admin with username
    }
}
