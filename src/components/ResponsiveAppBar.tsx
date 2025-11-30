import React, { useState, useCallback, useMemo } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Drawer, 
  List, 
  ListItem, 
  ListItemText, 
  Button, 
  Box 
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Link } from 'react-router-dom';

// Navigation items configuration
const navItems = [
  { label: 'Materiales', path: '/material' },
  { label: 'Accesorios', path: '/accesorios' },
  { label: 'Lista de Cotizaciones', path: '/lista-cotizaciones' },
  { label: 'Crear Cotizacion', path: '/cotizacion' }
];

export const ResponsiveAppBar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  // Memoized drawer content
  const drawerContent = useMemo(() => (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Typography variant="h6" sx={{ my: 2 }}>Menú</Typography>
      <List>
        {navItems.map((item) => (
          <ListItem key={item.path} component={Link} to={item.path}>
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
      </List>
    </Box>
  ), [handleDrawerToggle]);

  // Memoized desktop navigation buttons
  const desktopNavButtons = useMemo(() => (
    navItems.map((item) => (
      <Button 
        key={item.path} 
        color="inherit" 
        component={Link} 
        to={item.path}
      >
        {item.label}
      </Button>
    ))
  ), []);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Gestor de Materiales
          </Typography>
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            {desktopNavButtons}
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        sx={{ display: { xs: 'block', sm: 'none' } }}
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};
