import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Sale from '../models/Sale.js';
import InventoryLog, { InventoryLogType } from '../models/InventoryLog.js';
import DailyReport from '../models/DailyReport.js';
import Customer from '../models/Customer.js';
export class SaleService {
    static async processSale(saleData, userId) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const { items, customerId, paymentMethod, amountPaid, subTotal, taxTotal, discountTotal, grandTotal } = saleData;
            // 1. Generate Invoice Number
            const count = await Sale.countDocuments({}).session(session);
            const invoiceNumber = `INV-${new Date().getFullYear()}${String(count + 1).padStart(5, '0')}`;
            // 2. Prepare items and update stock
            const processedItems = [];
            for (const item of items) {
                const product = await Product.findById(item._id).session(session);
                if (!product)
                    throw new Error(`Product ${item.name} not found`);
                if (product.stockQuantity < item.quantity)
                    throw new Error(`Insufficient stock for ${product.name}`);
                const previousStock = product.stockQuantity;
                product.stockQuantity -= item.quantity;
                product.lastSoldAt = new Date();
                await product.save({ session });
                // Create Inventory Log
                await InventoryLog.create([{
                        product: product._id,
                        type: InventoryLogType.SALE,
                        quantity: -item.quantity,
                        previousStock,
                        newStock: product.stockQuantity,
                        user: userId,
                        timestamp: new Date()
                    }], { session });
                processedItems.push({
                    product: product._id,
                    name: product.name,
                    quantity: item.quantity,
                    price: product.price,
                    costPrice: product.costPrice,
                    taxRate: product.taxRate,
                    taxAmount: (product.price * item.quantity * product.taxRate) / 100,
                    discount: item.discount || 0,
                    subTotal: (product.price * item.quantity) - (item.discount || 0)
                });
            }
            // 3. Indian GST Breakdown
            const cgst = taxTotal / 2;
            const sgst = taxTotal / 2;
            // 4. Create Sale Record
            const sale = new Sale({
                invoiceNumber,
                cashier: userId,
                customer: customerId || null,
                items: processedItems,
                totalQuantity: items.reduce((acc, i) => acc + i.quantity, 0),
                subTotal,
                taxTotal,
                cgst,
                sgst,
                igst: 0,
                discountTotal,
                grandTotal,
                paymentMethod,
                amountPaid,
                changeAmount: amountPaid - grandTotal,
                status: 'completed',
                paymentStatus: 'paid'
            });
            await sale.save({ session });
            // 5. Update Customer (if exists)
            if (customerId) {
                await Customer.findByIdAndUpdate(customerId, {
                    $inc: { loyaltyPoints: Math.floor(grandTotal / 100) }
                }).session(session);
            }
            // 6. Update Daily Report
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const profit = processedItems.reduce((acc, i) => acc + (i.subTotal - (i.costPrice * i.quantity)), 0);
            await DailyReport.findOneAndUpdate({ date: today }, {
                $inc: {
                    totalSales: grandTotal,
                    totalProfit: profit,
                    totalTax: taxTotal,
                    totalDiscount: discountTotal,
                    orderCount: 1,
                    [`paymentBreakdown.${paymentMethod}`]: grandTotal
                }
            }, { upsert: true, session });
            await session.commitTransaction();
            return sale;
        }
        catch (error) {
            await session.abortTransaction();
            throw error;
        }
        finally {
            session.endSession();
        }
    }
}
