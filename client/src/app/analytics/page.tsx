'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp, Users, ArrowUpRight, ArrowDownRight,
    Layers, DollarSign, Box, Clock, Target, Activity,
    CalendarCheck, Zap, AlertTriangle, RotateCcw,
    ShoppingBag, Briefcase, Filter,
    Download, Timer, LucideIcon
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import api from '@/lib/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Cell, PieChart as RePieChart, Pie, Legend
} from 'recharts';

type TabType = 'overview' | 'sales' | 'inventory' | 'customers' | 'finance' | 'staff' | 'products';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function EnterpriseAnalytics() {
    const [data, setData] = useState<any>(null);

    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('overview');

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const res = await api.get('/analytics/detailed');
            setData(res.data.data);
        } catch (err) {
            console.error('Failed to fetch enterprise analytics', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <DashboardLayout>
            <div className="h-full flex flex-col items-center justify-center p-24">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-8" />
                <h2 className="text-4xl font-black italic uppercase tracking-tighter opacity-20 animate-pulse">Initializing Retail BI Engine...</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] mt-4 opacity-40">Compiling Multi-Store Transaction Matrix</p>
            </div>
        </DashboardLayout>
    );

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

    const tabs: { id: TabType, label: string, icon: React.ComponentType<{ size?: number | string }> }[] = [
        { id: 'overview', label: 'Overview', icon: Target },

        { id: 'sales', label: 'Sales Matrix', icon: TrendingUp },
        { id: 'inventory', label: 'Inventory Audit', icon: Box },
        { id: 'customers', label: 'Customer Intelligence', icon: Users },
        { id: 'products', label: 'Product Analytics', icon: ShoppingBag },
        { id: 'finance', label: 'Financial Health', icon: DollarSign },
        { id: 'staff', label: 'Staff Efficiency', icon: Briefcase },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-10 pb-20">
                {/* Header with Navigation */}
                <header className="flex flex-col gap-8">
                    <div className="flex justify-between items-end">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="px-2 py-0.5 bg-primary/10 text-primary text-[8px] font-black uppercase tracking-widest rounded-full border border-primary/20">Enterprise Grade</span>
                                <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest opacity-40 italic">Live Ledger Update: {new Date().toLocaleTimeString()}</span>
                            </div>
                            <h1 className="text-6xl font-black text-foreground italic uppercase tracking-tighter leading-none flex items-center gap-4">
                                Retail BI <span className="text-primary">Intelligence</span>
                            </h1>
                        </div>
                        <div className="flex gap-3">
                            <button className="glass px-6 py-3 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest hover:bg-secondary/50 transition-all border-border/40">
                                <Download size={14} /> Export Report
                            </button>
                            <button onClick={fetchAnalytics} className="bg-primary text-primary-foreground px-6 py-3 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest hover:shadow-lg hover:shadow-primary/20 transition-all">
                                <Timer size={14} /> Refresh Cycle
                            </button>
                        </div>
                    </div>

                    <nav className="flex gap-2 p-1.5 bg-secondary/20 rounded-[2rem] border border-border/50 w-fit">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all",
                                    activeTab === tab.id
                                        ? "bg-background text-primary shadow-xl border border-border shadow-black/20"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <tab.icon size={14} /> {tab.label}
                            </button>
                        ))}
                    </nav>
                </header>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-12"
                    >
                        {activeTab === 'overview' && (
                            <>
                                {/* Global Scorecards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <MetricCard
                                        label="Total Monthly Revenue"
                                        value={formatCurrency(data.performance.totalRevenue)}
                                        trend={data.performance.growth}
                                        icon={DollarSign}
                                        desc="Combined sales across all channels"
                                    />
                                    <MetricCard
                                        label="Retail Net Profit"
                                        value={formatCurrency(data.performance.totalProfit)}
                                        trend={data.performance.wowGrowth}
                                        icon={TrendingUp}
                                        color="text-emerald-500"
                                        desc="Profit after COGS and discounts"
                                    />
                                    <MetricCard
                                        label="Avg Ticket Size"
                                        value={formatCurrency(data.performance.avgTicketSize)}
                                        trend={0}
                                        icon={ShoppingCart}
                                        color="text-indigo-500"
                                        desc="Median spend per transaction"
                                    />
                                    <MetricCard
                                        label="Active Liquidity"
                                        value={formatCurrency(data.inventory.totalStockValue)}
                                        trend={-(data.inventory.expiredCount)}
                                        icon={Box}
                                        color="text-amber-500"
                                        desc="Market value of ready-to-sell stock"
                                    />
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-2 glass-card h-[450px]">
                                        <div className="flex justify-between items-center mb-10">
                                            <h3 className="text-2xl font-black italic uppercase tracking-tight flex items-center gap-3"><Activity className="text-primary" /> Multi-Cycle Performance Comparison</h3>
                                            <div className="flex gap-4">
                                                <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20"><div className="w-1.5 h-1.5 rounded-full bg-primary" /><span className="text-[8px] font-black uppercase text-primary">This Cycle: {formatCurrency(data.performance.thisWeekRevenue)}</span></div>
                                                <div className="flex items-center gap-2 px-3 py-1 bg-secondary rounded-full border border-border"><div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" /><span className="text-[8px] font-black uppercase text-muted-foreground">Last Cycle: {formatCurrency(data.performance.lastWeekRevenue)}</span></div>
                                            </div>
                                        </div>
                                        <div className="h-[300px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={[
                                                    { name: 'Last Cycle', revenue: data.performance.lastWeekRevenue },
                                                    { name: 'This Cycle', revenue: data.performance.thisWeekRevenue }
                                                ]}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                                    <XAxis dataKey="name" stroke="#444" fontSize={10} tick={{ fontWeight: 'black' }} />
                                                    <YAxis hide />
                                                    <Tooltip contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '12px', fontSize: '10px', fontWeight: 'black' }} />
                                                    <Bar dataKey="revenue" radius={[10, 10, 0, 0]}>
                                                        <Cell fill="#312e81" />
                                                        <Cell fill="#6366f1" />
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                    <div className="glass-card">
                                        <h3 className="text-2xl font-black italic uppercase tracking-tight mb-8 flex items-center gap-3"><Box className="text-amber-500" /> Stock Health Matrix</h3>
                                        <div className="h-[250px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RePieChart>
                                                    <Pie
                                                        data={[
                                                            { name: 'Peak Stock', value: data.inventory.totalRetailValue },
                                                            { name: 'Low Stock Value', value: data.inventory.lowStockItems * 1000 }, // Mocking value for visualization
                                                            { name: 'Dead Stock', value: data.inventory.deadStockCount * 500 }
                                                        ]}
                                                        innerRadius={60}
                                                        outerRadius={80}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                    >
                                                        <Cell fill="#10b981" />
                                                        <Cell fill="#f59e0b" />
                                                        <Cell fill="#ef4444" />
                                                    </Pie>
                                                    <Tooltip contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '12px' }} />
                                                    <Legend wrapperStyle={{ fontSize: '8px', fontWeight: 'black', textTransform: 'uppercase' }} />
                                                </RePieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="mt-6 flex justify-between">
                                            <div className="text-center">
                                                <p className="text-[8px] font-black uppercase opacity-40">Low Stock</p>
                                                <p className="text-lg font-black text-amber-500">{data.inventory.lowStockItems}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[8px] font-black uppercase opacity-40">Healthy</p>
                                                <p className="text-lg font-black text-emerald-500">{data.categoryStats.length}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[8px] font-black uppercase opacity-40">Dead SKUs</p>
                                                <p className="text-lg font-black text-rose-500">{data.inventory.deadStockCount}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'inventory' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <InventorySection data={data} />
                                <CategoryMetrics data={data} />
                                <div className="lg:col-span-2">
                                    <ExpiryTable items={data.inventory.expiresSoon} />
                                </div>
                            </div>
                        )}

                        {activeTab === 'staff' && (
                            <StaffLeaderboard stats={data.staffPerformance} />
                        )}

                        {activeTab === 'sales' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 glass-card h-[500px]">
                                    <h3 className="text-2xl font-black italic uppercase tracking-tight mb-10 flex items-center gap-3 font-mono"><Clock className="text-primary" /> Peak Density Matrix</h3>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={data.hourlyStats}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                            <XAxis dataKey="_id" stroke="#888" fontSize={10} tick={{ fontWeight: 'black' }} tickFormatter={h => `${h}:00`} />
                                            <YAxis axisLine={false} tickLine={false} stroke="#444" fontSize={10} />
                                            <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '12px' }} />
                                            <Bar dataKey="total" fill="#6366f1" radius={[10, 10, 0, 0]}>
                                                {data.hourlyStats.map((entry: { total: number }, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={entry.total > 5000 ? '#ef4444' : entry.total > 2000 ? '#6366f1' : '#312e81'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="glass-card">
                                    <h3 className="text-2xl font-black italic uppercase tracking-tight mb-10 flex items-center gap-3"><Filter className="text-primary" /> Channel Velocity</h3>
                                    <div className="space-y-4">
                                        {data.paymentStats.map((p: { _id: string; total: number; count: number }) => (
                                            <div key={p._id} className="p-6 bg-secondary/20 rounded-3xl border border-border group hover:bg-secondary/40 transition-all">

                                                <div className="flex justify-between items-center mb-4">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{p._id} Settlement</span>
                                                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded text-[8px] font-black uppercase">Active</span>
                                                </div>
                                                <div className="flex justify-between items-baseline">
                                                    <h4 className="text-2xl font-black tracking-tighter uppercase font-mono">{formatCurrency(p.total)}</h4>
                                                    <p className="text-[10px] font-black opacity-40">{p.count} TXNS</p>
                                                </div>
                                                <div className="mt-4 w-full h-1.5 bg-background rounded-full overflow-hidden">
                                                    <div className="h-full bg-primary" style={{ width: `${(p.total / data.performance.totalRevenue) * 100}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'customers' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="glass-card flex flex-col items-center justify-center p-20">
                                    <div className="relative mb-10">
                                        <div className="w-64 h-64 rounded-full border-8 border-primary/10 border-t-primary animate-[spin_10s_linear_infinite]" />
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <p className="text-5xl font-black tracking-tight">{data.retention.rate.toFixed(1)}%</p>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground italic">Retention Score</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-10 w-full">
                                        <div className="text-center">
                                            <p className="text-4xl font-black italic">{data.retention.total}</p>
                                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-2">Active Registry</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-4xl font-black italic text-primary">{data.retention.repeat}</p>
                                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-2">Loyal Entities</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="glass-card">
                                    <h3 className="text-2xl font-black italic uppercase tracking-tight mb-10 flex items-center gap-3"><RotateCcw className="text-rose-500" /> Credit Matrix</h3>
                                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                                        {data.topDebtors.map((d: { _id: string; name: string; phone: string; outstandingBalance: number }) => (
                                            <div key={d._id} className="p-6 bg-rose-500/5 rounded-3xl border border-rose-500/10 flex justify-between items-center group hover:border-rose-500/30 transition-all">

                                                <div className="flex items-center gap-5">
                                                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-black text-xl italic">{d.name[0]}</div>
                                                    <div>
                                                        <p className="font-black uppercase text-sm">{d.name}</p>
                                                        <p className="text-[10px] font-bold opacity-40">{d.phone}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xl font-black text-rose-500 tracking-tighter">{formatCurrency(d.outstandingBalance)}</p>
                                                    <div className="px-2 py-0.5 bg-rose-500/10 rounded text-[7px] font-black uppercase italic text-rose-500 tracking-widest mt-1">High Risk Unit</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'products' && (
                            <div className="space-y-8">
                                <ProductVelocity stats={data.topProducts} />
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <BrandIntelligence stats={data.brandStats} />
                                    <div className="glass-card h-[400px]">
                                        <h3 className="text-2xl font-black italic uppercase tracking-tight mb-8">Category Yield</h3>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RePieChart>
                                                <Pie
                                                    data={data.categoryStats}
                                                    innerRadius={60}
                                                    outerRadius={100}
                                                    paddingAngle={5}
                                                    dataKey="revenue"
                                                    nameKey="_id"
                                                >
                                                    {data.categoryStats.map((_entry: unknown, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '12px' }} />
                                            </RePieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </DashboardLayout>
    );
}

interface MetricCardProps {
    label: string;
    value: string;
    trend: number;
    icon: LucideIcon;
    color?: string;
    desc: string;
}

function MetricCard({ label, value, trend, icon: Icon, color = 'text-primary', desc }: MetricCardProps) {

    return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card !p-8 group relative overflow-hidden flex flex-col border-border/40">
            <div className="absolute top-[-20%] right-[-10%] opacity-[0.03] group-hover:scale-110 transition-transform"><Icon size={180} /></div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2 flex items-center gap-2">
                <Icon size={12} className={color} /> {label}
            </p>
            <h3 className={cn("text-4xl font-black tracking-tighter mb-1 font-mono uppercase italic", color)}>{value.split('.')[0]}<span className="text-lg opacity-40">{value.includes('.') ? '.' + value.split('.')[1] : ''}</span></h3>
            <div className="flex items-center justify-between mt-4">
                <p className="text-[9px] font-black uppercase opacity-40 italic flex-1 max-w-[120px]">{desc}</p>
                {trend !== 0 && (
                    <div className={cn("flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter", trend > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500")}>
                        {trend > 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                        {Math.abs(trend).toFixed(1)}%
                    </div>
                )}
            </div>
        </motion.div>
    );
}

function InventorySection({ data }: { data: any }) {

    return (
        <div className="glass-card">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h3 className="text-2xl font-black italic uppercase tracking-tight flex items-center gap-3"><Box className="text-amber-500" /> Stock Dynamics</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">Registry Capital Audit</p>
                </div>
            </div>
            <div className="space-y-6">
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-[10px] font-black uppercase opacity-40 mb-1">Total SKU Value (Cost)</p>
                        <p className="text-3xl font-black tracking-tighter font-mono">{formatCurrency(data.inventory.totalStockValue)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase opacity-40 mb-1">Market Capitalization</p>
                        <p className="text-xl font-black text-primary tracking-tighter font-mono">{formatCurrency(data.inventory.totalRetailValue)}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-secondary/20 rounded-3xl border border-border">
                        <p className="text-[9px] font-black uppercase text-muted-foreground mb-1">Low Stock Threshold</p>
                        <p className="text-2xl font-black italic">{data.inventory.lowStockItems}</p>
                    </div>
                    <div className="p-6 bg-secondary/20 rounded-3xl border border-border">
                        <p className="text-[9px] font-black uppercase text-muted-foreground mb-1">Stock Aging Index</p>
                        <p className="text-2xl font-black italic">Normal</p>
                    </div>
                </div>
                <div className="p-6 bg-rose-500/5 rounded-3xl border border-rose-500/20">
                    <p className="text-[9px] font-black uppercase text-rose-500 mb-2 font-mono flex items-center gap-2"><AlertTriangle size={12} /> Dead Stock Detected</p>
                    <div className="flex flex-wrap gap-2">
                        {data.inventory.deadStockList.slice(0, 3).map((item: { _id: string; name: string }) => (
                            <span key={item._id} className="px-3 py-1 bg-rose-500/10 text-rose-500 rounded-lg text-[8px] font-black uppercase border border-rose-500/20">{item.name}</span>
                        ))}
                        {data.inventory.deadStockCount > 3 && <span className="text-[8px] font-black uppercase opacity-40 self-center">+ {data.inventory.deadStockCount - 3} more</span>}
                    </div>
                </div>
            </div>
        </div>
    );
}

function CategoryMetrics({ data }: { data: any }) {
    return (
        <div className="glass-card">
            <h3 className="text-2xl font-black italic uppercase tracking-tight mb-10 flex items-center gap-3"><Layers className="text-emerald-500" /> Vault Profitability</h3>
            <div className="space-y-6 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                {data.categoryPerformance.map((cat: { _id: string; unitsSold: number; profit: number }) => (
                    <div key={cat._id} className="group relative">

                        <div className="flex justify-between items-end mb-2">
                            <div>
                                <h4 className="font-black text-sm uppercase italic group-hover:text-emerald-500 transition-colors">{cat._id} Registry</h4>
                                <p className="text-[8px] font-black uppercase opacity-40">{cat.unitsSold} Units Processed</p>
                            </div>
                            <div className="text-right">
                                <p className="font-black text-sm tracking-tighter text-emerald-500">{formatCurrency(cat.profit)}</p>
                                <p className="text-[8px] font-black uppercase opacity-40 font-mono">Gross Margin Yield</p>
                            </div>
                        </div>
                        <div className="w-full h-1 bg-background rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(cat.profit / data.performance.totalProfit) * 100}%` }}
                                className="h-full bg-emerald-500"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ExpiryTable({ items }: { items: { _id: string; name: string; expiryDate: string; stockQuantity: number }[] }) {
    if (!items || items.length === 0) return null;
    return (
        <div className="glass-card mt-8">
            <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-black italic uppercase tracking-tight flex items-center gap-3 italic"><CalendarCheck className="text-rose-500" /> Expiry Protocol Audit</h3>
                <span className="px-4 py-2 bg-rose-500/10 text-rose-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-500/20 animate-pulse">Critical Observation Window (30D)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {items.map((item) => (

                    <div key={item._id} className="p-6 bg-secondary/20 rounded-3xl border border-dashed border-border/40">
                        <p className="text-[10px] font-black uppercase italic mb-2 truncate max-w-full">{item.name}</p>
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-[8px] font-black uppercase opacity-40 mb-1">Expiry Date</p>
                                <p className="text-xs font-black text-rose-500">{new Date(item.expiryDate).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[8px] font-black uppercase opacity-40 mb-1">Stock</p>
                                <p className="text-xs font-black">{item.stockQuantity}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function StaffLeaderboard({ stats }: { stats: { _id: string; name: string; totalRevenue: number; orderCount: number; avgOrderValue: number }[] }) {
    return (
        <div className="glass-card">
            <h3 className="text-2xl font-black italic uppercase tracking-tight mb-10 flex items-center gap-3"><Briefcase className="text-primary" /> Operational Efficiency Matrix</h3>
            <div className="space-y-4">
                {stats.map((staff, idx: number) => (

                    <div key={staff._id} className="p-8 bg-secondary/10 rounded-[2.5rem] border border-border group hover:bg-secondary/20 hover:border-primary/30 transition-all flex items-center gap-8">
                        <div className="w-16 h-16 bg-background rounded-3xl flex items-center justify-center font-black text-2xl italic shadow-inner border border-border">#{idx + 1}</div>
                        <div className="flex-1">
                            <h4 className="text-xl font-black uppercase tracking-tight mb-1">{staff.name}</h4>
                            <div className="flex gap-8">
                                <div>
                                    <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Revenue Generation</p>
                                    <p className="text-lg font-black tracking-tighter text-primary font-mono">{formatCurrency(staff.totalRevenue)}</p>
                                </div>
                                <div>
                                    <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Dispatch Count</p>
                                    <p className="text-lg font-black tracking-tighter italic">{staff.orderCount}</p>
                                </div>
                                <div className="border-l border-border pl-8">
                                    <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Avg Bill Velocity</p>
                                    <p className="text-lg font-black tracking-tighter text-emerald-500 font-mono">{formatCurrency(staff.avgOrderValue)}</p>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black uppercase tracking-[0.2em] italic">Platinum Efficiency</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ProductVelocity({ stats }: { stats: { _id: string; totalSold: number; totalRevenue: number }[] }) {
    return (
        <div className="glass-card">
            <h3 className="text-2xl font-black italic uppercase tracking-tight mb-10 flex items-center gap-3"><Zap className="text-amber-500" /> Dispatch Velocity Board</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {stats.map((p, idx: number) => (

                    <div key={idx} className="p-6 bg-secondary/20 rounded-[2rem] border border-border group hover:scale-[1.02] transition-all">
                        <div className="w-10 h-10 bg-background rounded-xl border border-border flex items-center justify-center font-black italic text-primary mb-4 shadow-sm">#{idx + 1}</div>
                        <p className="text-xs font-black uppercase italic mb-1 truncate">{p._id}</p>
                        <p className="text-[8px] font-black uppercase text-muted-foreground mb-4">{p.totalSold} Units Processed</p>
                        <p className="text-lg font-black tracking-tighter text-emerald-500 font-mono italic">{formatCurrency(p.totalRevenue)}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function BrandIntelligence({ stats }: { stats: { _id: string; productCount: number; totalStockValue: number }[] }) {
    return (
        <div className="glass-card">
            <h3 className="text-2xl font-black italic uppercase tracking-tight mb-10 flex items-center gap-3 underline decoration-primary/30 underline-offset-8">Corporate Brand Yield</h3>
            <div className="space-y-4">
                {stats.map((brand) => (

                    <div key={brand._id} className="flex items-center justify-between p-5 bg-background border border-border rounded-2xl hover:bg-secondary/20 transition-all">
                        <div className="flex items-center gap-5">
                            <div className="w-10 h-10 glass rounded-xl flex items-center justify-center font-black uppercase text-xs italic">{brand._id[0]}</div>
                            <div>
                                <p className="font-black text-sm uppercase leading-none">{brand._id}</p>
                                <p className="text-[8px] font-black opacity-40 uppercase mt-1 italic">{brand.productCount} Registered SKUs</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-black uppercase text-muted-foreground italic mb-1">Registry Capital</p>
                            <p className="font-black text-emerald-500 tracking-tighter">{formatCurrency(brand.totalStockValue)}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function RiskItem({ label, value, status, color }: { label: string; value: string; status: string; color: 'rose' | 'amber' | 'emerald' }) {
    const colorClasses = {
        rose: 'text-rose-500 border-rose-500/20 bg-rose-500/5',
        amber: 'text-amber-500 border-amber-500/20 bg-amber-500/5',
        emerald: 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5',
    };

    return (
        <div className={cn("p-5 rounded-3xl border flex justify-between items-center group cursor-help", colorClasses[color])}>
            <div>
                <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">{label}</p>
                <p className="text-lg font-black tracking-tighter uppercase italic">{value}</p>
            </div>
            <div className="text-right">
                <span className="text-[8px] font-black uppercase italic tracking-[0.2em]">{status}</span>
            </div>
        </div>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ShoppingCart(props: any) { return <ShoppingBag {...props} />; }

