'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Users,
    BarChart3,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Sun,
    Moon,
    Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';

const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: ShoppingCart, label: 'POS Terminal', href: '/pos' },
    { icon: Package, label: 'Inventory', href: '/inventory' },
    { icon: Layers, label: 'Categories', href: '/categories' }, // Added Categories
    { icon: Users, label: 'Customers', href: '/customers' },
    { icon: BarChart3, label: 'Reports', href: '/reports' },
    { icon: BarChart3, label: 'Analytics', href: '/analytics' },
    { icon: Settings, label: 'Settings', href: '/settings' },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const { logout, theme, toggleTheme } = useAuthStore();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <aside
            className={cn(
                "h-screen glass border-r bg-card border-border transition-all duration-300 flex flex-col z-50",
                collapsed ? "w-20" : "w-64"
            )}
        >
            <div className="p-6 flex items-center justify-between">
                {!collapsed && (
                    <span className="text-xl font-bold text-foreground tracking-tight italic">OHM SAKTHI STORE</span>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-1.5 rounded-lg bg-secondary hover:bg-muted transition-colors text-foreground"
                >
                    {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
            </div>

            <nav className="flex-1 px-3 space-y-1 mt-4">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                            )}
                        >
                            <item.icon size={22} className={cn("shrink-0", isActive ? "text-primary-foreground" : "group-hover:text-primary")} />
                            {!collapsed && <span className="font-bold text-sm tracking-tight">{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 space-y-2 border-t border-border">
                <button
                    onClick={toggleTheme}
                    className={cn(
                        "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200",
                        collapsed && "justify-center"
                    )}
                >
                    {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
                    {!collapsed && <span className="font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
                </button>
                <button
                    onClick={handleLogout}
                    className={cn(
                        "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200",
                        collapsed && "justify-center"
                    )}
                >
                    <LogOut size={22} />
                    {!collapsed && <span className="font-medium">Sign Out</span>}
                </button>
            </div>
        </aside>
    );
}
