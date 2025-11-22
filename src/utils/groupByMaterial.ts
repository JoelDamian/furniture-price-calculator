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

export function agruparPiezasPorMaterialDeVariasCotizaciones(
  cotizaciones: Cotizacion[]
): Record<string, EstanteItem[]> {
  
  return cotizaciones.reduce<Record<string, EstanteItem[]>>((acc, cotizacion) => {
    
    cotizacion.piezas.forEach((pieza) => {
      if (!acc[pieza.material]) {
        acc[pieza.material] = [];
      }
      acc[pieza.material].push(pieza);
    });

    return acc;
  }, {});
}
