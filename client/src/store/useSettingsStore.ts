import { create } from 'zustand';
import api from '@/lib/api';

interface SettingsState {
    settings: any;
    loading: boolean;
    fetchSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
    settings: {
        paginationLimit: 10,
        currencySymbol: '₹'
    },
    loading: false,
    fetchSettings: async () => {
        set({ loading: true });
        try {
            const res = await api.get('/settings');
            if (res.data.data) {
                set({ settings: res.data.data });
            }
        } catch (err) {
            console.error('Failed to fetch settings');
        } finally {
            set({ loading: false });
        }
    }
}));
