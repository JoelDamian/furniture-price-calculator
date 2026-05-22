import { Finanza, FinanzaLineItem } from '../models/Interfaces';
import {
  calcCostoFinal,
  calcGanancia,
  calcGastoTotal,
  calcSaldo,
  formatDecimal,
  parseDecimal,
} from './finanzasCalculations';

const normalizeLineItems = (items: unknown): FinanzaLineItem[] => {
  if (!Array.isArray(items)) return [];

  return items
    .filter((item): item is Record<string, unknown> => item != null && typeof item === 'object')
    .map((item) => ({
      name: String(item.name ?? ''),
      cost: formatDecimal(item.cost ?? ''),
      cantidad: formatDecimal(item.cantidad ?? '1'),
    }));
};

const normalizeDateString = (value: unknown): string | null => {
  if (value == null || value === '') return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const timestamp = value as { toDate: () => Date };
    return timestamp.toDate().toISOString();
  }
  return String(value);
};

export const normalizeFinanzaFromFirestore = (
  id: string,
  data: Record<string, unknown>
): Finanza => {
  const sellItems = normalizeLineItems(data.sellItems);
  const expenseItems = normalizeLineItems(data.expenseItems);
  const discount = parseDecimal(data.discount ?? data.descuento ?? 0);
  const onAccount = parseDecimal(data.onAccount ?? data.balance ?? data.saldo ?? 0);
  const costoFinal = calcCostoFinal(sellItems, discount);
  const gastoTotal =
    typeof data.gastoTotal === 'number' && expenseItems.length === 0
      ? data.gastoTotal
      : calcGastoTotal(expenseItems);
  const saldo = calcSaldo(costoFinal, onAccount);
  const ganancia =
    typeof data.ganancia === 'number' ? data.ganancia : calcGanancia(costoFinal, gastoTotal);
  const createdAt =
    normalizeDateString(data.createdAt ?? data.fechaCreacion) ?? '';
  const finishedAt = normalizeDateString(data.finishedAt ?? data.fechaFinalizacion);

  return {
    id,
    name: String(data.name ?? ''),
    idOrg: parseDecimal(data.idOrg ?? 0),
    onAccount,
    discount,
    sellItems,
    expenseItems,
    costoFinal,
    saldo,
    gastoTotal,
    ganancia,
    createdAt,
    finishedAt,
  };
};

export const finanzaOrgQueryValues = (idOrg: number): (number | string)[] => [idOrg, String(idOrg)];
