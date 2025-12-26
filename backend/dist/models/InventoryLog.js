import mongoose, { Schema } from 'mongoose';
export var InventoryLogType;
(function (InventoryLogType) {
    InventoryLogType["SALE"] = "SALE";
    InventoryLogType["PURCHASE"] = "PURCHASE";
    InventoryLogType["RETURN"] = "RETURN";
    InventoryLogType["ADJUSTMENT"] = "ADJUSTMENT";
})(InventoryLogType || (InventoryLogType = {}));
const InventoryLogSchema = new Schema({
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
export default mongoose.model('InventoryLog', InventoryLogSchema);
