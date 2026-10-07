import axios from 'axios';

const USE_MOCK = import.meta.env.VITE_MOCK === 'true';
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export function categoriaProducto(
  nombre: string
): 'cerveza' | 'aguardiente' | 'ron' | 'whisky' | 'tequila' | 'vino' {
  const n = nombre.toLowerCase();

  const cervezas = [
    'cerveza', 'águila', 'aguila', 'club colombia', 'poker', 'pilsen',
    'costeñita', 'bbc', 'tres cordilleras', 'apóstol', 'apostol',
    'corona', 'ipa', 'lager', 'stout', 'pilsner', 'manigua',
  ];
  if (cervezas.some((p) => n.includes(p))) return 'cerveza';

  if (n.includes('aguardiente')) return 'aguardiente';
  if (n.includes('ron')) return 'ron';
  if (n.includes('whisky')) return 'whisky';
  if (n.includes('tequila') || n.includes('vodka')) return 'tequila';
  if (n.includes('vino') || n.includes('champaña') || n.includes('champagne')) return 'vino';

  return 'cerveza';
}

export function tieneAlcohol(_nombre: string): boolean {
  return true;
}

// ==================== DATOS MOCK ====================
const MOCK_USER = {
  email: 'thais@terrazapremium.com',
  password: 'Mesera123*',
  token: 'mock-token-thais-12345',
  rol: 'MESERO',
  sedeId: 1,
};

const MOCK_PRODUCTS = [
  { id: 1, nombre: 'Águila botella', precio: 8000, tipoProductoId: 1 },
  { id: 2, nombre: 'Águila lata', precio: 6000, tipoProductoId: 1 },
  { id: 3, nombre: 'Águila Light botella', precio: 8000, tipoProductoId: 1 },
  { id: 4, nombre: 'Águila Light lata', precio: 6000, tipoProductoId: 1 },
  { id: 5, nombre: 'Águila Zero lata', precio: 6500, tipoProductoId: 1 },
  { id: 6, nombre: 'Club Colombia Dorada', precio: 12000, tipoProductoId: 1 },
  { id: 7, nombre: 'Club Colombia Negra', precio: 12000, tipoProductoId: 1 },
  { id: 8, nombre: 'Poker botella', precio: 7000, tipoProductoId: 1 },
  { id: 9, nombre: 'Poker lata', precio: 5500, tipoProductoId: 1 },
  { id: 10, nombre: 'Pilsen botella', precio: 7500, tipoProductoId: 1 },
  { id: 11, nombre: 'Costeñita botella', precio: 7000, tipoProductoId: 1 },
  { id: 12, nombre: 'Corona extra', precio: 14000, tipoProductoId: 1 },
  { id: 13, nombre: 'BBC Lager', precio: 15000, tipoProductoId: 1 },
  { id: 14, nombre: 'BBC Septimazo IPA', precio: 17000, tipoProductoId: 1 },
  { id: 15, nombre: 'Tres Cordilleras IPA', precio: 16000, tipoProductoId: 1 },
  { id: 16, nombre: 'Apóstol Blonde Ale', precio: 16000, tipoProductoId: 1 },
  { id: 17, nombre: 'Aguardiente Antioqueño botella', precio: 65000, tipoProductoId: 2 },
  { id: 18, nombre: 'Aguardiente Cristal botella', precio: 58000, tipoProductoId: 2 },
  { id: 19, nombre: 'Aguardiente Néctar botella', precio: 60000, tipoProductoId: 2 },
  { id: 20, nombre: 'Aguardiente Blanco del Valle', precio: 55000, tipoProductoId: 2 },
  { id: 21, nombre: 'Ron Medellín Añejo', precio: 85000, tipoProductoId: 3 },
  { id: 22, nombre: 'Ron Viejo de Caldas', precio: 80000, tipoProductoId: 3 },
  { id: 23, nombre: 'Ron La Hechicera', precio: 180000, tipoProductoId: 3 },
  { id: 24, nombre: 'Whisky Old Parr', precio: 220000, tipoProductoId: 4 },
  { id: 25, nombre: 'Buchanans 12', precio: 280000, tipoProductoId: 4 },
  { id: 26, nombre: 'Tequila Jose Cuervo', precio: 180000, tipoProductoId: 5 },
  { id: 27, nombre: 'Vodka Absolut', precio: 190000, tipoProductoId: 6 },
  { id: 28, nombre: 'Vino tinto reserva', precio: 85000, tipoProductoId: 7 },
  { id: 29, nombre: 'Vino blanco reserva', precio: 85000, tipoProductoId: 7 },
  { id: 30, nombre: 'Champaña Moet', precio: 450000, tipoProductoId: 8 },
];

