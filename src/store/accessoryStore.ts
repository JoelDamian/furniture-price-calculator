// accessoryStore.ts
import { create } from 'zustand';
import {
  Accessory
} from '../models/Interfaces';

interface AccessoryState {
  items: Accessory[];
  addItem: (item: Omit<Accessory, 'precioTotal'>) => void;
  updateItem: (id: string, updated: Omit<Accessory, 'id'>) => void;
  deleteItem: (id: string) => void;
  clearItems: () => void;
  addListAccessories: (items: Accessory[]) => void;
}

export const useAccessoryStore = create<AccessoryState>((set) => ({
  items: [],
  addItem: (item) =>
    set((state) => {
      const nuevo = {
        ...item,
        precioTotal: item.cantidad * item.precioUnitario,
      };
      return { items: [...state.items, nuevo] };
    }),
  updateItem: (id, updated) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id
          ? { ...updated, id, precioTotal: updated.cantidad * updated.precioUnitario }
          : item
      ),
    })),
  deleteItem: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    })),
  clearItems: () => set({ items: [] }),
  addListAccessories: (items) =>
    set({ items: [...items] }),
}));
