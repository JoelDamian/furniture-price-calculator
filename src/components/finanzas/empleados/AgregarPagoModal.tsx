import React, { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Employee, EmployeePayment } from '../../../models/Interfaces';
import { addPaymentToEmployee } from '../../../services/employeesService';
import { ensureEmployeePayments } from '../../../utils/employeeUtils';
import {
  finanzaModalActionsSx,
  finanzaModalCloseButtonSx,
  finanzaModalContentSx,
  finanzaModalTitleSx,
} from '../finanzaModalStyles';

interface AgregarPagoModalProps {
  open: boolean;
  employee: Employee | null;
  onClose: () => void;
  onPaymentAdded: (employeeId: string, payment: EmployeePayment) => void;
}

const emptyForm = () => ({
  amount: '',
  startDate: '',
  endDate: '',
  description: '',
});

export const AgregarPagoModal: React.FC<AgregarPagoModalProps> = ({
  open,
  employee,
  onClose,
  onPaymentAdded,
}) => {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (open) setForm(emptyForm());
  }, [open]);

  const amount = parseFloat(form.amount);
  const isValid =
    employee &&
    !Number.isNaN(amount) &&
    amount > 0 &&
    form.startDate &&
    form.endDate &&
    form.description.trim() &&
    form.startDate <= form.endDate;

  const handleSave = useCallback(async () => {
    if (!employee || !isValid) return;

    const payment: EmployeePayment = {
      id: crypto.randomUUID(),
      amount,
      startDate: form.startDate,
      endDate: form.endDate,
      description: form.description.trim(),
      createdAt: new Date().toISOString(),
    };

    await addPaymentToEmployee(
      employee.id,
      ensureEmployeePayments(employee.payments),
      payment
    );
    onPaymentAdded(employee.id, payment);
    onClose();
  }, [amount, employee, form, isValid, onClose, onPaymentAdded]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={finanzaModalTitleSx}>
        Agregar pago — {employee?.name ?? ''}
        <IconButton
          onClick={onClose}
          sx={finanzaModalCloseButtonSx}
          aria-label="cerrar"
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={finanzaModalContentSx}>
        <TextField
          fullWidth
          label="Monto"
          type="number"
          inputProps={{ min: 0, step: 0.01 }}
          value={form.amount}
          onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Fecha inicio del pago"
          type="date"
          value={form.startDate}
          onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
          InputLabelProps={{ shrink: true }}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Fecha fin del pago"
          type="date"
          value={form.endDate}
          onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
          InputLabelProps={{ shrink: true }}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Descripción"
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          multiline
          minRows={2}
        />
      </DialogContent>
      <DialogActions sx={finanzaModalActionsSx}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave} disabled={!isValid}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
