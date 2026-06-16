import { Employee } from '../../../models/Interfaces';

export interface EmpleadoFormData {
  name: string;
  birthDate: string;
  identityCardNumber: string;
  homeAddress: string;
  isActive: boolean;
}

export const emptyEmpleadoForm = (): EmpleadoFormData => ({
  name: '',
  birthDate: '',
  identityCardNumber: '',
  homeAddress: '',
  isActive: true,
});

export const empleadoToForm = (employee: Employee): EmpleadoFormData => ({
  name: employee.name,
  birthDate: employee.birthDate,
  identityCardNumber: employee.identityCardNumber,
  homeAddress: employee.homeAddress,
  isActive: employee.isActive,
});

export const isEmpleadoFormValid = (form: EmpleadoFormData): boolean =>
  Boolean(
    form.name.trim() &&
      form.birthDate &&
      form.identityCardNumber.trim() &&
      form.homeAddress.trim()
  );

export const buildEmpleadoFieldsFromForm = (form: EmpleadoFormData) => ({
  name: form.name.trim(),
  birthDate: form.birthDate,
  identityCardNumber: form.identityCardNumber.trim(),
  homeAddress: form.homeAddress.trim(),
  isActive: form.isActive,
});
