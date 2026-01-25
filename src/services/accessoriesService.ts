import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { AccessoryGlobal } from "../models/Interfaces";
import { withGlobalLoading } from "../utils/withGlobalLoading";

export const fetchAccessories = async (): Promise<AccessoryGlobal[]> => {
    return withGlobalLoading(async () => {
        const snapshot = await getDocs(collection(db, "accesorio"));
        // Mapear cada documento para incluir el id
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as Omit<AccessoryGlobal, "id">)
        }));
    });
};

export const saveAccesorio = async (accesorio: AccessoryGlobal) => {
    return withGlobalLoading(async () => {
        try {
            // Excluir el campo `id`
            const { id, ...accesorioSinId } = accesorio;

            const docRef = await addDoc(collection(db, "accesorio"), accesorioSinId);
            return docRef.id; // puedes devolver el ID generado si lo necesitas
        } catch (error) {
            console.error("Error guardando material:", error);
            throw error;
        }
    });
};

export const updateAccesorioInFirestore = async (id: string, data: Omit<AccessoryGlobal, 'id'>) => {
  return withGlobalLoading(async () => {
    const accesorioRef = doc(db, "accesorio", id);
    await updateDoc(accesorioRef, data);
  });
};

export const deleteAccessorioInFirestore = async (id: string): Promise<void> => {
  return withGlobalLoading(async () => {
    if (!id) throw new Error("ID de cotización no proporcionado");
    const docRef = doc(db, "accesorio", id);
    await deleteDoc(docRef);
  });
};
