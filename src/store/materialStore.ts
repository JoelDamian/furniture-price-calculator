// src/store/materialStore.ts
import { create } from 'zustand';

export interface Material {
    id: string;
    precioHoja: number;
    med1: number;
    med2: number;
    material: string;
    precioM2: number;
    isTube?: boolean;
    precioML?: number; // precio por metro lineal (for tubes)
}

interface MaterialState {
    materiales: Material[];
    addMaterial: (nuevo: Material) => void;
    setMateriales: (lista: Material[]) => void;
    updateMaterial: (id: string, updated: Partial<Material>) => void;
}

export const useMaterialStore = create<MaterialState>((set) => ({
    materiales: [],
    addMaterial: (nuevo) => set((state) => ({ materiales: [...state.materiales, nuevo] })),
    setMateriales: (lista) => set(() => ({ materiales: lista })),
    updateMaterial: (id, updated) =>
        set((state) => ({
            materiales: state.materiales.map((mat) =>
                mat.id === id ? { ...mat, ...updated } : mat
            ),
        })),
}));
