// types.ts
export interface User {
    id: string;
    email: string;
    password: string;
    role: 'Sender' | 'Traveler' | 'Admin';
}

export interface Order {
    id: string;
    senderId: string;
    itemDetails: string;
    pickupLocation: string;
    dropoffLocation: string;
    status: 'Pending' | 'Paid' | 'Completed';
}
