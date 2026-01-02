'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Filter,
    FileText,
    Download,
    Eye,
    Receipt,
    Calendar,
    ArrowRight,
    Printer,
    User,
    CreditCard
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { exportToExcel } from '@/lib/excel';
import Pagination from '@/components/Pagination';

export default function ReportsPage() {
    const [sales, setSales] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSale, setSelectedSale] = useState<any>(null);
    const [filter, setFilter] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit, setLimit] = useState(10);

    useEffect(() => {
        fetchSales();
    }, [page, limit, filter, startDate, endDate]);

    const fetchSales = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/sales?page=${page}&limit=${limit}&filter=${filter}&startDate=${startDate}&endDate=${endDate}&search=${searchTerm}`);
            setSales(res.data.data);
            setTotalPages(res.data.pages);
        } catch (err) {
            toast.error('Failed to load transaction history');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchSales();
    };

    const handleExport = () => {
        const exportData = sales.map(s => ({
            Invoice: s.invoiceNumber,
            Date: new Date(s.createdAt).toLocaleString(),
            Customer: s.customerDetails?.name || s.customer?.name || 'Walk-in',
            Items: s.items.length,
            Total: s.grandTotal,
            Method: s.paymentMethod
        }));
        exportToExcel(exportData, 'Sales_Report');
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
          padding: ${is58mm ? '6px' : '10px'};
          color: #000;
        }

        .center { text-align: center; }
        .bold { font-weight: bold; }

        .header {
          text-align: center;
          border-bottom: 1px dashed #000;
          padding-bottom: 6px;
          margin-bottom: 6px;
        }

        .shop {
          font-size: ${is58mm ? '15px' : '18px'};
          font-weight: bold;
        }

        .meta {
          font-size: ${is58mm ? '10px' : '11px'};
          margin-top: 2px;
        }

        .row {
          display: flex;
          justify-content: space-between;
          font-size: ${is58mm ? '11px' : '13px'};
          margin: 3px 0;
        }

        /* ===== COLUMN SYSTEM ===== */
        .item-row {
          display: flex;
          margin: 3px 0;
          font-size: ${is58mm ? '11px' : '13px'};
        }

        .name {
          width: ${is58mm ? '65%' : '55%'};
          word-break: break-word;
        }

        .qty {
          width: ${is58mm ? '15%' : '15%'};
          text-align: center;
        }

        .amt {
          width: ${is58mm ? '20%' : '30%'};
          text-align: right;
        }

        /* AUTO FONT SHRINK */
        .name.md { font-size: inherit; }
        .name.sm { font-size: ${is58mm ? '10px' : '12px'}; }
        .name.xs { font-size: ${is58mm ? '9px' : '11px'}; }

        .divider {
          border-top: 1px dashed #000;
          margin: 5px 0;
        }

        .total {
          border-top: 1px dashed #000;
          margin-top: 6px;
          padding-top: 4px;
        }

        .grand {
          font-size: ${is58mm ? '14px' : '17px'};
          font-weight: bold;
          margin-top: 4px;
        }

        .footer {
          text-align: center;
          font-size: ${is58mm ? '9px' : '11px'};
          margin-top: 10px;
        }
      </style>
    </head>

    <body onload="window.print(); window.close();">

      <!-- HEADER -->
      <div class="header">
        <div class="shop">OHM SAKTHI STORE</div>
        <div class="meta">GSTIN: 27AAACA1234A1Z1</div>
        <div class="meta">INV: ${sale.invoiceNumber}</div>
        <div class="meta">Customer: ${sale.customerDetails?.name || sale.customer?.name || 'Walk-in'}</div>
        <div class="meta">${new Date(sale.createdAt).toLocaleString()}</div>
      </div>

      <!-- ITEM HEADER -->
      <div class="item-row bold">
        <span class="name">ITEM</span>
        <span class="qty">QTY</span>
        <span class="amt">AMT</span>
      </div>
      <div class="divider"></div>

      <!-- ITEMS -->
      ${sale.items.map((i: any) => {
            const len = i.name.length
            const cls = len > 28 ? 'xs' : len > 20 ? 'sm' : 'md'
            return `
          <div class="item-row">
            <span class="name ${cls}">${i.name}</span>
            <span class="qty">${i.quantity}</span>
            <span class="amt">${formatCurrency(i.price * i.quantity)}</span>
          </div>
        `
        }).join('')}

      <!-- TOTAL -->
      <div class="total">
        <div class="row">
          <span>SUBTOTAL</span>
          <span>${formatCurrency(sale.subTotal)}</span>
        </div>
        <div class="row">
          <span>GST</span>
          <span>${formatCurrency(sale.taxTotal)}</span>
        </div>
        <div class="row grand">
          <span>TOTAL</span>
          <span>${formatCurrency(sale.grandTotal)}</span>
        </div>
      </div>

      <!-- FOOTER -->
      <div class="footer">
        Thank you for visiting!
      </div>

    </body>
  </html>
  `)

        printWindow.document.close()
    }


    const filteredSales = sales.filter(s =>
        s.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.customerDetails?.name || s.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="space-y-10">
                <header className="flex flex-wrap items-center justify-between gap-8">
                    <div>
                        <h1 className="text-5xl font-black text-foreground italic uppercase tracking-tighter">Transaction Audit</h1>
                        <p className="text-muted-foreground mt-2 font-medium uppercase text-[10px] tracking-[0.3em]">Billing History & Financial Reporting</p>
                    </div>
                </header>

                <div className="glass-card !p-0 overflow-hidden shadow-2xl border-border/50 bg-card">
                    <div className="p-8 border-b border-border bg-secondary/20 flex flex-wrap items-center gap-6">
                        <form onSubmit={handleSearch} className="relative flex-1 min-w-[300px]">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search by Invoice or Customer..."
                                className="input-field w-full pl-14 h-14 text-sm font-bold bg-background focus:ring-primary/20"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </form>
                        <div className="flex gap-4 flex-wrap">
                            <select
                                className="h-14 px-6 glass rounded-2xl text-xs font-black uppercase tracking-widest border border-border outline-none"
                                value={filter}
                                onChange={(e) => { setFilter(e.target.value); setPage(1); }}
                            >
                                <option value="all">All Time</option>
                                <option value="today">Today</option>
                                <option value="week">This Week</option>
                                <option value="month">This Month</option>
                                <option value="year">This Year</option>
                                <option value="custom">Custom Range</option>
                            </select>

                            {filter === 'custom' && (
                                <div className="flex gap-2">
                                    <input type="date" className="h-14 px-4 glass rounded-2xl text-xs border border-border" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1); }} />
                                    <input type="date" className="h-14 px-4 glass rounded-2xl text-xs border border-border" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1); }} />
                                </div>
                            )}

                            <button onClick={handleExport} className="h-14 px-6 glass rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-widest hover:bg-secondary transition-all border border-border">
                                <Download size={18} /> Export
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-secondary/50 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] border-b border-border">
                                    <th className="px-10 py-6">Invoice & Time</th>
                                    <th className="px-10 py-6">Customer Context</th>
                                    <th className="px-10 py-6">Performance</th>
                                    <th className="px-10 py-6">Instrument</th>
                                    <th className="px-10 py-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                <AnimatePresence>
                                    {sales.map((sale, idx) => (
                                        <motion.tr
                                            key={sale._id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.03 }}
                                            className="hover:bg-secondary/30 transition-all group"
                                        >
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-14 h-14 rounded-2xl bg-secondary border border-border flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                                                        <Receipt size={24} />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-foreground text-lg tracking-tight mb-1">{sale.invoiceNumber}</p>
                                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-muted px-2 py-0.5 rounded leading-none">{new Date(sale.createdAt).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground">
                                                        <User size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-foreground text-sm tracking-tight">{sale.customerDetails?.name || sale.customer?.name || 'Walk-in Customer'}</p>
                                                        <p className="text-[10px] font-bold text-muted-foreground">{sale.customerDetails?.phone || 'ANONYMOUS'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-black text-primary text-xl tracking-tighter">{formatCurrency(sale.grandTotal)}</span>
                                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">{sale.items.length} SKUs Sold</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="inline-flex items-center gap-3 px-4 py-2 bg-secondary rounded-xl border border-border text-[10px] font-black uppercase tracking-widest group-hover:border-primary/20 transition-all">
                                                    <CreditCard size={14} className="text-primary" />
                                                    {sale.paymentMethod}
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button onClick={() => setSelectedSale(sale)} className="w-12 h-12 glass rounded-xl text-primary hover:bg-primary hover:text-white transition-all shadow-sm flex items-center justify-center"><Eye size={18} /></button>
                                                    <button onClick={() => handlePrint(sale)} className="w-12 h-12 glass rounded-xl text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-sm flex items-center justify-center"><Printer size={18} /></button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                                {loading && <tr><td colSpan={5} className="py-20 text-center opacity-50 uppercase font-black text-xs tracking-widest">Auditing Transactions...</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>

                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>

            {/* Bill Preview Modal */}
            <AnimatePresence>
                {selectedSale && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/90 backdrop-blur-xl">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-card max-w-2xl w-full relative z-10 !p-12 border-primary/20 bg-card">
                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2">Invoice Review</p>
                                    <h2 className="text-4xl font-black tracking-tight">{selectedSale.invoiceNumber}</h2>
                                </div>
                                <button onClick={() => setSelectedSale(null)} className="w-12 h-12 glass rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground">X</button>
                            </div>

                            <div className="space-y-8">
                                <div className="grid grid-cols-2 gap-8 text-[11px] font-black uppercase tracking-widest text-muted-foreground bg-secondary/30 p-6 rounded-[2rem]">
                                    <div>
                                        <p className="mb-2">Operator</p>
                                        <p className="text-foreground text-sm tracking-tight">{selectedSale.cashier?.name || 'ADMIN'}</p>
                                    </div>
                                    <div>
                                        <p className="mb-2">Timestamp</p>
                                        <p className="text-foreground text-sm tracking-tight">{new Date(selectedSale.createdAt).toLocaleString()}</p>
                                    </div>
                                    <div className="col-span-2 pt-4 border-t border-border mt-2">
                                        <p className="mb-2">Customer Recipient</p>
                                        <p className="text-foreground text-sm tracking-tight font-black">{selectedSale.customerDetails?.name || selectedSale.customer?.name || 'Walk-in Customer'}</p>
                                    </div>
                                </div>

                                <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-4">
                                    {selectedSale.items.map((item: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-end border-b border-border/10 pb-4">
                                            <div>
                                                <p className="font-black text-sm tracking-tight">{item.name}</p>
                                                <p className="text-[10px] font-black text-muted-foreground uppercase">{item.quantity} units @ {formatCurrency(item.price)}</p>
                                            </div>
                                            <p className="font-black text-primary">{formatCurrency(item.subTotal)}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-8 border-t border-border space-y-4">
                                    <div className="flex justify-between items-center text-muted-foreground font-black uppercase text-[10px] tracking-widest">
                                        <span>Subtotal (Net)</span>
                                        <span>{formatCurrency(selectedSale.subTotal)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-muted-foreground font-black uppercase text-[10px] tracking-widest">
                                        <span>Taxes (GST 18%)</span>
                                        <span className="text-emerald-500">+{formatCurrency(selectedSale.taxTotal)}</span>
                                    </div>
                                    <div className="flex justify-between items-end pt-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Settled Amount</span>
                                            <h3 className="text-5xl font-black text-primary tracking-tighter leading-none">{formatCurrency(selectedSale.grandTotal)}</h3>
                                        </div>
                                        <div className="flex gap-4">
                                            <button onClick={() => handlePrint(selectedSale)} className="btn-primary px-8 h-14 rounded-2xl flex items-center gap-3 text-xs tracking-widest uppercase font-black"><Printer size={18} /> Print Copy</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
}
