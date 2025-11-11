// cotizacionStore.ts
import { create } from 'zustand';
import { EstanteItem } from '../models/Interfaces';

interface CotizacionState {
    items: EstanteItem[];
    addItem: (item: Omit<EstanteItem, 'precioTotal' | 'precioUnitario' | 'tc'>) => void;
    updateItem: (id: string, updated: Omit<EstanteItem, 'precioTotal' | 'precioUnitario' | 'tc'>) => void;
    deleteItem: (id: string) => void;
    clearItems: () => void;
    addListItem: (items: EstanteItem[]) => void;
}

export const useCotizacionStore = create<CotizacionState>((set) => ({
    items: [],
    addItem: (item) =>
        set((state) => {
            const precioUnitario = parseFloat((item.ancho * item.largo * item.precioM2).toFixed(2));
            const precioTotal = parseFloat((precioUnitario * item.cantidad).toFixed(2));
            const tc = item.cantidad * (item.ancho * (item.atc ?? 0) + item.largo * (item.ltc ?? 0));
            const nuevo: EstanteItem = {
                ...item,
                precioUnitario,
                precioTotal,
                tc,
            };
            return { items: [...state.items, nuevo] };
        }),
    updateItem: (id, updated) =>
        set((state) => ({
            items: state.items.map((item) =>
                item.id === id
                    ? {
                        ...updated,
                        id,
                        precioUnitario: parseFloat((updated.ancho * updated.largo * updated.precioM2).toFixed(2)),
                        precioTotal: parseFloat((updated.ancho * updated.largo * updated.precioM2 * updated.cantidad).toFixed(2)),
                        tc: updated.cantidad * (updated.ancho * (updated.atc ?? 0) + updated.largo * (updated.ltc ?? 0)),
                    }
                    : item
            ),
        })),
    deleteItem: (id) =>
        set((state) => ({
            items: state.items.filter((item) => item.id !== id),
        })),
    clearItems: () => set({ items: [] }),
    addListItem: (items) =>
        set({ items: [...items] }),
}));
