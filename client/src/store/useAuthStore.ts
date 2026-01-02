import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'manager' | 'cashier';
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    theme: 'light' | 'dark';
    setAuth: (user: User, token: string) => void;
    logout: () => void;
    toggleTheme: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            theme: 'dark',
            setAuth: (user, token) => {
                set({ user, token, isAuthenticated: true });
            },
            logout: () => {
                set({ user: null, token: null, isAuthenticated: false });
            },
            toggleTheme: () => {
                set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' }));
            },
        }),
        {
            name: 'auth-storage-v2',
        }
    )
);
