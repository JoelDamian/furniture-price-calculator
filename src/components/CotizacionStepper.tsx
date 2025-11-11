import React, { useState } from 'react';
import { Box, Stepper, Step, StepLabel, Button, Typography } from '@mui/material';
import { FormCotizacion } from './FormularioCot';
import { AccessorysPage } from './Accessories';
import { CotizacionPreview } from './CotizacionPreview';
import { useNavigate } from 'react-router-dom';
import { useCotizacionStore } from '../store/cotizacionStore';
import { useAccessoryStore } from '../store/accessoryStore';
import { useCotizacionGlobalStore } from '../store/finalCotizacion';
import { saveCotizacion, updateCotizacionInFirestore } from "../services/cotizacionService";
import { Accessory } from '../models/Interfaces';
import { useLocation } from 'react-router-dom';

const steps = ['Piezas', 'Agregar Accesorios', 'Previsualización'];

export const CotizacionStepper: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();
  const cotizacion = useCotizacionGlobalStore((state) => state.cotizacion);
  const piezas = useCotizacionStore((state) => state.items);
  const resetPiezas = useCotizacionStore((state) => state.clearItems);
  const resetAccesorios = useAccessoryStore((state) => state.clearItems);
  const resetGlobal = useCotizacionGlobalStore((state) => state.resetCotizacion);
  const { items, addItem, updateItem } = useAccessoryStore();
  const location = useLocation();
  const { isEdit } = location.state || {};

  console.log("isEdit:", isEdit);


  const handleNext = () => {
    const totalTC = piezas.reduce((sum, item) => sum + (item.tc || 0), 0);
    const foundTC = items.find(acc => acc.id === '1');
    if (foundTC) {
      let newAccesorio = { ...foundTC, cantidad: totalTC, precioTotal: totalTC * foundTC.precioUnitario };
      updateItem(newAccesorio.id, newAccesorio);
    } else {
      const nuevoAccesorio: Accessory = {
        id: '1',
        cantidad: totalTC,
        nombre: 'Tapacanto',
        precioUnitario: 3,
        precioTotal: totalTC * 3
      }
      addItem(nuevoAccesorio);
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return <FormCotizacion />;
      case 1:
        return <AccessorysPage />;
      case 2:
        return <CotizacionPreview isEdit={isEdit}/>;
      default:
        return <Typography>Step desconocido</Typography>;
    }
  };

  const addNewCotizacion = async () => {
    try {
      console.log("Guardando cotización:", cotizacion);
      const id = await saveCotizacion(cotizacion);
      console.log("Cotización guardada con ID:", id);
      resetPiezas();
      resetAccesorios();
      resetGlobal();
      navigate('/lista-cotizaciones');
    } catch (err) {
      console.error("No se pudo guardar la cotización", err);
    }
  }

  const editCotizacion = async () => {
    try {
      console.log("Editando cotización ID:", cotizacion.id);
      await updateCotizacionInFirestore(cotizacion.id, cotizacion);
      resetPiezas();
      resetAccesorios();
      resetGlobal();
      navigate('/lista-cotizaciones');
    } catch (err) {
      console.error("No se pudo guardar la cotización", err);
    }
  }

  const handleSave = async () => {
    if (isEdit) {
      editCotizacion();
    } else {
      addNewCotizacion();
    }
  };
  return (
    <Box sx={{ width: '100%', p: 4 }}>
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ mt: 4 }}>{renderStepContent(activeStep)}</Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
          variant="outlined"
        >
          Atrás
        </Button>
        {activeStep != steps.length - 1 && <Button
          variant="contained"
          onClick={handleNext}
          disabled={activeStep === steps.length - 1}
        >
          Siguiente
        </Button>}
        {activeStep === steps.length - 1 && <Button
          variant="contained"
          onClick={handleSave}
        >
          Guardar
        </Button>}
      </Box>
    </Box>
  );
};
