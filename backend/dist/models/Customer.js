import mongoose, { Schema } from 'mongoose';
const CustomerSchema = new Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String },
    address: { type: String },
    gstin: { type: String },
    loyaltyPoints: { type: Number, default: 0 },
    creditLimit: { type: Number, default: 0 },
    outstandingBalance: { type: Number, default: 0 },
}, { timestamps: true });
export default mongoose.model('Customer', CustomerSchema);
meditation: true;
