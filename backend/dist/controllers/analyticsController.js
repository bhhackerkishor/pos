import DailyReport from '../models/DailyReport.js';
import Product from '../models/Product.js';
export const getDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const report = await DailyReport.findOne({ date: today });
        const stats = report ? {
            totalSales: report.totalSales,
            totalProfit: report.totalProfit,
            orderCount: report.orderCount,
            taxCollected: report.totalTax
        } : {
            totalSales: 0,
            totalProfit: 0,
            orderCount: 0,
            taxCollected: 0
        };
        const lowStockCount = await Product.countDocuments({
            $expr: { $lte: ['$stockQuantity', '$lowStockThreshold'] }
        });
        res.json({ success: true, data: { ...stats, lowStockCount } });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
export const getSalesChart = async (req, res) => {
    try {
        const reports = await DailyReport.find().sort('-date').limit(7);
        res.json({ success: true, data: reports.reverse() });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
