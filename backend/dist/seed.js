import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Category from './models/Category.js';
import Product from './models/Product.js';
import Supplier from './models/Supplier.js';
dotenv.config();
const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB for seeding (TypeScript)...');
        // 1. Clear existing (Optional - usually better to keep for this step)
        // await User.deleteMany({});
        // await Product.deleteMany({});
        // 2. Admin
        const adminExists = await User.findOne({ email: 'admin@example.com' });
        if (!adminExists) {
            await User.create({
                name: 'Shop Admin',
                email: 'admin@example.com',
                password: 'adminpassword123',
                role: 'admin',
            });
            console.log('Admin user created.');
        }
        // 3. Supplier
        let supplier = await Supplier.findOne({ name: 'A-One Electronics' });
        if (!supplier) {
            supplier = await Supplier.create({
                name: 'A-One Electronics',
                phone: '9876543210',
                email: 'contact@aone.com',
                gstin: '27AAACA1234A1Z1'
            });
            console.log('Supplier created.');
        }
        // 4. Categories
        const categories = ['Electronics', 'Grocery', 'Dairy'];
        const catDocs = [];
        for (const name of categories) {
            const cat = await Category.findOneAndUpdate({ name }, { name }, { upsert: true, new: true });
            catDocs.push(cat);
        }
        console.log('Categories seeded.');
        // 5. Products
        const products = [
            {
                name: 'MacBook Pro M3',
                sku: 'LAP-001',
                barcode: '100001',
                category: catDocs[0]._id,
                price: 150000,
                costPrice: 120000,
                taxRate: 18,
                stockQuantity: 5,
                unit: 'pcs'
            },
            {
                name: 'Organic Honey 500g',
                sku: 'GRO-002',
                barcode: '200001',
                category: catDocs[1]._id,
                price: 450,
                costPrice: 320,
                taxRate: 5,
                stockQuantity: 50,
                unit: 'box'
            }
        ];
        for (const p of products) {
            await Product.findOneAndUpdate({ sku: p.sku }, p, { upsert: true });
        }
        console.log('Products seeded.');
        process.exit();
    }
    catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
};
seed();
meditation: true;
