'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Download,
    User,
    Phone,
    Mail,
    MapPin,
    X,
    Users
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { exportToExcel } from '@/lib/excel';
import Pagination from '@/components/Pagination';

export default function CustomerPage() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<any>(null);

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit, setLimit] = useState(10);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        outstandingBalance: '0'
    });

    useEffect(() => {
        fetchCustomers();
        console.log(formData)
    }, [page, limit]);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/customers?page=${page}&limit=${limit}`);
            console.log(res.data)
            setCustomers(res.data.data);
            setTotalPages(res.data.pages);
        } catch (err) {
            toast.error('Failed to load customers');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (customer: any = null) => {
        if (customer) {
            setEditingCustomer(customer);
            setFormData({
                name: customer.name,
                phone: customer.phone || '',
                email: customer.email || '',
                address: customer.address || '',
                outstandingBalance: customer.outstandingBalance?.toString() || '0'
            });
        } else {
            setEditingCustomer(null);
            setFormData({
                name: '',
                phone: '',
                email: '',
                address: '',
                outstandingBalance: '0'
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = { ...formData, outstandingBalance: Number(formData.outstandingBalance) };
            if (editingCustomer) {
                await api.put(`/customers/${editingCustomer._id}`, data);
                toast.success('Customer profile updated');
            } else {
                await api.post('/customers', data);
                toast.success('Customer registered');
            }
            setShowModal(false);
            fetchCustomers();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to save customer');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this customer record?')) return;
        try {
            await api.delete(`/customers/${id}`);
            toast.success('Customer removed');
            fetchCustomers();
        } catch (error) {
            toast.error('Failed to delete customer');
        }
    };

    const handleExport = () => {
        exportToExcel(customers, 'Customers');
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm)
    );

    return (
        <DashboardLayout>
            <div className="space-y-10">
                <header className="flex flex-wrap items-center justify-between gap-8">
                    <div>
                        <h1 className="text-5xl font-black text-foreground italic uppercase tracking-tighter">Client Registry</h1>
                        <p className="text-muted-foreground mt-2 font-medium uppercase text-[10px] tracking-[0.3em]">Manage Relationship Database</p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={handleExport} className="flex items-center gap-3 px-8 h-14 glass rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-secondary transition-all border border-border">
                            <Download size={18} /> Export
                        </button>
                        <button onClick={() => handleOpenModal()} className="btn-primary h-14 px-8 text-xs tracking-widest uppercase font-black">
                            <Plus size={20} className="mr-1" /> New Client
                        </button>
                    </div>
                </header>

                <div className="glass-card !p-0 overflow-hidden shadow-2xl border-border/50 bg-card">
                    <div className="p-8 border-b border-border bg-secondary/20 flex flex-wrap items-center gap-6">
                        <div className="relative flex-1 min-w-[300px]">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search Clients by Name or Phone..."
                                className="input-field w-full pl-14 h-14 text-sm font-bold bg-background focus:ring-primary/20"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-secondary/50 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] border-b border-border">
                                    <th className="px-10 py-6">Identity</th>
                                    <th className="px-10 py-6">Contact Info</th>
                                    <th className="px-10 py-6">Location</th>
                                    <th className="px-10 py-6">Outstanding</th>
                                    <th className="px-10 py-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                <AnimatePresence>
                                    {filteredCustomers.map((c, idx) => (
                                        <motion.tr
                                            key={c._id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.03 }}
                                            className="hover:bg-secondary/30 transition-all group"
                                        >
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-12 h-12 rounded-xl bg-secondary border border-border flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                                                        <User size={24} />
                                                    </div>
                                                    <p className="font-black text-foreground text-lg tracking-tight">{c.name}</p>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-sm font-bold flex items-center gap-2"><Phone size={14} className="text-muted-foreground" /> {c.phone}</span>
                                                    {c.email && <span className="text-xs text-muted-foreground flex items-center gap-2"><Mail size={14} /> {c.email}</span>}
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <p className="text-sm text-muted-foreground flex items-center gap-2"><MapPin size={14} /> {c.address || 'N/A'}</p>
                                            </td>
                                            <td className="px-10 py-8">
                                                <span className={`font-black tracking-tighter ${c.outstandingBalance > 0 ? 'text-destructive' : 'text-emerald-500'}`}>
                                                    {c.outstandingBalance?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                                </span>
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button onClick={() => handleOpenModal(c)} className="w-12 h-12 glass rounded-xl text-primary hover:bg-primary hover:text-white transition-all shadow-sm flex items-center justify-center"><Edit2 size={18} /></button>
                                                    <button onClick={() => handleDelete(c._id)} className="w-12 h-12 glass rounded-xl text-destructive hover:bg-destructive hover:text-white transition-all shadow-sm flex items-center justify-center"><Trash2 size={18} /></button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                                {loading && <tr><td colSpan={5} className="py-20 text-center opacity-50 uppercase font-black text-xs tracking-widest">Scanning Registry...</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>

                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

                <AnimatePresence>
                    {showModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/90 backdrop-blur-xl">
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-card max-w-2xl w-full relative z-10 !p-12 border-primary/20 bg-card overflow-y-auto max-h-[90vh]">
                                <div className="flex justify-between items-center mb-10">
                                    <h2 className="text-4xl font-black tracking-tight">{editingCustomer ? 'Update Profile' : 'Register Client'}</h2>
                                    <button onClick={() => setShowModal(false)} className="w-12 h-12 glass rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground"><X size={24} /></button>
                                </div>
                                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div className="group">
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">Full Name</label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <input required className="input-field w-full pl-12" placeholder="John Doe" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="group">
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">Phone Number</label>
                                            <div className="relative">
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <input required className="input-field w-full pl-12" placeholder="+91 98765 43210" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="group">
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">Email Address</label>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <input className="input-field w-full pl-12" type="email" placeholder="john@example.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="group">
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">Outstanding Balance (₹)</label>
                                            <input type="number" className="input-field w-full" value={formData.outstandingBalance} onChange={e => setFormData({ ...formData, outstandingBalance: e.target.value })} />
                                        </div>
                                        <div className="group">
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">Mailing Address</label>
                                            <textarea className="input-field w-full min-h-[120px] pt-4" placeholder="Full address..." value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                                        </div>
                                        <button type="submit" className="btn-primary w-full h-16 text-sm tracking-widest uppercase font-black shadow-2xl shadow-primary/30">{editingCustomer ? 'Confirm Updates' : 'Registrar Client'}</button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </DashboardLayout>
    );
}
