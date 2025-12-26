import mongoose, { Schema } from 'mongoose';
const SaleSchema = new Schema({
    invoiceNumber: { type: String, required: true, unique: true },
    cashier: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer' },
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
}, { timestamps: true });
export default mongoose.model('Sale', SaleSchema);
meditation: true;
