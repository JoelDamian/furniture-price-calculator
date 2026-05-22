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
import { Finanza } from '../../models/Interfaces';
import { updateFinanzaInFirestore } from '../../services/finanzasService';
import { FinanzaFormFields } from './FinanzaFormFields';
import {
  finanzaModalActionsSx,
  finanzaModalCloseButtonSx,
  finanzaModalContentSx,
  finanzaModalTitleSx,
} from './finanzaModalStyles';
import { buildFinanzaPayload, finanzaToForm, FinanzaFormData } from './finanzaFormUtils';

interface EditarFinanzaModalProps {
  open: boolean;
  finanza: Finanza | null;
  onClose: () => void;
  onUpdated: (finanza: Finanza) => void;
}

export const EditarFinanzaModal: React.FC<EditarFinanzaModalProps> = ({
  open,
  finanza,
  onClose,
  onUpdated,
}) => {
  const [form, setForm] = useState<FinanzaFormData | null>(null);

  useEffect(() => {
    if (open && finanza) {
      setForm(finanzaToForm(finanza));
    }
  }, [open, finanza]);

  const handleUpdate = useCallback(async () => {
    if (!finanza || !form) return;

    const payload = buildFinanzaPayload(form, {
      createdAt: finanza.createdAt,
      finishedAt: finanza.finishedAt,
    });
    await updateFinanzaInFirestore(finanza.id, payload);
    onUpdated({ id: finanza.id, ...payload });
    onClose();
  }, [finanza, form, onClose, onUpdated]);

  return (
    <Dialog fullScreen open={open} onClose={onClose}>
      <DialogTitle sx={finanzaModalTitleSx}>
        Editar finanza
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
        {form && <FinanzaFormFields form={form} onChange={setForm} />}
      </DialogContent>
      <DialogActions sx={finanzaModalActionsSx}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={handleUpdate}
          disabled={!form?.name.trim()}
        >
          Actualizar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
