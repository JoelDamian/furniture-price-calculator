import React, { useState, useCallback, useMemo } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
  Box,
  Tooltip,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAuthStore } from '../store/authStore';
import { canAccessFinanzas } from '../constants/finanzasAccess';

const baseNavItems = [
  { label: 'Materiales', path: '/material' },
  { label: 'Accesorios', path: '/accesorios' },
  { label: 'Lista de Cotizaciones', path: '/lista-cotizaciones' },
  { label: 'Crear Cotizacion', path: '/cotizacion' },
];

const getEmailInitial = (email: string | null): string => {
  if (!email) return '?';
  const localPart = email.split('@')[0]?.trim();
  return (localPart?.[0] ?? '?').toUpperCase();
};

export const ResponsiveAppBar: React.FC = () => {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userEmail = useAuthStore((state) => state.userEmail);
  const logout = useAuthStore((state) => state.logout);

  const navItems = useMemo(() => {
    const items = [...baseNavItems];
    if (canAccessFinanzas(userEmail)) {
      items.push({ label: 'Finanzas', path: '/finanzas' });
    }
    return items;
  }, [userEmail]);

  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuAnchor(null);
  }, []);

  const handleLogout = useCallback(async () => {
    handleMenuClose();
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      logout();
      navigate('/');
    }
  }, [handleMenuClose, logout, navigate]);

  const isMenuOpen = Boolean(menuAnchor);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Gestor de Materiales
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title="Cerrar sesión">
              <IconButton
                color="inherit"
                onClick={handleLogout}
                aria-label="Cerrar sesión"
              >
                <LogoutIcon />
              </IconButton>
            </Tooltip>
            {isAuthenticated && (
              <>
                <IconButton
                  onClick={handleMenuOpen}
                  aria-label="Abrir menú de navegación"
                  aria-controls={isMenuOpen ? 'user-menu' : undefined}
                  aria-haspopup="true"
                  aria-expanded={isMenuOpen ? 'true' : undefined}
                  sx={{ p: 0.5 }}
                >
                  <Avatar
                    sx={{
                      bgcolor: 'primary.dark',
                      width: 40,
                      height: 40,
                      fontSize: '1rem',
                      fontWeight: 600,
                    }}
                  >
                    {getEmailInitial(userEmail)}
                  </Avatar>
                </IconButton>
                <Menu
                  id="user-menu"
                  anchorEl={menuAnchor}
                  open={isMenuOpen}
                  onClose={handleMenuClose}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  slotProps={{
                    paper: {
                      sx: {
                        mt: 1,
                        minWidth: 220,
                        maxWidth: 'calc(100vw - 32px)',
                      },
                    },
                  }}
                >
                  {userEmail && (
                    <>
                      <MenuItem disabled sx={{ opacity: 1 }}>
                        <ListItemText
                          primary={userEmail}
                          primaryTypographyProps={{
                            variant: 'body2',
                            color: 'text.secondary',
                            noWrap: true,
                          }}
                        />
                      </MenuItem>
                      <Divider />
                    </>
                  )}
                  {navItems.map((item) => (
                    <MenuItem
                      key={item.path}
                      component={Link}
                      to={item.path}
                      onClick={handleMenuClose}
                    >
                      {item.label}
                    </MenuItem>
                  ))}
                  <Divider />
                  <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                      <LogoutIcon fontSize="small" />
                    </ListItemIcon>
                    Cerrar sesión
                  </MenuItem>
                </Menu>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>
    </Box>
  );
};
