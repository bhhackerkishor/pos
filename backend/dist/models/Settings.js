import mongoose, { Schema } from 'mongoose';
const SettingsSchema = new Schema({
    shopName: { type: String, default: 'My Retail Shop' },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String },
    gstin: { type: String },
    currency: { type: String, default: 'INR' },
    currencySymbol: { type: String, default: '₹' },
    thermalPrinterWidth: { type: String, enum: ['58mm', '80mm'], default: '80mm' },
    invoicePrefix: { type: String, default: 'INV' },
    lowStockAlert: { type: Boolean, default: true },
});
export default mongoose.model('Settings', SettingsSchema);
