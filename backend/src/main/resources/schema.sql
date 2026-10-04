-- Terraza Premium (Zenith Tech Studio)
-- MER de 12 tablas para PostgreSQL 15.
-- Este script no lo ejecuta Spring Boot. Lo aplica Julián sobre terraza_premium.
-- No incluye productos, mesas ni inventario.

-- OWASP A08: las restricciones CHECK viven en la base, no solo en la API.

CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sedes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    direccion VARCHAR(255),
    telefono VARCHAR(30),
    ciudad VARCHAR(100) DEFAULT 'Bogotá',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- OWASP A02: la contraseña solo se guarda como hash bcrypt. Nunca en texto plano.
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol_id INTEGER NOT NULL REFERENCES roles (id),
    sede_id INTEGER REFERENCES sedes (id),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tipos_producto (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS proveedores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    nit VARCHAR(30) UNIQUE,
    contacto VARCHAR(100),
    telefono VARCHAR(30),
    email VARCHAR(150),
    direccion VARCHAR(255),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion VARCHAR(500),
    valor_compra DECIMAL(12, 2) NOT NULL CHECK (valor_compra >= 0),
    valor_venta DECIMAL(12, 2) NOT NULL CHECK (valor_venta >= 0),
    tipo_producto_id INTEGER NOT NULL REFERENCES tipos_producto (id),
    proveedor_id INTEGER REFERENCES proveedores (id),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (nombre, tipo_producto_id)
);

CREATE TABLE IF NOT EXISTS inventario (
    id SERIAL PRIMARY KEY,
    producto_id INTEGER NOT NULL REFERENCES productos (id),
    sede_id INTEGER NOT NULL REFERENCES sedes (id),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (sede_id, producto_id)
);

CREATE TABLE IF NOT EXISTS mesas (
    id SERIAL PRIMARY KEY,
    numero INTEGER NOT NULL CHECK (numero > 0),
    capacidad INTEGER NOT NULL CHECK (capacidad > 0),
    sede_id INTEGER NOT NULL REFERENCES sedes (id),
    estado VARCHAR(20) NOT NULL DEFAULT 'DISPONIBLE' CHECK (estado IN ('DISPONIBLE', 'OCUPADA')),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (sede_id, numero)
);

CREATE TABLE IF NOT EXISTS pedidos (
    id SERIAL PRIMARY KEY,
    sede_id INTEGER NOT NULL REFERENCES sedes (id),
    mesa_id INTEGER REFERENCES mesas (id),
    mesero_id INTEGER NOT NULL REFERENCES usuarios (id),
    cajero_id INTEGER REFERENCES usuarios (id),
    estado VARCHAR(20) NOT NULL DEFAULT 'ABIERTO' CHECK (estado IN ('ABIERTO', 'CERRADO')),
    total DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
    fecha_apertura TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_cierre TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS detalle_pedido (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL REFERENCES pedidos (id) ON DELETE CASCADE,
    producto_id INTEGER NOT NULL REFERENCES productos (id),
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(12, 2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal DECIMAL(12, 2) NOT NULL CHECK (subtotal >= 0),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pagos (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL REFERENCES pedidos (id),
    cajero_id INTEGER NOT NULL REFERENCES usuarios (id),
    metodo_pago VARCHAR(30) NOT NULL CHECK (metodo_pago IN ('EFECTIVO', 'TARJETA_CREDITO', 'TARJETA_DEBITO')),
    monto DECIMAL(12, 2) NOT NULL CHECK (monto >= 0),
    cambio DECIMAL(12, 2) CHECK (cambio >= 0),
    fecha_pago TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- OWASP A09: cada login fallido, acceso denegado, error y operación CRUD queda aquí.
CREATE TABLE IF NOT EXISTS auditoria (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios (id),
    operacion VARCHAR(100) NOT NULL,
    detalle VARCHAR(500),
    ip VARCHAR(45),
    sede_id INTEGER REFERENCES sedes (id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pedidos_sede_estado ON pedidos (sede_id, estado);
CREATE INDEX IF NOT EXISTS idx_inventario_producto ON inventario (producto_id);

-- Catálogo mínimo para la clave foránea del administrador.
-- Sin estos registros el INSERT del admin no puede cumplirse.
INSERT INTO roles (nombre, descripcion) VALUES
    ('ADMIN', 'Administrador'),
    ('CAJERO', 'Cajero'),
    ('MESERO', 'Mesero')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO sedes (nombre, direccion, ciudad) VALUES
    ('Galerías', 'Sede Galerías', 'Bogotá'),
    ('Zona T', 'Sede Zona T', 'Bogotá'),
    ('La 85', 'Sede La 85', 'Bogotá')
ON CONFLICT (nombre) DO NOTHING;

-- OWASP A02: hash bcrypt con factor 12. Clave temporal: Admin123*
INSERT INTO usuarios (nombre, email, password_hash, rol_id, sede_id, active)
SELECT 'Administrador',
       'admin@terrazapremium.com',
       '$2b$12$K3/6QIoMMolWEn02WykkvOdYSn8xUJCppptzBJFCjKf9T6Cma0TRi',
       r.id,
       s.id,
       TRUE
FROM roles r
CROSS JOIN sedes s
WHERE r.nombre = 'ADMIN'
  AND s.nombre = 'Galerías'
  AND NOT EXISTS (
      SELECT 1 FROM usuarios u WHERE LOWER(u.email) = 'admin@terrazapremium.com'
  );
