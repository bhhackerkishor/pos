import mongoose, { Schema, Document } from 'mongoose';

export interface ISaleItem {
    product: mongoose.Types.ObjectId;
    name: string;
    quantity: number;
    price: number;        // Selling price per unit
    costPrice: number;    // Cost at time of sale for profit calculation
    taxRate: number;      // GST %
    taxAmount: number;
    discount: number;
    subTotal: number;     // (Qty * Price) - Discount
}

export interface ISale extends Document {
    invoiceNumber: string;
    cashier: mongoose.Types.ObjectId;
    customer?: mongoose.Types.ObjectId;
    customerDetails?: {
        name: string;
        phone: string;
    };
    items: ISaleItem[];
    totalQuantity: number;
    subTotal: number;      // Total before tax
    taxTotal: number;      // Total GST
    cgst: number;
    sgst: number;
    igst: number;
    discountTotal: number;
    grandTotal: number;
    paymentMethod: 'cash' | 'card' | 'upi' | 'credit' | 'split';
    status: 'completed' | 'hold' | 'returned';
    paymentStatus: 'paid' | 'pending';
    amountPaid: number;
    changeAmount: number;
    offlineId?: string;    // For PWA sync
    synced: boolean;
}

const SaleSchema: Schema = new Schema(
    {
        invoiceNumber: { type: String, required: true, unique: true },
        cashier: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        customer: { type: Schema.Types.ObjectId, ref: 'Customer' },
        customerDetails: {
            name: { type: String },
            phone: { type: String }
        },
        items: [{
            product: { type: Schema.Types.ObjectId, ref: 'Product' },
            name: String,
            quantity: Number,
            price: Number,
            costPrice: Number,
            taxRate: Number,
            taxAmount: Number,
            discount: Number,
            subTotal: Number,
        }],
        totalQuantity: { type: Number, required: true },
        subTotal: { type: Number, required: true },
        taxTotal: { type: Number, required: true },
        cgst: { type: Number, default: 0 },
        sgst: { type: Number, default: 0 },
        igst: { type: Number, default: 0 },
        discountTotal: { type: Number, default: 0 },
        grandTotal: { type: Number, required: true },
        paymentMethod: { type: String, enum: ['cash', 'card', 'upi', 'credit', 'split'], default: 'cash' },
        status: { type: String, enum: ['completed', 'hold', 'returned'], default: 'completed' },
        paymentStatus: { type: String, enum: ['paid', 'pending'], default: 'paid' },
        amountPaid: { type: Number, required: true },
        changeAmount: { type: Number, default: 0 },
        offlineId: { type: String },
        synced: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export default mongoose.model<ISale>('Sale', SaleSchema);
