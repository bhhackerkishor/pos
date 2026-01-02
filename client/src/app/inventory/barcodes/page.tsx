'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Search, Printer, Tag, LayoutGrid, List, RefreshCw, Settings, X, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/db';
import { barcodePrintStyles } from '@/lib/barcodeUtils';
import { formatCurrency, cn } from '@/lib/utils';
import { useSyncStore } from '@/store/useSyncStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface ProductWithQty {
    _id: string;
    name: string;
    price: number;
    sku: string;
    barcode?: string;
    printQty: number;
}

export default function BarcodeGeneratorPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProducts, setSelectedProducts] = useState<ProductWithQty[]>([]);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showSettings, setShowSettings] = useState(false);

    // Generator Settings
    const [config, setConfig] = useState({
        columns: 4,
        shopName: 'OHM SAKTHI STORES',
        showPrice: true,
        showShopName: true,
        labelHeight: 30, // mm
        labelWidth: 1.5, // scale
    });

    const { isOnline, pullMasterData } = useSyncStore();

    useEffect(() => {
        loadProducts();
        fetchShopName();
    }, []);

    const fetchShopName = async () => {
        try {
            const res = await api.get('/settings');
            if (res.data?.data?.shopName) {
                setConfig(prev => ({ ...prev, shopName: res.data.data.shopName }));
            }
        } catch (err) {
            console.error('Failed to fetch settings');
        }
    };

    const loadProducts = async () => {
        const data = await db.products.toArray();
        if (data.length === 0 && isOnline) {
            await pullMasterData();
            const newData = await db.products.toArray();
            setProducts(newData);
        } else {
            setProducts(data);
        }
    };

    const toggleSelect = (p: any) => {
        const existing = selectedProducts.find(item => item._id === p._id);
        if (existing) {
            setSelectedProducts(selectedProducts.filter(item => item._id !== p._id));
        } else {
            setSelectedProducts([...selectedProducts, { ...p, printQty: 1 }]);
        }
    };

    const updatePrintQty = (id: string, delta: number) => {
        setSelectedProducts(prev => prev.map(p =>
            p._id === id ? { ...p, printQty: Math.max(1, p.printQty + delta) } : p
        ));
    };

    const handlePrint = () => {
        if (selectedProducts.length === 0) {
            toast.error('Select items to print');
            return;
        }

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        // Generate full list of labels based on quantities
        const allLabels: any[] = [];
        selectedProducts.forEach(p => {
            for (let i = 0; i < p.printQty; i++) {
                allLabels.push(p);
            }
        });

        const content = allLabels.map((p, idx) => `
            <div class="barcode-label" style="width: calc(100% / ${config.columns} - 10px);">
                ${config.showShopName ? `<div class="shop-name">${config.shopName}</div>` : ''}
                <div class="product-name">${p.name}</div>
                ${config.showPrice ? `<div class="price-section">MRP: ${formatCurrency(p.price)}</div>` : ''}
                <svg class="barcode-svg" id="barcode-${idx}"></svg>
            </div>
        `).join('');

        printWindow.document.write(`
            <html>
                <head>
                    <style>
                        ${barcodePrintStyles}
                        body { margin: 0; padding: 10px; display: flex; flex-wrap: wrap; gap: 10px; justify-content: start; }
                        .barcode-label { 
                            border: 0.5px solid #eee; 
                            padding: 5px; 
                            text-align: center; 
                            page-break-inside: avoid;
                            box-sizing: border-box;
                        }
                        .shop-name { font-size: 8px; font-weight: bold; margin-bottom: 2px; }
                        .product-name { font-size: 9px; margin-bottom: 2px; height: 24px; overflow: hidden; }
                        .price-section { font-size: 10px; font-weight: bold; }
                        .barcode-svg { max-width: 100%; height: ${config.labelHeight}px; }
                        @media print {
                            body { padding: 0; }
                            .barcode-label { border: none; }
                        }
                    </style>
                    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
                </head>
                <body>
                    ${content}
                    <script>
                        window.onload = () => {
                            ${allLabels.map((p, idx) => `
                                JsBarcode("#barcode-${idx}", "${p.barcode || p.sku}", { 
                                    width: ${config.labelWidth}, 
                                    height: ${config.labelHeight}, 
                                    fontSize: 10,
                                    displayValue: true
                                });
                            `).join('\n')}
                            setTimeout(() => { window.print(); window.close(); }, 500);
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchTerm))
    );

    return (
        <DashboardLayout>
            <div className="flex flex-col h-full gap-8">
                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter">Barcode Studio</h1>
                        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1 italic">Advanced Label Customization Engine</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setShowSettings(true)}
                            className="w-14 h-14 glass rounded-2xl flex items-center justify-center text-muted-foreground border border-border hover:bg-secondary transition-all"
                        >
                            <Settings size={20} />
                        </button>
                        <button
                            onClick={async () => { await pullMasterData(); loadProducts(); }}
                            className="w-14 h-14 glass rounded-2xl flex items-center justify-center text-primary border border-border hover:bg-secondary transition-all"
                        >
                            <RefreshCw size={20} />
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-3 px-8 h-14 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-105 transition-all"
                        >
                            <Printer size={18} /> Print Sheet ({selectedProducts.reduce((acc, p) => acc + p.printQty, 0)})
                        </button>
                    </div>
                </div>

                <div className="flex gap-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Find products for labeling..."
                            className="input-field w-full pl-12 h-14 bg-secondary/50"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex glass rounded-2xl p-1 border-border">
                        <button onClick={() => setViewMode('grid')} className={cn("p-3 rounded-xl transition-all", viewMode === 'grid' ? "bg-primary text-white shadow-lg" : "text-muted-foreground")}><LayoutGrid size={20} /></button>
                        <button onClick={() => setViewMode('list')} className={cn("p-3 rounded-xl transition-all", viewMode === 'list' ? "bg-primary text-white shadow-lg" : "text-muted-foreground")}><List size={20} /></button>
                    </div>
                </div>

                {/* PRODUCT SELECTION AREA */}
                <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                            {filteredProducts.map(p => {
                                const sel = selectedProducts.find(item => item._id === p._id);
                                return (
                                    <motion.div
                                        key={p._id}
                                        layout
                                        onClick={() => !sel && toggleSelect(p)}
                                        className={cn(
                                            "glass-card !p-4 cursor-pointer transition-all relative border-2 flex flex-col h-full",
                                            sel ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                                        )}
                                    >
                                        <div className="aspect-square bg-secondary rounded-xl mb-4 flex flex-col items-center justify-center p-4 relative overflow-hidden group">
                                            {sel ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    <p className="text-[10px] font-black text-primary uppercase">Copies</p>
                                                    <div className="flex items-center gap-3">
                                                        <button onClick={(e) => { e.stopPropagation(); updatePrintQty(p._id, -1); }} className="w-8 h-8 rounded-lg bg-white border border-border flex items-center justify-center hover:bg-primary hover:text-white transition-all"><Minus size={14} /></button>
                                                        <span className="text-xl font-black">{sel.printQty}</span>
                                                        <button onClick={(e) => { e.stopPropagation(); updatePrintQty(p._id, 1); }} className="w-8 h-8 rounded-lg bg-white border border-border flex items-center justify-center hover:bg-primary hover:text-white transition-all"><Plus size={14} /></button>
                                                    </div>
                                                    <button onClick={(e) => { e.stopPropagation(); toggleSelect(p); }} className="text-[8px] font-black uppercase text-rose-500 mt-4 underline">Remove</button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="w-full h-1 bg-black/10 rounded mb-1 animate-pulse" />
                                                    <div className="w-full h-1 bg-black/10 rounded mb-1 animate-pulse" style={{ width: '60%' }} />
                                                    <div className="w-full h-1 bg-black/10 rounded animate-pulse" style={{ width: '80%' }} />
                                                </>
                                            )}
                                        </div>
                                        <h3 className="font-bold text-xs line-clamp-2 mb-1 h-8">{p.name}</h3>
                                        <p className="text-primary font-black text-sm">{formatCurrency(p.price)}</p>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="glass rounded-[2rem] border border-border overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-secondary/50">
                                    <tr className="text-left">
                                        <th className="p-5 text-[10px] font-black uppercase tracking-widest">Product</th>
                                        <th className="p-5 text-[10px] font-black uppercase tracking-widest text-center">Copies</th>
                                        <th className="p-5 text-[10px] font-black uppercase tracking-widest text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.map(p => {
                                        const sel = selectedProducts.find(item => item._id === p._id);
                                        return (
                                            <tr key={p._id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                                                <td className="p-5">
                                                    <p className="font-bold text-sm">{p.name}</p>
                                                    <p className="text-[8px] font-black uppercase text-muted-foreground">{p.sku}</p>
                                                </td>
                                                <td className="p-5">
                                                    {sel && (
                                                        <div className="flex items-center justify-center gap-4">
                                                            <button onClick={() => updatePrintQty(p._id, -1)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center"><Minus size={14} /></button>
                                                            <span className="font-black w-8 text-center">{sel.printQty}</span>
                                                            <button onClick={() => updatePrintQty(p._id, 1)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center"><Plus size={14} /></button>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-5 text-right">
                                                    <button
                                                        onClick={() => toggleSelect(p)}
                                                        className={cn(
                                                            "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                                            sel ? "bg-rose-500 text-white" : "bg-primary text-white"
                                                        )}
                                                    >
                                                        {sel ? 'Remove' : 'Select'}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* SETTINGS MODAL */}
                <AnimatePresence>
                    {showSettings && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="glass-card max-w-md w-full relative !p-10 border-primary/20 bg-card"
                            >
                                <button onClick={() => setShowSettings(false)} className="absolute top-6 right-6 text-muted-foreground"><X size={20} /></button>
                                <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-8">Page Setup</h2>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Columns per row</label>
                                        <div className="flex gap-2">
                                            {[2, 3, 4, 5, 6].map(num => (
                                                <button
                                                    key={num}
                                                    onClick={() => setConfig({ ...config, columns: num })}
                                                    className={cn("flex-1 h-12 rounded-xl font-black text-xs", config.columns === num ? "bg-primary text-white" : "bg-secondary text-muted-foreground")}
                                                >
                                                    {num}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Shop Name Display</label>
                                        <input
                                            className="input-field w-full"
                                            value={config.shopName}
                                            onChange={(e) => setConfig({ ...config, shopName: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Label Height (mm)</label>
                                            <input
                                                type="number"
                                                className="input-field w-full"
                                                value={config.labelHeight}
                                                onChange={(e) => setConfig({ ...config, labelHeight: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Barcode Scale</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                className="input-field w-full"
                                                value={config.labelWidth}
                                                onChange={(e) => setConfig({ ...config, labelWidth: Number(e.target.value) })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-4 border-t border-border">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input type="checkbox" checked={config.showShopName} onChange={e => setConfig({ ...config, showShopName: e.target.checked })} className="w-5 h-5 rounded-lg border-primary text-primary" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Include Shop Name</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input type="checkbox" checked={config.showPrice} onChange={e => setConfig({ ...config, showPrice: e.target.checked })} className="w-5 h-5 rounded-lg border-primary text-primary" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Include MRP</span>
                                        </label>
                                    </div>
                                </div>

                                <button onClick={() => setShowSettings(false)} className="btn-primary w-full h-14 mt-10 font-black uppercase tracking-widest">Save Settings</button>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </DashboardLayout>
    );
}
