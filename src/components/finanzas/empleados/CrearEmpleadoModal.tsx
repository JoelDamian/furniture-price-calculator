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
import { Employee } from '../../../models/Interfaces';
import { saveEmployee } from '../../../services/employeesService';
import {
  finanzaModalActionsSx,
  finanzaModalCloseButtonSx,
  finanzaModalContentSx,
  finanzaModalTitleSx,
} from '../finanzaModalStyles';

interface CrearEmpleadoModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (employee: Employee) => void;
}

const emptyForm = () => ({
  name: '',
  birthDate: '',
  identityCardNumber: '',
  homeAddress: '',
});

export const CrearEmpleadoModal: React.FC<CrearEmpleadoModalProps> = ({
  open,
  onClose,
  onCreated,
}) => {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (open) setForm(emptyForm());
  }, [open]);

  const isValid =
    form.name.trim() &&
    form.birthDate &&
    form.identityCardNumber.trim() &&
    form.homeAddress.trim();

  const handleCreate = useCallback(async () => {
    if (!isValid) return;

    const payload = {
      name: form.name.trim(),
      birthDate: form.birthDate,
      identityCardNumber: form.identityCardNumber.trim(),
      homeAddress: form.homeAddress.trim(),
      payments: [],
      createdAt: new Date().toISOString(),
    };

    const newId = await saveEmployee(payload);
    onCreated({ id: newId, ...payload });
    onClose();
  }, [form, isValid, onClose, onCreated]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={finanzaModalTitleSx}>
        Crear empleado
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
          label="Nombre"
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Fecha de nacimiento"
          type="date"
          value={form.birthDate}
          onChange={(e) => setForm((prev) => ({ ...prev, birthDate: e.target.value }))}
          InputLabelProps={{ shrink: true }}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Número de carnet de identidad"
          value={form.identityCardNumber}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, identityCardNumber: e.target.value }))
          }
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Ubicación de domicilio"
          value={form.homeAddress}
          onChange={(e) => setForm((prev) => ({ ...prev, homeAddress: e.target.value }))}
          multiline
          minRows={2}
        />
      </DialogContent>
      <DialogActions sx={finanzaModalActionsSx}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleCreate} disabled={!isValid}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
