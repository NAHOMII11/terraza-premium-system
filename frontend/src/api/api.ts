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
    'corona', 'ipa', 'lager', 'stout', 'pilsner',
  ];
  if (cervezas.some((p) => n.includes(p))) return 'cerveza';

  if (n.includes('aguardiente')) return 'aguardiente';
  if (n.includes('ron')) return 'ron';
  if (n.includes('whisky')) return 'whisky';
  if (n.includes('tequila') || n.includes('vodka')) return 'tequila';
  if (n.includes('vino')) return 'vino';

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
  rol: 'MESERA',
  sedeId: 2,
};

const MOCK_PRODUCTS = [
  // Cervezas
  { id: 1, nombre: 'Águila botella', precio: 8000, tipoProductoId: 2 },
  { id: 2, nombre: 'Águila Light botella', precio: 8000, tipoProductoId: 2 },
  { id: 3, nombre: 'Club Colombia Dorada', precio: 12000, tipoProductoId: 2 },
  { id: 4, nombre: 'Club Colombia Negra', precio: 12000, tipoProductoId: 2 },
  { id: 5, nombre: 'Poker botella', precio: 7000, tipoProductoId: 2 },
  { id: 6, nombre: 'Pilsen botella', precio: 7500, tipoProductoId: 2 },
  { id: 7, nombre: 'Costeñita botella', precio: 7000, tipoProductoId: 2 },
  { id: 8, nombre: 'Corona botella', precio: 14000, tipoProductoId: 2 },
  { id: 9, nombre: 'BBC Lager botella', precio: 15000, tipoProductoId: 2 },
  { id: 10, nombre: 'BBC Septimazo IPA', precio: 17000, tipoProductoId: 2 },
  { id: 11, nombre: 'Tres Cordilleras IPA', precio: 16000, tipoProductoId: 2 },
  { id: 12, nombre: 'Apóstol Blonde Ale', precio: 16000, tipoProductoId: 2 },

  // Aguardientes
  { id: 13, nombre: 'Aguardiente Antioqueño (botella)', precio: 65000, tipoProductoId: 2 },
  { id: 14, nombre: 'Aguardiente Cristal (botella)', precio: 58000, tipoProductoId: 2 },
  { id: 15, nombre: 'Aguardiente Néctar (botella)', precio: 60000, tipoProductoId: 2 },
  { id: 16, nombre: 'Aguardiente Blanco del Valle (botella)', precio: 55000, tipoProductoId: 2 },

  // Rones
  { id: 17, nombre: 'Ron Medellín Añejo (botella)', precio: 85000, tipoProductoId: 2 },
  { id: 18, nombre: 'Ron Viejo de Caldas (botella)', precio: 80000, tipoProductoId: 2 },
  { id: 19, nombre: 'Ron La Hechicera (botella)', precio: 180000, tipoProductoId: 2 },

  // Whisky
  { id: 20, nombre: 'Whisky Old Parr (botella)', precio: 220000, tipoProductoId: 2 },
  { id: 21, nombre: "Buchanan's 12 (botella)", precio: 280000, tipoProductoId: 2 },

  // Tequila / Vodka
  { id: 22, nombre: 'Tequila José Cuervo (botella)', precio: 180000, tipoProductoId: 2 },
  { id: 23, nombre: 'Vodka Absolut (botella)', precio: 190000, tipoProductoId: 2 },

  // Vinos
  { id: 24, nombre: 'Vino tinto (botella)', precio: 85000, tipoProductoId: 2 },
  { id: 25, nombre: 'Vino blanco (botella)', precio: 85000, tipoProductoId: 2 },
  { id: 26, nombre: 'Vino rosado (botella)', precio: 85000, tipoProductoId: 2 },
];

const MOCK_TABLES: { id: number; numero: number; estado: string; sedeId: number }[] = [
  { id: 1, numero: 1, estado: 'LIBRE', sedeId: 2 },
  { id: 2, numero: 2, estado: 'OCUPADA', sedeId: 2 },
  { id: 3, numero: 3, estado: 'LIBRE', sedeId: 2 },
  { id: 4, numero: 4, estado: 'OCUPADA', sedeId: 2 },
  { id: 5, numero: 5, estado: 'OCUPADA', sedeId: 2 },
  { id: 6, numero: 6, estado: 'LIBRE', sedeId: 2 },
  { id: 7, numero: 7, estado: 'LIBRE', sedeId: 2 },
  { id: 8, numero: 8, estado: 'OCUPADA', sedeId: 2 },
  { id: 9, numero: 9, estado: 'LIBRE', sedeId: 2 },
  { id: 10, numero: 10, estado: 'OCUPADA', sedeId: 2 },
];

