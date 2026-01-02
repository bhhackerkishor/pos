import mongoose from 'mongoose';
import Supplier from '../models/Supplier.js';
import SupplierTransaction from '../models/SupplierTransaction.js';

export class SupplierService {
    static async processTransaction(txData: any, userId: string): Promise<any> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const {
                supplierId,
                type,
                amount,
                description,
                date,
                offlineId
            } = txData;

            // Check for duplicate offlineId
            if (offlineId) {
                const existingTx = await SupplierTransaction.findOne({ offlineId }).session(session);
                if (existingTx) {
                    await session.abortTransaction();
                    return existingTx;
                }
            }

            const supplier = await Supplier.findById(supplierId).session(session);
            if (!supplier) throw new Error('Supplier not found');

            const transaction = new SupplierTransaction({
                supplier: supplierId,
                type,
                amount,
                description,
                date: date || new Date(),
                offlineId,
                synced: true
            });

            await transaction.save({ session });

            // Update supplier balance
            const balanceChange = type === 'purchase' ? amount : -amount;
            supplier.currentBalance = (supplier.currentBalance || 0) + balanceChange;
            await supplier.save({ session });

            await session.commitTransaction();
            return transaction;
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
