import Product from '../models/Product.js';
export const getProducts = async (req, res) => {
    try {
        const products = await Product.find().populate('category');
        res.json({ success: true, count: products.length, data: products });
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
        const product = await Product.create(req.body);
        res.status(201).json({ success: true, data: product });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
export const updateProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!product)
            return res.status(404).json({ success: false, message: 'Product not found' });
        res.json({ success: true, data: product });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
