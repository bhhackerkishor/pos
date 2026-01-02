import Dexie, { Table } from 'dexie';

export interface Product {
    _id: string;
    name: string;
    sku: string;
    barcode?: string;
    price: number;
    costPrice: number;
    taxRate: number;
    stockQuantity: number;
    category: string;
    unit: string;
    isActive: boolean;
}

export interface Sale {
    id?: number;
    invoiceNumber: string;
    items: any[];
    totalQuantity: number;
    subTotal: number;
    taxTotal: number;
    grandTotal: number;
    paymentMethod: string;
    amountPaid: number;
    changeAmount: number;
    customerDetails?: { name: string; phone: string };
    createdAt: Date;
    offlineId: string;
    synced: number; // 0 for false, 1 for true (IndexedDB doesn't index booleans as well in all cases, using number is safer for older versions but Dexie handles it)
}

export interface Supplier {
    _id: string;
    name: string;
    phone: string;
    email?: string;
    address?: string;
    gstin?: string;
    currentBalance: number;
}

export interface SupplierTransaction {
    id?: number;
    supplierId: string;
    type: 'purchase' | 'payment';
    amount: number;
    description?: string;
    date: Date;
    offlineId: string;
    synced: number;
}

export interface SyncQueue {
    id?: number;
    type: 'sale' | 'supplier_transaction' | 'stock_update';
    data: any;
    timestamp: number;
}

export interface Settings {
    key: string;
    value: any;
}

export class POSDatabase extends Dexie {
    products!: Table<Product>;
    sales!: Table<Sale>;
    suppliers!: Table<Supplier>;
    supplierTransactions!: Table<SupplierTransaction>;
    syncQueue!: Table<SyncQueue>;
    settings!: Table<Settings>;

    constructor() {
        super('POSDatabase');
        this.version(1).stores({
            products: '_id, name, sku, barcode, category',
            sales: '++id, invoiceNumber, offlineId, synced, createdAt',
            suppliers: '_id, name, phone',
            supplierTransactions: '++id, supplierId, offlineId, synced, date',
            syncQueue: '++id, type, timestamp',
            settings: 'key'
        });
    }
}

export const db = new POSDatabase();
