// client/src/store/cartStore.js — POS Cart (Zustand)
import { create } from 'zustand';

const calcLine = (item) => {
  const base     = item.unitPrice * item.quantity;
  const discAmt  = base * ((item.discountPct || 0) / 100);
  const afterDis = base - discAmt;
  const gstAmt   = 0;
  return { ...item, discountAmt: discAmt, gstAmt: 0, lineTotal: afterDis };
};

export const useCartStore = create((set, get) => ({
  items:         [],
  customer:      null,
  paymentMethod: 'CASH',
  note:          '',
  heldSales:     [],

  // Computed
  subtotal:       () => get().items.reduce((s, i) => s + i.unitPrice * i.quantity - i.discountAmt, 0),
  gstAmount:      () => 0,
  discountTotal:  () => get().items.reduce((s, i) => s + i.discountAmt, 0),
  totalAmount:    () => get().items.reduce((s, i) => s + i.lineTotal, 0),
  itemCount:      () => get().items.reduce((s, i) => s + i.quantity, 0),

  addItem: (product, quantity = 1) => {
    set((state) => {
      const existing = state.items.find(i => i.productId === product.id);
      if (existing) {
        return { items: state.items.map(i => i.productId === product.id ? calcLine({ ...i, quantity: i.quantity + quantity }) : i) };
      }
      const newItem = calcLine({
        productId:   product.id,
        nameEn:      product.nameEn,
        nameUr:      product.nameUr || product.nameEn,
        sku:         product.sku,
        unitPrice:   Number(product.sellingPrice),
        quantity,
        discountPct: 0,
        discountAmt: 0,
        gstRate:     0,
        gstAmt:      0,
        lineTotal:   Number(product.sellingPrice) * quantity,
        maxStock:    product.currentStock,
      });
      return { items: [...state.items, newItem] };
    });
  },

  removeItem: (productId) => set((state) => ({ items: state.items.filter(i => i.productId !== productId) })),

  updateQuantity: (productId, quantity) => {
    if (quantity < 1) return;
    set((state) => ({ items: state.items.map(i => i.productId === productId ? calcLine({ ...i, quantity }) : i) }));
  },

  updateDiscount: (productId, discountPct) => {
    set((state) => ({ items: state.items.map(i => i.productId === productId ? calcLine({ ...i, discountPct }) : i) }));
  },

  setCustomer:      (customer)      => set({ customer }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  setNote:          (note)          => set({ note }),

  clearCart: () => set({ items: [], customer: null, paymentMethod: 'CASH', note: '' }),

  holdSale: () => {
    const { items, customer, note } = get();
    if (!items.length) return;
    set((state) => ({
      heldSales: [...state.heldSales, { id: Date.now(), items, customer, note, heldAt: new Date() }],
      items: [], customer: null, note: '',
    }));
  },

  resumeHeld: (id) => {
    const held = get().heldSales.find(s => s.id === id);
    if (!held) return;
    set((state) => ({
      items: held.items, customer: held.customer, note: held.note,
      heldSales: state.heldSales.filter(s => s.id !== id),
    }));
  },

  removeHeld: (id) => set((state) => ({ heldSales: state.heldSales.filter(s => s.id !== id) })),
}));
