import { Request, Response } from 'express';
import Supplier from '../models/Supplier.js';

export const getSuppliers = async (req: Request, res: Response) => {
    try {
        const suppliers = await Supplier.find().sort('name');
        res.json({ success: true, count: suppliers.length, suppliers });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const createSupplier = async (req: Request, res: Response) => {
    try {
        const supplier = await Supplier.create(req.body);
        res.status(201).json({ success: true, data: supplier });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const getSupplierById = async (req: Request, res: Response) => {
    try {
        const supplier = await Supplier.findById(req.params.id);
        if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
        res.json({ success: true, data: supplier });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const updateSupplier = async (req: Request, res: Response) => {
    try {
        const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
        res.json({ success: true, data: supplier });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};
