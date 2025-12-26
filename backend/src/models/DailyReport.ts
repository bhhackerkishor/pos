import mongoose, { Schema, Document } from 'mongoose';

export interface IDailyReport extends Document {
    date: Date; // Midnight of the day
    totalSales: number;
    totalProfit: number;
    totalTax: number;
    totalDiscount: number;
    orderCount: number;
    paymentBreakdown: {
        cash: number;
        card: number;
        upi: number;
        credit: number;
    };
    categoryRevenue: Map<string, number>;
}

const DailyReportSchema: Schema = new Schema({
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

export default mongoose.model<IDailyReport>('DailyReport', DailyReportSchema);
