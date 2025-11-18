// accessoryStore.ts
import { create } from 'zustand';
import {
  AccessoryGlobal
} from '../models/Interfaces';

interface AccessoryStateGlobal {
  items: AccessoryGlobal[];
  addItem: (item: Omit<AccessoryGlobal, 'precioTotal'>) => void;
  updateItem: (id: string, updated: Omit<AccessoryGlobal, 'id'>) => void;
  deleteItem: (id: string) => void;
  clearItems: () => void;
  addListAccessories: (items: AccessoryGlobal[]) => void;
}

export const useAccessoryGlobalStore = create<AccessoryStateGlobal>((set) => ({
  items: [],
  addItem: (item) =>
    set((state) => {
      return { items: [...state.items, item] };
    }),
  updateItem: (id, updated) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id
          ? { ...updated, id}
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
