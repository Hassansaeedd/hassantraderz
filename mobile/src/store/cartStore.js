// mobile/src/store/cartStore.js — Mobile POS Cart State
import { create } from 'zustand';

export const useCartStore = create((set, get) => ({
  items: [],
  customer: null,

  addItem: (product) => {
    const items = get().items;
    const existing = items.find((i) => i.productId === product.id);

    if (existing) {
      if (existing.quantity >= product.currentStock) return false;
      set({
        items: items.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + 1, lineTotal: (i.quantity + 1) * i.unitPrice }
            : i
        ),
      });
    } else {
      set({
        items: [
          ...items,
          {
            productId: product.id,
            nameEn: product.nameEn,
            nameUr: product.nameUr,
            sku: product.sku,
            unitPrice: Number(product.sellingPrice),
            quantity: 1,
            lineTotal: Number(product.sellingPrice),
            stock: product.currentStock,
          },
        ],
      });
    }
    return true;
  },

  updateQuantity: (productId, qty) => {
    if (qty <= 0) {
      get().removeItem(productId);
      return;
    }
    set({
      items: get().items.map((i) =>
        i.productId === productId
          ? { ...i, quantity: qty, lineTotal: qty * i.unitPrice }
          : i
      ),
    });
  },

  removeItem: (productId) => {
    set({ items: get().items.filter((i) => i.productId !== productId) });
  },

  clearCart: () => set({ items: [], customer: null }),

  subtotal: () => get().items.reduce((s, i) => s + i.lineTotal, 0),
  gstAmount: () => Math.round(get().subtotal() * 0.17),
  totalAmount: () => get().subtotal() + get().gstAmount(),
  itemCount: () => get().items.reduce((s, i) => s + i.quantity, 0),
}));
