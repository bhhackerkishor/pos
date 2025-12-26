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
        const sales = await Sale.find().populate('customer').populate('cashier', 'name').sort('-createdAt');
        res.json({ success: true, count: sales.length, data: sales });
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
