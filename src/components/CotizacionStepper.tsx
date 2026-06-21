import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SaveIcon from '@mui/icons-material/Save';
import { FormCotizacion } from './FormularioCot';
import { AccessorysPage } from './Accessories';
import { CotizacionPreview } from './CotizacionPreview';
import { CotizacionWizardStepper } from './cotizacion/CotizacionWizardStepper';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCotizacionStore } from '../store/cotizacionStore';
import { useAccessoryStore } from '../store/accessoryStore';
import { useCotizacionGlobalStore } from '../store/finalCotizacion';
import { saveCotizacion, updateCotizacionInFirestore } from "../services/cotizacionService";
import { Accessory } from '../models/Interfaces';

const steps = ['Piezas', 'Agregar Accesorios', 'Previsualización'];

const MemoizedFormCotizacion = React.memo(FormCotizacion);
const MemoizedAccessorysPage = React.memo(AccessorysPage);
const MemoizedCotizacionPreview = React.memo(CotizacionPreview);

export const CotizacionStepper: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { isEdit, fromAi, tipoMueble } = location.state || {};

  const cotizacion = useCotizacionGlobalStore((state) => state.cotizacion);
  const piezas = useCotizacionStore((state) => state.items);
  const resetPiezas = useCotizacionStore((state) => state.clearItems);
  const resetAccesorios = useAccessoryStore((state) => state.clearItems);
  const resetGlobal = useCotizacionGlobalStore((state) => state.resetCotizacion);
  const items = useAccessoryStore((state) => state.items);
  const addItem = useAccessoryStore((state) => state.addItem);
  const updateItem = useAccessoryStore((state) => state.updateItem);

  useEffect(() => {
    if (!isEdit && !fromAi) {
      resetPiezas();
      resetAccesorios();
      resetGlobal();
    }
  }, [isEdit, fromAi, resetPiezas, resetAccesorios, resetGlobal]);

  const resetAllStores = useCallback(() => {
    resetPiezas();
    resetAccesorios();
    resetGlobal();
  }, [resetPiezas, resetAccesorios, resetGlobal]);

  const handleNext = useCallback(() => {
    const totalTC = piezas.reduce((sum, item) => sum + (item.tc || 0), 0);
    const foundTC = items.find(acc => acc.id === '1');

    if (foundTC) {
      const newAccesorio = {
        ...foundTC,
        cantidad: totalTC,
        precioTotal: totalTC * foundTC.precioUnitario
      };
      updateItem(newAccesorio.id, newAccesorio);
    } else {
      const nuevoAccesorio: Accessory = {
        id: '1',
        cantidad: totalTC,
        nombre: 'Tapacanto',
        precioUnitario: 3,
        precioTotal: totalTC * 3
      };
      addItem(nuevoAccesorio);
    }
    setActiveStep((prev) => prev + 1);
  }, [piezas, items, updateItem, addItem]);

  const handleBack = useCallback(() => {
    setActiveStep((prev) => prev - 1);
  }, []);

  const stepContent = useMemo(() => {
    switch (activeStep) {
      case 0:
        return <MemoizedFormCotizacion isEdit={isEdit} initialTipoMueble={tipoMueble} />;
      case 1:
        return <MemoizedAccessorysPage />;
      case 2:
        return <MemoizedCotizacionPreview isEdit={isEdit} />;
      default:
        return <Typography>Step desconocido</Typography>;
    }
  }, [activeStep, isEdit, tipoMueble]);

  const addNewCotizacion = useCallback(async () => {
    try {
      const id = await saveCotizacion(cotizacion);
      console.log("Cotización guardada con ID:", id);
      resetAllStores();
      navigate('/lista-cotizaciones');
    } catch (err) {
      console.error("No se pudo guardar la cotización", err);
    }
  }, [cotizacion, resetAllStores, navigate]);

  const editCotizacion = useCallback(async () => {
    try {
      await updateCotizacionInFirestore(cotizacion.id, cotizacion);
      resetAllStores();
      navigate('/lista-cotizaciones');
    } catch (err) {
      console.error("No se pudo guardar la cotización", err);
    }
  }, [cotizacion, resetAllStores, navigate]);

  const handleSave = useCallback(async () => {
    if (isEdit) {
      await editCotizacion();
    } else {
      await addNewCotizacion();
    }
  }, [isEdit, editCotizacion, addNewCotizacion]);

  const isLastStep = activeStep === steps.length - 1;
  const isFirstStep = activeStep === 0;

  return (
    <Box sx={{ width: '100%', maxWidth: 1100, mx: 'auto', px: { xs: 1, md: 2 }, py: { xs: 2, md: 3 } }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary' }}>
        {isEdit ? 'Editar cotización' : 'Nueva cotización'}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Completa los pasos para {isEdit ? 'actualizar' : 'crear'} tu cotización de melamina.
      </Typography>

      <CotizacionWizardStepper steps={steps} activeStep={activeStep} />

      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ p: { xs: 2, md: 3 } }}>{stepContent}</Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 2,
            px: { xs: 2, md: 3 },
            py: 2,
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'grey.50',
          }}
        >
          <Button
            disabled={isFirstStep}
            onClick={handleBack}
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            sx={{ borderRadius: 2, px: 3 }}
          >
            Atrás
          </Button>
          {!isLastStep ? (
            <Button
              variant="contained"
              onClick={handleNext}
              endIcon={<ArrowForwardIcon />}
              sx={{ borderRadius: 2, px: 3, boxShadow: 'none' }}
            >
              Siguiente
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleSave}
              startIcon={<SaveIcon />}
              sx={{ borderRadius: 2, px: 3, boxShadow: 'none' }}
            >
              Guardar
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
};
