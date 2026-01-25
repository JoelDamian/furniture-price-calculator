import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';

interface DuplicateCotizacionDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const DuplicateCotizacionDialog: React.FC<DuplicateCotizacionDialogProps> = ({
  open,
  onCancel,
  onConfirm,
}) => {
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>¿Duplicar cotización?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Estas seguro de duplicar esta cotizacion?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button onClick={onConfirm} color="primary" variant="contained">
          Aceptar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

