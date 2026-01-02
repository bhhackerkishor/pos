import mongoose, { Schema } from 'mongoose';
const SupplierSchema = new Schema({
    name: { type: String, required: true },
    contactPerson: { type: String },
    phone: { type: String, required: true },
    email: { type: String },
    address: { type: String },
    gstin: { type: String },
}, { timestamps: true });
export default mongoose.model('Supplier', SupplierSchema);
