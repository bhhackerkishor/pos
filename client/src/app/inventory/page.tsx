'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, Download, Package, TrendingUp, AlertTriangle, BarChart3, X, Barcode, Tag, Layers, DollarSign, Box, Upload, ImageIcon } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { exportToExcel } from '@/lib/excel';
import Pagination from '@/components/Pagination';

export default function InventoryPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);

    // Pagination State
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit, setLimit] = useState(10);

    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        barcode: '',
        category: '',
        price: '',
        wholesalePrice: '',
        wholesaleThreshold: '10',
        costPrice: '',
        taxRate: '18',
        stockQuantity: '0',
        unit: 'pcs',
        lowStockThreshold: '10',
        image: ''
    });

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, [page, selectedCategory, limit]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/products?page=${page}&limit=${limit}&category=${selectedCategory}&search=${searchTerm}`);
            setProducts(res.data.data);
            setTotalPages(res.data.pages);
        } catch (err) {
            toast.error('Failed to load inventory');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories');
            setCategories(res.data.data);
        } catch (err) {
            console.error('Failed to load categories');
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchProducts();
    };

    const handleExport = () => {
        const exportData = products.map(p => ({
            Name: p.name,
            SKU: p.sku,
            Barcode: p.barcode,
            Category: p.category?.name || 'N/A',
            Price: p.price,
            Cost: p.costPrice,
            Stock: p.stockQuantity,
            Unit: p.unit
        }));
        exportToExcel(exportData, 'Inventory');
    };

    const handleOpenModal = (product: any = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                sku: product.sku,
                barcode: product.barcode || '',
                category: product.category?._id || product.category || '',
                price: product.price.toString(),
                wholesalePrice: product.wholesalePrice?.toString() || '',
                wholesaleThreshold: product.wholesaleThreshold?.toString() || '10',
                costPrice: product.costPrice.toString(),
                taxRate: product.taxRate.toString(),
                stockQuantity: product.stockQuantity.toString(),
                unit: product.unit,
                lowStockThreshold: product.lowStockThreshold.toString(),
                image: product.image || ''
            });
        } else {
            setEditingProduct(null);
            setFormData({
                name: '',
                sku: '',
                barcode: '',
                category: categories[0]?._id || '',
                price: '',
                wholesalePrice: '',
                wholesaleThreshold: '10',
                costPrice: '',
                taxRate: '18',
                stockQuantity: '0',
                unit: 'pcs',
                lowStockThreshold: '10',
                image: ''
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = {
                ...formData,
                price: Number(formData.price),
                costPrice: Number(formData.costPrice),
                wholesalePrice: formData.wholesalePrice ? Number(formData.wholesalePrice) : undefined,
                wholesaleThreshold: Number(formData.wholesaleThreshold),
                taxRate: Number(formData.taxRate),
                stockQuantity: Number(formData.stockQuantity),
                lowStockThreshold: Number(formData.lowStockThreshold)
            };

            if (editingProduct) {
                await api.put(`/products/${editingProduct._id}`, data);
                toast.success('Product updated');
            } else {
                await api.post('/products', data);
                toast.success('Product added to vault');
            }
            setShowModal(false);
            fetchProducts();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to save product');
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const loadingToast = toast.loading('Synchronizing image with server...');
        try {
            const formDataToUpload = new FormData();
            formDataToUpload.append('file', file);

            const res = await api.post('/upload/image', formDataToUpload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.secure_url) {
                setFormData(prev => ({ ...prev, image: res.data.secure_url }));
                toast.success('Image synchronized successfully', { id: loadingToast });
            } else {
                throw new Error('Upload failed');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Server sync failed', { id: loadingToast });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to remove this item from the vault?')) return;
        try {
            await api.delete(`/products/${id}`);
            toast.success('Product removed');
            fetchProducts();
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    const totalVaultValue = products.reduce((acc, p) => acc + (p.costPrice * p.stockQuantity), 0);
    const criticalStockCount = products.filter(p => p.stockQuantity <= p.lowStockThreshold).length;

    return (
        <DashboardLayout>
            <div className="space-y-10">
                <header className="flex flex-wrap items-center justify-between gap-8">
                    <div>
                        <h1 className="text-5xl font-black text-foreground italic uppercase tracking-tighter">Vault Management</h1>
                        <p className="text-muted-foreground mt-2 font-medium uppercase text-[10px] tracking-[0.3em]">Total Value Control & Stock Audit</p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={handleExport} className="flex items-center gap-3 px-8 h-14 glass rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-secondary transition-all border border-border">
                            <Download size={18} /> Export
                        </button>
                        <button onClick={() => handleOpenModal()} className="btn-primary h-14 px-8 text-xs tracking-widest uppercase font-black">
                            <Plus size={20} className="mr-1" /> Add Product
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card flex items-center gap-6 border-amber-500/10">
                        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-inner">
                            <AlertTriangle size={32} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Critical Stock</p>
                            <h4 className="text-4xl font-black tracking-tighter">{criticalStockCount} SKUs</h4>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass-card flex items-center gap-6 border-emerald-500/10">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner">
                            <TrendingUp size={32} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Stock Investment</p>
                            <h4 className="text-4xl font-black tracking-tighter">{formatCurrency(totalVaultValue)}</h4>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="glass-card flex items-center gap-6 border-blue-500/10">
                        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-inner">
                            <BarChart3 size={32} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Registry</p>
                            <h4 className="text-4xl font-black tracking-tighter">{products.length} Items</h4>
                        </div>
                    </motion.div>
                </div>

                <div className="glass-card !p-0 overflow-hidden shadow-2xl border-border/50 bg-card">
                    <div className="p-8 border-b border-border bg-secondary/20 flex flex-wrap items-center gap-6">
                        <form onSubmit={handleSearch} className="relative flex-1 min-w-[300px]">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Filter Registry..."
                                className="input-field w-full pl-14 h-14 text-sm font-bold bg-background focus:ring-primary/20"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </form>
                        <div className="flex gap-4">
                            <select
                                className="h-14 px-6 glass rounded-2xl text-xs font-black uppercase tracking-widest border border-border outline-none focus:ring-2 ring-primary/20"
                                value={selectedCategory}
                                onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
                            >
                                <option value="">All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-secondary/50 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] border-b border-border">
                                    <th className="px-10 py-6">Identity</th>
                                    <th className="px-10 py-6">Pricing Matrix</th>
                                    <th className="px-10 py-6">Wholesale Data</th>
                                    <th className="px-10 py-6 text-center">Availability</th>
                                    <th className="px-10 py-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                <AnimatePresence>
                                    {products.map((p, idx) => (
                                        <motion.tr
                                            key={p._id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.03 }}
                                            className="hover:bg-secondary/30 transition-all group"
                                        >
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-14 h-14 rounded-2xl bg-secondary border border-border flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner overflow-hidden">
                                                        {p.image ? (
                                                            <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Package size={24} />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-foreground text-lg tracking-tight mb-1">{p.name}</p>
                                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-muted px-2 py-0.5 rounded leading-none">{p.sku}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-black text-foreground text-lg tracking-tighter">{formatCurrency(p.price)}</span>
                                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Entry: {formatCurrency(p.costPrice)}</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-black text-emerald-500 text-lg tracking-tighter">{p.wholesalePrice ? formatCurrency(p.wholesalePrice) : 'N/A'}</span>
                                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Threshold: {p.wholesaleThreshold} {p.unit}</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-center">
                                                <div className="inline-flex flex-col items-center gap-2">
                                                    <span className={cn(
                                                        "text-lg font-black tracking-tighter",
                                                        p.stockQuantity <= p.lowStockThreshold ? "text-destructive" : "text-emerald-500"
                                                    )}>{p.stockQuantity} {p.unit}</span>
                                                    <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden border border-border">
                                                        <div className={cn("h-full", p.stockQuantity <= p.lowStockThreshold ? "bg-destructive" : "bg-primary")} style={{ width: `${Math.min(100, (p.stockQuantity / (p.lowStockThreshold * 5)) * 100)}%` }} />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button onClick={() => handleOpenModal(p)} className="w-12 h-12 glass rounded-xl text-primary hover:bg-primary hover:text-white transition-all shadow-sm flex items-center justify-center"><Edit2 size={18} /></button>
                                                    <button onClick={() => handleDelete(p._id)} className="w-12 h-12 glass rounded-xl text-destructive hover:bg-destructive hover:text-white transition-all shadow-sm flex items-center justify-center"><Trash2 size={18} /></button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                                {loading && <tr><td colSpan={5} className="py-20 text-center opacity-50 uppercase font-black text-xs tracking-widest">Refreshing Vault...</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>

                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

                {/* Registry Modal */}
                <AnimatePresence>
                    {showModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/90 backdrop-blur-xl">
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-card max-w-4xl w-full relative z-10 !p-12 border-primary/20 bg-card overflow-y-auto max-h-[90vh]">
                                <div className="flex justify-between items-center mb-10">
                                    <h2 className="text-4xl font-black tracking-tight">{editingProduct ? 'Update Registry' : 'New Registry Entry'}</h2>
                                    <button onClick={() => setShowModal(false)} className="w-12 h-12 glass rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground"><X size={24} /></button>
                                </div>
                                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div className="group">
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block group-focus-within:text-primary transition-colors">Product Name</label>
                                            <div className="relative">
                                                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <input required className="input-field w-full pl-12" placeholder="e.g. SONY WH-1000XM5" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="group">
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">Category</label>
                                            <select
                                                className="input-field w-full h-14"
                                                value={formData.category}
                                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                                required
                                            >
                                                <option value="" disabled>Select Category</option>
                                                {categories.map(cat => (
                                                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="group">
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block group-focus-within:text-primary transition-colors">Product Image</label>
                                            <div className="flex gap-4 items-start">
                                                <div className="w-24 h-24 rounded-2xl bg-secondary border border-border flex items-center justify-center overflow-hidden shrink-0">
                                                    {formData.image ? <img src={formData.image} className="w-full h-full object-cover" /> : <ImageIcon size={32} className="opacity-20" />}
                                                </div>
                                                <div className="flex-1 space-y-3">
                                                    <div className="relative">
                                                        <Box className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                        <input className="input-field w-full pl-12 text-[10px]" placeholder="Image URL (Auto-filled on upload)" value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} />
                                                    </div>
                                                    <label className="flex items-center justify-center gap-2 h-10 px-4 bg-primary/10 text-primary border border-primary/20 rounded-xl text-[10px] font-black uppercase cursor-pointer hover:bg-primary/20 transition-all">
                                                        <Upload size={14} /> Upload via Cloudinary
                                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">SKU Code</label>
                                                <div className="relative">
                                                    <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                    <input required className="input-field w-full pl-12" placeholder="SKU001" value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">Barcode</label>
                                                <div className="relative">
                                                    <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                    <input className="input-field w-full pl-12" placeholder="890123" value={formData.barcode} onChange={e => setFormData({ ...formData, barcode: e.target.value })} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">M.R.P (Retail)</label>
                                                <div className="relative">
                                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                    <input required type="number" className="input-field w-full pl-12" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">Entry Cost</label>
                                                <div className="relative">
                                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                    <input required type="number" className="input-field w-full pl-12" value={formData.costPrice} onChange={e => setFormData({ ...formData, costPrice: e.target.value })} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-emerald-500/5 p-4 rounded-3xl border border-emerald-500/10">
                                                <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 block">Wholesale Price</label>
                                                <input type="number" className="input-field w-full bg-background" value={formData.wholesalePrice} onChange={e => setFormData({ ...formData, wholesalePrice: e.target.value })} />
                                            </div>
                                            <div className="bg-emerald-500/5 p-4 rounded-3xl border border-emerald-500/10">
                                                <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 block">Wholesale Min Qty</label>
                                                <input type="number" className="input-field w-full bg-background" value={formData.wholesaleThreshold} onChange={e => setFormData({ ...formData, wholesaleThreshold: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">In-Stock</label>
                                                <input required type="number" className="input-field w-full" value={formData.stockQuantity} onChange={e => setFormData({ ...formData, stockQuantity: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">Unit</label>
                                                <select className="input-field w-full h-14" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })}>
                                                    <option value="pcs">Pcs</option>
                                                    <option value="kg">Kg</option>
                                                    <option value="ltr">Ltr</option>
                                                    <option value="box">Box</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">Low Alert</label>
                                                <input required type="number" className="input-field w-full" value={formData.lowStockThreshold} onChange={e => setFormData({ ...formData, lowStockThreshold: e.target.value })} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">GST Percentage (%)</label>
                                            <select className="input-field w-full h-14" value={formData.taxRate} onChange={e => setFormData({ ...formData, taxRate: e.target.value })}>
                                                <option value="0">0% (Nil)</option>
                                                <option value="5">5% (Essential)</option>
                                                <option value="12">12% (Standard)</option>
                                                <option value="18">18% (Standard+)</option>
                                                <option value="28">28% (Luxury)</option>
                                            </select>
                                        </div>
                                        <button type="submit" className="btn-primary w-full h-16 text-sm tracking-widest uppercase font-black shadow-2xl shadow-primary/30">{editingProduct ? 'Commit Changes' : 'Initialize SKU'}</button>
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
