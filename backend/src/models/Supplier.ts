import mongoose, { Schema, Document } from 'mongoose';

export interface ISupplier extends Document {
    name: string;
    contactPerson?: string;
    phone: string;
    email?: string;
    address?: string;
    gstin?: string;
}

const SupplierSchema: Schema = new Schema({
    name: { type: String, required: true },
    contactPerson: { type: String },
    phone: { type: String, required: true },
    email: { type: String },
    address: { type: String },
    gstin: { type: String },
}, { timestamps: true });

export default mongoose.model<ISupplier>('Supplier', SupplierSchema);
