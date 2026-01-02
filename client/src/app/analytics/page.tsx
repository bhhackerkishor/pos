'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp, Users, ShoppingBag,
    DollarSign, Package, Calendar, RefreshCw, BarChart3,
    ArrowUpRight, ArrowDownRight, UserMinus, Star
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import api from '@/lib/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Cell
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
}

export default function SimpleAnalytics() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const res = await api.get('/analytics/detailed');
            setData(res.data.data);
        } catch (err) {
            console.error('Failed to fetch analytics', err);
        } finally {
            setLoading(false);
        }
    };

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
            <div className="flex flex-col items-center justify-center min-h-[60vh] opacity-20">
                <BarChart3 size={80} strokeWidth={1} />
                <p className="mt-4 font-black uppercase tracking-widest">No Data Available</p>
                <button onClick={fetchAnalytics} className="mt-6 btn-primary">Try Again</button>
            </div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout>
            <div className="space-y-10 pb-10">
                {/* HEADER */}
                <div className="flex flex-wrap items-end justify-between gap-6">
                    <div>
                        <h1 className="text-5xl font-black italic uppercase tracking-tighter">Performance</h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mt-2">Essential Business Intelligence & Stats</p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={fetchAnalytics} className="h-14 w-14 glass rounded-2xl flex items-center justify-center text-primary hover:bg-secondary transition-all">
                            <RefreshCw size={20} />
                        </button>
                        <div className="h-14 glass rounded-2xl px-6 flex items-center gap-4">
                            <div className="flex flex-col text-right">
                                <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Growth Index</span>
                                <span className={cn("text-xs font-black", data.performance.growth >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                    {data.performance.growth >= 0 ? '+' : ''}{data.performance.growth.toFixed(1)}%
                                </span>
                            </div>
                            {data.performance.growth >= 0 ? <ArrowUpRight className="text-emerald-500" /> : <ArrowDownRight className="text-rose-500" />}
                        </div>
                    </div>
                </div>

                {/* KEY CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        label="Total Revenue"
                        value={formatCurrency(data.performance.totalRevenue)}
                        icon={DollarSign}
                        color="text-primary"
                        desc="Month-to-date gross sales"
                    />
                    <StatCard
                        label="Net Profit"
                        value={formatCurrency(data.performance.totalProfit)}
                        icon={TrendingUp}
                        color="text-emerald-500"
                        desc="Revenue after product costs"
                    />
                    <StatCard
                        label="Loyalty Base"
                        value={data.retention.total.toString()}
                        icon={Users}
                        color="text-indigo-500"
                        desc="Total registered customers"
                    />
                    <StatCard
                        label="Avg Ticket"
                        value={formatCurrency(data.performance.avgTicketSize)}
                        icon={Star}
                        color="text-amber-500"
                        desc="Average spend per bill"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* CHART */}
                    <div className="lg:col-span-2 glass-card !p-8 h-[500px] flex flex-col">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                                    <BarChart3 className="text-primary" /> Sales Density
                                </h3>
                                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mt-1">Transaction distribution per hour</p>
                            </div>
                        </div>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.hourlyStats}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                    <XAxis dataKey="_id" stroke="#999" fontSize={10} tick={{ fontWeight: 'black' }} tickFormatter={h => `${h}:00`} />
                                    <YAxis axisLine={false} tickLine={false} stroke="#999" fontSize={10} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                                        contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '12px', fontSize: '10px', color: '#fff' }}
                                    />
                                    <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                                        {data.hourlyStats.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.total > (data.performance.totalRevenue / 24) ? '#6366f1' : '#cbd5e1'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* TOP PRODUCTS & DEBTORS */}
                    <div className="space-y-8">
                        {/* BEST SELLERS */}
                        <div className="glass-card !p-8 flex flex-col">
                            <h3 className="text-xl font-black uppercase tracking-tight mb-8">Best Sellers</h3>
                            <div className="space-y-4">
                                {data.topProducts.slice(0, 5).map((p, idx) => (
                                    <div key={idx} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center font-black text-[10px] text-muted-foreground group-hover:bg-primary group-hover:text-white transition-all">#{idx + 1}</div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-tight line-clamp-1">{p._id}</p>
                                                <p className="text-[8px] font-bold text-muted-foreground uppercase">{p.totalSold} Sold</p>
                                            </div>
                                        </div>
                                        <p className="font-black text-xs tracking-tighter">{formatCurrency(p.totalRevenue)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* TOP DEBTORS */}
                        <div className="glass-card !p-8 border-rose-500/10 bg-rose-500/[0.02]">
                            <h3 className="text-xl font-black uppercase tracking-tight mb-8 text-rose-500">Credit Alert</h3>
                            <div className="space-y-4">
                                {data.topDebtors.slice(0, 3).map((d, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-white border border-rose-500/10 rounded-xl shadow-sm">
                                        <div>
                                            <p className="text-[10px] font-black uppercase">{d.name}</p>
                                            <p className="text-[8px] font-bold text-muted-foreground">{d.phone}</p>
                                        </div>
                                        <p className="font-black text-rose-500 tracking-tighter">{formatCurrency(d.outstandingBalance)}</p>
                                    </div>
                                ))}
                                {data.topDebtors.length === 0 && <p className="text-[10px] font-black uppercase opacity-20 text-center py-4 italic">No outstanding credits</p>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* BOTTOM VITAL ROW */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <VitalCard icon={Package} label="Stock Valuation" value={formatCurrency(data.inventory.totalStockValue)} />
                    <VitalCard icon={Users} label="Repeat Customers" value={data.retention.repeat.toString()} />
                    <VitalCard icon={Calendar} label="System Pulse" value="Online & Synced" color="text-emerald-500" />
                </div>
            </div>
        </DashboardLayout>
    );
}

function StatCard({ label, value, icon: Icon, color, desc }: any) {
    return (
        <div className="glass-card !p-8 border-border/40 relative overflow-hidden group">
            <div className="absolute top-[-10%] right-[-10%] opacity-[0.03] group-hover:scale-110 transition-transform"><Icon size={120} /></div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-3 flex items-center gap-2">
                <Icon size={12} className={color} /> {label}
            </p>
            <h3 className={cn("text-3xl font-black tracking-tighter uppercase mb-2", color)}>{value}</h3>
            <p className="text-[9px] font-black uppercase opacity-40 italic">{desc}</p>
        </div>
    );
}

function VitalCard({ icon: Icon, label, value, color = "text-muted-foreground" }: any) {
    return (
        <div className="glass-card !p-6 flex items-center gap-6">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground shadow-inner">
                <Icon size={24} />
            </div>
            <div>
                <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">{label}</p>
                <p className={cn("text-xl font-black tracking-tight", color)}>{value}</p>
            </div>
        </div>
    );
}
