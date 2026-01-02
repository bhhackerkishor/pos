import DailyReport from '../models/DailyReport.js';
import Product from '../models/Product.js';
import Sale from '../models/Sale.js';
import Customer from '../models/Customer.js';
export const getDashboardStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let query = {};
        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        else {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            query.date = today;
        }
        const reports = await DailyReport.find(query);
        const stats = reports.reduce((acc, report) => ({
            totalSales: acc.totalSales + report.totalSales,
            totalProfit: acc.totalProfit + report.totalProfit,
            orderCount: acc.orderCount + report.orderCount,
            taxCollected: acc.taxCollected + report.totalTax
        }), {
            totalSales: 0,
            totalProfit: 0,
            orderCount: 0,
            taxCollected: 0
        });
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
        const { days = '7' } = req.query;
        const limit = parseInt(days);
        const reports = await DailyReport.find().sort('-date').limit(limit);
        res.json({ success: true, data: reports.reverse() });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
export const getDetailedAnalytics = async (req, res) => {
    try {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        // 1. Performance Overview
        const performance = await DailyReport.aggregate([
            { $match: { date: { $gte: startOfMonth } } },
            {
                $group: {
                    _id: null,
                    avgOrderValue: { $avg: { $divide: ['$totalSales', '$orderCount'] } },
                    totalRevenue: { $sum: '$totalSales' },
                    totalProfit: { $sum: '$totalProfit' },
                    maxDailySale: { $max: '$totalSales' }
                }
            }
        ]);
        // 2. Category Distribution
        const categoryStats = await Product.aggregate([
            { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'catInfo' } },
            { $unwind: '$catInfo' },
            {
                $group: {
                    _id: '$catInfo.name',
                    stockValue: { $sum: { $multiply: ['$costPrice', '$stockQuantity'] } },
                    productCount: { $sum: 1 }
                }
            }
        ]);
        // 3. Top Selling Products
        const topProducts = await Sale.aggregate([
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.name',
                    totalSold: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: '$items.subTotal' }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 10 }
        ]);
        // 4. Payment Method Distribution
        const paymentStats = await Sale.aggregate([
            {
                $group: {
                    _id: '$paymentMethod',
                    count: { $sum: 1 },
                    total: { $sum: '$grandTotal' }
                }
            }
        ]);
        // 5. Debtors (Outstanding Balance)
        const topDebtors = await Customer.find({ outstandingBalance: { $gt: 0 } })
            .sort('-outstandingBalance')
            .limit(10)
            .select('name phone outstandingBalance');
        // 6. Hourly Peaks (last 30 days)
        const hourAgo = new Date();
        hourAgo.setDate(hourAgo.getDate() - 30);
        const hourlyStats = await Sale.aggregate([
            { $match: { createdAt: { $gte: hourAgo } } },
            {
                $group: {
                    _id: { $hour: '$createdAt' },
                    count: { $sum: 1 },
                    total: { $sum: '$grandTotal' }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        // 7. Customer Retention
        const totalCustomers = await Customer.countDocuments();
        const repeatCustomers = await Sale.aggregate([
            { $match: { customer: { $exists: true, $ne: null } } },
            { $group: { _id: '$customer', count: { $sum: 1 } } },
            { $match: { count: { $gt: 1 } } },
            { $count: 'count' }
        ]);
        // 8. Growth (vs last month)
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        const lastMonthRevenue = await DailyReport.aggregate([
            { $match: { date: { $gte: lastMonth, $lte: lastMonthEnd } } },
            { $group: { _id: null, total: { $sum: '$totalSales' } } }
        ]);
        // 9. Week-over-Week Comparison
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        const fourteenDaysAgo = new Date(today);
        fourteenDaysAgo.setDate(today.getDate() - 14);
        const thisWeekRevenue = await DailyReport.aggregate([
            { $match: { date: { $gte: sevenDaysAgo } } },
            { $group: { _id: null, total: { $sum: '$totalSales' } } }
        ]);
        const lastWeekRevenue = await DailyReport.aggregate([
            { $match: { date: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } } },
            { $group: { _id: null, total: { $sum: '$totalSales' } } }
        ]);
        const wowGrowth = lastWeekRevenue[0]?.total > 0
            ? ((thisWeekRevenue[0]?.total - lastWeekRevenue[0]?.total) / lastWeekRevenue[0]?.total) * 100
            : 0;
        const currentRev = performance[0]?.totalRevenue || 0;
        const previousRev = lastMonthRevenue[0]?.total || 0;
        const growth = previousRev > 0 ? ((currentRev - previousRev) / previousRev) * 100 : 0;
        // 10. Inventory Health & Turnover
        const inventoryStats = await Product.aggregate([
            {
                $group: {
                    _id: null,
                    totalStockValue: { $sum: { $multiply: ['$costPrice', '$stockQuantity'] } },
                    totalRetailValue: { $sum: { $multiply: ['$price', '$stockQuantity'] } },
                    potentialProfit: { $sum: { $multiply: [{ $subtract: ['$price', '$costPrice'] }, '$stockQuantity'] } },
                    lowStockItems: { $sum: { $cond: [{ $lte: ['$stockQuantity', '$lowStockThreshold'] }, 1, 0] } }
                }
            }
        ]);
        // 11. Category Performance (Profit focus)
        const categoryPerformance = await Sale.aggregate([
            { $unwind: '$items' },
            { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'pInfo' } },
            { $unwind: '$pInfo' },
            { $lookup: { from: 'categories', localField: 'pInfo.category', foreignField: '_id', as: 'cInfo' } },
            { $unwind: '$cInfo' },
            {
                $group: {
                    _id: '$cInfo.name',
                    revenue: { $sum: '$items.subTotal' },
                    profit: { $sum: { $subtract: ['$items.subTotal', { $multiply: ['$items.costPrice', '$items.quantity'] }] } },
                    unitsSold: { $sum: '$items.quantity' }
                }
            },
            { $sort: { profit: -1 } }
        ]);
        // 12. Dead Stock Detection (Not sold in 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        const deadStock = await Product.find({
            $or: [
                { lastSoldAt: { $lt: thirtyDaysAgo } },
                { lastSoldAt: { $exists: false } }
            ],
            stockQuantity: { $gt: 0 }
        }).limit(20).select('name stockQuantity lastSoldAt');
        // 13. Staff Performance (Operational Efficiency)
        const staffStats = await Sale.aggregate([
            {
                $group: {
                    _id: '$cashier',
                    totalRevenue: { $sum: '$grandTotal' },
                    orderCount: { $sum: 1 },
                    avgOrderValue: { $avg: '$grandTotal' }
                }
            },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'cashierInfo' } },
            { $unwind: '$cashierInfo' },
            {
                $project: {
                    name: '$cashierInfo.name',
                    totalRevenue: 1,
                    orderCount: 1,
                    avgOrderValue: { $round: ['$avgOrderValue', 2] }
                }
            },
            { $sort: { totalRevenue: -1 } }
        ]);
        // 14. Expiry Audit (Critical for Grocery)
        const expiresSoon = await Product.find({
            expiryDate: { $lte: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000), $gt: today }
        }).select('name stockQuantity expiryDate').limit(10);
        const expired = await Product.countDocuments({
            expiryDate: { $lt: today }
        });
        // 15. Brand Comparison
        const brandStats = await Product.aggregate([
            { $match: { brand: { $exists: true, $ne: null } } },
            {
                $group: {
                    _id: '$brand',
                    productCount: { $sum: 1 },
                    totalStockValue: { $sum: { $multiply: ['$costPrice', '$stockQuantity'] } }
                }
            },
            { $sort: { totalStockValue: -1 } },
            { $limit: 10 }
        ]);
        // 16. Operational Metrics: Average Ticket Size (ATS)
        const ats = performance[0]?.totalRevenue / performance[0]?.orderCount || 0;
        const analyticsData = {
            performance: {
                ...(performance[0] || {}),
                growth,
                wowGrowth,
                thisWeekRevenue: thisWeekRevenue[0]?.total || 0,
                lastWeekRevenue: lastWeekRevenue[0]?.total || 0,
                avgTicketSize: Math.round(ats * 100) / 100
            },
            inventory: {
                ...(inventoryStats[0] || {}),
                deadStockCount: deadStock.length,
                deadStockList: deadStock,
                expiresSoon,
                expiredCount: expired
            },
            staffPerformance: staffStats,
            brandStats,
            categoryPerformance,
            categoryStats,
            topProducts,
            paymentStats,
            topDebtors,
            hourlyStats,
            retention: {
                total: totalCustomers,
                repeat: repeatCustomers[0]?.count || 0,
                rate: totalCustomers > 0 ? ((repeatCustomers[0]?.count || 0) / totalCustomers) * 100 : 0
            }
        };
        res.json({
            success: true,
            data: analyticsData
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
