// App.tsx
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Container } from '@mui/material';
import { MelaminaMaterialsPage } from './components/Materiales';
import { Login } from './components/Login';
import { useAuthStore } from './store/authStore';
import { useEffect } from 'react';
import { CotizacionStepper } from './components/CotizacionStepper';
import { CotizacionesList } from './components/CotizacionesList';
import { AccessorysGlobalPage } from './components/AccessoriesGlobal';
import { useAccessoryGlobalStore } from './store/accessoryGlobalStore';
import { fetchAccessories } from './services/accessoriesService';
import {ResponsiveAppBar} from './components/ResponsiveAppBar';

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const login = useAuthStore((state) => state.login);

  const restoreSession = useAuthStore((state) => state.restoreSession);
  const { addListAccessories } = useAccessoryGlobalStore();

  useEffect(() => {
    restoreSession();
    fetchAccessories().then((accessories) => {
      addListAccessories(accessories);
    });
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
      <ResponsiveAppBar />
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
            isAuthenticated ? <CotizacionStepper /> : <Navigate to="/" state={{ isEdit: false }} />
          } />
          <Route path="/accesorios" element={
            isAuthenticated ? <AccessorysGlobalPage /> : <Navigate to="/" />
          } />
        </Routes>
      </Container>
    </Router>
  );
}

export default App;