import jwt from "jsonwebtoken";

const generateToken = (userId: string): string => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET is not defined in environment variables");
    }

    // Sign the token with the user ID and set an expiration
    return jwt.sign({ id: userId }, secret, { expiresIn: "30d" });
};

export default generateToken;
