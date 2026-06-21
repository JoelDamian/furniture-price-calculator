import React from 'react';
import { Box, Typography } from '@mui/material';

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ icon, title }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, mt: 1 }}>
    <Box sx={{ color: 'primary.main', display: 'flex', alignItems: 'center' }}>{icon}</Box>
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
        {title}
      </Typography>
      <Box sx={{ width: 48, height: 3, bgcolor: 'primary.main', borderRadius: 1, mt: 0.5 }} />
    </Box>
  </Box>
);
