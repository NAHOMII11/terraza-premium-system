export interface Usuario {
  id: number;
  email: string;
  rol: 'ADMIN' | 'MESERA' | 'MESERO' | 'CAJERO';
  sedeId?: number;
}

export function roleLabel(rol?: string) {
  if (rol === 'ADMIN') return 'Administrator';
  if (rol === 'CAJERO') return 'Cashier';
  if (rol === 'MESERO' || rol === 'MESERA') return 'Waiter';
  return rol || '';
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