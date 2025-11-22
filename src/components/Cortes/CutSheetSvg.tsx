import React, { FC, useMemo } from "react";
import { HojaCorte } from "../../models/Interfaces";

interface CutSheetSvgProps {
  hoja: HojaCorte;
  svgWidth?: number;
  showLabels?: boolean;
}

export const CutSheetSvg: FC<CutSheetSvgProps> = ({
  hoja,
  svgWidth = 400,
  showLabels = true,
}) => {
  // Escalamos metros -> píxeles
  const { svgHeight, scale } = useMemo(() => {
    const scaleLocal = svgWidth / hoja.width;
    return {
      scale: scaleLocal,
      svgHeight: hoja.height * scaleLocal,
    };
  }, [hoja.width, hoja.height, svgWidth]);

  return (
    <svg
      width={svgWidth}
      height={svgHeight}
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      style={{ border: "1px solid #999", background: "#fdfdfd" }}
    >
      {/* Hoja completa */}
      <rect
        x={0}
        y={0}
        width={svgWidth}
        height={svgHeight}
        fill="#f5f5f5"
        stroke="#333"
        strokeWidth={1}
      />

      {/* Piezas */}
      {hoja.piezas.map((pieza) => {
        const x = pieza.x * scale;
        const y = pieza.y * scale;
        const w = pieza.width * scale;
        const h = pieza.height * scale;

        // Medidas formateadas en metros (2 decimales)
        const label = `${pieza.width.toFixed(2)} × ${pieza.height.toFixed(2)} m`;

        return (
          <g key={`${hoja.hojaId}-${pieza.piezaId}-${x}-${y}`}>
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              fill="#d0e6ff"
              stroke="#1a3b5d"
              strokeWidth={0.8}
            />

            {showLabels && (
              <text
                x={x + w / 2}
                y={y + h / 2}
                fontSize={10}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#000"
              >
                {label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};
