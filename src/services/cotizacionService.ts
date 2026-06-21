// src/services/cotizacionService.ts
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { Cotizacion } from "../models/Interfaces";
import { db } from "../config/firebase";
import { withGlobalLoading } from "../utils/withGlobalLoading";

/** Firestore no acepta valores `undefined` */
const omitUndefined = <T extends Record<string, unknown>>(data: T): Partial<T> =>
    Object.fromEntries(
        Object.entries(data).filter(([, value]) => value !== undefined)
    ) as Partial<T>;

export const saveCotizacion = async (cotizacion: Cotizacion) => {
    return withGlobalLoading(async () => {
        try {
            const { id, ...cotizacionSinId } = cotizacion;
            const docData = omitUndefined({
                ...cotizacionSinId,
                createdAt: cotizacionSinId.createdAt ?? new Date().toISOString(),
            });
            console.log("Guardando cotización en Firestore:", docData);
            const docRef = await addDoc(collection(db, "cotizacion"), docData);
            return docRef.id;
        } catch (error) {
            console.error("Error guardando cotización:", error);
            throw error;
        }
    });
};

/** Importa una cotización desde JSON (sin id) — usado por Recover */
export const recoverCotizacionFromJson = async (
    data: Omit<Cotizacion, 'id'>
): Promise<string> => {
    return saveCotizacion({ ...data, id: '' });
};

export const fetchCotizaciones = async () => {
    return withGlobalLoading(async () => {
        try {
            const colRef = collection(db, 'cotizacion');
            const snapshot = await getDocs(colRef);
            const docs = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...(doc.data() as Omit<Cotizacion, 'id'>),
            }));
            return docs;
        } catch (error) {
            console.error('Error al obtener cotizaciones:', error);
        }
    });
};

export const updateCotizacionInFirestore = async (id: string, data: Partial<Omit<Cotizacion, 'id'>>) => {
  return withGlobalLoading(async () => {
    const ref = doc(db, 'cotizacion', id);
    await updateDoc(ref, omitUndefined(data as Record<string, unknown>));
  });
};

export const deleteCotizacionInFirestore = async (id: string): Promise<void> => {
  return withGlobalLoading(async () => {
    if (!id) throw new Error("ID de cotización no proporcionado");
    const docRef = doc(db, "cotizacion", id);
    await deleteDoc(docRef);
  });
};
