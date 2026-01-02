import { Request, Response } from 'express';
import Category from '../models/Category.js';

export const getCategories = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const total = await Category.countDocuments();
        const categories = await Category.find()
            .sort({ name: 1 })
            .skip(skip)
            .limit(limit);

        res.json({
            success: true,
            count: categories.length,
            total,
            pages: Math.ceil(total / limit),
            data: categories
        });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const createCategory = async (req: Request, res: Response) => {
    try {
        const category = await Category.create(req.body);
        res.status(201).json({ success: true, data: category });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const updateCategory = async (req: Request, res: Response) => {
    try {
        const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
        res.json({ success: true, data: category });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const deleteCategory = async (req: Request, res: Response) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
        res.json({ success: true, data: {} });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};
