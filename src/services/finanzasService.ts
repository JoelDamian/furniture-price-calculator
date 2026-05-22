import { collection, addDoc, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Finanza } from '../models/Interfaces';
import { withGlobalLoading } from '../utils/withGlobalLoading';
import { finanzaOrgQueryValues, normalizeFinanzaFromFirestore } from '../utils/finanzaMapper';

export const fetchFinanzasByOrg = async (idOrg: number): Promise<Finanza[]> => {
  return withGlobalLoading(async () => {
    const q = query(
      collection(db, 'finanzas'),
      where('idOrg', 'in', finanzaOrgQueryValues(idOrg))
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) =>
      normalizeFinanzaFromFirestore(docSnap.id, docSnap.data())
    );
  });
};

export const saveFinanza = async (finanza: Finanza): Promise<string> => {
  return withGlobalLoading(async () => {
    const { id, ...finanzaSinId } = finanza;
    const docRef = await addDoc(collection(db, 'finanzas'), finanzaSinId);
    return docRef.id;
  });
};

export const updateFinanzaInFirestore = async (
  id: string,
  data: Omit<Finanza, 'id'>
): Promise<void> => {
  return withGlobalLoading(async () => {
    const finanzaRef = doc(db, 'finanzas', id);
    await updateDoc(finanzaRef, data);
  });
};

export const finalizeFinanzaInFirestore = async (
  id: string,
  finishedAt: string
): Promise<void> => {
  return withGlobalLoading(async () => {
    const finanzaRef = doc(db, 'finanzas', id);
    await updateDoc(finanzaRef, { finishedAt });
  });
};
