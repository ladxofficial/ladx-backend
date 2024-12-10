import { Document } from "mongoose";

interface CloudinaryImage {
    url: string;
    publicId: string;
}

export interface IOrder extends Document {
    userId: string;
    packageName: string;
    packageDetails: string;
    itemDescription: string;
    packageValue: number;
    quantityInKg: number;
    price: number;
    addressSendingFrom: string;
    addressDeliveringTo: string;
    receiverName: string;
    receiverPhone: string;
    images: CloudinaryImage[];
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface OrderUpdateInput {
    packageName?: string;
    packageDetails?: string;
    itemDescription?: string;
    packageValue?: number;
    quantityInKg?: number;
    price?: number;
    addressSendingFrom?: string;
    addressDeliveringTo?: string;
    receiverName?: string;
    receiverPhone?: string;
    status?: string;
}