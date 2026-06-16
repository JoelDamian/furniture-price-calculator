import React, { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Employee } from '../../../models/Interfaces';
import { updateEmployeeInFirestore } from '../../../services/employeesService';
import { ensureEmployeePayments } from '../../../utils/employeeUtils';
import {
  finanzaModalActionsSx,
  finanzaModalCloseButtonSx,
  finanzaModalContentSx,
  finanzaModalTitleSx,
} from '../finanzaModalStyles';
import { EmpleadoFormFields } from './EmpleadoFormFields';
import {
  buildEmpleadoFieldsFromForm,
  empleadoToForm,
  emptyEmpleadoForm,
  EmpleadoFormData,
  isEmpleadoFormValid,
} from './empleadoFormUtils';

interface EditarEmpleadoModalProps {
  open: boolean;
  employee: Employee | null;
  onClose: () => void;
  onUpdated: (employee: Employee) => void;
}

export const EditarEmpleadoModal: React.FC<EditarEmpleadoModalProps> = ({
  open,
  employee,
  onClose,
  onUpdated,
}) => {
  const [form, setForm] = useState<EmpleadoFormData>(emptyEmpleadoForm);

  useEffect(() => {
    if (open && employee) {
      setForm(empleadoToForm(employee));
    }
  }, [open, employee]);

  const isValid = isEmpleadoFormValid(form);

  const handleSave = useCallback(async () => {
    if (!employee || !isValid) return;

    const fields = buildEmpleadoFieldsFromForm(form);
    const payload: Omit<Employee, 'id'> = {
      ...fields,
      payments: ensureEmployeePayments(employee.payments),
      createdAt: employee.createdAt,
    };

    await updateEmployeeInFirestore(employee.id, payload);
    onUpdated({ id: employee.id, ...payload });
    onClose();
  }, [employee, form, isValid, onClose, onUpdated]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={finanzaModalTitleSx}>
        Editar empleado
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
        <EmpleadoFormFields form={form} onChange={setForm} />
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