const MOCK_TABLES: { id: number; numero: number; estado: string; sedeId: number }[] = [
  { id: 2, numero: 1, estado: 'DISPONIBLE', sedeId: 1 },
  { id: 3, numero: 2, estado: 'OCUPADA', sedeId: 1 },
  { id: 4, numero: 3, estado: 'DISPONIBLE', sedeId: 1 },
  { id: 5, numero: 4, estado: 'DISPONIBLE', sedeId: 1 },
  { id: 6, numero: 5, estado: 'OCUPADA', sedeId: 1 },
  { id: 7, numero: 6, estado: 'DISPONIBLE', sedeId: 1 },
  { id: 8, numero: 7, estado: 'DISPONIBLE', sedeId: 1 },
  { id: 9, numero: 8, estado: 'OCUPADA', sedeId: 1 },
  { id: 10, numero: 9, estado: 'DISPONIBLE', sedeId: 1 },
  { id: 11, numero: 10, estado: 'DISPONIBLE', sedeId: 1 },
];

const MOCK_INVENTORY = [
  { id: 1, productoId: 1, productoNombre: 'Águila botella', cantidad: 120, sedeId: 1 },
  { id: 2, productoId: 6, productoNombre: 'Club Colombia Dorada', cantidad: 48, sedeId: 1 },
  { id: 3, productoId: 9, productoNombre: 'Poker lata', cantidad: 3, sedeId: 1 },
  { id: 4, productoId: 12, productoNombre: 'Corona extra', cantidad: 24, sedeId: 1 },
  { id: 5, productoId: 17, productoNombre: 'Aguardiente Antioqueño botella', cantidad: 8, sedeId: 1 },
  { id: 6, productoId: 21, productoNombre: 'Ron Medellín Añejo', cantidad: 5, sedeId: 1 },
  { id: 7, productoId: 24, productoNombre: 'Whisky Old Parr', cantidad: 3, sedeId: 1 },
  { id: 8, productoId: 28, productoNombre: 'Vino tinto reserva', cantidad: 12, sedeId: 1 },
];

let MOCK_ORDERS: { id: number; mesaId: number; estado: string; total: number; sedeId: number }[] = [
  { id: 101, mesaId: 3, estado: 'ABIERTO', total: 73000, sedeId: 1 },
  { id: 102, mesaId: 6, estado: 'ABIERTO', total: 45000, sedeId: 1 },
  { id: 103, mesaId: 9, estado: 'CERRADO', total: 28000, sedeId: 1 },
];

// ==================== CLIENTE AXIOS ====================
const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // envía cookies de sesión
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => {
    const url = res.config.url || '';

    // Normalizar productos: el backend devuelve valorVenta pero el frontend usa precio
    if (url.includes('/api/products')) {
      const normalizar = (p: any) => ({
        ...p,
        precio: p.precio ?? p.valorVenta ?? p.valor_venta ?? 0,
      });
      res.data = Array.isArray(res.data)
        ? res.data.map(normalizar)
        : normalizar(res.data);
    }

    // Normalizar inventario: backend devuelve "stock", frontend usa "cantidad"
    if (url.includes('/api/inventory')) {
      const normalizar = (i: any) => ({
        ...i,
        cantidad: i.cantidad ?? i.stock ?? 0,
      });
      res.data = Array.isArray(res.data)
        ? res.data.map(normalizar)
        : normalizar(res.data);
    }

    return res;
  },
  (error) => {
    // TODO: Reactivar cuando Nahomi arregle CORS con credenciales
    // if (error.response?.status === 401) {
    //   localStorage.clear();
    //   window.location.href = '/login';
    // }
    return Promise.reject(error);
  }
);

