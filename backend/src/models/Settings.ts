import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
    shopName: string;
    address: string;
    phone: string;
    email?: string;
    gstin?: string;
    currency: string;
    currencySymbol: string;
    thermalPrinterWidth: '58mm' | '80mm';
    invoicePrefix: string;
    lowStockAlert: boolean;
    paginationLimit: number;
    receiptShowName: boolean;
    receiptShowQty: boolean;
    receiptShowPrice: boolean;
    receiptShowTax: boolean;
}

const SettingsSchema: Schema = new Schema({
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
    paginationLimit: { type: Number, default: 10 },
    receiptShowName: { type: Boolean, default: true },
    receiptShowQty: { type: Boolean, default: true },
    receiptShowPrice: { type: Boolean, default: true },
    receiptShowTax: { type: Boolean, default: true },
});

export default mongoose.model<ISettings>('Settings', SettingsSchema);
