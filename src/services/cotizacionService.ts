// src/services/cotizacionService.ts
import { collection, addDoc } from "firebase/firestore";
import { Cotizacion } from "../models/Interfaces";
import { db } from "../config/firebase";

export const saveCotizacion = async (cotizacion: Cotizacion) => {
    try {
        const { id, ...cotizacionSinId } = cotizacion;
        const docRef = await addDoc(collection(db, "cotizacion"), cotizacionSinId);
        return docRef.id;
    } catch (error) {
        console.error("Error guardando cotización:", error);
        throw error;
    }
};
