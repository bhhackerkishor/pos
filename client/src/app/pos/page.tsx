'use client';

import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
    Search,
    Plus,
    Minus,
    Trash2,
    ShoppingCart,
    CreditCard,
    Banknote,
    Scan,
    Package,
    History,
    Save,
    User,
    Printer,
    Coins,
    Layers,
    Clock,
    PlusCircle,
    RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency, cn } from '@/lib/utils';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useSyncStore } from '@/store/useSyncStore';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { db } from '@/lib/db';
import { generateInvoiceNumber } from '@/lib/invoiceUtils';
import { useLiveQuery } from 'dexie-react-hooks';

export default function POSPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [products, setProducts] = useState<any[]>([]);
    const { items, addItem, removeItem, updateQuantity, clearCart, holdBill, heldBills, resumeBill } = useCartStore();
    const { isOnline, setOnline, syncData, pullMasterData } = useSyncStore();


    // UI States
    const [loading, setLoading] = useState(false);
    const [showCheckout, setShowCheckout] = useState(false);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [showCustomerForm, setShowCustomerForm] = useState(false);

    // Data States
    const [categories, setCategories] = useState<any[]>([]);
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [allCustomers, setAllCustomers] = useState<any[]>([]);
    const [recentPurchases, setRecentPurchases] = useState<any[]>([]);
    const [showHeldBills, setShowHeldBills] = useState(false);
    const [showCustomProductModal, setShowCustomProductModal] = useState(false);
    const [shopSettings, setShopSettings] = useState<any>(null);

    // Payment States
    const [receivedAmount, setReceivedAmount] = useState<string>('');
    const [autoPrint, setAutoPrint] = useState(true);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'credit'>('cash');
    const [customProduct, setCustomProduct] = useState({ name: '', price: '', taxRate: '18' });

    const [selectedProductIndex, setSelectedProductIndex] = useState(-1);
    const searchRef = useRef<HTMLInputElement>(null);
    const checkoutAmountRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const delaySearch = setTimeout(() => {
            fetchProducts();
        }, 300);
        return () => clearTimeout(delaySearch);
    }, [searchTerm, activeCategory]);

    useEffect(() => {
        fetchInitialData();
        const handleStatusChange = () => {
            setOnline(navigator.onLine);
            if (navigator.onLine) syncData();
        };
        window.addEventListener('online', handleStatusChange);
        window.addEventListener('offline', handleStatusChange);

        const handleKeyDown = (e: KeyboardEvent) => {
            // Shortcuts
            if (e.key === 'F2') { e.preventDefault(); searchRef.current?.focus(); }
            if (e.key === 'F4') { e.preventDefault(); setShowCheckout(true); }
            if (e.ctrlKey && e.key === 'p') {
                e.preventDefault();
                if (items.length > 0) handlePrint({ items, subTotal: calculateTotals().subtotal, grandTotal: total, createdAt: new Date(), invoiceNumber: 'DRAFT' });
            }
            if (e.key === 'Escape') {
                setShowCheckout(false);
                setShowCustomerForm(false);
                setShowHeldBills(false);
                setShowCustomProductModal(false);
            }
            if (e.altKey && e.key === 'c') { e.preventDefault(); clearCart(); }

            // Scanner Support: Auto-focus search if no input is active
            if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
                if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
                    searchRef.current?.focus();
                }
            }



            // Navigation in search results
            if (document.activeElement === searchRef.current) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSelectedProductIndex(prev => Math.min(prev + 1, products.length - 1));
                }
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelectedProductIndex(prev => Math.max(prev - 1, 0));
                }
                if (e.key === 'Enter' && selectedProductIndex >= 0) {
                    e.preventDefault();
                    addItem(products[selectedProductIndex]);
                    setSelectedProductIndex(-1);
                    setSearchTerm('');
                    toast.success(`Added ${products[selectedProductIndex].name}`);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        if (navigator.onLine) syncData();
        return () => {
            window.removeEventListener('online', handleStatusChange);
            window.removeEventListener('offline', handleStatusChange);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [products, selectedProductIndex]);

    const fetchInitialData = async () => {
        try {
            const catRes = await api.get('/categories');
            setCategories(catRes.data.data);
            const custRes = await api.get('/customers');
            setAllCustomers(custRes.data.data);
            const recentRes = await api.get('/sales?limit=10');
            const recentItems = recentRes.data.data.flatMap((sale: any) => sale.items).slice(0, 10);
            const uniqueRecents = Array.from(new Map(recentItems.map((item: any) => [item.product, { ...item, _id: item.product }])).values());
            setRecentPurchases(uniqueRecents);

            const settingsRes = await api.get('/settings');
            setShopSettings(settingsRes.data.data);
        } catch (error) {
            console.error('Failed to load initial terminal data');
        }
    };

    const fetchProducts = async () => {
        try {
            setLoading(true);
            // Search in local IndexedDB
            let query: any = db.products;
            if (activeCategory !== 'all') {
                query = query.where('category').equals(activeCategory);
            }

            let data = await (activeCategory !== 'all' ? query.toArray() : db.products.toArray());

            // If local DB is empty and we're online, try pulling master data
            if (data.length === 0 && isOnline && !searchTerm && activeCategory === 'all') {
                await pullMasterData();
                data = await db.products.toArray();
            }
            if (searchTerm) {
                const lowerSearch = searchTerm.toLowerCase();
                data = data.filter((p: any) =>
                    p.name.toLowerCase().includes(lowerSearch) ||
                    (p.barcode && p.barcode.includes(lowerSearch)) ||
                    p.sku.toLowerCase().includes(lowerSearch)
                );
            }

            // Auto-add if exact barcode match
            if (searchTerm && data.length === 1 && (data[0].barcode === searchTerm || data[0].sku === searchTerm)) {
                addItem(data[0]);
                setSearchTerm('');
                toast.success(`Added ${data[0].name}`);
            }

            setProducts(data);
        } catch (error) {
            toast.error('Failed to load local products');
        } finally {
            setLoading(false);
        }
    };

    const handleAddCustomProduct = (e: React.FormEvent) => {
        e.preventDefault();
        const product = {
            _id: `CUSTOM-${Date.now()}`,
            name: customProduct.name,
            price: Number(customProduct.price),
            costPrice: 0,
            taxRate: Number(customProduct.taxRate),
            sku: 'CUSTOM',
            unit: 'pcs',
            stockQuantity: 999,
            lowStockThreshold: 0
        };
        addItem(product);
        setShowCustomProductModal(false);
        setCustomProduct({ name: '', price: '', taxRate: '18' });
        toast.success('Custom product added');
    };

    const calculateTotals = () => {
        let subtotal = 0;
        let taxTotal = 0;
        items.forEach(item => {
            let price = item.price;
            if (item.wholesalePrice && item.wholesaleThreshold && item.quantity >= item.wholesaleThreshold) {
                price = item.wholesalePrice;
            }
            subtotal += price * item.quantity;
            taxTotal += (price * item.quantity * item.taxRate) / 100;
        });
        return { subtotal, taxTotal, total: subtotal + taxTotal };
    };

    const { total } = calculateTotals();
    const changeAmount = Number(receivedAmount) > total ? (Number(receivedAmount) - total) : 0;
    const balanceShortfall = total > Number(receivedAmount) ? (total - Number(receivedAmount)) : 0;

    const handleCheckout = async () => {
  try {
    setLoading(true);

    if (items.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    const invoiceNumber = await generateInvoiceNumber();

    const totals = calculateTotals();

    const totalQuantity = items.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    // GST Split (India)
    const cgst = totals.taxTotal / 2;
    const sgst = totals.taxTotal / 2;
    const igst = 0;

    const amountPaid =
      paymentMethod === 'credit'
        ? 0
        : Number(receivedAmount) || totals.total;

    const saleData = {
      invoiceNumber,

      // REQUIRED (User performing sale)
      cashier: useAuthStore.getState().user?._id,

      // Optional customer reference
      customer: selectedCustomerId || undefined,

      customerDetails: {
        name: customerName || 'Walk-in Customer',
        phone: customerPhone || '',
      },

      items: items.map(item => {
        const appliedPrice =
          item.wholesalePrice &&
          item.wholesaleThreshold &&
          item.quantity >= item.wholesaleThreshold
            ? item.wholesalePrice
            : item.price;

        const subTotal = appliedPrice * item.quantity;
        const taxAmount = (subTotal * (item.taxRate || 0)) / 100;

        return {
          product: item._id,          // ObjectId
          name: item.name,
          quantity: item.quantity,
          price: appliedPrice,
          costPrice: item.costPrice || 0,
          taxRate: item.taxRate || 0,
          taxAmount,
          discount: 0,
          subTotal,
        };
      }),

      totalQuantity,

      subTotal: totals.subtotal,
      taxTotal: totals.taxTotal,

      cgst,
      sgst,
      igst,

      discountTotal: 0,

      grandTotal: totals.total,

      paymentMethod, // cash | upi | card | credit | split

      status: 'completed',

      paymentStatus:
        paymentMethod === 'credit' ? 'pending' : 'paid',

      amountPaid,

      changeAmount,

      offlineId: `SALE-${Date.now()}`,

      synced: false,
    };

    // ===============================
    // OFFLINE FIRST: Save locally
    // ===============================
    await db.sales.add(saleData);

    // Deduct stock locally
    for (const item of saleData.items) {
      const product = await db.products.get(item.product);
      if (product) {
        await db.products.update(item.product, {
          stockQuantity:
            (product.stockQuantity || 0) - item.quantity,
        });
      }
    }

    toast.success('Sale completed');

    // Auto print
    if (autoPrint) {
      handlePrint(saleData);
    }

    // Background sync if online
    if (isOnline) {
      syncData();
    }

    // Reset UI
    clearCart();
    setCustomerName('');
    setCustomerPhone('');
    setSelectedCustomerId(null);
    setReceivedAmount('');
    setShowCheckout(false);

    fetchProducts();
  } catch (error) {
    console.error(error);
    toast.error('Checkout failed');
  } finally {
    setLoading(false);
  }
};

    const handlePrint = (sale: any) => {
        const printWindow = window.open('', '_blank')
        if (!printWindow) return

        const printerWidth = shopSettings?.thermalPrinterWidth || '80mm'
        const is58mm = printerWidth.includes('58')

        printWindow.document.write(`
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>Receipt</title>
      <style>
        @page { margin: 0; }
        body {
          font-family: monospace;
          width: ${printerWidth};
          margin: 0 auto;
          padding: ${is58mm ? '6px' : '10px'};
          color: #000;
        }

        .center { text-align: center; }
        .bold { font-weight: bold; }

        .header {
          border-bottom: 1px dashed #000;
          padding-bottom: 6px;
          margin-bottom: 6px;
        }

        .shop-name {
          font-size: ${is58mm ? '15px' : '18px'};
          font-weight: bold;
        }

        .meta {
          font-size: ${is58mm ? '10px' : '11px'};
          margin-top: 3px;
        }

        .item-row {
          display: flex;
          align-items: flex-start;
          margin: 3px 0;
          font-size: ${is58mm ? '11px' : '13px'};
        }

        .header-row {
          font-weight: bold;
        }

        /* ===== COLUMN LAYOUT SWITCH ===== */

        /* 80mm / 76mm */
        .name-lg { width: 48%; }
        .qty-lg { width: 12%; text-align: center; }
        .rate-lg { width: 18%; text-align: right; }
        .amt-lg { width: 22%; text-align: right; }

        /* 58mm */
        .name-sm { width: 65%; }
        .qty-sm { width: 15%; text-align: center; }
        .amt-sm { width: 20%; text-align: right; }

        .name {
          word-break: break-word;
        }

        /* AUTO FONT SHRINK */
        .name.md { font-size: ${is58mm ? '11px' : '13px'}; }
        .name.sm { font-size: ${is58mm ? '10px' : '12px'}; }
        .name.xs { font-size: ${is58mm ? '9px' : '11px'}; }

        .divider {
          border-top: 1px dashed #000;
          margin: 5px 0;
        }

        .totals .row {
          display: flex;
          justify-content: space-between;
          font-size: ${is58mm ? '11px' : '13px'};
          margin: 2px 0;
        }

        .grand {
          font-size: ${is58mm ? '14px' : '17px'};
          font-weight: bold;
          border-top: 2px solid #000;
          padding-top: 4px;
          margin-top: 4px;
        }

        .footer {
          border-top: 1px dashed #000;
          margin-top: 8px;
          padding-top: 6px;
          font-size: ${is58mm ? '9px' : '11px'};
          text-align: center;
        }
      </style>
    </head>

    <body onload="window.print(); window.close();">

      <!-- HEADER -->
      <div class="header center">
        <div class="shop-name">
          ${shopSettings?.shopName || 'OHM SAKTHI STORE'}
        </div>
        ${shopSettings?.gstin ? `<div class="meta">GSTIN: ${shopSettings.gstin}</div>` : ''}
        <div class="meta">
          INV: ${sale.invoiceNumber}<br/>
          ${new Date(sale.createdAt).toLocaleString()}<br/>
          CUSTOMER: ${sale.customerDetails?.name || sale.customer?.name || 'Walk-in'}
        </div>
      </div>

      ${is58mm
                ? `
        <!-- 58MM HEADER -->
        <div class="item-row header-row">
          <span class="name name-sm">ITEM</span>
          <span class="qty-sm">QTY</span>
          <span class="amt-sm">AMT</span>
        </div>
        <div class="divider"></div>

        ${sale.items.map((i: any) => {
                    const l = i.name.length
                    const c = l > 28 ? 'xs' : l > 20 ? 'sm' : 'md'
                    return `
            <div class="item-row">
              <span class="name name-sm ${c}">${i.name}</span>
              <span class="qty-sm">${i.quantity}</span>
              <span class="amt-sm">${formatCurrency(i.price * i.quantity)}</span>
            </div>
          `
                }).join('')}
        `
                : `
        <!-- 80MM HEADER -->
        <div class="item-row header-row">
          <span class="name name-lg">ITEM</span>
          <span class="qty-lg">QTY</span>
          <span class="rate-lg">RATE</span>
          <span class="amt-lg">AMT</span>
        </div>
        <div class="divider"></div>

        ${sale.items.map((i: any) => {
                    const l = i.name.length
                    const c = l > 32 ? 'xs' : l > 24 ? 'sm' : 'md'
                    return `
            <div class="item-row">
              <span class="name name-lg ${c}">${i.name}</span>
              <span class="qty-lg">${i.quantity}</span>
              <span class="rate-lg">${formatCurrency(i.price)}</span>
              <span class="amt-lg">${formatCurrency(i.price * i.quantity)}</span>
            </div>
          `
                }).join('')}
        `
            }

      <div class="divider"></div>

      <!-- TOTALS -->
      <div class="totals">
        <div class="row">
          <span>SUBTOTAL</span>
          <span>${formatCurrency(sale.subTotal)}</span>
        </div>

        <div class="row">
          <span>TOTAL</span>
          <span>${formatCurrency(sale.grandTotal)}</span>
        </div>
      </div>

      <!-- FOOTER -->
      <div class="footer">
        Thank you for shopping!<br/>
        ${shopSettings?.address || ''}
      </div>

    </body>
  </html>
  `)

        printWindow.document.close()
    };
    return (
        <DashboardLayout>
            <div className="flex flex-col h-full gap-8">
                <div className="flex flex-wrap items-center justify-between gap-6">
                    <div className="flex items-center gap-4 flex-1 max-w-2xl">
                        <div className="relative flex-1">
                            {!isOnline && (
                                <div className="absolute -top-6 left-0 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Offline Mode Active</span>
                                </div>
                            )}
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <input ref={searchRef} type="text" placeholder="Barcode / Product... (Alt+S)" className="input-field w-full pl-12 h-14" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => setShowHeldBills(true)} className="flex items-center gap-2 px-6 h-14 glass rounded-2xl font-black text-xs uppercase tracking-widest text-primary border border-primary/20"><History size={18} /> Resume ({heldBills.length})</button>
                        <button onClick={() => setShowCustomerForm(!showCustomerForm)} className={cn("flex items-center gap-2 px-6 h-14 glass rounded-2xl font-black text-xs uppercase tracking-widest transition-all border", customerName ? "text-emerald-500 border-emerald-500/50 bg-emerald-500/5 shadow-lg shadow-emerald-500/10" : "text-muted-foreground border-border")}>
                            <User size={18} />
                            <div className="text-left">
                                <p className="leading-none">{customerName || 'Add Customer'}</p>
                                {customerName && <p className="text-[8px] mt-1 text-emerald-600/60 font-black">BAL: {formatCurrency(allCustomers.find(c => c.phone === customerPhone)?.outstandingBalance || 0)}</p>}
                            </div>
                        </button>
                        <button onClick={holdBill} className="flex items-center gap-2 px-6 h-14 glass rounded-2xl font-black text-xs uppercase tracking-widest text-amber-500 hover:bg-amber-500/10 transition-all border border-amber-500/20"><Save size={18} /> Hold Bill</button>
                        <button onClick={() => setShowCustomProductModal(true)} className="flex items-center gap-2 px-6 h-14 glass rounded-2xl font-black text-xs uppercase tracking-widest text-indigo-500 border border-indigo-500/20"><PlusCircle size={18} /> Custom Item</button>
                    </div>
                </div>

                <div className="flex-1 flex gap-10 min-h-0">
                    <div className="flex-1 flex flex-col gap-6">
                        {showCustomerForm && (
                            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="glass-card !p-8 space-y-6 bg-secondary/50 border-primary/20 shadow-2xl">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">Quick Select Customer</label>
                                        <select className="input-field w-full h-12 bg-background font-bold" value={customerPhone} onChange={(e) => {
                                            const cust = allCustomers.find(c => c.phone === e.target.value);
                                            if (cust) {
                                                setCustomerName(cust.name);
                                                setCustomerPhone(cust.phone);
                                                setSelectedCustomerId(cust._id);
                                            } else {
                                                setSelectedCustomerId(null);
                                            }
                                        }}>
                                            <option value="">New / Walking Customer</option>
                                            {allCustomers.map(c => <option key={c._id} value={c.phone}>{c.name} ({c.phone})</option>)}
                                        </select>
                                    </div>
                                    <div className="flex gap-4 items-end">
                                        <div className="flex-1">
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">Full Name</label>
                                            <input type="text" placeholder="Individual / Firm Name" className="input-field w-full h-12 bg-background font-bold" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">Phone Number</label>
                                            <input type="text" placeholder="+91" className="input-field w-full h-12 bg-background font-bold" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                                        </div>
                                        <button onClick={() => setShowCustomerForm(false)} className="btn-primary h-12 px-8 text-[10px] uppercase font-black">Sync Ledger</button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar">
                            <button onClick={() => setActiveCategory('all')} className={cn("px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border", activeCategory === 'all' ? "bg-primary text-white border-primary-light shadow-lg" : "glass text-muted-foreground border-border")}>All Vaults</button>
                            {categories.map(cat => <button key={cat._id} onClick={() => setActiveCategory(cat._id)} className={cn("flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border", activeCategory === cat._id ? "bg-primary text-white border-primary-light shadow-lg" : "glass text-muted-foreground border-border")}><Layers size={14} /> {cat.name}</button>)}
                        </div>

                        {recentPurchases.length > 0 && activeCategory === 'all' && !searchTerm && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest italic"><Clock size={14} /> Recently Purchased</div>
                                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                                    {recentPurchases.map((p) => (
                                        <button key={p._id} onClick={() => addItem(p)} className="flex flex-col items-center gap-2 p-3 glass rounded-2xl min-w-[100px] hover:border-primary/50 transition-all group">
                                            <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">{p.image ? <img src={p.image} className="w-full h-full object-cover rounded-lg" /> : <Package size={20} />}</div>
                                            <span className="text-[9px] font-black truncate w-full">{p.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                            {loading ? <div className="h-full flex items-center justify-center opacity-20 uppercase font-black tracking-widest">Searching...</div> : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                                    {products.map((p, idx) => (
                                        <motion.div
                                            key={p._id}
                                            layout
                                            onClick={() => addItem(p)}
                                            className={cn(
                                                "glass-card !p-3 hover:border-primary/50 transition-all cursor-pointer group relative overflow-hidden flex flex-col items-center text-center",
                                                selectedProductIndex === idx && "ring-2 ring-primary border-primary bg-primary/5"
                                            )}
                                        >
                                            <div className="w-full aspect-square bg-secondary rounded-2xl flex items-center justify-center text-primary group-hover:scale-105 transition-all overflow-hidden mb-3 relative shadow-inner">
                                                {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : <Package size={32} strokeWidth={1.5} opacity={0.5} />}
                                                {p.wholesalePrice && <div className="absolute top-2 right-2 px-2 py-0.5 bg-emerald-500/90 backdrop-blur-md rounded-md text-[8px] font-black text-white uppercase tracking-widest italic shadow-lg">WS Active</div>}
                                                {selectedProductIndex === idx && <div className="absolute inset-0 bg-primary/10 flex items-center justify-center font-black text-white text-[10px] uppercase">Hit Enter</div>}
                                            </div>
                                            <div className="px-2 w-full">
                                                <h3 className="font-bold text-foreground text-[11px] line-clamp-1 tracking-tight mb-1">{p.name}</h3>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-primary font-black text-sm">{formatCurrency(p.price)}</span>
                                                    {p.stockQuantity !== undefined && (
                                                        <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full", p.stockQuantity <= p.lowStockThreshold ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-500")}>{p.stockQuantity}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="w-[450px] flex flex-col glass rounded-[2.5rem] border border-border overflow-hidden shadow-2xl bg-card">
                        <div className="p-8 border-b border-border bg-secondary/30 flex items-center justify-between">
                            <div className="flex items-center gap-4"><div className="w-12 h-12 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20"><ShoppingCart size={24} /></div><h2 className="text-xl font-black tracking-tight uppercase">Terminal Cart</h2></div>
                            <button onClick={clearCart} className="w-10 h-10 bg-destructive/5 text-destructive rounded-xl hover:bg-destructive transition-all hover:text-white border border-destructive/10 flex items-center justify-center "><Trash2 size={18} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
                            <AnimatePresence>
                                {items.length === 0 ? <div className="h-full flex flex-col items-center justify-center opacity-20"><ShoppingCart size={60} /><p className="text-xs font-black uppercase tracking-widest mt-4">Registry Locked</p></div> : items.map((item) => {
                                    const isWholesale = item.wholesalePrice && item.wholesaleThreshold && item.quantity >= item.wholesaleThreshold;
                                    const appliedPrice = isWholesale ? item.wholesalePrice : item.price;
                                    return (
                                        <motion.div key={item._id} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-4 bg-secondary/50 border border-border/50 rounded-2xl flex items-center gap-4 group">
                                            <div className="flex-1 min-w-0"><p className="font-bold text-xs truncate tracking-tight">{item.name}</p><p className={cn("text-[9px] font-black uppercase", isWholesale ? "text-emerald-500" : "text-muted-foreground")}>{formatCurrency(appliedPrice || 0)} {isWholesale && 'WS_RATE'}</p></div>
                                            <div className="flex items-center gap-2 bg-background border border-border p-1 rounded-xl">
                                                <button onClick={() => { if (item.quantity === 1) removeItem(item._id); else updateQuantity(item._id, item.quantity - 1); }} className="w-6 h-6 flex items-center justify-center text-primary hover:bg-primary/10 rounded-lg transition-colors"><Minus size={12} /></button>
                                                <span className="w-6 text-center font-black text-[10px]">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item._id, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center text-primary hover:bg-primary/10 rounded-lg transition-colors"><Plus size={12} /></button>
                                            </div>
                                            <button onClick={() => removeItem(item._id)} className="w-8 h-8 flex items-center justify-center text-destructive opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive/10 rounded-lg"><Trash2 size={14} /></button>
                                            <div className="text-right min-w-[80px]"><p className="font-black text-primary text-sm tracking-tighter">{formatCurrency((appliedPrice || 0) * item.quantity).split('.')[0]}</p></div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                        <div className="p-8 bg-secondary/20 border-t border-border">
                            <div className="flex justify-between items-end mb-8">
                                <div className="flex flex-col"><span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-1 italic">Checkout Total</span><h3 className="text-5xl font-black text-primary tracking-tighter leading-none">{formatCurrency(total).split('.')[0]}</h3></div>
                                <button onClick={() => items.length > 0 && setShowCheckout(true)} className="btn-primary h-16 px-10 rounded-2xl text-sm font-black tracking-widest uppercase shadow-xl hover:scale-105 transition-all">Settle Bill</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showCheckout && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/80 backdrop-blur-3xl">
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 40 }} className="glass-card max-w-4xl w-full relative z-10 !p-12 border-primary/20 bg-card shadow-2xl">
                            <div className="flex gap-12">
                                <div className="flex-1 space-y-8">
                                    <div><p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4">Settle Transaction</p><h2 className="text-6xl font-black tracking-tighter text-foreground mb-2">{formatCurrency(total)}</h2><div className="flex items-center gap-3 p-3 bg-secondary rounded-2xl border border-border"><User size={16} className="text-primary" /><span className="text-xs font-black uppercase tracking-widest">{customerName || 'Walking Customer (Guest)'}</span></div></div>
                                    <div className="space-y-6">
                                        <div><label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 block flex items-center gap-2"><Coins size={14} /> Currency Received</label><input ref={checkoutAmountRef} autoFocus type="number" className="input-field w-full h-20 text-4xl font-black tracking-tighter bg-secondary text-primary" placeholder="0.00" value={receivedAmount} onChange={(e) => setReceivedAmount(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCheckout()} /></div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="bg-emerald-500/5 p-6 rounded-3xl border border-emerald-500/10"><p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Change Return</p><p className="text-3xl font-black text-emerald-600 tracking-tighter">{formatCurrency(changeAmount)}</p></div>
                                            <div className={cn("p-6 rounded-3xl border transition-all", balanceShortfall > 0 ? "bg-amber-500/5 border-amber-500/10" : "bg-secondary border-border opacity-30")}><p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Shortfall / Due</p><p className="text-3xl font-black text-amber-600 tracking-tighter">{formatCurrency(balanceShortfall)}</p></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-[300px] border-l border-border pl-12 space-y-8">
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Instrument Type</p>
                                        <button onClick={() => setPaymentMethod('cash')} className={cn("w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-4 px-6 transition-all border", paymentMethod === 'cash' ? "bg-emerald-500 text-white border-emerald-400 shadow-xl shadow-emerald-500/20" : "bg-background text-muted-foreground border-border")}><Banknote size={20} /> Cash</button>
                                        <button onClick={() => setPaymentMethod('upi')} className={cn("w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-4 px-6 transition-all border", paymentMethod === 'upi' ? "bg-primary text-white border-primary-light shadow-xl shadow-primary/20" : "bg-background text-muted-foreground border-border")}><Scan size={20} /> UPI / QR</button>
                                        <button disabled={!customerName} onClick={() => setPaymentMethod('credit')} className={cn("w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-4 px-6 transition-all border", paymentMethod === 'credit' ? "bg-amber-500 text-white border-amber-400 shadow-xl shadow-amber-500/20" : "bg-background text-muted-foreground border-border", !customerName && "opacity-20 grayscale pointer-events-none")}><CreditCard size={20} /> Credit (Due)</button>
                                    </div>
                                    <div className="p-6 bg-secondary rounded-3xl border border-border"><label className="flex items-center gap-4 cursor-pointer"><div className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={autoPrint} onChange={(e) => setAutoPrint(e.target.checked)} className="sr-only peer" /><div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div></div><span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Printer size={16} /> Auto-Print Receipt</span></label></div>
                                    <button onClick={handleCheckout} className="btn-primary w-full h-20 text-lg font-black tracking-[0.2em] shadow-2xl shadow-primary/40 rounded-[2rem]">COMMIT SALE</button>
                                    <button onClick={() => setShowCheckout(false)} className="w-full text-center text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:text-foreground">Back to Cart</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showHeldBills && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/80 backdrop-blur-xl">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card max-w-2xl w-full !p-12 border-primary/20 bg-card">
                            <div className="flex justify-between items-center mb-8"><h2 className="text-3xl font-black uppercase tracking-tighter">Held Transactions</h2><button onClick={() => setShowHeldBills(false)} className="w-10 h-10 glass rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground">X</button></div>
                            <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-4">
                                {heldBills.length === 0 ? <div className="text-center py-20 opacity-30 font-black uppercase tracking-widest">No Drafts Found</div> : heldBills.map((bill) => (
                                    <div key={bill.id} className="p-6 glass rounded-3xl border border-border flex items-center justify-between group hover:border-primary/30 transition-all">
                                        <div><p className="font-black text-primary tracking-tighter">{bill.id}</p><p className="text-[10px] font-bold text-muted-foreground uppercase">{new Date(bill.timestamp).toLocaleString()}</p><div className="flex gap-2 mt-2">{bill.items.slice(0, 3).map((item, i) => <span key={i} className="text-[8px] bg-secondary px-2 py-0.5 rounded font-black uppercase">{item.name}</span>)}{bill.items.length > 3 && <span className="text-[8px] opacity-40 font-black">+{bill.items.length - 3} MORE</span>}</div></div>
                                        <button onClick={() => { resumeBill(bill.id); setShowHeldBills(false); }} className="px-6 h-12 bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center gap-2"><RotateCcw size={16} /> Resume</button>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showCustomProductModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/80 backdrop-blur-xl">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card max-w-md w-full !p-12 border-primary/20 bg-card">
                            <div className="flex justify-between items-center mb-8"><h2 className="text-3xl font-black uppercase tracking-tighter">Custom Entry</h2><button onClick={() => setShowCustomProductModal(false)} className="w-10 h-10 glass rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground">X</button></div>
                            <form onSubmit={handleAddCustomProduct} className="space-y-6">
                                <div><label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">Item Name</label><input required type="text" className="input-field w-full h-14 bg-secondary font-bold" placeholder="E.g. Loose Sugar" value={customProduct.name} onChange={e => setCustomProduct({ ...customProduct, name: e.target.value })} /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">Price</label><input required type="number" className="input-field w-full h-14 bg-secondary font-bold" placeholder="0.00" value={customProduct.price} onChange={e => setCustomProduct({ ...customProduct, price: e.target.value })} /></div>
                                    <div><label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">GST (%)</label><select className="input-field w-full h-14 bg-secondary font-bold" value={customProduct.taxRate} onChange={e => setCustomProduct({ ...customProduct, taxRate: e.target.value })}><option value="0">0%</option><option value="5">5%</option><option value="12">12%</option><option value="18">18%</option><option value="28">28%</option></select></div>
                                </div>
                                <button type="submit" className="btn-primary w-full h-16 font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/30 rounded-2xl">Confirm Addition</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
}
