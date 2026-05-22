import React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Finanza } from '../../models/Interfaces';
import { FinanzaFormFields } from './FinanzaFormFields';
import {
  finanzaModalActionsSx,
  finanzaModalCloseButtonSx,
  finanzaModalContentSx,
  finanzaModalTitleSx,
} from './finanzaModalStyles';
import { finanzaToForm } from './finanzaFormUtils';

interface DetalleFinanzaModalProps {
  open: boolean;
  finanza: Finanza | null;
  onClose: () => void;
}

export const DetalleFinanzaModal: React.FC<DetalleFinanzaModalProps> = ({
  open,
  finanza,
  onClose,
}) => {
  const form = finanza ? finanzaToForm(finanza) : null;

  return (
    <Dialog fullScreen open={open} onClose={onClose}>
      <DialogTitle sx={finanzaModalTitleSx}>
        Detalle de finanza
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
        {form && finanza && (
          <FinanzaFormFields
            form={form}
            onChange={() => undefined}
            readOnly
            createdAt={finanza.createdAt}
            finishedAt={finanza.finishedAt}
          />
        )}
      </DialogContent>
      <DialogActions sx={finanzaModalActionsSx}>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};
