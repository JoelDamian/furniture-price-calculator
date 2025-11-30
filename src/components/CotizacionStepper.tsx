import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Stepper, Step, StepLabel, Button, Typography } from '@mui/material';
import { FormCotizacion } from './FormularioCot';
import { AccessorysPage } from './Accessories';
import { CotizacionPreview } from './CotizacionPreview';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCotizacionStore } from '../store/cotizacionStore';
import { useAccessoryStore } from '../store/accessoryStore';
import { useCotizacionGlobalStore } from '../store/finalCotizacion';
import { saveCotizacion, updateCotizacionInFirestore } from "../services/cotizacionService";
import { Accessory } from '../models/Interfaces';

const steps = ['Piezas', 'Agregar Accesorios', 'Previsualización'];

// Memoized step components to prevent unnecessary re-renders
const MemoizedFormCotizacion = React.memo(FormCotizacion);
const MemoizedAccessorysPage = React.memo(AccessorysPage);
const MemoizedCotizacionPreview = React.memo(CotizacionPreview);

export const CotizacionStepper: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { isEdit } = location.state || {};

  // Store selectors
  const cotizacion = useCotizacionGlobalStore((state) => state.cotizacion);
  const piezas = useCotizacionStore((state) => state.items);
  const resetPiezas = useCotizacionStore((state) => state.clearItems);
  const resetAccesorios = useAccessoryStore((state) => state.clearItems);
  const resetGlobal = useCotizacionGlobalStore((state) => state.resetCotizacion);
  const items = useAccessoryStore((state) => state.items);
  const addItem = useAccessoryStore((state) => state.addItem);
  const updateItem = useAccessoryStore((state) => state.updateItem);

  useEffect(() => {
    if (!isEdit) {
      resetPiezas();
      resetAccesorios();
      resetGlobal();
    }
  }, [isEdit, resetPiezas, resetAccesorios, resetGlobal]);

  // Memoized reset function
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

  // Memoized step content renderer
  const stepContent = useMemo(() => {
    switch (activeStep) {
      case 0:
        return <MemoizedFormCotizacion />;
      case 1:
        return <MemoizedAccessorysPage />;
      case 2:
        return <MemoizedCotizacionPreview isEdit={isEdit} />;
      default:
        return <Typography>Step desconocido</Typography>;
    }
  }, [activeStep, isEdit]);

  const addNewCotizacion = useCallback(async () => {
    try {
      console.log("Guardando cotización:", cotizacion);
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
      console.log("Editando cotización ID:", cotizacion.id);
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
    <Box sx={{ width: '100%', p: { xs: 1, md: 4 } }}>
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ mt: 4 }}>{stepContent}</Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button
          disabled={isFirstStep}
          onClick={handleBack}
          variant="outlined"
        >
          Atrás
        </Button>
        {!isLastStep && (
          <Button
            variant="contained"
            onClick={handleNext}
          >
            Siguiente
          </Button>
        )}
        {isLastStep && (
          <Button
            variant="contained"
            onClick={handleSave}
          >
            Guardar
          </Button>
        )}
      </Box>
    </Box>
  );
};
