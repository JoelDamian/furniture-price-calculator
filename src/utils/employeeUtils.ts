import { EmployeePayment } from '../models/Interfaces';

export const ensureEmployeePayments = (
  payments: EmployeePayment[] | null | undefined
): EmployeePayment[] => {
  if (!Array.isArray(payments)) return [];
  return payments.filter(
    (payment): payment is EmployeePayment =>
      payment != null && typeof payment === 'object'
  );
};
