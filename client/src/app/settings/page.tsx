'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { motion } from 'framer-motion';
import {
    Save,
    Settings as SettingsIcon,
    Store,
    MapPin,
    Phone,
    Mail,
    Hash,
    Printer,
    Bell,
    List,
    CreditCard
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        shopName: 'My Retail Shop',
        address: '',
        phone: '',
        email: '',
        gstin: '',
        currency: 'INR',
        currencySymbol: '₹',
        thermalPrinterWidth: '80mm',
        invoicePrefix: 'INV',
        lowStockAlert: true,
        paginationLimit: 10,
        receiptShowName: true,
        receiptShowQty: true,
        receiptShowPrice: true,
        receiptShowTax: true,
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const res = await api.get('/settings');
            if (res.data.data) {
                setSettings(res.data.data);
            }
        } catch (err) {
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            await api.post('/settings', settings);
            toast.success('Configuration saved successfully');
        } catch (err) {
            toast.error('Failed to save configuration');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <p className="text-muted-foreground uppercase font-black text-xs tracking-widest animate-pulse">Initializing System Configuration...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-10">
                <header className="flex flex-wrap items-center justify-between gap-8">
                    <div>
                        <h1 className="text-5xl font-black text-foreground italic uppercase tracking-tighter">System Engine</h1>
                        <p className="text-muted-foreground mt-2 font-medium uppercase text-[10px] tracking-[0.3em]">Master Configuration & Global Parameters</p>
                    </div>
                </header>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                    <div className="xl:col-span-8 space-y-8">
                        {/* Shop Profile */}
                        <div className="glass-card space-y-8">
                            <div className="flex items-center gap-4 text-primary">
                                <Store size={24} />
                                <h2 className="text-2xl font-black tracking-tight uppercase">Shop Profile</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Business Name</label>
                                    <input className="input-field w-full" value={settings.shopName} onChange={e => setSettings({ ...settings, shopName: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Gst Number (Optional)</label>
                                    <input className="input-field w-full" value={settings.gstin} onChange={e => setSettings({ ...settings, gstin: e.target.value })} />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Physical Address</label>
                                    <textarea className="input-field w-full min-h-[100px] pt-4" value={settings.address} onChange={e => setSettings({ ...settings, address: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Contact Phone</label>
                                    <input className="input-field w-full" value={settings.phone} onChange={e => setSettings({ ...settings, phone: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Email Address</label>
                                    <input className="input-field w-full" type="email" value={settings.email} onChange={e => setSettings({ ...settings, email: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        {/* Operational Settings */}
                        <div className="glass-card space-y-8">
                            <div className="flex items-center gap-4 text-primary">
                                <SettingsIcon size={24} />
                                <h2 className="text-2xl font-black tracking-tight uppercase">Operational Params</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Base Currency</label>
                                    <select className="input-field w-full h-14" value={settings.currency} onChange={e => setSettings({ ...settings, currency: e.target.value })}>
                                        <option value="INR">Indian Rupee (INR)</option>
                                        <option value="USD">US Dollar (USD)</option>
                                        <option value="EUR">Euro (EUR)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Currency Symbol</label>
                                    <input className="input-field w-full" value={settings.currencySymbol} onChange={e => setSettings({ ...settings, currencySymbol: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Records Per Page</label>
                                    <input type="number" className="input-field w-full" value={settings.paginationLimit} onChange={e => setSettings({ ...settings, paginationLimit: Number(e.target.value) })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Invoice Prefix</label>
                                    <input className="input-field w-full" value={settings.invoicePrefix} onChange={e => setSettings({ ...settings, invoicePrefix: e.target.value })} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="xl:col-span-4 space-y-8">
                        <div className="glass-card space-y-8">
                            <div className="flex items-center gap-4 text-primary">
                                <Printer size={24} />
                                <h2 className="text-2xl font-black tracking-tight uppercase">Hardware</h2>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Thermal Printer Width</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setSettings({ ...settings, thermalPrinterWidth: '58mm' })}
                                        className={`h-14 rounded-2xl font-black text-xs uppercase transition-all ${settings.thermalPrinterWidth === '58mm' ? 'bg-primary text-white shadow-lg' : 'glass hover:bg-secondary'}`}
                                    >
                                        58mm
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSettings({ ...settings, thermalPrinterWidth: '80mm' })}
                                        className={`h-14 rounded-2xl font-black text-xs uppercase transition-all ${settings.thermalPrinterWidth === '80mm' ? 'bg-primary text-white shadow-lg' : 'glass hover:bg-secondary'}`}
                                    >
                                        80mm
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-6 bg-secondary/30 p-6 rounded-3xl border border-border">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-4">Invoice Layout configuration</p>
                                <div className="space-y-3">
                                    {[
                                        { key: 'receiptShowName', label: 'Show Item Name' },
                                        { key: 'receiptShowQty', label: 'Show Quantity' },
                                        { key: 'receiptShowPrice', label: 'Show Unit Price' },
                                        { key: 'receiptShowTax', label: 'Show Tax Details' },
                                    ].map((item) => (
                                        <div key={item.key} className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
                                            <button
                                                type="button"
                                                onClick={() => setSettings({ ...settings, [item.key as keyof typeof settings]: !settings[item.key as keyof typeof settings] })}
                                                className={`w-10 h-6 rounded-full relative transition-all ${settings[item.key as keyof typeof settings] ? 'bg-primary' : 'bg-border'}`}
                                            >
                                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings[item.key as keyof typeof settings] ? 'right-1' : 'left-1'}`} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="glass-card space-y-8">
                            <div className="flex items-center gap-4 text-primary">
                                <Bell size={24} />
                                <h2 className="text-2xl font-black tracking-tight uppercase">Automations</h2>
                            </div>
                            <div className="flex items-center justify-between p-6 glass rounded-3xl">
                                <div>
                                    <p className="font-black text-sm uppercase">Low Stock Alerts</p>
                                    <p className="text-[10px] text-muted-foreground uppercase font-medium">Auto-ping when vault is low</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSettings({ ...settings, lowStockAlert: !settings.lowStockAlert })}
                                    className={`w-14 h-8 rounded-full relative transition-all ${settings.lowStockAlert ? 'bg-primary' : 'bg-secondary'}`}
                                >
                                    <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${settings.lowStockAlert ? 'right-1' : 'left-1'}`} />
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="btn-primary w-full h-20 text-sm tracking-widest uppercase font-black shadow-2xl shadow-primary/30 flex items-center justify-center gap-4"
                        >
                            <Save size={20} />
                            {saving ? 'Synchronizing...' : 'Save Configuration'}
                        </button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
