export interface Usuario {
  id: number;
  email: string;
  rol: 'ADMIN' | 'MESERA' | 'CAJERO';
  sedeId?: number;
}

export interface Producto {
  id: number;
  nombre: string;
  precio: number;
  tipoProductoId: number;
  conAlcohol?: boolean;
  categoria?: 'coctel' | 'cerveza' | 'vino' | 'snack' | 'plato';
}

export interface Mesa {
  id: number;
  numero: number;
  estado: 'LIBRE' | 'OCUPADA';
  sedeId: number;
}

export interface InventarioItem {
  id: number;
  productoId: number;
  productoNombre: string;
  cantidad: number;
  sedeId: number;
}