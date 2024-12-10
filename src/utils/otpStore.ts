// src/utils/otpStore.ts
const otpStore: { [key: string]: { otp: string; userData: any; expiresAt: Date } } = {};

export const saveOtp = (userId: string, otp: string, userData: any) => {
    otpStore[userId] = {
        otp,
        userData,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // OTP expires in 10 minutes
    };
};

export const getOtp = (userId: string) => {
    const entry = otpStore[userId];
    if (entry && entry.expiresAt > new Date()) {
        return entry.otp;
    }
    return null;
};

export const getUserData = (userId: string) => {
    const entry = otpStore[userId];
    return entry && entry.expiresAt > new Date() ? entry.userData : null;
};

export const removeOtp = (userId: string) => {
    delete otpStore[userId];
};
