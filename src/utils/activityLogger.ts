import ActivityLog from "../models/ActivityLog";

export const logActivity = async (
    userId: string,
    action: string,
    entity: string,
    entityId?: string,
    details: Record<string, any> = {}
): Promise<void> => {
    try {
        await ActivityLog.create({
            userId,
            action,
            entity,
            entityId,
            details,
        });
    } catch (error) {
        console.error("Error logging activity:", error);
    }
};
