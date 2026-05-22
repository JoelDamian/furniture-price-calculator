import { Finanza, FinanzaLineItem } from '../../models/Interfaces';
import {
  calcCostoFinal,
  calcGanancia,
  calcGastoTotal,
  calcSaldo,
  emptyLineItem,
  formatDecimal,
  parseDecimal,
} from '../../utils/finanzasCalculations';

export interface FinanzaFormData {
  name: string;
  idOrg: number;
  onAccount: string;
  discount: string;
  sellItems: FinanzaLineItem[];
  expenseItems: FinanzaLineItem[];
}

export const createEmptyForm = (idOrg: number): FinanzaFormData => ({
  name: '',
  idOrg,
  onAccount: '',
  discount: '',
  sellItems: [emptyLineItem()],
  expenseItems: [emptyLineItem()],
});

export const finanzaToForm = (finanza: Finanza): FinanzaFormData => ({
  name: finanza.name,
  idOrg: finanza.idOrg,
  onAccount: formatDecimal(finanza.onAccount),
  discount: formatDecimal(finanza.discount),
  sellItems: finanza.sellItems.length
    ? finanza.sellItems.map((item) => ({
        name: item.name,
        cost: formatDecimal(item.cost),
        cantidad: formatDecimal(item.cantidad || '1'),
      }))
    : [emptyLineItem()],
  expenseItems: finanza.expenseItems.length
    ? finanza.expenseItems.map((item) => ({
        name: item.name,
        cost: formatDecimal(item.cost),
        cantidad: formatDecimal(item.cantidad || '1'),
      }))
    : [emptyLineItem()],
});

export interface FinanzaDates {
  createdAt: string;
  finishedAt: string | null;
}

export const formatFinanzaDate = (iso: string | null | undefined, pendingLabel?: string): string => {
  if (!iso) return pendingLabel ?? '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const buildFinanzaPayload = (
  form: FinanzaFormData,
  dates: FinanzaDates
): Omit<Finanza, 'id'> => {
  const sellItems = form.sellItems.map(({ name, cost, cantidad }) => ({
    name,
    cost: cost || '0',
    cantidad: cantidad || '1',
  }));
  const expenseItems = form.expenseItems.map(({ name, cost, cantidad }) => ({
    name,
    cost: cost || '0',
    cantidad: cantidad || '1',
  }));
  const discount = parseDecimal(form.discount);
  const onAccount = parseDecimal(form.onAccount);
  const costoFinal = calcCostoFinal(sellItems, discount);
  const gastoTotal = calcGastoTotal(expenseItems);
  const saldo = calcSaldo(costoFinal, onAccount);

  return {
    name: form.name,
    idOrg: form.idOrg,
    onAccount,
    discount,
    sellItems,
    expenseItems,
    costoFinal,
    saldo,
    gastoTotal,
    ganancia: calcGanancia(costoFinal, gastoTotal),
    createdAt: dates.createdAt,
    finishedAt: dates.finishedAt,
  };
};
