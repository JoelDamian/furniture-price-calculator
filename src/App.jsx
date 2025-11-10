// App.tsx
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Container } from '@mui/material';
import { MelaminaMaterialsPage } from './components/Materiales';
import { Login } from './components/Login';
import { useAuthStore } from './store/authStore';
import { useEffect } from 'react';
import { CotizacionStepper } from './components/CotizacionStepper';
import { CotizacionesList } from './components/CotizacionesList';

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const login = useAuthStore((state) => state.login);

  const restoreSession = useAuthStore((state) => state.restoreSession);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);


  useEffect(() => {
    const session = sessionStorage.getItem('isAuthenticated');
    if (session === 'true') login();
  }, [login]);

  const handleLogin = () => {
    login();
    sessionStorage.setItem('isAuthenticated', 'true');
  };


  return (
    <Router>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Gestor de Materiales
          </Typography>
          <Button color="inherit" component={Link} to="/">
            Materiales
          </Button>
          <Button color="inherit" component={Link} to="/lista-cotizaciones">
            Lista de Cotizaciones
          </Button>
          <Button color="inherit" component={Link} to="/cotizacion">
            Crear Cotizacion
          </Button>
        </Toolbar>
      </AppBar>
      <Container sx={{ mt: 4 }}>
        <Routes>
          <Route path="/" element={
            isAuthenticated ? <Navigate to="/material" /> : <Login onLogin={handleLogin} />
          } />
          <Route path="/material" element={
            isAuthenticated ? <MelaminaMaterialsPage /> : <Navigate to="/" />
          } />
          <Route path="/lista-cotizaciones" element={
            isAuthenticated ? <CotizacionesList /> : <Navigate to="/" />
          } />
          <Route path="/cotizacion" element={
            isAuthenticated ? <CotizacionStepper /> : <Navigate to="/" />
          } />
        </Routes>
      </Container>
    </Router>
  );
}

export default App;