// ==================== MODO MOCK ====================
if (USE_MOCK) {
  console.log('🔧 MODO MOCK ACTIVADO — Solo botellas');

  api.defaults.adapter = async (config) => {
    const url = config.url || '';
    const method = (config.method || 'get').toLowerCase();
    const body = config.data ? JSON.parse(config.data) : {};

    await new Promise((r) => setTimeout(r, 250));

    const ok = (data: any) => ({
      data,
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });

    if (url.includes('/api/auth/login') && method === 'post') {
      if (body.email === 'thais@terrazapremium.com' && body.password === 'Mesera123*') {
        return ok({ token: 'mock-token-thais', rol: 'MESERO', sedeId: 1 });
      }
      if (body.email === 'admin@terrazapremium.com' && body.password === 'Admin123*') {
        return ok({ token: 'mock-token-admin', rol: 'ADMIN', sedeId: 1 });
      }
      if (body.email === 'julian@terrazapremium.com' && body.password === 'Cajero123*') {
        return ok({ token: 'mock-token-cajero', rol: 'CAJERO', sedeId: 1 });
      }
      return Promise.reject({
        response: { status: 401, data: { message: 'Credenciales incorrectas' } },
        config,
      });
    }

    if (url.includes('/api/auth/logout')) return ok({ message: 'Sesión cerrada' });
    if (url.includes('/api/products') && method === 'get') return ok(MOCK_PRODUCTS);
    if (url.includes('/api/tables') && method === 'get') return ok(MOCK_TABLES);

    const tablePutMatch = url.match(/\/api\/tables\/(\d+)/);
    if (tablePutMatch && method === 'put') {
      const id = Number(tablePutMatch[1]);
      const mesa = MOCK_TABLES.find((m) => m.id === id);
      if (mesa) {
        if (body.estado) mesa.estado = body.estado;
        return ok(mesa);
      }
      return Promise.reject({
        response: { status: 404, data: { message: 'Mesa no encontrada' } },
        config,
      });
    }

    if (url.includes('/api/inventory') && method === 'get') return ok(MOCK_INVENTORY);
    if (url.includes('/api/orders') && method === 'get') return ok(MOCK_ORDERS);

    if (url.includes('/api/orders') && method === 'post') {
      const newOrder = {
        id: Date.now(),
        mesaId: body.mesaId,
        estado: 'ABIERTO',
        total:
          body.items?.reduce((s: number, i: any) => {
            const p = MOCK_PRODUCTS.find((x) => x.id === i.productoId);
            return s + (p?.precio || 0) * i.cantidad;
          }, 0) || 0,
        sedeId: body.sedeId,
      };
      MOCK_ORDERS.push(newOrder);

      const mesa = MOCK_TABLES.find((m) => m.id === Number(body.mesaId));
      if (mesa) mesa.estado = 'OCUPADA';

      return ok(newOrder);
    }

    const orderPutMatch = url.match(/\/api\/orders\/(\d+)/);
    if (orderPutMatch && method === 'put') {
      const id = Number(orderPutMatch[1]);
      const pedido = MOCK_ORDERS.find((o) => o.id === id);
      MOCK_ORDERS = MOCK_ORDERS.map((o) => (o.id === id ? { ...o, ...body } : o));

      if (pedido && (body.estado === 'CANCELADO' || body.estado === 'CERRADO')) {
        const mesa = MOCK_TABLES.find((m) => m.id === pedido.mesaId);
        if (mesa) mesa.estado = 'DISPONIBLE';
      }

      return ok(MOCK_ORDERS.find((o) => o.id === id));
    }

    return Promise.reject({
      response: { status: 404, data: { message: `No mockeado: ${method} ${url}` } },
      config,
    });
  };
}

export default api;