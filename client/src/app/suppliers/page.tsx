'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
    Search, Plus, User, Phone, MapPin,
    ArrowUpCircle, ArrowDownCircle,
    Trash2, Pencil, X
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { db } from '@/lib/db';
import toast from 'react-hot-toast';

/* ---------------- TYPES ---------------- */
type Supplier = {
    _id: string;
    name: string;
    phone: string;
    email?: string;
    address?: string;
    gstin?: string;
    currentBalance: number;
};

type TxType = 'purchase' | 'payment';

/* ---------------- COMPONENT ---------------- */
export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [search, setSearch] = useState('');

    // Modals
    const [showSupplierModal, setShowSupplierModal] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [showTxModal, setShowTxModal] = useState(false);
    const [txType, setTxType] = useState<TxType>('purchase');

    /* ---------------- LOADERS ---------------- */
    useEffect(() => {
        loadSuppliers();
    }, []);

    useEffect(() => {
        if (selectedSupplier) loadTransactions(selectedSupplier._id);
    }, [selectedSupplier]);

    const loadSuppliers = async () => {
        const data = await db.suppliers.toArray();
        setSuppliers(data);
    };

    const loadTransactions = async (supplierId: string) => {
        const data = await db.supplierTransactions
            .where('supplierId')
            .equals(supplierId)
            .sortBy('date');
        setTransactions(data.reverse());
    };

    /* ---------------- SUPPLIER CRUD ---------------- */
    const saveSupplier = async (e: any) => {
        e.preventDefault();
        const fd = new FormData(e.target);

        const supplier: Supplier = {
            _id: editingSupplier?._id || `SUP-${Date.now()}`,
            name: fd.get('name') as string,
            phone: fd.get('phone') as string,
            email: fd.get('email') as string,
            address: fd.get('address') as string,
            gstin: fd.get('gstin') as string,
            currentBalance: Number(fd.get('openingBalance')) || 0
        };

        if (editingSupplier) {
            await db.suppliers.update(editingSupplier._id, supplier);
            toast.success('Supplier updated');
        } else {
            await db.suppliers.add(supplier);
            toast.success('Supplier added');
        }

        setShowSupplierModal(false);
        setEditingSupplier(null);
        loadSuppliers();
    };

    const deleteSupplier = async (id: string) => {
        if (!confirm('Delete supplier and all transactions?')) return;

        await db.suppliers.delete(id);
        await db.supplierTransactions.where('supplierId').equals(id).delete();

        toast.success('Supplier deleted');
        setSelectedSupplier(null);
        loadSuppliers();
    };

    /* ---------------- TRANSACTIONS ---------------- */
    const addTransaction = async (e: any) => {
        e.preventDefault();
        if (!selectedSupplier) return;

        const fd = new FormData(e.target);
        const amount = Number(fd.get('amount'));

        const tx = {
            supplierId: selectedSupplier._id,
            type: txType,
            amount,
            description: fd.get('description'),
            date: new Date(),
            synced: 0
        };

        await db.supplierTransactions.add(tx);

        const balanceChange = txType === 'purchase' ? amount : -amount;
        await db.suppliers.update(selectedSupplier._id, {
            currentBalance: selectedSupplier.currentBalance + balanceChange
        });

        setSelectedSupplier({
            ...selectedSupplier,
            currentBalance: selectedSupplier.currentBalance + balanceChange
        });

        toast.success('Transaction added');
        setShowTxModal(false);
        loadTransactions(selectedSupplier._id);
        loadSuppliers();
    };

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.phone.includes(search)
    );

    /* ---------------- UI ---------------- */
    return (
        <DashboardLayout>
            <div className="flex h-full gap-6">

                {/* LEFT */}
                <div className="w-1/3 space-y-4">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-black">SUPPLIERS</h1>
                        <button
                            onClick={() => setShowSupplierModal(true)}
                            className="btn-primary"
                        >
                            <Plus size={18} />
                        </button>
                    </div>

                    <input
                        placeholder="Search supplier..."
                        className="input-field"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />

                    <div className="space-y-2">
                        {filteredSuppliers.map(s => (
                            <div
                                key={s._id}
                                onClick={() => setSelectedSupplier(s)}
                                className={cn(
                                    'card cursor-pointer',
                                    selectedSupplier?._id === s._id && 'border-primary'
                                )}
                            >
                                <div className="flex justify-between">
                                    <div>
                                        <p className="font-bold">{s.name}</p>
                                        <p className="text-xs opacity-60">{s.phone}</p>
                                    </div>
                                    <p className="font-black">
                                        {formatCurrency(s.currentBalance)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT */}
                <div className="flex-1">
                    {!selectedSupplier ? (
                        <div className="h-full flex items-center justify-center opacity-30">
                            Select Supplier
                        </div>
                    ) : (
                        <>
                            {/* HEADER */}
                            <div className="card flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-black">{selectedSupplier.name}</h2>
                                    <p className="text-xs">{selectedSupplier.phone}</p>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setEditingSupplier(selectedSupplier);
                                            setShowSupplierModal(true);
                                        }}
                                        className="btn-secondary"
                                    >
                                        <Pencil size={16} />
                                    </button>

                                    <button
                                        onClick={() => deleteSupplier(selectedSupplier._id)}
                                        className="btn-danger"
                                    >
                                        <Trash2 size={16} />
                                    </button>

                                    <button
                                        onClick={() => { setTxType('purchase'); setShowTxModal(true); }}
                                        className="btn-warning"
                                    >
                                        <ArrowUpCircle size={16} /> Purchase
                                    </button>

                                    <button
                                        onClick={() => { setTxType('payment'); setShowTxModal(true); }}
                                        className="btn-success"
                                    >
                                        <ArrowDownCircle size={16} /> Payment
                                    </button>
                                </div>
                            </div>

                            {/* LEDGER */}
                            <div className="card mt-4">
                                {transactions.length === 0 && (
                                    <p className="text-center opacity-40">No transactions</p>
                                )}

                                {transactions.map((tx, i) => (
                                    <div key={i} className="flex justify-between border-b py-2">
                                        <div>
                                            <p className="font-bold text-sm">{tx.type}</p>
                                            <p className="text-xs opacity-60">{tx.description}</p>
                                        </div>
                                        <p className={tx.type === 'purchase' ? 'text-red-500' : 'text-green-500'}>
                                            {formatCurrency(tx.amount)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ---------------- SUPPLIER MODAL ---------------- */}
            {showSupplierModal && (
                <Modal title={editingSupplier ? 'Edit Supplier' : 'Add Supplier'} onClose={() => {
                    setShowSupplierModal(false);
                    setEditingSupplier(null);
                }}>
                    <form onSubmit={saveSupplier} className="space-y-3">
                        <input name="name" defaultValue={editingSupplier?.name} required placeholder="Name" />
                        <input name="phone" defaultValue={editingSupplier?.phone} required placeholder="Phone" />
                        <input name="email" defaultValue={editingSupplier?.email} placeholder="Email" />
                        <input name="gstin" defaultValue={editingSupplier?.gstin} placeholder="GSTIN" />
                        <textarea name="address" defaultValue={editingSupplier?.address} placeholder="Address" />
                        <input
                            name="openingBalance"
                            type="number"
                            defaultValue={editingSupplier?.currentBalance}
                            placeholder="Opening Balance"
                        />
                        <button className="btn-primary w-full">Save</button>
                    </form>
                </Modal>
            )}

            {/* ---------------- TX MODAL ---------------- */}
            {showTxModal && (
                <Modal title={`Add ${txType}`} onClose={() => setShowTxModal(false)}>
                    <form onSubmit={addTransaction} className="space-y-3">
                        <input name="amount" type="number" required placeholder="Amount" />
                        <input name="description" placeholder="Description" />
                        <button className="btn-primary w-full">Save</button>
                    </form>
                </Modal>
            )}
        </DashboardLayout>
    );
}

/* ---------------- SIMPLE MODAL ---------------- */
function Modal({ title, onClose, children }: any) {
    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-card p-6 rounded-xl w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-3 right-3">
                    <X size={18} />
                </button>
                <h2 className="font-black mb-4">{title}</h2>
                {children}
            </div>
        </div>
    );
}
