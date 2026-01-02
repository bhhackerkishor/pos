import mongoose, { Schema, Document } from 'mongoose';

export enum InventoryLogType {
    SALE = 'SALE',
    PURCHASE = 'PURCHASE',
    RETURN = 'RETURN',
    ADJUSTMENT = 'ADJUSTMENT'
}

export interface IInventoryLog extends Document {
    product: mongoose.Types.ObjectId;
    type: InventoryLogType;
    quantity: number; // Positive for increase, Negative for decrease
    previousStock: number;
    newStock: number;
    referenceId?: mongoose.Types.ObjectId; // SaleId or PurchaseId
    user: mongoose.Types.ObjectId;
    note?: string;
    timestamp: Date;
}

const InventoryLogSchema: Schema = new Schema({
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    type: { type: String, enum: Object.values(InventoryLogType), required: true },
    quantity: { type: Number, required: true },
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    referenceId: { type: Schema.Types.ObjectId },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    note: { type: String },
    timestamp: { type: Date, default: Date.now },
});

export default mongoose.model<IInventoryLog>('InventoryLog', InventoryLogSchema);
