import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Category from './models/Category.js';
import Product from './models/Product.js';

dotenv.config();

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log('Clearing database...');
        await User.deleteMany({});
        await Category.deleteMany({});
        await Product.deleteMany({});

        console.log('Seeding Admin...');
        await User.create({
            name: 'System Admin',
            email: 'admin@example.com',
            password: 'adminpassword123',
            role: 'admin'
        });

        console.log('Seeding Categories...');
        const categories = await Category.insertMany([
            { name: 'Beverages', description: 'Drinks and juices' },
            { name: 'Snacks', description: 'Chips and crackers' },
            { name: 'Dairy', description: 'Milk and cheese' },
            { name: 'Electronics', description: 'Gadgets and accessories' }
        ]);

        console.log('Seeding Products (with Wholesale Pricing)...');
        await Product.insertMany([
            {
                name: 'Coca Cola 500ml',
                sku: 'COKE500',
                barcode: '8901764012345',
                category: categories[0]._id,
                price: 40,
                wholesalePrice: 35,
                wholesaleThreshold: 12, // Dozen
                costPrice: 30,
                taxRate: 18,
                stockQuantity: 100,
                unit: 'pcs',
                lowStockThreshold: 10
            },
            {
                name: 'Amul Butter 500g',
                sku: 'AMULB500',
                barcode: '8901262010214',
                category: categories[2]._id,
                price: 260,
                wholesalePrice: 245,
                wholesaleThreshold: 10,
                costPrice: 230,
                taxRate: 12,
                stockQuantity: 50,
                unit: 'pcs',
                lowStockThreshold: 5
            },
            {
                name: 'Maggi Noodles 70g',
                sku: 'MAGGI70',
                barcode: '8901058000101',
                category: categories[1]._id,
                price: 14,
                wholesalePrice: 12,
                wholesaleThreshold: 24, // Full case
                costPrice: 10,
                taxRate: 5,
                stockQuantity: 500,
                unit: 'pcs',
                lowStockThreshold: 50
            },
            {
                name: 'Lays Magic Masala',
                sku: 'LAYSMM',
                barcode: '8901491102340',
                category: categories[1]._id,
                price: 20,
                wholesalePrice: 18,
                wholesaleThreshold: 20,
                costPrice: 15,
                taxRate: 12,
                stockQuantity: 200,
                unit: 'pcs',
                lowStockThreshold: 20
            }
        ]);

        console.log('Seed Complete!');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seed();
