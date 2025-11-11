export interface MaterialItem {
  id: string;
  precioHoja: number;
  med1: number;
  med2: number;
  material: string;
  precioM2: number;
}
export interface Accessory {
  id: string;
  cantidad: number;
  nombre: string;
  precioUnitario: number;
  precioTotal: number;
}

export interface EstanteItem {
  id: string;
  cantidad: number;
  pieza: string;
  material: string;
  ancho: number;
  largo: number;
  precioM2: number;
  precioUnitario: number;
  precioTotal: number;
  atc?: number;
  ltc?: number;
  tc?: number;
}

export interface Cotizacion {
  id: string;
  nombre: string;
  piezas: EstanteItem[];
  accesorios: Accessory[];
  manoDeObra: number;
  total: number; // calculado
  precioVenta: number; // total * 2
  precioVentaConIva: number; // total * 2.5
  dimensiones: Dimensiones;
}

export interface Dimensiones {
    ancho: number;
    alto: number;
    profundidad: number;
}
