import React from 'react';
import { FormControlLabel, Switch, TextField } from '@mui/material';
import { EmpleadoFormData } from './empleadoFormUtils';

interface EmpleadoFormFieldsProps {
  form: EmpleadoFormData;
  onChange: (form: EmpleadoFormData) => void;
}

export const EmpleadoFormFields: React.FC<EmpleadoFormFieldsProps> = ({ form, onChange }) => (
  <>
    <TextField
      fullWidth
      label="Nombre"
      value={form.name}
      onChange={(e) => onChange({ ...form, name: e.target.value })}
      sx={{ mb: 2 }}
    />
    <TextField
      fullWidth
      label="Fecha de nacimiento"
      type="date"
      value={form.birthDate}
      onChange={(e) => onChange({ ...form, birthDate: e.target.value })}
      InputLabelProps={{ shrink: true }}
      sx={{ mb: 2 }}
    />
    <TextField
      fullWidth
      label="Número de carnet de identidad"
      value={form.identityCardNumber}
      onChange={(e) => onChange({ ...form, identityCardNumber: e.target.value })}
      sx={{ mb: 2 }}
    />
    <TextField
      fullWidth
      label="Ubicación de domicilio"
      value={form.homeAddress}
      onChange={(e) => onChange({ ...form, homeAddress: e.target.value })}
      multiline
      minRows={2}
      sx={{ mb: 2 }}
    />
    <FormControlLabel
      control={
        <Switch
          checked={form.isActive}
          onChange={(e) => onChange({ ...form, isActive: e.target.checked })}
        />
      }
      label="Empleado activo"
    />
  </>
);
