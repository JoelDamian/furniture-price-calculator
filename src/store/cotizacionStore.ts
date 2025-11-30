// cotizacionStore.ts
import { create } from 'zustand';
import { EstanteItem } from '../models/Interfaces';
import { Dimensiones } from '../models/Interfaces';
interface CotizacionState {
    items: EstanteItem[];
    dimensiones: Dimensiones;
    addItem: (item: EstanteItem) => void;
    updateItem: (id: string, updated: EstanteItem) => void;
    deleteItem: (id: string) => void;
    clearItems: () => void;
    addListItem: (items: EstanteItem[]) => void;
    setDimensiones: (dimensiones: Dimensiones) => void;
}

export const useCotizacionStore = create<CotizacionState>((set) => ({
    items: [],
    dimensiones: { ancho: 0, alto: 0, profundidad: 0 },
    addItem: (item) =>
        set((state) => ({
            items: [...state.items, item]
        })),
    updateItem: (id, updated) =>
        set((state) => ({
            items: state.items.map((item) =>
                item.id === id ? { ...updated, id } : item
            ),
        })),
    deleteItem: (id) =>
        set((state) => ({
            items: state.items.filter((item) => item.id !== id),
        })),
    clearItems: () => set({ items: [], dimensiones: { ancho: 0, alto: 0, profundidad: 0 } }),
    addListItem: (items) =>
        set({ items: [...items] }),
    setDimensiones: (dimensiones) => set({ dimensiones }),
}));
