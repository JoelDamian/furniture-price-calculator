import React from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Employee } from '../../../models/Interfaces';
import { ensureEmployeePayments } from '../../../utils/employeeUtils';
import {
  finanzaModalActionsSx,
  finanzaModalCloseButtonSx,
  finanzaModalContentSx,
  finanzaModalTitleSx,
} from '../finanzaModalStyles';

interface VerPagosModalProps {
  open: boolean;
  employee: Employee | null;
  onClose: () => void;
}

const formatDate = (date: string) => {
  if (!date) return '—';
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
};

export const VerPagosModal: React.FC<VerPagosModalProps> = ({
  open,
  employee,
  onClose,
}) => {
  const payments = ensureEmployeePayments(employee?.payments).sort(
    (a, b) =>
      new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={finanzaModalTitleSx}>
        Pagos — {employee?.name ?? ''}
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
        {payments.length === 0 ? (
          <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
            Este empleado no tiene pagos registrados.
          </Typography>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Monto</TableCell>
                  <TableCell>Período</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Registrado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id ?? payment.createdAt}>
                    <TableCell>{Number(payment.amount ?? 0).toFixed(2)}</TableCell>
                    <TableCell>
                      {formatDate(payment.startDate)} — {formatDate(payment.endDate)}
                    </TableCell>
                    <TableCell>{payment.description ?? '—'}</TableCell>
                    <TableCell>
                      {payment.createdAt
                        ? new Date(payment.createdAt).toLocaleDateString('es-BO')
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions sx={finanzaModalActionsSx}>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};
