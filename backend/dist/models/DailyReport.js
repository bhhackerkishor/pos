import mongoose, { Schema } from 'mongoose';
const DailyReportSchema = new Schema({
    date: { type: Date, required: true, unique: true },
    totalSales: { type: Number, default: 0 },
    totalProfit: { type: Number, default: 0 },
    totalTax: { type: Number, default: 0 },
    totalDiscount: { type: Number, default: 0 },
    orderCount: { type: Number, default: 0 },
    paymentBreakdown: {
        cash: { type: Number, default: 0 },
        card: { type: Number, default: 0 },
        upi: { type: Number, default: 0 },
        credit: { type: Number, default: 0 },
    },
    categoryRevenue: { type: Map, of: Number },
});
export default mongoose.model('DailyReport', DailyReportSchema);
