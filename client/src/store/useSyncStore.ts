import { create } from 'zustand';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { db } from '@/lib/db';

interface SyncState {
    isOnline: boolean;
    setOnline: (status: boolean) => void;
    syncData: () => Promise<void>;
    pullMasterData: () => Promise<void>;
}

export const useSyncStore = create<SyncState>((set, get) => ({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,

    setOnline: (status) => {
        set({ isOnline: status });
        if (status) {
            get().syncData();
        }
    },

    syncData: async () => {
        const { isOnline } = get();
        if (!isOnline) return;

        // 1. Sync pending sales
        const pendingSales = await db.sales.where('synced').equals(0).toArray();
        if (pendingSales.length > 0) {
            toast.loading(`Syncing ${pendingSales.length} sales...`, { id: 'sync-sales' });
            for (const sale of pendingSales) {
                try {
                    await api.post('/sales', sale);
                    await db.sales.update(sale.id!, { synced: 1 });
                } catch (err) {
                    console.error('Failed to sync sale', sale.id, err);
                }
            }
            toast.success('Sales synced successfully', { id: 'sync-sales' });
        }

        // 2. Sync supplier transactions
        const pendingTransactions = await db.supplierTransactions.where('synced').equals(0).toArray();
        if (pendingTransactions.length > 0) {
            toast.loading(`Syncing ${pendingTransactions.length} transactions...`, { id: 'sync-tx' });
            for (const tx of pendingTransactions) {
                try {
                    await api.post('/suppliers/transactions', tx);
                    await db.supplierTransactions.update(tx.id!, { synced: 1 });
                } catch (err) {
                    console.error('Failed to sync transaction', tx.id, err);
                }
            }
            toast.success('Transactions synced', { id: 'sync-tx' });
        }
    },

    pullMasterData: async () => {
        const { isOnline } = get();
        if (!isOnline) return;

        try {
            toast.loading('Updating product & supplier data...', { id: 'pull-data' });

            const [productsRes, suppliersRes] = await Promise.all([
                api.get('/products?limit=10000'),
                api.get('/suppliers')
            ]);

            // Upsert into IndexedDB
            await db.transaction('rw', [db.products, db.suppliers], async () => {
                await db.products.clear();
                await db.products.bulkAdd(productsRes.data.data || []);

                await db.suppliers.clear();
                await db.suppliers.bulkAdd(suppliersRes.data.suppliers || []);
            });


            toast.success('Data updated locally', { id: 'pull-data' });
        } catch (err) {
            console.error('Failed to pull master data', err);
            toast.error('Failed to update local data', { id: 'pull-data' });
        }
    }
}));
