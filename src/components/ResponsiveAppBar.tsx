import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Menu, MenuItem, Drawer, List, ListItem, ListItemText, Button, Box } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Link } from 'react-router-dom';

export const ResponsiveAppBar: React.FC = () => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Typography variant="h6" sx={{ my: 2 }}>Menú</Typography>
      <List>
        <ListItem button component={Link} to="/material">
          <ListItemText primary="Materiales" />
        </ListItem>
        <ListItem button component={Link} to="/accesorios">
          <ListItemText primary="Accesorios" />
        </ListItem>
        <ListItem button component={Link} to="/lista-cotizaciones">
          <ListItemText primary="Lista de Cotizaciones" />
        </ListItem>
        <ListItem button component={Link} to="/cotizacion">
          <ListItemText primary="Crear Cotizacion" />
        </ListItem>
      </List>
    </Box>
  );

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
            <Button color="inherit" component={Link} to="/material">Materiales</Button>
            <Button color="inherit" component={Link} to="/accesorios">Accesorios</Button>
            <Button color="inherit" component={Link} to="/lista-cotizaciones">Lista de Cotizaciones</Button>
            <Button color="inherit" component={Link} to="/cotizacion">Crear Cotizacion</Button>
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        sx={{ display: { xs: 'block', sm: 'none' } }}
      >
        {drawer}
      </Drawer>
    </Box>
  );
};
