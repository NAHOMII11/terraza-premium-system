-- Terraza Premium (Zenith Tech Studio)
-- MER de 12 tablas. Ejecutar manualmente sobre la base terraza_premium.
-- Spring Boot no aplica este archivo al arrancar.

CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS sedes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    direccion VARCHAR(255),
    telefono VARCHAR(30),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol_id INTEGER NOT NULL REFERENCES roles (id),
    sede_id INTEGER REFERENCES sedes (id),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMP NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tipos_producto (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS proveedores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    nit VARCHAR(30) UNIQUE,
    telefono VARCHAR(30),
    email VARCHAR(150),
    direccion VARCHAR(255),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion VARCHAR(500),
    precio DECIMAL(12, 2) NOT NULL CHECK (precio >= 0),
    tipo_producto_id INTEGER NOT NULL REFERENCES tipos_producto (id),
    proveedor_id INTEGER REFERENCES proveedores (id),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMP NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (nombre, tipo_producto_id)
);

CREATE TABLE IF NOT EXISTS inventario (
    id SERIAL PRIMARY KEY,
    producto_id INTEGER NOT NULL REFERENCES productos (id),
    sede_id INTEGER NOT NULL REFERENCES sedes (id),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    stock_minimo INTEGER NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
    actualizado_en TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (producto_id, sede_id)
);

CREATE TABLE IF NOT EXISTS mesas (
    id SERIAL PRIMARY KEY,
    numero INTEGER NOT NULL CHECK (numero > 0),
    capacidad INTEGER NOT NULL CHECK (capacidad > 0),
    sede_id INTEGER NOT NULL REFERENCES sedes (id),
    estado VARCHAR(20) NOT NULL DEFAULT 'LIBRE' CHECK (estado IN ('LIBRE', 'OCUPADA', 'RESERVADA')),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (sede_id, numero)
);

CREATE TABLE IF NOT EXISTS pedidos (
    id SERIAL PRIMARY KEY,
    sede_id INTEGER NOT NULL REFERENCES sedes (id),
    mesa_id INTEGER REFERENCES mesas (id),
    usuario_id INTEGER NOT NULL REFERENCES usuarios (id),
    estado VARCHAR(20) NOT NULL DEFAULT 'ABIERTO' CHECK (estado IN ('ABIERTO', 'CERRADO', 'CANCELADO')),
    total DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
    observaciones VARCHAR(500),
    creado_en TIMESTAMP NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS detalle_pedido (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL REFERENCES pedidos (id) ON DELETE CASCADE,
    producto_id INTEGER NOT NULL REFERENCES productos (id),
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(12, 2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal DECIMAL(12, 2) NOT NULL CHECK (subtotal >= 0),
    UNIQUE (pedido_id, producto_id)
);

CREATE TABLE IF NOT EXISTS pagos (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL REFERENCES pedidos (id),
    usuario_id INTEGER NOT NULL REFERENCES usuarios (id),
    metodo VARCHAR(30) NOT NULL CHECK (metodo IN ('EFECTIVO', 'TARJETA', 'TRANSFERENCIA')),
    monto DECIMAL(12, 2) NOT NULL CHECK (monto >= 0),
    referencia VARCHAR(100),
    creado_en TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auditoria (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios (id),
    accion VARCHAR(100) NOT NULL,
    entidad VARCHAR(100),
    entidad_id INTEGER,
    detalle VARCHAR(500),
    creado_en TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios (rol_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_sede ON usuarios (sede_id);
CREATE INDEX IF NOT EXISTS idx_productos_tipo ON productos (tipo_producto_id);
CREATE INDEX IF NOT EXISTS idx_productos_proveedor ON productos (proveedor_id);
CREATE INDEX IF NOT EXISTS idx_inventario_sede ON inventario (sede_id);
CREATE INDEX IF NOT EXISTS idx_mesas_sede ON mesas (sede_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_sede_estado ON pedidos (sede_id, estado);
CREATE INDEX IF NOT EXISTS idx_detalle_pedido_pedido ON detalle_pedido (pedido_id);
CREATE INDEX IF NOT EXISTS idx_pagos_pedido ON pagos (pedido_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON auditoria (usuario_id);

INSERT INTO roles (nombre, descripcion) VALUES
    ('ADMIN', 'Administrador'),
    ('CAJERO', 'Cajero'),
    ('MESERO', 'Mesero')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO sedes (nombre, direccion) VALUES
    ('Galerías', 'Sede Galerías'),
    ('Zona T', 'Sede Zona T'),
    ('La 85', 'Sede La 85')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO tipos_producto (nombre, descripcion) VALUES
    ('Bebida', 'Bebidas'),
    ('Comida', 'Comidas'),
    ('Postre', 'Postres')
ON CONFLICT (nombre) DO NOTHING;

-- Usuario inicial de desarrollo. Clave temporal: Admin123*
-- Cambiarla después del primer ingreso.
INSERT INTO usuarios (nombre, email, password_hash, rol_id, sede_id)
SELECT 'Administrador',
       'admin@terrazapremium.com',
       '$2b$10$ZVSgJpUwyFBhSPoL.niWNuPRcCTIVykEmdKTV8J.Ccaj5j2klLdUq',
       r.id,
       s.id
FROM roles r
CROSS JOIN sedes s
WHERE r.nombre = 'ADMIN'
  AND s.nombre = 'Galerías'
  AND NOT EXISTS (
      SELECT 1 FROM usuarios u WHERE LOWER(u.email) = 'admin@terrazapremium.com'
  );

-- El pedido descuenta inventario por sede. Ejemplo para cargar stock:
-- INSERT INTO inventario (producto_id, sede_id, stock, stock_minimo) VALUES (1, 1, 20, 5);
