import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Sale, { ISale } from '../models/Sale.js';
import InventoryLog, { InventoryLogType } from '../models/InventoryLog.js';
import DailyReport from '../models/DailyReport.js';
import Customer from '../models/Customer.js';

export class SaleService {
    static async processSale(saleData: any, userId: string): Promise<ISale> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const {
                items,
                customerId,
                customerName, // For walk-in customers
                customerPhone,
                paymentMethod,
                amountPaid,
                discountTotal,
                invoiceNumber: clientInvoiceNumber,
                offlineId
            } = saleData;

            // 1. Check for duplicate offlineId
            if (offlineId) {
                const existingSale = await Sale.findOne({ offlineId }).session(session);
                if (existingSale) {
                    await session.abortTransaction();
                    return existingSale;
                }
            }

            // 2. Generate or use client Invoice Number
            let invoiceNumber = clientInvoiceNumber;
            if (!invoiceNumber) {
                const count = await Sale.countDocuments({}).session(session);
                invoiceNumber = `INV-${new Date().getFullYear()}${String(count + 1).padStart(5, '0')}`;
            }

            // 2. Prepare items and update stock
            const processedItems = [];
            let calculatedSubTotal = 0;
            let calculatedTaxTotal = 0;

            for (const item of items) {
                const product = await Product.findById(item._id).session(session);
                if (!product) throw new Error(`Product ${item.name} not found`);
                //if (product.stockQuantity < item.quantity) throw new Error(`Insufficient stock for ${product.name}`);

                // Determine correct price (Wholesale vs Retail)
                let appliedPrice = product.price;
                if (product.wholesalePrice && product.wholesaleThreshold && item.quantity >= product.wholesaleThreshold) {
                    appliedPrice = product.wholesalePrice;
                }

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

                const itemTax = (appliedPrice * item.quantity * product.taxRate) / 100;
                const itemSubTotal = (appliedPrice * item.quantity);

                processedItems.push({
                    product: product._id,
                    name: product.name,
                    quantity: item.quantity,
                    price: appliedPrice,
                    costPrice: product.costPrice,
                    taxRate: product.taxRate,
                    taxAmount: itemTax,
                    discount: item.discount || 0,
                    subTotal: itemSubTotal - (item.discount || 0)
                });

                calculatedSubTotal += itemSubTotal;
                calculatedTaxTotal += itemTax;
            }

            // 3. Indian GST Breakdown
            const cgst = calculatedTaxTotal / 2;
            const sgst = calculatedTaxTotal / 2;

            // 4. Create Sale Record
            const grandTotal = calculatedSubTotal + calculatedTaxTotal - discountTotal;
            const changeAmount = amountPaid >= grandTotal ? (amountPaid - grandTotal) : 0;
            const outstanding = amountPaid < grandTotal ? (grandTotal - amountPaid) : 0;

            const sale = new Sale({
                invoiceNumber,
                offlineId,
                cashier: userId,
                customer: customerId || null,
                customerDetails: customerId ? null : {
                    name: customerName || 'Walk-in Customer',
                    phone: customerPhone || ''
                },
                items: processedItems,
                totalQuantity: items.reduce((acc: number, i: any) => acc + i.quantity, 0),
                subTotal: calculatedSubTotal,
                taxTotal: calculatedTaxTotal,
                cgst,
                sgst,
                igst: 0,
                discountTotal,
                grandTotal,
                paymentMethod,
                amountPaid: amountPaid > grandTotal ? grandTotal : amountPaid,
                changeAmount,
                status: 'completed',
                paymentStatus: outstanding > 0 ? 'pending' : 'paid',
                synced: true
            });

            await sale.save({ session });
            await sale.populate('customer');

            // 5. Update Customer Loyalty & Balance (if registered)
            let targetCustomerId = customerId;
            if (!targetCustomerId && customerPhone) {
                const existingCustomer = await Customer.findOne({ phone: customerPhone }).session(session);
                if (existingCustomer) {
                    targetCustomerId = existingCustomer._id;
                    sale.customer = targetCustomerId as any; // Cast for mongoose id
                    sale.customerDetails = undefined;
                }
            }

            if (targetCustomerId) {
                await Customer.findByIdAndUpdate(targetCustomerId, {
                    $inc: {
                        loyaltyPoints: Math.floor(sale.grandTotal / 100),
                        outstandingBalance: outstanding
                    },
                    $set: { lastVisit: new Date() }
                }).session(session);
            }

            // 6. Update Daily Report
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const profit = processedItems.reduce((acc, i) => acc + (i.subTotal - (i.costPrice * i.quantity)), 0);

            await DailyReport.findOneAndUpdate(
                { date: today },
                {
                    $inc: {
                        totalSales: sale.grandTotal,
                        totalProfit: profit,
                        totalTax: sale.taxTotal,
                        totalDiscount: discountTotal,
                        orderCount: 1,
                        [`paymentBreakdown.${paymentMethod}`]: sale.amountPaid,
                        'paymentBreakdown.credit': outstanding
                    }
                },
                { upsert: true, session }
            ).session(session); // Ensure session is used

            await session.commitTransaction();
            return sale;
        } catch (error) {
            if (session.inTransaction()) {
                await session.abortTransaction();
            }
            throw error;
        } finally {
            session.endSession();
        }
    }
}
