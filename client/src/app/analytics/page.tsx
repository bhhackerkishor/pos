'use client';

import { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp, Users, ShoppingBag,
    DollarSign, Package, Calendar, RefreshCw, BarChart3,
    ArrowUpRight, ArrowDownRight, UserMinus, Star,
    Wallet, PieChart as PieChartIcon, Activity, Filter, Clock
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import api from '@/lib/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Cell, LineChart, Line, AreaChart, Area, PieChart, Pie, Legend
} from 'recharts';

interface AnalyticsData {
    performance: {
        totalRevenue: number;
        totalProfit: number;
        avgTicketSize: number;
        growth: number;
    };
    inventory: {
        totalStockValue: number;
        lowStockItems: number;
    };
    hourlyStats: { _id: number; total: number }[];
    retention: {
        total: number;
        repeat: number;
        rate: number;
    };
    topProducts: {
        _id: string;
        totalSold: number;
        totalRevenue: number;
    }[];
    topDebtors: {
        _id: string;
        name: string;
        phone: string;
        outstandingBalance: number;
    }[];
    categoryPerformance: {
        _id: string;
        revenue: number;
        profit: number;
        unitsSold: number;
    }[];
    paymentStats: {
        _id: string;
        total: number;
        count: number;
    }[];
}

export default function AdvancedAnalytics() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/analytics/detailed?startDate=${dateRange.start}&endDate=${dateRange.end}`);
            setData(res.data.data);
        } catch (err) {
            console.error('Failed to fetch analytics', err);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    if (loading) return (
        <DashboardLayout>
            <div className="h-full flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Compiling Business Metrics...</p>
                </div>
            </div>
        </DashboardLayout>
    );

    if (!data) return (
        <DashboardLayout>
            <div className="flex flex-col items-center justify-center min-vh-60 opacity-20">
                <BarChart3 size={80} strokeWidth={1} />
                <p className="mt-4 font-black uppercase tracking-widest">No Intelligence Data</p>
                <button onClick={fetchAnalytics} className="mt-6 btn-primary">Retry Sync</button>
            </div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout>
            <div className="space-y-10 pb-20">
                {/* HEADER & FILTERS */}
                <div className="flex flex-col gap-8">
                    <div className="flex flex-wrap items-end justify-between gap-6">
                        <div>
                            <h1 className="text-6xl font-black italic uppercase tracking-tighter">Analytics</h1>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground mt-2">Omni-Channel Business Intelligence Dashboard</p>
                        </div>
                        <div className="flex items-center gap-4 glass p-2 rounded-2xl border border-border/50">
                            <div className="flex items-center gap-2 px-4 border-r border-border/50">
                                <Calendar size={14} className="text-muted-foreground" />
                                <input type="date" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} className="bg-transparent text-[10px] font-black uppercase outline-none" />
                                <span className="text-[10px] opacity-20">TO</span>
                                <input type="date" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} className="bg-transparent text-[10px] font-black uppercase outline-none" />
                            </div>
                            <button onClick={fetchAnalytics} className="h-10 px-6 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2">
                                <RefreshCw size={14} /> Apply Filter
                            </button>
                        </div>
                    </div>

                    {/* TOP STATS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <MetricCard label="Revenue" value={data.performance.totalRevenue} icon={DollarSign} trend={data.performance.growth} />
                        <MetricCard label="Profit" value={data.performance.totalProfit} icon={TrendingUp} color="text-emerald-500" />
                        <MetricCard label="Customers" value={data.retention.total} icon={Users} color="text-indigo-500" suffix="" />
                        <MetricCard label="Avg Ticket" value={data.performance.avgTicketSize} icon={Star} color="text-amber-500" />
                    </div>
                </div>

                {/* VISUALIZATIONS GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* 1. SALES HOURLY HEATMAP (BAR CHART) */}
                    <div className="lg:col-span-8 glass-card !p-8 h-[500px] flex flex-col">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3"><Clock className="text-primary" /> Hourly Performance Matrix</h3>
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">Transaction density across the 24h cycle</p>
                            </div>
                        </div>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.hourlyStats}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                    <XAxis dataKey="_id" stroke="#999" fontSize={10} tick={{ fontWeight: 'black' }} tickFormatter={h => `${h}:00`} />
                                    <YAxis axisLine={false} tickLine={false} stroke="#999" fontSize={10} />
                                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '12px' }} />
                                    <Bar dataKey="total" radius={[10, 10, 0, 0]}>
                                        {data.hourlyStats.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.total > 5000 ? '#6366f1' : '#cbd5e1'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 2. CATEGORY YIELD (PIE CHART) */}
                    <div className="lg:col-span-4 glass-card !p-8 flex flex-col h-[500px]">
                        <h3 className="text-2xl font-black uppercase tracking-tight mb-4 flex items-center gap-3"><PieChartIcon className="text-emerald-500" /> Profit Yield</h3>
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-10">Category distribution by net profit</p>
                        <div className="flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.categoryPerformance}
                                        innerRadius={80}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="profit"
                                        nameKey="_id"
                                    >
                                        {data.categoryPerformance.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '12px' }} />
                                    <Legend wrapperStyle={{ fontSize: '9px', fontWeight: 'black', textTransform: 'uppercase' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 3. SETTLEMENT MODES (AREA CHART / LINE) */}
                    <div className="lg:col-span-6 glass-card !p-8 h-[400px]">
                        <h3 className="text-2xl font-black uppercase tracking-tight mb-10 flex items-center gap-3"><Wallet className="text-indigo-500" /> Settlement Distribution</h3>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.paymentStats} layout="vertical">
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="_id" type="category" axisLine={false} tickLine={false} fontSize={10} width={80} tick={{ fontWeight: 'black' }} />
                                    <Tooltip />
                                    <Bar dataKey="total" fill="#4f46e5" radius={[0, 10, 10, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 4. BEST SELLERS VELOCITY */}
                    <div className="lg:col-span-6 glass-card !p-8 h-[400px]">
                        <h3 className="text-2xl font-black uppercase tracking-tight mb-10 flex items-center gap-3"><ShoppingBag className="text-amber-500" /> Inventory Velocity</h3>
                        <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                            {data.topProducts.map((p, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-secondary/20 rounded-2xl group hover:bg-secondary/40 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center font-black italic text-primary group-hover:bg-primary group-hover:text-white transition-all">#{idx + 1}</div>
                                        <div>
                                            <p className="text-xs font-black uppercase leading-tight">{p._id}</p>
                                            <p className="text-[8px] font-black text-muted-foreground uppercase">{p.totalSold} Units Processed</p>
                                        </div>
                                    </div>
                                    <p className="font-black text-lg tracking-tighter text-emerald-500">{formatCurrency(p.totalRevenue)}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 5. RISK MANAGEMENT (CREDIT AUTO-AUDIT) */}
                    <div className="lg:col-span-12 glass-card !p-8 border-rose-500/10 bg-rose-500/[0.01]">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3"><Activity className="text-rose-500" /> Accounts Receivable Alert</h3>
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">High-risk outstanding balances requiring immediate collection</p>
                            </div>
                            <span className="px-6 py-2 bg-rose-500/10 text-rose-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-500/20">Audit Registry: {data.topDebtors.length} Units</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {data.topDebtors.slice(0, 4).map((d, idx) => (
                                <div key={idx} className="p-6 bg-white border border-rose-500/10 rounded-3xl shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:scale-125 transition-transform"><UserMinus size={60} /></div>
                                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Customer Profile</p>
                                    <h4 className="text-xl font-black uppercase tracking-tight mb-4">{d.name}</h4>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[8px] font-black text-muted-foreground uppercase">Contact Info</p>
                                            <p className="text-xs font-bold">{d.phone}</p>
                                        </div>
                                        <p className="text-2xl font-black text-rose-500 tracking-tighter">{formatCurrency(d.outstandingBalance)}</p>
                                    </div>
                                </div>
                            ))}
                            {data.topDebtors.length === 0 && (
                                <div className="col-span-full py-10 flex flex-col items-center justify-center opacity-20">
                                    <Star size={48} />
                                    <p className="text-xs font-black uppercase tracking-widest mt-4">Registry is Clear / No Risks Detected</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

function MetricCard({ label, value, icon: Icon, trend, color = 'text-primary', suffix = '' }: any) {
    const isNum = typeof value === 'number';
    const displayValue = isNum ? (suffix === '' ? formatCurrency(value) : value + suffix) : value;

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card !p-8 group relative overflow-hidden flex flex-col border-border/40">
            <div className="absolute top-[-20%] right-[-10%] opacity-[0.03] group-hover:scale-110 transition-transform"><Icon size={180} /></div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2 flex items-center gap-2">
                <Icon size={12} className={color} /> {label}
            </p>
            <h3 className={cn("text-4xl font-black tracking-tighter mb-1 font-mono uppercase italic", color)}>
                {displayValue.toString().split('.')[0]}<span className="text-lg opacity-40">{displayValue.toString().includes('.') ? '.' + displayValue.toString().split('.')[1] : ''}</span>
            </h3>
            {trend !== undefined && (
                <div className="mt-4 flex items-center gap-2">
                    <div className={cn("flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter", trend >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500")}>
                        {trend >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                        {Math.abs(trend).toFixed(1)}%
                    </div>
                    <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest opacity-40 italic">VS PREV CYCLE</span>
                </div>
            )}
        </motion.div>
    );
}
