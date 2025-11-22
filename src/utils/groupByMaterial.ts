import { Cotizacion, EstanteItem } from "../models/Interfaces";

export function agruparPiezasPorMaterial(cotizacion: Cotizacion) {
  return cotizacion.piezas.reduce<Record<string, EstanteItem[]>>((acc, pieza) => {
    if (!acc[pieza.material]) {
      acc[pieza.material] = [];
    }
    acc[pieza.material].push(pieza);
    return acc;
  }, {});
}
