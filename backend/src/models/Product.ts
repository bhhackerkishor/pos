import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
    name: string;
    sku: string;
    barcode?: string;
    category: mongoose.Types.ObjectId;
    description?: string;
    price: number;
    wholesalePrice?: number;
    wholesaleThreshold?: number;
    costPrice: number;
    taxRate: number; // Percentage
    stockQuantity: number;
    unit: string; // e.g., 'pcs', 'kg', 'ltr'
    lowStockThreshold: number;
    image?: string;
    isActive: boolean;
    lastSoldAt?: Date;
    expiryDate?: Date;
    brand?: string;
    supplier?: string;
}

const ProductSchema: Schema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        sku: { type: String, required: true, unique: true, uppercase: true },
        barcode: { type: String, unique: true, sparse: true },
        category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
        description: { type: String },
        image: { type: String },
        price: { type: Number, required: true, min: 0 },
        wholesalePrice: { type: Number, min: 0 },
        wholesaleThreshold: { type: Number, min: 0, default: 10 },
        costPrice: { type: Number, required: true, min: 0 },
        taxRate: { type: Number, default: 0 },
        stockQuantity: { type: Number, default: 0 },
        unit: { type: String, default: 'pcs' },
        lowStockThreshold: { type: Number, default: 10 },
        isActive: { type: Boolean, default: true },
        lastSoldAt: { type: Date },
        expiryDate: { type: Date },
        brand: { type: String, trim: true },
        supplier: { type: String, trim: true },
    },
    { timestamps: true }
);

// Indexes
ProductSchema.index({ name: 'text', sku: 'text', barcode: 'text' });

export default mongoose.model<IProduct>('Product', ProductSchema);
