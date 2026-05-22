import React, { useCallback, useMemo } from 'react';
import {
  Box,
  Button,
  Grid,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { FinanzaLineItem } from '../../models/Interfaces';
import {
  calcCostoFinal,
  calcGanancia,
  calcGastoTotal,
  calcSaldo,
  emptyLineItem,
  isValidDecimalInput,
  parseDecimal,
} from '../../utils/finanzasCalculations';
import { FinanzaFormData, formatFinanzaDate } from './finanzaFormUtils';

interface DecimalTextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  helperText?: string;
}

export const DecimalTextField: React.FC<DecimalTextFieldProps> = ({
  label,
  value,
  onChange,
  readOnly,
  helperText,
}) => (
  <TextField
    fullWidth
    label={label}
    value={value}
    onChange={(e) => {
      const next = e.target.value;
      if (isValidDecimalInput(next)) onChange(next);
    }}
    helperText={helperText}
    InputProps={{ readOnly }}
    inputProps={{ inputMode: 'decimal' }}
  />
);

interface FinanzaFormFieldsProps {
  form: FinanzaFormData;
  onChange: (form: FinanzaFormData) => void;
  readOnly?: boolean;
  createdAt?: string | null;
  finishedAt?: string | null;
}

export const FinanzaFormFields: React.FC<FinanzaFormFieldsProps> = ({
  form,
  onChange,
  readOnly = false,
  createdAt,
  finishedAt,
}) => {
  const costoFinal = useMemo(
    () => calcCostoFinal(form.sellItems, parseDecimal(form.discount)),
    [form.sellItems, form.discount]
  );
  const saldo = useMemo(
    () => calcSaldo(costoFinal, parseDecimal(form.onAccount)),
    [costoFinal, form.onAccount]
  );
  const gastoTotal = useMemo(() => calcGastoTotal(form.expenseItems), [form.expenseItems]);
  const ganancia = useMemo(
    () => calcGanancia(costoFinal, gastoTotal),
    [costoFinal, gastoTotal]
  );

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...form, name: e.target.value });
    },
    [form, onChange]
  );

  const handleOnAccountChange = useCallback(
    (value: string) => {
      onChange({ ...form, onAccount: value });
    },
    [form, onChange]
  );

  const handleDiscountChange = useCallback(
    (value: string) => {
      onChange({ ...form, discount: value });
    },
    [form, onChange]
  );

  const updateLineItem = useCallback(
    (
      listKey: 'sellItems' | 'expenseItems',
      index: number,
      field: keyof FinanzaLineItem,
      value: string
    ) => {
      if ((field === 'cost' || field === 'cantidad') && !isValidDecimalInput(value)) return;

      const items = [...form[listKey]];
      items[index] = {
        ...items[index],
        [field]: value,
      };
      onChange({ ...form, [listKey]: items });
    },
    [form, onChange]
  );

  const addLineItem = useCallback(
    (listKey: 'sellItems' | 'expenseItems') => {
      onChange({ ...form, [listKey]: [...form[listKey], emptyLineItem()] });
    },
    [form, onChange]
  );

  const removeLineItem = useCallback(
    (listKey: 'sellItems' | 'expenseItems', index: number) => {
      const items = form[listKey].filter((_, i) => i !== index);
      onChange({ ...form, [listKey]: items.length ? items : [emptyLineItem()] });
    },
    [form, onChange]
  );

  const renderItemsSection = (title: string, listKey: 'sellItems' | 'expenseItems') => (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Typography variant="h6">{title}</Typography>
        {!readOnly && (
          <Button size="small" startIcon={<AddIcon />} onClick={() => addLineItem(listKey)}>
            Agregar
          </Button>
        )}
      </Box>
      {form[listKey].map((item, index) => (
        <Grid container spacing={3} key={`${listKey}-${index}`} sx={{ mb: 2 }} alignItems="center">
          <Grid item xs={2} sm={2}>
            <DecimalTextField
              label="Cantidad"
              value={item.cantidad}
              onChange={(value) => updateLineItem(listKey, index, 'cantidad', value)}
              readOnly={readOnly}
            />
          </Grid>
          <Grid item xs={4} sm={4}>
            <TextField
              fullWidth
              label="Nombre"
              value={item.name}
              onChange={(e) => updateLineItem(listKey, index, 'name', e.target.value)}
              InputProps={{ readOnly }}
            />
          </Grid>
          <Grid item xs={4} sm={4}>
            <DecimalTextField
              label="Costo"
              value={item.cost}
              onChange={(value) => updateLineItem(listKey, index, 'cost', value)}
              readOnly={readOnly}
            />
          </Grid>
          {!readOnly && (
            <Grid item xs={2} sm={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconButton color="error" onClick={() => removeLineItem(listKey, index)}>
                <DeleteIcon />
              </IconButton>
            </Grid>
          )}
        </Grid>
      ))}
    </Box>
  );

  return (
    <Box sx={{ pt: 1 }}>
      {(createdAt !== undefined || finishedAt !== undefined) && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Fecha de inicio
            </Typography>
            <Typography variant="body1">{formatFinanzaDate(createdAt)}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Fecha de finalización
            </Typography>
            <Typography variant="body1">
              {formatFinanzaDate(finishedAt, 'Pendiente')}
            </Typography>
          </Grid>
        </Grid>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Nombre"
            value={form.name}
            onChange={handleNameChange}
            InputProps={{ readOnly }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <DecimalTextField
            label="A cuenta"
            value={form.onAccount}
            onChange={handleOnAccountChange}
            readOnly={readOnly}
          />
        </Grid>
      </Grid>

      {renderItemsSection('Items de venta', 'sellItems')}
      {renderItemsSection('Items de gasto', 'expenseItems')}

      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <DecimalTextField
            label="Descuento"
            value={form.discount}
            onChange={handleDiscountChange}
            readOnly={readOnly}
            helperText="Se resta del total de ventas"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Costo final"
            value={costoFinal.toFixed(2)}
            InputProps={{ readOnly: true }}
            helperText="Ventas - descuento"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Saldo"
            value={saldo.toFixed(2)}
            InputProps={{ readOnly: true }}
            helperText="Costo final - A cuenta"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Gasto total"
            value={gastoTotal.toFixed(2)}
            InputProps={{ readOnly: true }}
            helperText="Suma de gastos (cantidad × costo)"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Ganancia"
            value={ganancia.toFixed(2)}
            InputProps={{ readOnly: true }}
            helperText="Costo final - Gasto total"
          />
        </Grid>
      </Grid>
    </Box>
  );
};
