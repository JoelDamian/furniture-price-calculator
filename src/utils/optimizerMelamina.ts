import { MaxRectsPacker } from "maxrects-packer";
import { MaterialItem, EstanteItem } from "../models/Interfaces";

const toMM = (m: number) => Math.round(m * 1000);
const toM = (mm: number) => mm / 1000;

export function optimizarMelamina(
  material: MaterialItem,
  piezas: EstanteItem[],
  allowRotation: boolean = true
) {
  const widthMM = toMM(material.med1);
  const heightMM = toMM(material.med2);

  const packer = new MaxRectsPacker(
    widthMM,
    heightMM,
    0,
    {
      smart: false, // OK
      pot: false,
      square: false,
      allowRotation: allowRotation
    }
  );

  piezas.forEach((p) => {
    let w = toMM(p.ancho);
    let h = toMM(p.largo);

    // 🔥 Rotación manual ANTES de insertar

    // Caso 1: entra rotada pero no normal
    if (w > widthMM && h <= heightMM) {
      [w, h] = [h, w]; // swap
    }

    // Caso 2: entra rotada verticalmente
    if (h > heightMM && w <= widthMM) {
      [w, h] = [h, w];
    }

    // Caso 3: ni rotada ni normal cabe
    if (w > widthMM || h > heightMM) {
      console.error("❌ Pieza demasiado grande para la hoja:", p);
      return;
    }

    for (let i = 0; i < p.cantidad; i++) {
      packer.add(w, h, { piezaId: p.id });
    }
  });

  return packer.bins.map((bin, index) => ({
    hojaId: `${material.id}-${index + 1}`,
    width: material.med1,
    height: material.med2,
    piezas: bin.rects.map((rect) => ({
      piezaId: rect.data.piezaId,
      x: toM(rect.x),
      y: toM(rect.y),
      width: toM(rect.width),
      height: toM(rect.height),
      rotado: rect.rot,
    })),
  }));
}
