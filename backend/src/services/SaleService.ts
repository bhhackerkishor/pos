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
            console.log(`Processing sale: ${saleData.invoiceNumber || 'NEW'} (OfflineID: ${saleData.offlineId})`);
            const {

                items,
                customerId,
                customerName, // For walk-in customers
                customerPhone,
                paymentMethod,
                amountPaid,
                discountTotal: rawDiscountTotal,
                invoiceNumber: clientInvoiceNumber,
                offlineId
            } = saleData;

            const safeItems = Array.isArray(items) ? items : [];
            const discountTotal = Number(rawDiscountTotal) || 0;
            const safeAmountPaid = Number(amountPaid) || 0;

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

            for (const item of safeItems) {
                const product = await Product.findById(item._id).session(session);
                if (!product) continue; // Skip non-existent products instead of crashing
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

                const itemQty = Number(item.quantity) || 0;
                const itemPrice = Number(appliedPrice) || 0;
                const itemRawDiscount = Number(item.discount) || 0;
                const prodTaxRate = Number(product.taxRate) || 0;

                const itemTax = (itemPrice * itemQty * prodTaxRate) / 100;
                const itemSubTotal = (itemPrice * itemQty);

                processedItems.push({
                    product: product._id,
                    name: product.name,
                    quantity: itemQty,
                    price: itemPrice,
                    costPrice: Number(product.costPrice) || 0,
                    taxRate: prodTaxRate,
                    taxAmount: Number(itemTax.toFixed(2)),
                    discount: itemRawDiscount,
                    subTotal: Number((itemSubTotal - itemRawDiscount).toFixed(2))
                });

                calculatedSubTotal += (itemSubTotal - itemRawDiscount);
                calculatedTaxTotal += itemTax;
            }

            // 3. Indian GST Breakdown
            const cgst = calculatedTaxTotal / 2;
            const sgst = calculatedTaxTotal / 2;

            // 4. Create Sale Record
            const rawGrandTotal = (calculatedSubTotal + calculatedTaxTotal) - discountTotal;
            console.log('Raw Grand Total:', rawGrandTotal);
            const grandTotal = Number(Math.max(0, rawGrandTotal).toFixed(2));
            console.log('Grand Total:', grandTotal);
            console.log('Discount Total:', discountTotal);
            console.log('Calculated Sub Total:', calculatedSubTotal);
            console.log('Calculated Tax Total:', calculatedTaxTotal);
            console.log('Safe Amount Paid:', safeAmountPaid);

            if (isNaN(grandTotal)) throw new Error('Grand total calculation resulted in NaN');

            const changeAmount = safeAmountPaid >= grandTotal ? (safeAmountPaid - grandTotal) : 0;
            const outstanding = safeAmountPaid < grandTotal ? (grandTotal - safeAmountPaid) : 0;

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
                totalQuantity: Number(processedItems.reduce((acc, i) => acc + i.quantity, 0).toFixed(2)),
                subTotal: Number(calculatedSubTotal.toFixed(2)),
                taxTotal: Number(calculatedTaxTotal.toFixed(2)),
                cgst: Number((calculatedTaxTotal / 2).toFixed(2)),
                sgst: Number((calculatedTaxTotal / 2).toFixed(2)),
                igst: 0,
                discountTotal: Number(discountTotal.toFixed(2)),
                grandTotal: grandTotal,
                paymentMethod,
                amountPaid: Number(Math.min(safeAmountPaid, grandTotal).toFixed(2)),
                changeAmount: Number(changeAmount.toFixed(2)),
                status: 'completed',
                paymentStatus: outstanding > 0 ? 'pending' : 'paid',
                synced: true
            });

            await sale.save({ session });

            // 5. Update Customer Loyalty & Balance (if registered)
            let targetCustomerId = customerId;
            if (!targetCustomerId && customerPhone) {
                const existingCustomer = await Customer.findOne({ phone: customerPhone }).session(session);
                if (existingCustomer) {
                    targetCustomerId = existingCustomer._id;
                    await Sale.findByIdAndUpdate(sale._id, { customer: targetCustomerId, customerDetails: undefined }).session(session);
                    sale.customer = targetCustomerId as any;
                }
            }

            if (targetCustomerId) {
                await Customer.findByIdAndUpdate(targetCustomerId, {
                    $inc: {
                        loyaltyPoints: Math.max(0, Math.floor(grandTotal / 100)),
                        outstandingBalance: outstanding
                    },
                    $set: { lastVisit: new Date() }
                }).session(session);
            }

            // 6. Update Daily Report
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const profit = processedItems.reduce((acc, i) => {
                const itemCost = i.costPrice || 0;
                return acc + (i.subTotal - (itemCost * i.quantity));
            }, 0);


            await DailyReport.findOneAndUpdate(
                { date: today },
                {
                    $inc: {
                        totalSales: Number(sale.grandTotal.toFixed(2)),
                        totalProfit: Number(profit.toFixed(2)),
                        totalTax: Number(sale.taxTotal.toFixed(2)),
                        totalDiscount: Number(discountTotal.toFixed(2)),
                        orderCount: 1,
                        [`paymentBreakdown.${paymentMethod}`]: Number(sale.amountPaid.toFixed(2)),
                        'paymentBreakdown.credit': Number(outstanding.toFixed(2))
                    }
                },
                { upsert: true, session }
            );

            await session.commitTransaction();
            return sale;
        } catch (error: any) {
            if (session.inTransaction()) {
                await session.abortTransaction();
            }

            // Handle WriteConflict - Retry with jitter
            if (error.code === 112 || error.message.includes('Write conflict')) {
                const jitter = Math.floor(Math.random() * 100) + 50;
                console.log(`Write conflict detected, retrying in ${jitter}ms...`);
                await new Promise(resolve => setTimeout(resolve, jitter));
                session.endSession();
                return SaleService.processSale(saleData, userId);
            }

            console.error(`Sale Processing Error: ${error.message}`);
            throw error;
        } finally {
            session.endSession();
        }
    }
}
