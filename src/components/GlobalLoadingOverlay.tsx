import React from 'react';
import { Backdrop, CircularProgress } from '@mui/material';
import { useLoadingStore } from '../store/loadingStore';

export const GlobalLoadingOverlay: React.FC = () => {
  const isLoading = useLoadingStore((s) => s.activeRequests > 0);

  return (
    <Backdrop
      open={isLoading}
      sx={{
        color: '#fff',
        zIndex: (theme) => theme.zIndex.modal + 10,
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
      }}
    >
      <CircularProgress color="inherit" />
    </Backdrop>
  );
};

