import React from 'react';
import { Box, Typography } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';

interface CotizacionWizardStepperProps {
  steps: string[];
  activeStep: number;
}

export const CotizacionWizardStepper: React.FC<CotizacionWizardStepperProps> = ({
  steps,
  activeStep,
}) => (
  <Box
    sx={{
      bgcolor: 'background.paper',
      borderRadius: 3,
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      px: { xs: 2, md: 4 },
      py: 3,
      mb: 3,
    }}
  >
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        gap: 0,
      }}
    >
      {steps.map((label, index) => {
        const isCompleted = index < activeStep;
        const isActive = index === activeStep;
        const isLast = index === steps.length - 1;

        return (
          <React.Fragment key={label}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: { xs: 80, sm: 120 },
                flex: 1,
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: isCompleted ? 'primary.main' : 'background.paper',
                  border: 2,
                  borderColor: isCompleted || isActive ? 'primary.main' : 'grey.300',
                  color: isCompleted ? 'common.white' : isActive ? 'primary.main' : 'grey.500',
                  fontWeight: 700,
                  fontSize: '1rem',
                  transition: 'all 0.2s',
                }}
              >
                {isCompleted ? <CheckIcon fontSize="small" /> : index + 1}
              </Box>
              <Typography
                variant="body2"
                sx={{
                  mt: 1,
                  fontWeight: isActive ? 600 : 500,
                  color: 'text.primary',
                  textAlign: 'center',
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                }}
              >
                {label}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: isActive ? 'primary.main' : 'text.secondary',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '0.7rem',
                }}
              >
                {isCompleted ? 'Completado' : isActive ? 'En progreso' : 'Pendiente'}
              </Typography>
            </Box>

            {!isLast && (
              <Box
                sx={{
                  flex: 1,
                  height: 2,
                  bgcolor: index < activeStep ? 'primary.main' : 'grey.200',
                  mt: 2.5,
                  mx: { xs: 0.5, sm: 1 },
                  minWidth: 24,
                  borderRadius: 1,
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </Box>
  </Box>
);
