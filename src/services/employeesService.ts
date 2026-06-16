import { collection, addDoc, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Employee, EmployeePayment } from '../models/Interfaces';
import { withGlobalLoading } from '../utils/withGlobalLoading';
import { ensureEmployeePayments } from '../utils/employeeUtils';

const COLLECTION = 'employees';

const normalizeEmployeeFromFirestore = (id: string, data: Record<string, unknown>): Employee => ({
  id,
  name: String(data.name ?? ''),
  birthDate: String(data.birthDate ?? ''),
  identityCardNumber: String(data.identityCardNumber ?? ''),
  homeAddress: String(data.homeAddress ?? ''),
  isActive: typeof data.isActive === 'boolean' ? data.isActive : true,
  payments: ensureEmployeePayments(data.payments as EmployeePayment[] | null | undefined),
  createdAt: String(data.createdAt ?? ''),
});

export const fetchEmployees = async (): Promise<Employee[]> => {
  return withGlobalLoading(async () => {
    const snapshot = await getDocs(collection(db, COLLECTION));
    return snapshot.docs
      .map((docSnap) => normalizeEmployeeFromFirestore(docSnap.id, docSnap.data()))
      .sort((a, b) => a.name.localeCompare(b.name));
  });
};

export const saveEmployee = async (
  employee: Omit<Employee, 'id'>
): Promise<string> => {
  return withGlobalLoading(async () => {
    const docRef = await addDoc(collection(db, COLLECTION), employee);
    return docRef.id;
  });
};

export const updateEmployeeInFirestore = async (
  id: string,
  data: Omit<Employee, 'id'>
): Promise<void> => {
  return withGlobalLoading(async () => {
    const employeeRef = doc(db, COLLECTION, id);
    await updateDoc(employeeRef, data);
  });
};

export const addPaymentToEmployee = async (
  employeeId: string,
  currentPayments: EmployeePayment[],
  payment: EmployeePayment
): Promise<void> => {
  return withGlobalLoading(async () => {
    const employeeRef = doc(db, COLLECTION, employeeId);
    await updateDoc(employeeRef, {
      payments: [...ensureEmployeePayments(currentPayments), payment],
    });
  });
};

export const addPaymentsToEmployees = async (
  entries: { employee: Employee; payment: EmployeePayment }[]
): Promise<void> => {
  if (entries.length === 0) return;

  return withGlobalLoading(async () => {
    await Promise.all(
      entries.map(({ employee, payment }) => {
        const employeeRef = doc(db, COLLECTION, employee.id);
        return updateDoc(employeeRef, {
          payments: [...ensureEmployeePayments(employee.payments), payment],
        });
      })
    );
  });
};
