import { useLocation } from 'react-router-dom';
import { CotizacionAiChat } from './cotizacionAi/CotizacionAiChat';
import { useAuthStore } from '../store/authStore';
import { canAccessFinanzas } from '../constants/finanzasAccess';

const COTIZACION_ROUTES = ['/cotizacion', '/lista-cotizaciones'];

export const CotizacionAiChatWidget = () => {
  const location = useLocation();
  const userEmail = useAuthStore((state) => state.userEmail);
  const showChat =
    COTIZACION_ROUTES.includes(location.pathname) &&
    canAccessFinanzas(userEmail);

  if (!showChat) return null;

  return <CotizacionAiChat />;
};
