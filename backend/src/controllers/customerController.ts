import { Request, Response } from 'express';
import Customer from '../models/Customer.js';

export const getCustomers = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const total = await Customer.countDocuments();
        const customers = await Customer.find()
            .sort({ name: 1 })
            .skip(skip)
            .limit(limit);

        res.json({
            success: true,
            count: customers.length,
            total,
            pages: Math.ceil(total / limit),
            data: customers
        });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const createCustomer = async (req: Request, res: Response) => {
    try {
        const customer = await Customer.create(req.body);
        res.status(201).json({ success: true, data: customer });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const updateCustomer = async (req: Request, res: Response) => {
    try {
        const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
        res.json({ success: true, data: customer });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const deleteCustomer = async (req: Request, res: Response) => {
    try {
        const customer = await Customer.findByIdAndDelete(req.params.id);
        if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
        res.json({ success: true, data: {} });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const getCustomerById = async (req: Request, res: Response) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
        res.json({ success: true, data: customer });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};
