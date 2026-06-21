import { Dimensiones, EstanteItem, MaterialItem } from '../models/Interfaces';
import type { ChatMessageImage } from './aiImageUtils';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  image?: ChatMessageImage;
}

export type TipoMueble = 'estante' | 'gabinete';

export interface CotizacionAiParams {
  nombre: string;
  tipoMueble: TipoMueble;
  dimensiones: Dimensiones;
  material: string;
  repisas?: number;
}

const calcularPrecioUnitario = (
  ancho: number,
  largo: number,
  precioM2: number,
  isTube?: boolean,
  precioML?: number
) => {
  if (isTube) {
    return parseFloat((largo * (precioML ?? 0)).toFixed(2));
  }
  return parseFloat((ancho * largo * precioM2).toFixed(2));
};

export const findMaterial = (materiales: MaterialItem[], materialName: string): MaterialItem | undefined => {
  const normalized = materialName.toLowerCase().trim();
  return (
    materiales.find((m) => m.material.toLowerCase() === normalized) ??
    materiales.find((m) => m.material.toLowerCase().includes(normalized)) ??
    materiales.find((m) => normalized.includes(m.material.toLowerCase()))
  );
};

const createPieza = (
  pieza: string,
  cantidad: number,
  ancho: number,
  largo: number,
  material: MaterialItem
): EstanteItem => {
  const precioM2 = material.isTube ? (material.precioML ?? 0) : material.precioM2;
  const precioUnitario = calcularPrecioUnitario(
    ancho,
    largo,
    precioM2,
    material.isTube,
    material.precioML
  );
  const precioTotal = parseFloat((precioUnitario * cantidad).toFixed(2));

  return {
    id: crypto.randomUUID(),
    cantidad,
    pieza,
    material: material.material,
    ancho,
    largo,
    precioM2,
    precioUnitario,
    precioTotal,
    atc: 0,
    ltc: 0,
    tc: 0,
  };
};

export const generarPiezasMueble = (
  params: CotizacionAiParams,
  materiales: MaterialItem[]
): { piezas: EstanteItem[]; materialUsado: string } => {
  const material = findMaterial(materiales, params.material);
  if (!material) {
    throw new Error(`No se encontró el material "${params.material}". Materiales disponibles: ${materiales.map((m) => m.material).join(', ')}`);
  }

  const { ancho, alto, profundidad } = params.dimensiones;
  const repisas = params.repisas ?? 1;
  const piezas: EstanteItem[] = [];

  if (params.tipoMueble === 'estante') {
    piezas.push(createPieza('lateral', 2, profundidad, alto, material));
    piezas.push(createPieza('base', 1, ancho, profundidad, material));
    piezas.push(createPieza('fondo', 1, ancho, alto, material));
    if (repisas > 0) {
      piezas.push(createPieza('repisa', repisas, ancho, profundidad, material));
    }
  } else {
    piezas.push(createPieza('lateral', 2, profundidad, alto, material));
    piezas.push(createPieza('fondo', 1, ancho, alto, material));
    piezas.push(createPieza('base', 1, ancho, profundidad, material));
    piezas.push(createPieza('puertas', 1, ancho / 2, alto, material));
    if (repisas > 0) {
      piezas.push(createPieza('repisa', repisas, ancho, profundidad, material));
    }
  }

  return { piezas, materialUsado: material.material };
};

export const parseQuoteReadyBlock = (text: string): CotizacionAiParams | null => {
  const match = text.match(/\[QUOTE_READY\]([\s\S]*?)\[\/QUOTE_READY\]/);
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[1].trim());
    if (!parsed.nombre || !parsed.tipoMueble || !parsed.dimensiones || !parsed.material) {
      return null;
    }
  if (!['estante', 'gabinete'].includes(parsed.tipoMueble)) {
      return null;
    }

    return {
      nombre: String(parsed.nombre),
      tipoMueble: parsed.tipoMueble,
      dimensiones: {
        ancho: Number(parsed.dimensiones.ancho),
        alto: Number(parsed.dimensiones.alto),
        profundidad: Number(parsed.dimensiones.profundidad),
      },
      material: String(parsed.material),
      repisas: parsed.repisas != null ? Number(parsed.repisas) : 1,
    };
  } catch {
    return null;
  }
};

