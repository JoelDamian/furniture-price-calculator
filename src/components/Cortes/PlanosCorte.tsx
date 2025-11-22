import React from "react";
import { CutPlanSvgList } from "./CutPlanSvgList";
import { HojaCorte } from "../../models/Interfaces";

interface ResultadoPorMaterial {
  material: string;
  resultado: HojaCorte[];
}

interface Props {
  planos?: ResultadoPorMaterial[]; // opcional !!!
}

export const PlanosDeCortePorMaterial: React.FC<Props> = ({ planos = [] }) => {
  if (!Array.isArray(planos) || planos.length === 0) {
    return <h2>No hay planos para mostrar</h2>;
  }

  return (
    <div style={{ padding: "24px" }}>
      <h1>Planos de corte por material</h1>

      {planos.map((item) => (
        <div key={item.material} style={{ marginBottom: "40px" }}>
          <h2>{item.material}</h2>
          <CutPlanSvgList hojas={item.resultado} svgWidthPerSheet={350} />
        </div>
      ))}
    </div>
  );
};
