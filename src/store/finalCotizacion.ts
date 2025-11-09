import { create } from 'zustand';
import { Cotizacion } from '../models/Interfaces';

interface CotizacionState {
    cotizacion: Cotizacion;
    setCotizacion: (cotizacion: Cotizacion) => void;
    updateManoObra: (manoObra: number) => void;
    resetCotizacion: () => void;
}

export const useCotizacionGlobalStore = create<CotizacionState>((set) => ({
    cotizacion: {
        id: '',
        nombre: '',
        piezas: [],
        accesorios: [],
        manoDeObra: 0,
        total: 0,
        precioVenta: 0,
        precioVentaConIva: 0
    },
    setCotizacion: (cotizacion) => set(() => ({ cotizacion })),
    updateManoObra: (manoObra) =>
        set((state) => {
            const totalEstantes = state.cotizacion.piezas.reduce((sum, item) => sum + item.precioTotal, 0);
            const totalAccesorios = state.cotizacion.accesorios.reduce((sum, item) => sum + item.precioTotal, 0);
            const total = totalEstantes + totalAccesorios + manoObra;
            return {
                cotizacion: {
                    ...state.cotizacion,
                    manoObra,
                    total,
                    precioVenta: total * 2,
                    precioConIva: total * 2.5
                }
            };
        }),
    resetCotizacion: () =>
        set(() => ({
            cotizacion: {
                id: '',
                nombre: '',
                piezas: [],
                accesorios: [],
                manoDeObra: 0,
                total: 0,
                precioVenta: 0,
                precioVentaConIva: 0
            }
        }))
}));
