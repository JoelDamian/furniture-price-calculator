import React, { FC, useMemo } from "react";
import { HojaCorte } from "../../models/Interfaces";

// Color palette for different pieces
const PIECE_COLORS = [
  "#FFB3BA", // Light pink
  "#BAFFC9", // Light green
  "#BAE1FF", // Light blue
  "#FFFFBA", // Light yellow
  "#FFD9BA", // Light orange
  "#E0BBE4", // Light purple
  "#D4F0F0", // Light teal
  "#FCE4EC", // Pink
  "#F0F4C3", // Lime
  "#B2EBF2", // Cyan
  "#FFCCBC", // Deep orange light
  "#D1C4E9", // Deep purple light
  "#C8E6C9", // Green light
  "#FFF9C4", // Yellow light
  "#F8BBD9", // Pink light
  "#B3E5FC", // Light blue 2
];

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

  // Create a color map for unique piezaIds
  const colorMap = useMemo(() => {
    const uniquePiezaIds = [...new Set(hoja.piezas.map(p => p.piezaId))];
    const map: Record<string, string> = {};
    uniquePiezaIds.forEach((id, index) => {
      map[id] = PIECE_COLORS[index % PIECE_COLORS.length];
    });
    return map;
  }, [hoja.piezas]);

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
      {hoja.piezas.map((pieza, index) => {
        const x = pieza.x * scale;
        const y = pieza.y * scale;
        const w = pieza.width * scale;
        const h = pieza.height * scale;

        // Get color for this piece based on piezaId
        const fillColor = colorMap[pieza.piezaId] || PIECE_COLORS[0];

        // Medidas formateadas en metros (2 decimales)
        const label = `${pieza.width.toFixed(2)} × ${pieza.height.toFixed(2)} m`;

        return (
          <g key={`${hoja.hojaId}-${pieza.piezaId}-${x}-${y}-${index}`}>
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              fill={fillColor}
              stroke="#333"
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
