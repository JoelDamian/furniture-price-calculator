import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Employee, EmployeePayment } from '../../../models/Interfaces';
import { addPaymentsToEmployees } from '../../../services/employeesService';
import {
  finanzaModalActionsSx,
  finanzaModalCloseButtonSx,
  finanzaModalContentSx,
  finanzaModalTitleSx,
} from '../finanzaModalStyles';

interface RealizarPagoModalProps {
  open: boolean;
  employees: Employee[];
  onClose: () => void;
  onPaymentsAdded: (payments: { employeeId: string; payment: EmployeePayment }[]) => void;
}

interface EmployeePaymentForm {
  amount: string;
  description: string;
}

const emptyDateForm = () => ({
  startDate: '',
  endDate: '',
});

const buildEmployeeForms = (employees: Employee[]): Record<string, EmployeePaymentForm> =>
  Object.fromEntries(
    employees.map((employee) => [employee.id, { amount: '', description: '' }])
  );

export const RealizarPagoModal: React.FC<RealizarPagoModalProps> = ({
  open,
  employees,
  onClose,
  onPaymentsAdded,
}) => {
  const [dateForm, setDateForm] = useState(emptyDateForm);
  const [employeeForms, setEmployeeForms] = useState<Record<string, EmployeePaymentForm>>({});

  useEffect(() => {
    if (open) {
      setDateForm(emptyDateForm());
      setEmployeeForms(buildEmployeeForms(employees));
    }
  }, [open, employees]);

  const datesValid =
    Boolean(dateForm.startDate) &&
    Boolean(dateForm.endDate) &&
    dateForm.startDate <= dateForm.endDate;

  const entriesToSave = useMemo(() => {
    if (!datesValid) return [];

    return employees.flatMap((employee) => {
      const form = employeeForms[employee.id];
      if (!form) return [];

      const amount = parseFloat(form.amount);
      const description = form.description.trim();
      if (Number.isNaN(amount) || amount <= 0 || !description) return [];

      return [{
        employee,
        payment: {
          id: crypto.randomUUID(),
          amount,
          startDate: dateForm.startDate,
          endDate: dateForm.endDate,
          description,
          createdAt: new Date().toISOString(),
        } satisfies EmployeePayment,
      }];
    });
  }, [dateForm.endDate, dateForm.startDate, datesValid, employeeForms, employees]);

  const isValid = employees.length > 0 && datesValid && entriesToSave.length > 0;

  const updateEmployeeForm = useCallback(
    (employeeId: string, field: keyof EmployeePaymentForm, value: string) => {
      setEmployeeForms((prev) => ({
        ...prev,
        [employeeId]: {
          ...prev[employeeId],
          [field]: value,
        },
      }));
    },
    []
  );

  const handleSave = useCallback(async () => {
    if (!isValid) return;

    await addPaymentsToEmployees(entriesToSave);

    onPaymentsAdded(
      entriesToSave.map(({ employee, payment }) => ({
        employeeId: employee.id,
        payment,
      }))
    );
    onClose();
  }, [entriesToSave, isValid, onClose, onPaymentsAdded]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={finanzaModalTitleSx}>
        Realizar pago
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
        {employees.length === 0 ? (
          <Alert severity="warning">
            No hay empleados activos. Activa al menos uno antes de realizar un pago.
          </Alert>
        ) : (
          <>
            <Typography variant="subtitle2" gutterBottom>
              Período del pago
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Fecha inicio"
                  type="date"
                  value={dateForm.startDate}
                  onChange={(e) =>
                    setDateForm((prev) => ({ ...prev, startDate: e.target.value }))
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Fecha fin"
                  type="date"
                  value={dateForm.endDate}
                  onChange={(e) =>
                    setDateForm((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <Divider sx={{ mb: 2 }} />

            <Typography variant="subtitle2" gutterBottom>
              Pagos por empleado
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Completa monto y descripción solo para los empleados a los que deseas registrar pago.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {employees.map((employee) => {
                const form = employeeForms[employee.id] ?? { amount: '', description: '' };

                return (
                  <Box
                    key={employee.id}
                    sx={{
                      p: 2,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                      {employee.name}
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                          fullWidth
                          label="Monto"
                          type="number"
                          inputProps={{ min: 0, step: 0.01 }}
                          value={form.amount}
                          onChange={(e) =>
                            updateEmployeeForm(employee.id, 'amount', e.target.value)
                          }
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 8 }}>
                        <TextField
                          fullWidth
                          label="Descripción"
                          value={form.description}
                          onChange={(e) =>
                            updateEmployeeForm(employee.id, 'description', e.target.value)
                          }
                        />
                      </Grid>
                    </Grid>
                  </Box>
                );
              })}
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions sx={finanzaModalActionsSx}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave} disabled={!isValid}>
          Registrar pagos
        </Button>
      </DialogActions>
    </Dialog>
  );
};
