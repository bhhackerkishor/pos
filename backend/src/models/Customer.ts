import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
    name: string;
    phone: string;
    email?: string;
    address?: string;
    gstin?: string; // India Specific
    loyaltyPoints: number;
    creditLimit: number;
    outstandingBalance: number;
}

const CustomerSchema: Schema = new Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String },
    address: { type: String },
    gstin: { type: String },
    loyaltyPoints: { type: Number, default: 0 },
    creditLimit: { type: Number, default: 0 },
    outstandingBalance: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model<ICustomer>('Customer', CustomerSchema);
