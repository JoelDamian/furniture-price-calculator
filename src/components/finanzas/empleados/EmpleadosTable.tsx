import React, { useCallback, useEffect, useMemo, useState, memo } from 'react';
import {
  Box,
  Button,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Employee, EmployeePayment } from '../../../models/Interfaces';
import { fetchEmployees } from '../../../services/employeesService';
import { ensureEmployeePayments } from '../../../utils/employeeUtils';
import { CrearEmpleadoModal } from './CrearEmpleadoModal';
import { EditarEmpleadoModal } from './EditarEmpleadoModal';
import { AgregarPagoModal } from './AgregarPagoModal';
import { VerPagosModal } from './VerPagosModal';
import { RealizarPagoModal } from './RealizarPagoModal';

interface EmpleadoRowProps {
  employee: Employee;
  onEdit: (employee: Employee) => void;
  onViewPayments: (employee: Employee) => void;
  onAddPayment: (employee: Employee) => void;
}

const formatDate = (date: string) => {
  if (!date) return '—';
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
};

const EmpleadoRow = memo(({ employee, onEdit, onViewPayments, onAddPayment }: EmpleadoRowProps) => (
  <TableRow hover>
    <TableCell>{employee.name}</TableCell>
    <TableCell>{formatDate(employee.birthDate)}</TableCell>
    <TableCell>{employee.identityCardNumber}</TableCell>
    <TableCell>{employee.homeAddress}</TableCell>
    <TableCell>
      <Chip
        label={employee.isActive ? 'Activo' : 'Inactivo'}
        color={employee.isActive ? 'success' : 'default'}
        size="small"
      />
    </TableCell>
    <TableCell>{ensureEmployeePayments(employee.payments).length}</TableCell>
    <TableCell>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        <Button size="small" onClick={() => onEdit(employee)}>
          Editar
        </Button>
        <Button size="small" variant="outlined" onClick={() => onViewPayments(employee)}>
          Ver pagos
        </Button>
        <Button size="small" variant="contained" onClick={() => onAddPayment(employee)}>
          Agregar pago
        </Button>
      </Box>
    </TableCell>
  </TableRow>
));

EmpleadoRow.displayName = 'EmpleadoRow';

export const EmpleadosTable: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [nameSearch, setNameSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [bulkPayOpen, setBulkPayOpen] = useState(false);
  const [paymentsOpen, setPaymentsOpen] = useState(false);
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const loadEmployees = useCallback(async () => {
    const data = await fetchEmployees();
    setEmployees(data);
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const activeEmployees = useMemo(
    () => employees.filter((employee) => employee.isActive),
    [employees]
  );

  const handleEmployeeCreated = useCallback((employee: Employee) => {
    setEmployees((prev) => [...prev, employee].sort((a, b) => a.name.localeCompare(b.name)));
  }, []);

  const handleEmployeeUpdated = useCallback((employee: Employee) => {
    setEmployees((prev) =>
      prev
        .map((item) => (item.id === employee.id ? employee : item))
        .sort((a, b) => a.name.localeCompare(b.name))
    );
    setSelectedEmployee((prev) => (prev?.id === employee.id ? employee : prev));
  }, []);

  const handleEdit = useCallback((employee: Employee) => {
    setSelectedEmployee(employee);
    setEditOpen(true);
  }, []);

  const handleViewPayments = useCallback((employee: Employee) => {
    setSelectedEmployee(employee);
    setPaymentsOpen(true);
  }, []);

  const handleAddPayment = useCallback((employee: Employee) => {
    setSelectedEmployee(employee);
    setAddPaymentOpen(true);
  }, []);

  const handlePaymentAdded = useCallback(
    (employeeId: string, payment: EmployeePayment) => {
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === employeeId
            ? { ...emp, payments: [...ensureEmployeePayments(emp.payments), payment] }
            : emp
        )
      );
      setSelectedEmployee((prev) =>
        prev?.id === employeeId
          ? { ...prev, payments: [...ensureEmployeePayments(prev.payments), payment] }
          : prev
      );
    },
    []
  );

  const handleBulkPaymentsAdded = useCallback(
    (results: { employeeId: string; payment: EmployeePayment }[]) => {
      setEmployees((prev) =>
        prev.map((emp) => {
          const match = results.find((r) => r.employeeId === emp.id);
          return match
            ? { ...emp, payments: [...ensureEmployeePayments(emp.payments), match.payment] }
            : emp;
        })
      );
    },
    []
  );

  const filteredEmployees = useMemo(() => {
    const search = nameSearch.trim().toLowerCase();
    if (!search) return employees;
    return employees.filter((emp) => emp.name.toLowerCase().includes(search));
  }, [employees, nameSearch]);

  const tableRows = useMemo(
    () =>
      filteredEmployees.map((employee) => (
        <EmpleadoRow
          key={employee.id}
          employee={employee}
          onEdit={handleEdit}
          onViewPayments={handleViewPayments}
          onAddPayment={handleAddPayment}
        />
      )),
    [filteredEmployees, handleEdit, handleViewPayments, handleAddPayment]
  );

  const emptyMessage = nameSearch.trim()
    ? 'No se encontraron resultados'
    : 'No hay empleados registrados';

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Empleados</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={() => setBulkPayOpen(true)}>
            Realizar pago
          </Button>
          <Button variant="contained" onClick={() => setCreateOpen(true)}>
            Crear empleado
          </Button>
        </Box>
      </Box>

      <TextField
        fullWidth
        label="Buscar por nombre"
        value={nameSearch}
        onChange={(e) => setNameSearch(e.target.value)}
        sx={{ mb: 2, maxWidth: 400 }}
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Fecha de nacimiento</TableCell>
              <TableCell>Carnet de identidad</TableCell>
              <TableCell>Domicilio</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Pagos</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tableRows.length ? tableRows : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <CrearEmpleadoModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleEmployeeCreated}
      />

      <EditarEmpleadoModal
        open={editOpen}
        employee={selectedEmployee}
        onClose={() => {
          setEditOpen(false);
          setSelectedEmployee(null);
        }}
        onUpdated={handleEmployeeUpdated}
      />

      <RealizarPagoModal
        open={bulkPayOpen}
        employees={activeEmployees}
        onClose={() => setBulkPayOpen(false)}
        onPaymentsAdded={handleBulkPaymentsAdded}
      />

      <VerPagosModal
        open={paymentsOpen}
        employee={selectedEmployee}
        onClose={() => {
          setPaymentsOpen(false);
          setSelectedEmployee(null);
        }}
      />

      <AgregarPagoModal
        open={addPaymentOpen}
        employee={selectedEmployee}
        onClose={() => {
          setAddPaymentOpen(false);
          setSelectedEmployee(null);
        }}
        onPaymentAdded={handlePaymentAdded}
      />
    </Box>
  );
};
