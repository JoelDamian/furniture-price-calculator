import { FinanzaLineItem } from '../models/Interfaces';

export const DECIMAL_INPUT_REGEX = /^\d*\.?\d*$/;

export const isValidDecimalInput = (value: string): boolean =>
  DECIMAL_INPUT_REGEX.test(value);

export const parseDecimal = (value: string | number): number => {
  const parsed = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const formatDecimal = (value: string | number): string => {
  if (typeof value === 'string') return value;
  return Number.isFinite(value) ? String(value) : '';
};

export const getLineItemTotal = (item: FinanzaLineItem): number =>
  parseDecimal(item.cantidad) * parseDecimal(item.cost);

export const sumLineItems = (items: FinanzaLineItem[]): number =>
  items.reduce((acc, item) => acc + getLineItemTotal(item), 0);

export const sumLineItemStrings = (items: FinanzaLineItem[]): number =>
  items.reduce((acc, item) => acc + getLineItemTotal(item), 0);

export const calcCostoFinal = (sellItems: FinanzaLineItem[], discount: number): number =>
  sumLineItems(sellItems) - discount;

export const calcSaldo = (costoFinal: number, onAccount: number): number =>
  Math.max(0, costoFinal - onAccount);

export const calcGastoTotal = (expenseItems: FinanzaLineItem[]): number =>
  sumLineItems(expenseItems);

export const calcGanancia = (costoFinal: number, gastoTotal: number): number =>
  costoFinal - gastoTotal;

export const emptyLineItem = (): FinanzaLineItem => ({ name: '', cost: '', cantidad: '1' });
