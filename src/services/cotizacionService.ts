// src/services/cotizacionService.ts
import { collection, addDoc, getDocs, doc, updateDoc,deleteDoc  } from "firebase/firestore";
import { Cotizacion } from "../models/Interfaces";
import { db } from "../config/firebase";

export const saveCotizacion = async (cotizacion: Cotizacion) => {
    try {
        const { id, ...cotizacionSinId } = cotizacion;
        console.log("Guardando cotización en Firestore:", cotizacionSinId);
        const docRef = await addDoc(collection(db, "cotizacion"), cotizacionSinId);
        return docRef.id;
    } catch (error) {
        console.error("Error guardando cotización:", error);
        throw error;
    }
};

export const fetchCotizaciones = async () => {
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
};

export const updateCotizacionInFirestore = async (id: string, data: Partial<Omit<Cotizacion, 'id'>>) => {
  const ref = doc(db, 'cotizacion', id);
  await updateDoc(ref, data);
};

export const deleteCotizacionInFirestore = async (id: string): Promise<void> => {
  if (!id) throw new Error("ID de cotización no proporcionado");
  const docRef = doc(db, "cotizacion", id);
  await deleteDoc(docRef);
};
