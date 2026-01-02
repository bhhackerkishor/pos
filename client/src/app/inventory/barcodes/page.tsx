'use client';

import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Search, Printer, Tag, Download, LayoutGrid, List } from 'lucide-react';
import { motion } from 'framer-motion';
import { db } from '@/lib/db';
import { generateBarcode, barcodePrintStyles } from '@/lib/barcodeUtils';
import { formatCurrency, cn } from '@/lib/utils';
import { useSyncStore } from '@/store/useSyncStore';
import { RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';


export default function BarcodeGeneratorPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [shopName, setShopName] = useState('My Shop');

    const { isOnline, pullMasterData } = useSyncStore();

    useEffect(() => {
        loadProducts();
    }, []);


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
        if (selectedProducts.find(item => item._id === p._id)) {
            setSelectedProducts(selectedProducts.filter(item => item._id !== p._id));
        } else {
            setSelectedProducts([...selectedProducts, p]);
        }
    };

    const handlePrint = () => {
        if (selectedProducts.length === 0) {
            toast.error('Select items to print');
            return;
        }

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const content = selectedProducts.map(p => `
            <div class="barcode-label">
                <div class="shop-name">${shopName}</div>
                <div class="product-name">${p.name}</div>
                <div class="price-section">MRP: ${formatCurrency(p.price)}</div>
                <svg id="barcode-${p._id}"></svg>
            </div>
        `).join('');

        printWindow.document.write(`
            <html>
                <head>
                    <style>
                        ${barcodePrintStyles}
                        body { margin: 0; padding: 20px; display: flex; flex-wrap: wrap; gap: 10px; }
                    </style>
                    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
                </head>
                <body>
                    ${content}
                    <script>
                        window.onload = () => {
                            ${selectedProducts.map(p => `JsBarcode("#barcode-${p._id}", "${p.barcode || p.sku}", { width: 1.5, height: 30, fontSize: 10 });`).join('\n')}
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
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter">Barcode Generator</h1>
                        <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mt-1 italic">Inventory Labeling System</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={async () => { await pullMasterData(); loadProducts(); }}
                            className="w-14 h-14 glass rounded-2xl flex items-center justify-center text-primary border border-border hover:bg-secondary transition-all"
                            title="Sync Products"
                        >
                            <RefreshCw size={20} />
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-8 h-14 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all"
                        >
                            <Printer size={18} /> Print Labels ({selectedProducts.length})
                        </button>
                    </div>

                </div>

                <div className="flex gap-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search by name, SKU or barcode..."
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

                <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                            {filteredProducts.map(p => (
                                <motion.div
                                    key={p._id}
                                    layout
                                    onClick={() => toggleSelect(p)}
                                    className={cn(
                                        "glass-card !p-4 cursor-pointer transition-all relative border-2",
                                        selectedProducts.find(item => item._id === p._id) ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                                    )}
                                >
                                    {selectedProducts.find(item => item._id === p._id) && (
                                        <div className="absolute top-2 right-2 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center shadow-lg"><Tag size={12} /></div>
                                    )}
                                    <div className="aspect-video bg-secondary rounded-xl mb-4 flex flex-col items-center justify-center p-4">
                                        <div className="w-full h-8 bg-black/10 rounded mb-2 animate-pulse" />
                                        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">{p.barcode || p.sku}</span>
                                    </div>
                                    <h3 className="font-bold text-xs line-clamp-1 mb-1">{p.name}</h3>
                                    <p className="text-primary font-black text-sm">{formatCurrency(p.price)}</p>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="glass rounded-[2rem] border border-border overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-secondary/50">
                                    <tr className="text-left">
                                        <th className="p-5 text-[10px] font-black uppercase tracking-widest">Product</th>
                                        <th className="p-5 text-[10px] font-black uppercase tracking-widest">SKU / Barcode</th>
                                        <th className="p-5 text-[10px] font-black uppercase tracking-widest">Price</th>
                                        <th className="p-5 text-[10px] font-black uppercase tracking-widest text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.map(p => (
                                        <tr key={p._id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                                            <td className="p-5 font-bold text-sm">{p.name}</td>
                                            <td className="p-5 text-xs font-mono">{p.barcode || p.sku}</td>
                                            <td className="p-5 font-black text-primary">{formatCurrency(p.price)}</td>
                                            <td className="p-5 text-right">
                                                <button
                                                    onClick={() => toggleSelect(p)}
                                                    className={cn(
                                                        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                                        selectedProducts.find(item => item._id === p._id) ? "bg-primary text-white" : "glass border-border"
                                                    )}
                                                >
                                                    {selectedProducts.find(item => item._id === p._id) ? 'Selected' : 'Select'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