export const stripQuoteReadyBlock = (text: string): string => {
  return text.replace(/\[QUOTE_READY\][\s\S]*?\[\/QUOTE_READY\]/g, '').trim();
};

export const formatMaterialesList = (materiales: MaterialItem[]): string => {
  if (materiales.length === 0) return 'ninguno cargado aún';
  return materiales.map((m) => m.material).join(', ');
};

const parseDimension = (text: string, labels: string[]): number | null => {
  for (const label of labels) {
    const patterns = [
      new RegExp(`${label}\\s*(?:de|:)?\\s*(\\d+(?:[.,]\\d+)?)\\s*m`, 'i'),
      new RegExp(`${label}\\s*(\\d+(?:[.,]\\d+)?)`, 'i'),
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const value = parseFloat(match[1].replace(',', '.'));
        if (!Number.isNaN(value) && value > 0) return value;
      }
    }
  }
  return null;
};

const parseNombre = (text: string): string | null => {
  const patterns = [
    /nombre\s*(?:es|:)\s*["']?([^"'\n,]+)["']?/i,
    /cotizaci[oó]n\s*["']([^"']+)["']/i,
    /["']([^"']{2,})["']/,
    /\b([A-Z][A-Za-z0-9]*(?:Prueba|IA|Estante|Gabinete)[A-Za-z0-9]*)\b/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]?.trim()) {
      return match[1].trim();
    }
  }
  return null;
};

const parseTipoMueble = (text: string): TipoMueble | null => {
  if (/\bgabinete\b/i.test(text)) return 'gabinete';
  if (/\bestante\b/i.test(text)) return 'estante';
  return null;
};

const parseMaterialFromText = (text: string, materiales: MaterialItem[]): string | null => {
  const normalizedText = text.toLowerCase();
  const sorted = [...materiales].sort((a, b) => b.material.length - a.material.length);

  for (const material of sorted) {
    if (normalizedText.includes(material.material.toLowerCase())) {
      return material.material;
    }
  }

  if (/melamina\s+blanca\s+15/i.test(normalizedText)) {
    return findMaterial(materiales, 'Melamina Blanca 15mm')?.material ?? null;
  }
  if (/melamina\s+blanca\s+18/i.test(normalizedText)) {
    return findMaterial(materiales, 'MELAMINA BLANCA 18MM')?.material ?? null;
  }
  if (/melamina\s+blanca/i.test(normalizedText)) {
    return findMaterial(materiales, 'Melamina Blanca 15mm')?.material ?? null;
  }

  return null;
};

const parseRepisas = (text: string): number => {
  const match = text.match(/(\d+)\s*repisas?/i);
  return match ? Number(match[1]) : 1;
};

/** Fallback local cuando la IA no emite [QUOTE_READY] pero la conversación ya tiene los datos. */
export const extractQuoteFromConversation = (
  messages: ChatMessage[],
  materiales: MaterialItem[]
): CotizacionAiParams | null => {
  const fullText = messages.map((message) => message.content).join('\n');

  const tipoMueble = parseTipoMueble(fullText);
  const nombre = parseNombre(fullText);
  const material = parseMaterialFromText(fullText, materiales);

  const ancho = parseDimension(fullText, ['ancho']);
  const alto =
    parseDimension(fullText, ['alto', 'altura']) ??
    parseDimension(fullText, ['largo', 'largura']);
  const profundidad = parseDimension(fullText, ['profundidad', 'profundo', 'fondo']);

  if (!tipoMueble || !nombre || !material || ancho == null || alto == null || profundidad == null) {
    return null;
  }

  return {
    nombre,
    tipoMueble,
    dimensiones: { ancho, alto, profundidad },
    material,
    repisas: parseRepisas(fullText),
  };
};
