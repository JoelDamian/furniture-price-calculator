import React, { useState } from 'react';
import { Box, Stepper, Step, StepLabel, Button, Typography } from '@mui/material';
import { FormCotizacion } from './FormularioCot';
import { AccessorysPage } from './Accessories';
import { CotizacionPreview } from './CotizacionPreview';
import { useNavigate } from 'react-router-dom';
import { useCotizacionStore } from '../store/cotizacionStore';
import { useAccessoryStore } from '../store/accessoryStore';
import { useCotizacionGlobalStore } from '../store/finalCotizacion';
import { saveCotizacion } from "../services/cotizacionService";

const steps = ['Piezas', 'Agregar Accesorios', 'Previsualización'];

export const CotizacionStepper: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();
  const cotizacion = useCotizacionGlobalStore.getState().cotizacion;

  const resetPiezas = useCotizacionStore((state) => state.clearItems);
  const resetAccesorios = useAccessoryStore((state) => state.clearItems);
  const resetGlobal = useCotizacionGlobalStore((state) => state.resetCotizacion);


  const handleNext = () => {
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
        return <CotizacionPreview />;
      default:
        return <Typography>Step desconocido</Typography>;
    }
  };

  const handleSave = async () => {
    try {
      const id = await saveCotizacion(cotizacion);
      console.log("Cotización guardada con ID:", id);
      // Limpia los stores
      resetPiezas();
      resetAccesorios();
      resetGlobal();
      // Redirige
      navigate('/lista-cotizaciones');
    } catch (err) {
      console.error("No se pudo guardar la cotización", err);
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
