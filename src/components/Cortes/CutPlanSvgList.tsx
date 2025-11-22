import React, { FC } from "react";
import { CutSheetSvg } from "./CutSheetSvg";
import { HojaCorte } from "../../models/Interfaces";

interface CutPlanSvgListProps {
  hojas: HojaCorte[];
  svgWidthPerSheet?: number;
}

export const CutPlanSvgList: FC<CutPlanSvgListProps> = ({
  hojas,
  svgWidthPerSheet = 400,
}) => {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
      {hojas.map((hoja) => (
        <div key={hoja.hojaId}>
          <div style={{ marginBottom: 8, fontWeight: 600 }}>
            {hoja.hojaId} ({hoja.width}m × {hoja.height}m)
          </div>
          <CutSheetSvg hoja={hoja} svgWidth={svgWidthPerSheet} />
        </div>
      ))}
    </div>
  );
};
