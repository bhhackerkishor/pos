import mongoose from "mongoose";
import dotenv from 'dotenv';
import Product from "./models/Product.js";

dotenv.config();

const CAT_STAPLES = new mongoose.Types.ObjectId();
const CAT_SNACKS = new mongoose.Types.ObjectId();
const CAT_DAIRY = new mongoose.Types.ObjectId();
const CAT_BEVERAGES = new mongoose.Types.ObjectId();
const CAT_OILS = new mongoose.Types.ObjectId();
const CAT_HOUSEHOLD = new mongoose.Types.ObjectId();
const CAT_PERSONAL = new mongoose.Types.ObjectId();

const products = [
    // ===== STAPLES (20) =====
    ...["Rice 1kg", "Rice 5kg", "Atta 1kg", "Atta 5kg", "Maida 1kg", "Rava 1kg",
        "Toor Dal 1kg", "Moong Dal 1kg", "Chana Dal 1kg", "Urad Dal 1kg",
        "Rajma 1kg", "Chickpeas 1kg", "Poha 1kg", "Sabudana 1kg",
        "Sugar 1kg", "Salt 1kg", "Jaggery 1kg", "Besan 1kg",
        "Corn Flour 1kg", "Soya Chunks 1kg"
    ].map((name, i) => ({
        name,
        sku: `STP${i + 1}`,
        barcode: `8901000000${i + 1}`,
        category: CAT_STAPLES,
        price: 50 + i * 5,
        wholesalePrice: 45 + i * 5,
        wholesaleThreshold: 10,
        costPrice: 40 + i * 4,
        taxRate: 5,
        stockQuantity: 200,
        unit: "kg",
        lowStockThreshold: 20,
        isActive: true
    })),

    // ===== SNACKS (20) =====
    ...["Maggi", "Yippee", "Lays", "Kurkure", "Bingo",
        "Good Day", "Marie Gold", "Bourbon", "Oreo", "Hide & Seek",
        "Little Hearts", "Monaco", "CrackJack", "Treat",
        "Moms Magic", "50-50", "Tiger", "Dark Fantasy",
        "Cake Roll", "Rusk"
    ].map((name, i) => ({
        name: `${name} Snack`,
        sku: `SNK${i + 1}`,
        barcode: `8902000000${i + 1}`,
        category: CAT_SNACKS,
        price: 10 + i * 2,
        wholesalePrice: 8 + i * 2,
        wholesaleThreshold: 24,
        costPrice: 7 + i,
        taxRate: 12,
        stockQuantity: 300,
        unit: "pcs",
        lowStockThreshold: 30,
        isActive: true
    })),

    // ===== DAIRY (15) =====
    ...["Milk 500ml", "Milk 1L", "Curd 500g", "Curd 1kg",
        "Butter 100g", "Butter 200g", "Paneer 200g",
        "Paneer 500g", "Cheese Slice", "Cheese Block",
        "Ghee 500ml", "Ghee 1L", "Flavored Milk",
        "Buttermilk", "Lassi"
    ].map((name, i) => ({
        name,
        sku: `DRY${i + 1}`,
        barcode: `8903000000${i + 1}`,
        category: CAT_DAIRY,
        price: 30 + i * 10,
        wholesalePrice: 28 + i * 9,
        wholesaleThreshold: 10,
        costPrice: 25 + i * 8,
        taxRate: 0,
        stockQuantity: 100,
        unit: "pack",
        lowStockThreshold: 10,
        isActive: true
    })),

    // ===== BEVERAGES (15) =====
    ...["Tea 100g", "Tea 250g", "Coffee 100g", "Coffee 200g",
        "Boost", "Horlicks", "Bournvita", "Complan",
        "Soft Drink 500ml", "Soft Drink 1L",
        "Fruit Juice", "Energy Drink",
        "Mineral Water 1L", "Soda", "Cold Coffee"
    ].map((name, i) => ({
        name,
        sku: `BEV${i + 1}`,
        barcode: `8904000000${i + 1}`,
        category: CAT_BEVERAGES,
        price: 40 + i * 10,
        wholesalePrice: 38 + i * 9,
        wholesaleThreshold: 12,
        costPrice: 35 + i * 8,
        taxRate: 12,
        stockQuantity: 180,
        unit: "bottle",
        lowStockThreshold: 20,
        isActive: true
    })),

    // ===== OILS (10) =====
    ...["Sunflower Oil 1L", "Sunflower Oil 5L",
        "Groundnut Oil 1L", "Groundnut Oil 5L",
        "Coconut Oil 1L", "Mustard Oil 1L",
        "Rice Bran Oil", "Olive Oil",
        "Palm Oil", "Refined Oil"
    ].map((name, i) => ({
        name,
        sku: `OIL${i + 1}`,
        barcode: `8905000000${i + 1}`,
        category: CAT_OILS,
        price: 130 + i * 20,
        wholesalePrice: 125 + i * 18,
        wholesaleThreshold: 5,
        costPrice: 120 + i * 15,
        taxRate: 5,
        stockQuantity: 80,
        unit: "ltr",
        lowStockThreshold: 10,
        isActive: true
    })),

    // ===== HOUSEHOLD + PERSONAL (20) =====
    ...["Bath Soap", "Shampoo", "Conditioner", "Toothpaste",
        "Toothbrush", "Detergent Powder", "Detergent Liquid",
        "Dish Wash", "Floor Cleaner", "Phenyl",
        "Hand Wash", "Hand Sanitizer", "Tissue Paper",
        "Napkins", "Mosquito Coil", "Room Freshener",
        "Garbage Bags", "Scrubber", "Liquid Soap", "Face Wash"
    ].map((name, i) => ({
        name,
        sku: `HOM${i + 1}`,
        barcode: `8906000000${i + 1}`,
        category: CAT_HOUSEHOLD,
        price: 25 + i * 10,
        wholesalePrice: 23 + i * 9,
        wholesaleThreshold: 12,
        costPrice: 20 + i * 8,
        taxRate: 18,
        stockQuantity: 150,
        unit: "pcs",
        lowStockThreshold: 20,
        isActive: true
    }))
];

const seed = async () => {
    await mongoose.connect('mongodb+srv://kishor47gaming:Kishor47gaming@cluster1.zn0ef.mongodb.net/pos_system?retryWrites=true&w=majority&appName=Cluster1');
    await Product.deleteMany();
    await Product.insertMany(products);
    console.log(`✅ Seeded ${products.length} grocery products`);
    process.exit();
};

seed();
