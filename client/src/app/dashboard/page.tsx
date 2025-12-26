'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { motion } from 'framer-motion';
import {
    TrendingUp,
    ShoppingCart,
    Package,
    AlertTriangle,
    CircleDollarSign
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import api from '@/lib/api';

export default function Dashboard() {
    const [stats, setStats] = useState<any>(null);
    const [chartData, setChartData] = useState<any[]>([]);
    const [period, setPeriod] = useState<'live' | 'day' | 'week' | 'custom'>('live');
    const [customRange, setCustomRange] = useState({ start: '', end: '' });

    const fetchData = async () => {
        try {
            let statsUrl = '/analytics/stats';
            let chartUrl = '/analytics/chart?days=7';

            if (period === 'day') {
                const today = new Date().toISOString().split('T')[0];
                statsUrl += `?startDate=${today}&endDate=${today}`;
            } else if (period === 'week') {
                const end = new Date().toISOString().split('T')[0];
                const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                statsUrl += `?startDate=${start}&endDate=${end}`;
                chartUrl = '/analytics/chart?days=7';
            } else if (period === 'custom' && customRange.start && customRange.end) {
                statsUrl += `?startDate=${customRange.start}&endDate=${customRange.end}`;
                const diff = Math.ceil((new Date(customRange.end).getTime() - new Date(customRange.start).getTime()) / (1000 * 60 * 60 * 24));
                chartUrl = `/analytics/chart?days=${Math.max(7, diff)}`;
            }

            const [statsRes, chartRes] = await Promise.all([
                api.get(statsUrl),
                api.get(chartUrl)
            ]);
            setStats(statsRes.data.data);
            setChartData(chartRes.data.data.map((d: any) => ({
                name: new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit' }),
                sales: d.totalSales,
                profit: d.totalProfit
            })));
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchData();
        if (period === 'live') {
            const interval = setInterval(fetchData, 30000); // Refresh every 30s for live
            return () => clearInterval(interval);
        }
    }, [period, customRange]);

    const statCards = [
        { label: "Today's Revenue", value: stats?.totalSales || 0, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { label: "Total Profit", value: stats?.totalProfit || 0, icon: CircleDollarSign, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: "Orders Today", value: stats?.orderCount || 0, icon: ShoppingCart, color: 'text-primary', bg: 'bg-primary/10' },
        { label: "Low Stock Items", value: stats?.lowStockCount || 0, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-10">
                <header className="flex flex-wrap items-center justify-between gap-6">
                    <div>
                        <h1 className="text-5xl font-black text-foreground tracking-tighter italic">COMMAND CENTER</h1>
                        <p className="text-muted-foreground mt-2 font-medium uppercase text-[10px] tracking-[0.3em]">
                            {period === 'live' ? 'Real-time Performance Metrics' : `Analytics for ${period.toUpperCase()}`}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                        {period === 'custom' && (
                            <div className="flex items-center gap-2 bg-secondary/50 p-1.5 rounded-2xl border border-border">
                                <input
                                    type="date"
                                    className="bg-transparent text-[10px] font-black uppercase px-2 focus:outline-none"
                                    value={customRange.start}
                                    onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                                />
                                <span className="text-muted-foreground">→</span>
                                <input
                                    type="date"
                                    className="bg-transparent text-[10px] font-black uppercase px-2 focus:outline-none"
                                    value={customRange.end}
                                    onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                                />
                            </div>
                        )}
                        <div className="flex bg-secondary p-1.5 rounded-2xl border border-border shadow-inner">
                            <button
                                onClick={() => setPeriod('live')}
                                className={cn(
                                    "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                    period === 'live' ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Live
                            </button>
                            <button
                                onClick={() => setPeriod('day')}
                                className={cn(
                                    "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                    period === 'day' ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Day
                            </button>
                            <button
                                onClick={() => setPeriod('week')}
                                className={cn(
                                    "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                    period === 'week' ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Week
                            </button>
                            <button
                                onClick={() => setPeriod('custom')}
                                className={cn(
                                    "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                    period === 'custom' ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Custom
                            </button>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {statCards.map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="glass-card relative overflow-hidden group border-border/50 hover:border-primary/30 transition-all shadow-xl"
                        >
                            <div className="flex items-center gap-6 relative z-10">
                                <div className={cn(stat.bg, stat.color, "p-6 rounded-2xl group-hover:scale-110 transition-transform shadow-sm")}>
                                    <stat.icon size={32} />
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</p>
                                    <h3 className="text-3xl font-black text-foreground tracking-tighter leading-none">
                                        {stat.label.includes('Items') || stat.label.includes('Orders') ? stat.value : formatCurrency(stat.value)}
                                    </h3>
                                </div>
                            </div>
                            <div className="absolute -bottom-10 -right-10 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700">
                                <stat.icon size={180} />
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 glass-card h-[550px] flex flex-col border-border/50 shadow-2xl">
                        <div className="flex justify-between items-center mb-12">
                            <div>
                                <h3 className="text-xl font-black text-foreground italic tracking-tight uppercase">Performance Velocity</h3>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-1">Net Sales vs Gross Profit</p>
                            </div>
                            <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest">
                                <div className="flex items-center gap-2"><span className="w-3 h-3 bg-primary rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)]"></span> Sales</div>
                                <div className="flex items-center gap-2"><span className="w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span> Profit</div>
                            </div>
                        </div>
                        <div className="flex-1 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-5" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 800, opacity: 0.5 }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 800, opacity: 0.5 }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--card)',
                                            border: '1px solid var(--border)',
                                            borderRadius: '1.5rem',
                                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                                            fontSize: '12px',
                                            fontWeight: 'bold'
                                        }}
                                        itemStyle={{ color: 'var(--foreground)' }}
                                    />
                                    <Area type="monotone" dataKey="sales" stroke="#8b5cf6" strokeWidth={5} fillOpacity={1} fill="url(#colorSales)" />
                                    <Area type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={5} fill="transparent" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="glass-card flex flex-col items-center justify-center space-y-10 relative overflow-hidden bg-primary/5 border-primary/10 shadow-2xl">
                        <div className="w-40 h-40 rounded-full border-[12px] border-primary/20 flex items-center justify-center relative bg-background shadow-2xl">
                            <Package size={56} className="text-primary" />
                            <div className="absolute inset-0 border-[12px] border-primary border-t-transparent rounded-full animate-spin-slow"></div>
                            <div className="absolute -inset-4 border border-primary/10 rounded-full animate-pulse"></div>
                        </div>
                        <div className="text-center">
                            <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">Stock Integrity</h3>
                            <p className="text-muted-foreground mt-3 font-bold uppercase text-[10px] tracking-[0.2em] max-w-[200px] mx-auto leading-relaxed">System monitoring shows 92% optimal inventory levels</p>
                        </div>
                        <button className="btn-primary w-full h-16 rounded-2xl text-xs tracking-[0.2em] font-black uppercase">Inventory Audit Log</button>
                        <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
