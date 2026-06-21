import React, { useCallback, useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import { Cotizacion } from '../models/Interfaces';
import { recoverCotizacionFromJson } from '../services/cotizacionService';

interface RecoverCotizacionDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (newId: string, nombre: string) => void;
}

const isValidCotizacionPayload = (value: unknown): value is Omit<Cotizacion, 'id'> => {
  if (!value || typeof value !== 'object') return false;
  const data = value as Record<string, unknown>;
  return (
    typeof data.nombre === 'string' &&
    Array.isArray(data.piezas) &&
    Array.isArray(data.accesorios) &&
    typeof data.manoDeObra === 'number' &&
    typeof data.total === 'number' &&
    typeof data.precioVenta === 'number' &&
    typeof data.precioVentaConIva === 'number' &&
    !!data.dimensiones &&
    typeof data.dimensiones === 'object'
  );
};

export const RecoverCotizacionDialog: React.FC<RecoverCotizacionDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleClose = useCallback(() => {
    if (submitting) return;
    setError(null);
    onClose();
  }, [onClose, submitting]);

  const handleSubmit = useCallback(async () => {
    setError(null);
    setSubmitting(true);

    try {
      const parsed: unknown = JSON.parse(jsonText);
      const { id: _ignoredId, ...rest } = (parsed ?? {}) as Cotizacion;

      if (!isValidCotizacionPayload(rest)) {
        throw new Error(
          'JSON inválido. Debe incluir nombre, piezas, accesorios, totales y dimensiones.'
        );
      }

      const newId = await recoverCotizacionFromJson(rest);
      setJsonText('');
      onSuccess(newId, rest.nombre);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la cotización');
    } finally {
      setSubmitting(false);
    }
  }, [jsonText, onClose, onSuccess]);

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle>Recover — importar cotización</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TextField
          autoFocus
          fullWidth
          multiline
          minRows={12}
          maxRows={24}
          label="JSON de cotización"
          placeholder='Pega aquí el JSON exportado (con o sin "id")'
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          disabled={submitting}
          sx={{ fontFamily: 'monospace' }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting || !jsonText.trim()}
        >
          {submitting ? 'Creando…' : 'Crear cotización'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
