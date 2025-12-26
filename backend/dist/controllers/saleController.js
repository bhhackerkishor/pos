import { SaleService } from '../services/SaleService.js';
import Sale from '../models/Sale.js';
export const createSale = async (req, res) => {
    try {
        const sale = await SaleService.processSale(req.body, req.user.id);
        res.status(201).json({ success: true, data: sale });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
export const getSales = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const query = {};
        // Date Filtering
        if (req.query.filter) {
            const now = new Date();
            let start = new Date();
            let end = new Date();
            switch (req.query.filter) {
                case 'today':
                    start.setHours(0, 0, 0, 0);
                    end.setHours(23, 59, 59, 999);
                    break;
                case 'week':
                    start.setDate(now.getDate() - 7);
                    break;
                case 'month':
                    start.setMonth(now.getMonth() - 1);
                    break;
                case 'year':
                    start.setFullYear(now.getFullYear() - 1);
                    break;
                case 'custom':
                    if (req.query.startDate && req.query.endDate) {
                        start = new Date(req.query.startDate);
                        end = new Date(req.query.endDate);
                        end.setHours(23, 59, 59, 999);
                    }
                    break;
            }
            if (req.query.filter !== 'all') {
                query.createdAt = { $gte: start, $lte: end };
            }
        }
        const total = await Sale.countDocuments(query);
        const sales = await Sale.find(query)
            .populate('customer')
            .populate('cashier', 'name')
            .sort('-createdAt')
            .skip(skip)
            .limit(limit);
        res.json({
            success: true,
            count: sales.length,
            total,
            pages: Math.ceil(total / limit),
            data: sales
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
export const getSaleById = async (req, res) => {
    try {
        const sale = await Sale.findById(req.params.id).populate('customer').populate('cashier', 'name');
        if (!sale)
            return res.status(404).json({ success: false, message: 'Sale not found' });
        res.json({ success: true, data: sale });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
