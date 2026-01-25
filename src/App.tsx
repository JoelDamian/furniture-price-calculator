// App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Container, ThemeProvider, createTheme } from '@mui/material';
import { pink } from '@mui/material/colors';
import { MelaminaMaterialsPage } from './components/Materiales';
import { Login } from './components/Login';
import { useAuthStore } from './store/authStore';
import { useEffect } from 'react';
import { CotizacionStepper } from './components/CotizacionStepper';
import { CotizacionesList } from './components/CotizacionesList';
import { AccessorysGlobalPage } from './components/AccessoriesGlobal';
import { useAccessoryGlobalStore } from './store/accessoryGlobalStore';
import { fetchAccessories } from './services/accessoriesService';
import { ResponsiveAppBar } from './components/ResponsiveAppBar';
import { PlanosPage } from './components/Cortes/PlanosPage';
import { GlobalLoadingOverlay } from './components/GlobalLoadingOverlay';

// Create theme with pink as primary color
const theme = createTheme({
  palette: {
    primary: {
      main: pink[500], // #e91e63
      light: pink[300],
      dark: pink[700],
    },
  },
});

function App() {
  // Use single selector to avoid multiple subscriptions
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const addListAccessories = useAccessoryGlobalStore((state) => state.addListAccessories);

  // Single useEffect for session restoration - removed duplicate logic
  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // Separate useEffect for loading accessories only once on mount
  useEffect(() => {
    const loadAccessories = async () => {
      try {
        const accessories = await fetchAccessories();
        addListAccessories(accessories);
      } catch (error) {
        console.error('Error loading accessories:', error);
      }
    };
    loadAccessories();
  }, [addListAccessories]);

  return (
    <ThemeProvider theme={theme}>
      <Router>
        <GlobalLoadingOverlay />
        <ResponsiveAppBar />
        <Container sx={{ mt: 4 }}>
          <Routes>
            <Route path="/" element={
              isAuthenticated ? <Navigate to="/material" /> : <Login />
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
            <Route path="/planos" element={
              isAuthenticated ? <PlanosPage /> : <Navigate to="/" />
            } />
          </Routes>
        </Container>
      </Router>
    </ThemeProvider>
  );
}

export default App;
