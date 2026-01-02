'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
    const theme = useAuthStore((state) => state.theme);

    useEffect(() => {
        // Apply Theme
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);

        // Register PWA
        if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js');
            });
        } else if ('serviceWorker' in navigator) {
            // Allow SW in dev for testing offline if needed
            navigator.serviceWorker.register('/sw.js');
        }
    }, [theme]);

    return <>{children}</>;
}
