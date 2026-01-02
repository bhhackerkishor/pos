import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
    _id: string;
    name: string;
    price: number;
    costPrice: number;
    taxRate: number;
    quantity: number;
    discount: number;
    wholesalePrice?: number;
    wholesaleThreshold?: number;
}

interface CartState {
    items: CartItem[];
    heldBills: { id: string; items: CartItem[]; timestamp: number }[];
    addItem: (product: any) => void;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, qty: number) => void;
    clearCart: () => void;
    holdBill: () => void;
    resumeBill: (id: string) => void;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            heldBills: [],
            addItem: (product) => {
                const items = get().items;
                const index = items.findIndex((i) => i._id === product._id);
                if (index > -1) {
                    const newItems = [...items];
                    newItems[index].quantity += 1;
                    set({ items: newItems });
                } else {
                    set({ items: [...items, { ...product, quantity: 1, discount: 0 }] });
                }
            },
            removeItem: (id) => set({ items: get().items.filter((i) => i._id !== id) }),
            updateQuantity: (id, qty) => {
                const newItems = get().items.map((i) =>
                    i._id === id ? { ...i, quantity: Math.max(1, qty) } : i
                );
                set({ items: newItems });
            },
            clearCart: () => set({ items: [] }),
            holdBill: () => {
                const currentItems = get().items;
                if (currentItems.length === 0) return;
                const newHold = {
                    id: `HOLD-${Date.now()}`,
                    items: currentItems,
                    timestamp: Date.now()
                };
                set({ heldBills: [...get().heldBills, newHold], items: [] });
            },
            resumeBill: (id) => {
                const bill = get().heldBills.find((b) => b.id === id);
                if (bill) {
                    set({
                        items: bill.items,
                        heldBills: get().heldBills.filter((b) => b.id !== id)
                    });
                }
            }
        }),
        { name: 'cart-storage' }
    )
);
