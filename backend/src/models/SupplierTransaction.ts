import mongoose, { Schema, Document } from 'mongoose';

export interface ISupplierTransaction extends Document {
    supplier: mongoose.Types.ObjectId;
    type: 'purchase' | 'payment';
    amount: number;
    description?: string;
    date: Date;
    invoiceNumber?: string; // If type is purchase, reference the purchase invoice
    paymentMethod?: 'cash' | 'card' | 'upi' | 'bank_transfer';
    offlineId?: string;
    synced: boolean;
}

const SupplierTransactionSchema: Schema = new Schema({
    supplier: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
    type: { type: String, enum: ['purchase', 'payment'], required: true },
    amount: { type: Number, required: true },
    description: { type: String },
    date: { type: Date, default: Date.now },
    invoiceNumber: { type: String },
    paymentMethod: { type: String, enum: ['cash', 'card', 'upi', 'bank_transfer'] },
    offlineId: { type: String },
    synced: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model<ISupplierTransaction>('SupplierTransaction', SupplierTransactionSchema);
