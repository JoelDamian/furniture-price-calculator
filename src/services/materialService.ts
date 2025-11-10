import { collection, addDoc, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../config/firebase";
import { MaterialItem } from "../models/Interfaces"; // Asegúrate de importar desde donde defines esta interfaz

export const saveMaterial = async (material: MaterialItem) => {
    try {
        // Excluir el campo `id`
        const { id, ...materialSinId } = material;

        const docRef = await addDoc(collection(db, "material"), materialSinId);
        return docRef.id; // puedes devolver el ID generado si lo necesitas
    } catch (error) {
        console.error("Error guardando material:", error);
        throw error;
    }
};

export const fetchMaterials = async (): Promise<MaterialItem[]> => {
    const snapshot = await getDocs(collection(db, "material"));
    // Mapear cada documento para incluir el id
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<MaterialItem, "id">)
    }));
};

export const updateMaterialInFirestore = async (id: string, data: Omit<MaterialItem, 'id'>) => {
  const materialRef = doc(db, "material", id);
  await updateDoc(materialRef, data);
};
