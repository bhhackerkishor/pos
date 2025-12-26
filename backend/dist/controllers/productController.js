import Product from '../models/Product.js';
import cloudinary from '../utils/cloudinary.js';
import fs from 'fs';
export const getProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const query = {};
        if (req.query.search) {
            query.$or = [
                { name: { $regex: req.query.search, $options: 'i' } },
                { barcode: { $regex: req.query.search, $options: 'i' } }
            ];
        }
        if (req.query.category) {
            query.category = req.query.category;
        }
        const total = await Product.countDocuments(query);
        const products = await Product.find(query)
            .populate('category')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        res.json({
            success: true,
            count: products.length,
            total,
            pages: Math.ceil(total / limit),
            data: products
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
export const getProductByBarcode = async (req, res) => {
    try {
        const product = await Product.findOne({ barcode: req.params.barcode }).populate('category');
        if (!product)
            return res.status(404).json({ success: false, message: 'Product not found' });
        res.json({ success: true, data: product });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
export const createProduct = async (req, res) => {
    try {
        let productData = { ...req.body };
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'products',
                resource_type: 'image',
            });
            productData.image = result.secure_url;
            fs.unlinkSync(req.file.path);
        }
        const product = await Product.create(productData);
        res.status(201).json({ success: true, data: product });
    }
    catch (err) {
        if (req.file)
            fs.unlinkSync(req.file.path);
        res.status(500).json({ success: false, message: err.message });
    }
};
export const updateProduct = async (req, res) => {
    try {
        let updateData = { ...req.body };
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'products',
                resource_type: 'image',
            });
            updateData.image = result.secure_url;
            fs.unlinkSync(req.file.path);
        }
        const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
        if (!product)
            return res.status(404).json({ success: false, message: 'Product not found' });
        res.json({ success: true, data: product });
    }
    catch (err) {
        if (req.file)
            fs.unlinkSync(req.file.path);
        res.status(500).json({ success: false, message: err.message });
    }
};
export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product)
            return res.status(404).json({ success: false, message: 'Product not found' });
        res.json({ success: true, data: {} });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
