import { Employee, EmployeePayment, Finanza } from '../models/Interfaces';
import { FINANZAS_ORG } from '../constants/finanzasAccess';
import { ensureEmployeePayments } from './employeeUtils';

export interface ReportEmployeePayment {
  employeeId: string;
  employeeName: string;
  payment: EmployeePayment;
}

export interface FinanzasReportSummary {
  totalProjectExpenses: number;
  totalProjectProfit: number;
  totalSalaryExpenses: number;
  netProfit: number;
}

export interface FinanzasReportData {
  startDate: string;
  endDate: string;
  projects: Finanza[];
  employeePayments: ReportEmployeePayment[];
  summary: FinanzasReportSummary;
}

const toDateOnlyStart = (value: string): Date =>
  new Date(`${value.split('T')[0]}T00:00:00`);

const toDateOnlyEnd = (value: string): Date =>
  new Date(`${value.split('T')[0]}T23:59:59.999`);

export const isDateInRange = (
  value: string,
  startDate: string,
  endDate: string
): boolean => {
  if (!value || !startDate || !endDate) return false;

  const date = toDateOnlyStart(value);
  if (Number.isNaN(date.getTime())) return false;

  return date >= toDateOnlyStart(startDate) && date <= toDateOnlyEnd(endDate);
};

export const isProjectCompletedInRange = (
  finanza: Finanza,
  startDate: string,
  endDate: string
): boolean => {
  if (!finanza.finishedAt) return false;

  return (
    isDateInRange(finanza.createdAt, startDate, endDate) &&
    isDateInRange(finanza.finishedAt, startDate, endDate)
  );
};

export const isPaymentInRange = (
  payment: EmployeePayment,
  startDate: string,
  endDate: string
): boolean => {
  if (!payment.startDate || !payment.endDate || !startDate || !endDate) return false;

  return (
    payment.startDate <= endDate &&
    payment.endDate >= startDate
  );
};

export const getOrgLabel = (idOrg: number): string =>
  idOrg === FINANZAS_ORG.STUDIO ? 'Studio' : 'Carpintería';

export const buildFinanzasReport = (
  startDate: string,
  endDate: string,
  finanzas: Finanza[],
  employees: Employee[]
): FinanzasReportData => {
  const projects = finanzas
    .filter((finanza) => isProjectCompletedInRange(finanza, startDate, endDate))
    .sort((a, b) => a.name.localeCompare(b.name));

  const employeePayments = employees.flatMap((employee) =>
    ensureEmployeePayments(employee.payments)
      .filter((payment) => isPaymentInRange(payment, startDate, endDate))
      .map((payment) => ({
        employeeId: employee.id,
        employeeName: employee.name,
        payment,
      }))
  ).sort((a, b) => a.employeeName.localeCompare(b.employeeName));

  const totalProjectExpenses = projects.reduce((acc, project) => acc + project.gastoTotal, 0);
  const totalProjectProfit = projects.reduce((acc, project) => acc + project.ganancia, 0);
  const totalSalaryExpenses = employeePayments.reduce(
    (acc, item) => acc + item.payment.amount,
    0
  );

  return {
    startDate,
    endDate,
    projects,
    employeePayments,
    summary: {
      totalProjectExpenses,
      totalProjectProfit,
      totalSalaryExpenses,
      netProfit: totalProjectProfit - totalSalaryExpenses,
    },
  };
};

export const formatReportDate = (value: string): string => {
  if (!value) return '—';
  const datePart = value.split('T')[0];
  const [year, month, day] = datePart.split('-');
  return `${day}/${month}/${year}`;
};

export const formatReportCurrency = (value: number): string =>
  value.toLocaleString('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
