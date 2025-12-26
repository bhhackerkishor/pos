import mongoose, { Schema } from 'mongoose';
const ProductSchema = new Schema({
    name: { type: String, required: true },
    sku: { type: String, required: true, unique: true },
    barcode: { type: String, unique: true, sparse: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    description: { type: String },
    unit: { type: String, enum: ['pcs', 'kg', 'g', 'ltr', 'ml', 'box'], default: 'pcs' },
    price: { type: Number, required: true },
    costPrice: { type: Number, required: true },
    taxRate: { type: Number, default: 0 },
    stockQuantity: { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 10 },
    isActive: { type: Boolean, default: true },
    imageUrl: { type: String },
    lastSoldAt: { type: Date },
}, { timestamps: true });
ProductSchema.index({ name: 'text', sku: 'text', barcode: 'text' });
export default mongoose.model('Product', ProductSchema);
