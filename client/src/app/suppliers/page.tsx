'use client';

import { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
    Search, Plus, User, Phone, MapPin,
    ArrowUpCircle, ArrowDownCircle,
    Trash2, Pencil, X, TrendingUp, TrendingDown, Wallet, Calendar, Filter, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency, cn } from '@/lib/utils';
import { db } from '@/lib/db';
import { useSyncStore } from '@/store/useSyncStore';
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
    const [dateFilter, setDateFilter] = useState({ start: '', end: '' });

    const { isOnline, pullMasterData } = useSyncStore();

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
        if (data.length === 0 && isOnline) {
            await pullMasterData();
            const newData = await db.suppliers.toArray();
            setSuppliers(newData);
        }
    };

    const loadTransactions = async (supplierId: string) => {
        const data = await db.supplierTransactions
            .where('supplierId')
            .equals(supplierId)
            .sortBy('date');
        setTransactions(data.reverse());
    };

    /* ---------------- ANALYTICS ---------------- */
    const analytics = useMemo(() => {
        let filtered = transactions;
        if (dateFilter.start) {
            const start = new Date(dateFilter.start);
            filtered = filtered.filter(tx => new Date(tx.date) >= start);
        }
        if (dateFilter.end) {
            const end = new Date(dateFilter.end);
            end.setHours(23, 59, 59, 999);
            filtered = filtered.filter(tx => new Date(tx.date) <= end);
        }

        const totalPurchases = filtered.filter(tx => tx.type === 'purchase').reduce((acc, tx) => acc + tx.amount, 0);
        const totalPayments = filtered.filter(tx => tx.type === 'payment').reduce((acc, tx) => acc + tx.amount, 0);

        return { totalPurchases, totalPayments, filtered };
    }, [transactions, dateFilter]);

    /* ---------------- CRUD ---------------- */
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
            currentBalance: editingSupplier ? editingSupplier.currentBalance : (Number(fd.get('openingBalance')) || 0)
        };

        try {
            if (editingSupplier) {
                await db.suppliers.update(editingSupplier._id, supplier);
                toast.success('Registry Updated');
            } else {
                await db.suppliers.add(supplier);
                toast.success('New Supplier Registered');
            }
            setShowSupplierModal(false);
            setEditingSupplier(null);
            loadSuppliers();
        } catch (err) {
            toast.error('Failed to save supplier');
        }
    };

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
            synced: 0,
            offlineId: `SUPTX-${Date.now()}`
        };

        try {
            await db.supplierTransactions.add(tx);
            const balanceChange = txType === 'purchase' ? amount : -amount;
            const newBalance = selectedSupplier.currentBalance + balanceChange;

            await db.suppliers.update(selectedSupplier._id, { currentBalance: newBalance });
            setSelectedSupplier({ ...selectedSupplier, currentBalance: newBalance });

            toast.success(`${txType === 'purchase' ? 'Purchase' : 'Payment'} recorded`);
            setShowTxModal(false);
            loadTransactions(selectedSupplier._id);
            loadSuppliers();
        } catch (err) {
            toast.error('Failed to record transaction');
        }
    };

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.phone.includes(search)
    );

    return (
        <DashboardLayout>
            <div className="flex h-full gap-8">

                {/* LEFT SIDEBAR: Supplier List */}
                <div className="w-[400px] flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-black italic uppercase tracking-tighter">Suppliers</h1>
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none">Vendor Ledger & Credit</p>
                        </div>
                        <button
                            onClick={() => setShowSupplierModal(true)}
                            className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-110 transition-all"
                        >
                            <Plus size={24} />
                        </button>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <input
                            placeholder="Search directory..."
                            className="input-field w-full pl-12 h-14 bg-secondary/50"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                        {filteredSuppliers.map(s => (
                            <motion.div
                                key={s._id}
                                layout
                                onClick={() => setSelectedSupplier(s)}
                                className={cn(
                                    'glass-card !p-5 cursor-pointer border-2 transition-all relative overflow-hidden',
                                    selectedSupplier?._id === s._id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                                )}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <p className="font-black text-lg tracking-tight leading-none">{s.name}</p>
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{s.phone}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={cn("text-lg font-black tracking-tighter", s.currentBalance > 0 ? "text-amber-500" : "text-emerald-500")}>
                                            {formatCurrency(s.currentBalance)}
                                        </p>
                                        <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Balance</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* RIGHT CONTENT: Ledger & Analytics */}
                <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                    <AnimatePresence mode="wait">
                        {!selectedSupplier ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="h-full flex flex-col items-center justify-center text-center opacity-30 select-none grayscale"
                            >
                                <Users size={120} strokeWidth={1} />
                                <h2 className="text-2xl font-black uppercase tracking-widest mt-6">Select a Supplier</h2>
                                <p className="text-xs font-bold mt-2">To view transaction history and analytics</p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key={selectedSupplier._id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8 pb-10"
                            >
                                {/* SUPPLIER HEADER */}
                                <div className="glass-card !p-8 flex justify-between items-end border-primary/10">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                                                <User size={32} />
                                            </div>
                                            <div>
                                                <h1 className="text-4xl font-black tracking-tighter leading-none">{selectedSupplier.name}</h1>
                                                <div className="flex gap-4 mt-2">
                                                    <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground"><Phone size={12} /> {selectedSupplier.phone}</span>
                                                    {selectedSupplier.gstin && <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary"><Wallet size={12} /> GSTIN: {selectedSupplier.gstin}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <button onClick={() => { setEditingSupplier(selectedSupplier); setShowSupplierModal(true); }} className="w-12 h-12 glass rounded-2xl flex items-center justify-center hover:bg-primary hover:text-white transition-all"><Pencil size={18} /></button>
                                        <button onClick={() => { setTxType('purchase'); setShowTxModal(true); }} className="h-12 px-6 bg-amber-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-amber-500/20 hover:scale-105 transition-all flex items-center gap-2"><ArrowUpCircle size={18} /> Purchase</button>
                                        <button onClick={() => { setTxType('payment'); setShowTxModal(true); }} className="h-12 px-6 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all flex items-center gap-2"><ArrowDownCircle size={18} /> Payment</button>
                                    </div>
                                </div>

                                {/* ANALYTICS CARDS */}
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="glass-card flex items-center gap-6 border-amber-500/10">
                                        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-inner"><TrendingUp size={32} /></div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Total Purchases</p>
                                            <h4 className="text-3xl font-black tracking-tighter">{formatCurrency(analytics.totalPurchases)}</h4>
                                        </div>
                                    </div>
                                    <div className="glass-card flex items-center gap-6 border-emerald-500/10">
                                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner"><TrendingDown size={32} /></div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Total Payments</p>
                                            <h4 className="text-3xl font-black tracking-tighter">{formatCurrency(analytics.totalPayments)}</h4>
                                        </div>
                                    </div>
                                    <div className="glass-card flex items-center gap-6 border-primary/10">
                                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner"><Wallet size={32} /></div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Net Balance</p>
                                            <h4 className="text-3xl font-black tracking-tighter">{formatCurrency(selectedSupplier.currentBalance)}</h4>
                                        </div>
                                    </div>
                                </div>

                                {/* FILTERS & LEDGER */}
                                <div className="glass-card !p-0 overflow-hidden">
                                    <div className="p-8 border-b border-border bg-secondary/20 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <input type="date" className="input-field pl-12 h-12 text-xs" value={dateFilter.start} onChange={e => setDateFilter({ ...dateFilter, start: e.target.value })} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">To</span>
                                            <div className="relative">
                                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <input type="date" className="input-field pl-12 h-12 text-xs" value={dateFilter.end} onChange={e => setDateFilter({ ...dateFilter, end: e.target.value })} />
                                            </div>
                                            <button onClick={() => setDateFilter({ start: '', end: '' })} className="text-[10px] font-black uppercase text-primary tracking-widest hover:underline ml-4">Reset</button>
                                        </div>
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground italic">Transaction Ledger / {analytics.filtered.length} Records</h3>
                                    </div>

                                    <table className="w-full text-left">
                                        <thead className="bg-secondary/50 border-b border-border">
                                            <tr className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                                <th className="px-8 py-4">Status</th>
                                                <th className="px-8 py-4">Date</th>
                                                <th className="px-8 py-4">Description</th>
                                                <th className="px-8 py-4 text-right">Debit / Credit</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50">
                                            {analytics.filtered.map((tx, idx) => (
                                                <tr key={idx} className="hover:bg-secondary/20 transition-colors group">
                                                    <td className="px-8 py-4">
                                                        <div className={cn(
                                                            "w-8 h-8 rounded-lg flex items-center justify-center shadow-lg",
                                                            tx.type === 'purchase' ? "bg-amber-500/10 text-amber-600" : "bg-emerald-500/10 text-emerald-600"
                                                        )}>
                                                            {tx.type === 'purchase' ? <ArrowUpCircle size={14} /> : <ArrowDownCircle size={14} />}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-4 text-xs font-bold opacity-70">
                                                        {new Date(tx.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </td>
                                                    <td className="px-8 py-4 text-xs font-bold">{tx.description || 'No description provided'}</td>
                                                    <td className={cn(
                                                        "px-8 py-4 text-right font-black text-lg tracking-tighter",
                                                        tx.type === 'purchase' ? "text-amber-500" : "text-emerald-500"
                                                    )}>
                                                        {tx.type === 'purchase' ? '+' : '-'}{formatCurrency(tx.amount)}
                                                    </td>
                                                </tr>
                                            ))}
                                            {analytics.filtered.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="py-20 text-center opacity-30 uppercase font-black text-xs tracking-widest italic">No matching transactions found</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* MODALS: Same style as other pages */}
            <AnimatePresence>
                {showSupplierModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/90 backdrop-blur-xl">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-card max-w-lg w-full relative !p-12 border-primary/20 bg-card">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-3xl font-black italic tracking-tight">{editingSupplier ? 'Update Vendor' : 'New Supplier'}</h2>
                                <button onClick={() => { setShowSupplierModal(false); setEditingSupplier(null); }} className="w-10 h-10 glass rounded-full flex items-center justify-center text-muted-foreground"><X size={20} /></button>
                            </div>
                            <form onSubmit={saveSupplier} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Business Name</label>
                                    <input name="name" defaultValue={editingSupplier?.name} required placeholder="ACME Corp" className="input-field w-full" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Phone</label>
                                        <input name="phone" defaultValue={editingSupplier?.phone} required className="input-field w-full" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">GSTIN</label>
                                        <input name="gstin" defaultValue={editingSupplier?.gstin} className="input-field w-full" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Email</label>
                                    <input name="email" defaultValue={editingSupplier?.email} className="input-field w-full" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Address</label>
                                    <textarea name="address" defaultValue={editingSupplier?.address} className="input-field w-full min-h-[100px]" />
                                </div>
                                {!editingSupplier && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Opening Balance</label>
                                        <input name="openingBalance" type="number" defaultValue={0} className="input-field w-full" />
                                    </div>
                                )}
                                <button className="btn-primary w-full h-14 font-black uppercase tracking-widest">Initialize Entry</button>
                            </form>
                        </motion.div>
                    </div>
                )}

                {showTxModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/90 backdrop-blur-xl">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-card max-w-md w-full relative !p-12 border-primary/20 bg-card">
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-3">
                                    {txType === 'purchase' ? <ArrowUpCircle className="text-amber-500" size={32} /> : <ArrowDownCircle className="text-emerald-500" size={32} />}
                                    <h2 className="text-3xl font-black italic tracking-tight uppercase leading-none">{txType === 'purchase' ? 'Debit' : 'Credit'} Entry</h2>
                                </div>
                                <button onClick={() => setShowTxModal(false)} className="w-10 h-10 glass rounded-full flex items-center justify-center text-muted-foreground"><X size={20} /></button>
                            </div>
                            <form onSubmit={addTransaction} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Amount</label>
                                    <input name="amount" type="number" step="0.01" required placeholder="0.00" className="input-field w-full text-2xl font-black tracking-tighter" autoFocus />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Description / Bill No.</label>
                                    <input name="description" placeholder="e.g. Bill #INV-001" className="input-field w-full" />
                                </div>
                                <button className={cn(
                                    "w-full h-14 font-black uppercase tracking-widest text shadow-xl transition-all",
                                    txType === 'purchase' ? "bg-amber-500 text-white shadow-amber-500/20" : "bg-emerald-500 text-white shadow-emerald-500/20"
                                )}>Record Entry</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
}

// Fixed Lucide naming and added Users count
function Users({ size, strokeWidth }: any) {
    return <User size={size} strokeWidth={strokeWidth} />;
}
