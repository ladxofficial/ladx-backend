import WebSocket from "ws";
import jwt from "jsonwebtoken";

interface AuthenticatedClient {
    ws: WebSocket;
    userId: string;
}

const wss = new WebSocket.Server({ noServer: true });
const clients = new Map<string, WebSocket>(); // Map userId to WebSocket connections

// WebSocket Connection Event
wss.on("connection", (ws: WebSocket, userId: string) => {
    console.log(`WebSocket connection established for userId: ${userId}`);

    // Add user to clients map
    clients.set(userId, ws);

    // Handle WebSocket disconnection
    ws.on("close", () => {
        console.log(`WebSocket connection closed for userId: ${userId}`);
        clients.delete(userId);
    });

    // Handle WebSocket errors
    ws.on("error", (error) => {
        console.error(`WebSocket error for userId: ${userId}`, error);
        clients.delete(userId);
    });
});

// Function to Send Notifications via WebSocket
export const sendNotification = (userId: string, notification: object): void => {
    const client = clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(notification));
        console.log(`Notification sent via WebSocket to userId: ${userId}`);
    } else {
        console.warn(`No active WebSocket connection found for userId: ${userId}`);
    }
};

// WebSocket Upgrade Handler
export const handleWebSocketUpgrade = (req: any, socket: any, head: any) => {
    const token = req.url?.split("token=")?.[1];
    console.log(`WebSocket upgrade requested. Token: ${token}`);

    if (!token) {
        console.warn("WebSocket connection denied: Missing token");
        socket.destroy();
        return;
    }

    try {
        // Verify the JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
        const userId = decoded.id;

        console.log(`WebSocket token decoded. UserId: ${userId}`);

        // Upgrade the connection
        wss.handleUpgrade(req, socket, head, (ws) => {
            wss.emit("connection", ws, userId);
        });
    } catch (error) {
        console.error("WebSocket connection denied: Invalid token", error);
        socket.destroy();
    }
};


export default wss;