const MOCK_INVENTORY = [
  { id: 1, productoId: 1, productoNombre: 'Águila botella', cantidad: 120, sedeId: 2 },
  { id: 2, productoId: 3, productoNombre: 'Club Colombia Dorada', cantidad: 48, sedeId: 2 },
  { id: 3, productoId: 5, productoNombre: 'Poker botella', cantidad: 3, sedeId: 2 },
  { id: 4, productoId: 8, productoNombre: 'Corona botella', cantidad: 24, sedeId: 2 },
  { id: 5, productoId: 13, productoNombre: 'Aguardiente Antioqueño (botella)', cantidad: 8, sedeId: 2 },
  { id: 6, productoId: 17, productoNombre: 'Ron Medellín Añejo (botella)', cantidad: 5, sedeId: 2 },
  { id: 7, productoId: 20, productoNombre: 'Whisky Old Parr (botella)', cantidad: 3, sedeId: 2 },
  { id: 8, productoId: 24, productoNombre: 'Vino tinto (botella)', cantidad: 12, sedeId: 2 },
];

let MOCK_ORDERS: { id: number; mesaId: number; estado: string; total: number; sedeId: number }[] = [
  { id: 101, mesaId: 2, estado: 'PENDIENTE', total: 73000, sedeId: 2 },
  { id: 102, mesaId: 5, estado: 'PREPARANDO', total: 45000, sedeId: 2 },
  { id: 103, mesaId: 8, estado: 'LISTO', total: 28000, sedeId: 2 },
];

// ==================== CLIENTE AXIOS ====================
const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
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

    // LOGIN
    if (url.includes('/api/auth/login') && method === 'post') {
      if (body.email === MOCK_USER.email && body.password === MOCK_USER.password) {
        return ok({
          token: MOCK_USER.token,
          rol: MOCK_USER.rol,
          sedeId: MOCK_USER.sedeId,
        });
      }
      return Promise.reject({
        response: { status: 401, data: { message: 'Credenciales incorrectas' } },
        config,
      });
    }

    // LOGOUT
    if (url.includes('/api/auth/logout')) return ok({ message: 'Sesión cerrada' });

    // PRODUCTS
    if (url.includes('/api/products') && method === 'get') return ok(MOCK_PRODUCTS);

    // TABLES GET
    if (url.includes('/api/tables') && method === 'get') return ok(MOCK_TABLES);

    // TABLES PUT
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

    // INVENTORY
    if (url.includes('/api/inventory') && method === 'get') return ok(MOCK_INVENTORY);

    // ORDERS GET
    if (url.includes('/api/orders') && method === 'get') return ok(MOCK_ORDERS);

    // ORDERS POST
    if (url.includes('/api/orders') && method === 'post') {
      const newOrder = {
        id: Date.now(),
        mesaId: body.mesaId,
        estado: body.estado || 'PENDIENTE',
        total:
          body.items?.reduce((s: number, i: any) => {
            const p = MOCK_PRODUCTS.find((x) => x.id === i.productoId);
            return s + (p?.precio || 0) * i.cantidad;
          }, 0) || 0,
        sedeId: body.sedeId,
      };
      MOCK_ORDERS.push(newOrder);

      const mesa = MOCK_TABLES.find((m) => m.id === Number(body.mesaId));
      if (mesa && newOrder.estado !== 'CANCELADO') mesa.estado = 'OCUPADA';

      return ok(newOrder);
    }

    // ORDERS PUT
    const orderPutMatch = url.match(/\/api\/orders\/(\d+)/);
    if (orderPutMatch && method === 'put') {
      const id = Number(orderPutMatch[1]);
      const pedido = MOCK_ORDERS.find((o) => o.id === id);
      MOCK_ORDERS = MOCK_ORDERS.map((o) => (o.id === id ? { ...o, ...body } : o));

      if (pedido && (body.estado === 'CANCELADO' || body.estado === 'CERRADO')) {
        const mesa = MOCK_TABLES.find((m) => m.id === pedido.mesaId);
        if (mesa) mesa.estado = 'LIBRE';
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