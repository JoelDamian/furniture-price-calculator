import { useLocation } from "react-router-dom";
import { PlanosDeCortePorMaterial } from "./PlanosCorte";

export const PlanosPage: React.FC = () => {
  const location = useLocation();

  const planos = location.state?.planos ?? [];

  return <PlanosDeCortePorMaterial planos={planos} />;
};
