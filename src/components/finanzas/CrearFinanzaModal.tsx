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
import { saveFinanza } from '../../services/finanzasService';
import { FinanzaFormFields } from './FinanzaFormFields';
import {
  finanzaModalActionsSx,
  finanzaModalCloseButtonSx,
  finanzaModalContentSx,
  finanzaModalTitleSx,
} from './finanzaModalStyles';
import { buildFinanzaPayload, createEmptyForm, FinanzaFormData } from './finanzaFormUtils';

interface CrearFinanzaModalProps {
  open: boolean;
  title: string;
  idOrg: number;
  onClose: () => void;
  onCreated: (finanza: Finanza) => void;
}

export const CrearFinanzaModal: React.FC<CrearFinanzaModalProps> = ({
  open,
  title,
  idOrg,
  onClose,
  onCreated,
}) => {
  const [form, setForm] = useState<FinanzaFormData>(() => createEmptyForm(idOrg));

  useEffect(() => {
    if (open) {
      setForm(createEmptyForm(idOrg));
    }
  }, [open, idOrg]);

  const handleCreate = useCallback(async () => {
    const payload = buildFinanzaPayload(form, {
      createdAt: new Date().toISOString(),
      finishedAt: null,
    });
    const newId = await saveFinanza({ id: crypto.randomUUID(), ...payload });
    onCreated({ id: newId, ...payload });
    onClose();
  }, [form, onClose, onCreated]);

  return (
    <Dialog fullScreen open={open} onClose={onClose}>
      <DialogTitle sx={finanzaModalTitleSx}>
        Crear finanza - {title}
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
        <FinanzaFormFields form={form} onChange={setForm} />
      </DialogContent>
      <DialogActions sx={finanzaModalActionsSx}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleCreate} disabled={!form.name.trim()}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
