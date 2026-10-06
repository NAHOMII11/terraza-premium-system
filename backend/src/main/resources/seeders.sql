-- ==========================================
-- LIMPIAR
-- ==========================================
DELETE FROM inventario;
DELETE FROM detalle_pedido;
DELETE FROM pedidos;
DELETE FROM productos;
DELETE FROM tipos_producto;

-- Reiniciar secuencias
ALTER SEQUENCE tipos_producto_id_seq RESTART WITH 1;
ALTER SEQUENCE productos_id_seq RESTART WITH 1;
ALTER SEQUENCE inventario_id_seq RESTART WITH 1;

-- ==========================================
-- TIPOS DE PRODUCTO
-- ==========================================
INSERT INTO tipos_producto (nombre, descripcion, active) VALUES
('Cerveza', 'Cervezas nacionales e importadas', true),
('Aguardiente', 'Aguardientes colombianos', true),
('Ron', 'Rones nacionales e importados', true),
('Whisky', 'Whiskies escoceses e irlandeses', true),
('Tequila', 'Tequilas y mezcales', true),
('Vodka', 'Vodkas premium y estandar', true),
('Vino', 'Vinos tintos, blancos y rosados', true),
('Champana', 'Champanas y espumosos', true),
('Otros', 'Licores varios', true);

-- ==========================================
-- PRODUCTOS (60 licores)
-- Los IDs de tipo_producto se buscan por nombre
-- ==========================================
INSERT INTO productos (codigo, nombre, valor_compra, valor_venta, tipo_producto_id, active)
SELECT d.codigo, d.nombre, d.valor_compra, d.valor_venta,
       (SELECT id FROM tipos_producto WHERE nombre = d.tipo),
       true
FROM (VALUES
-- CERVEZAS
('CER-001', 'Aguila botella', 5500, 8000, 'Cerveza'),
('CER-002', 'Aguila lata', 4000, 6000, 'Cerveza'),
('CER-003', 'Aguila Light botella', 5500, 8000, 'Cerveza'),
('CER-004', 'Aguila Light lata', 4000, 6000, 'Cerveza'),
('CER-005', 'Aguila Zero lata', 4500, 6500, 'Cerveza'),
('CER-006', 'Club Colombia Dorada', 8500, 12000, 'Cerveza'),
('CER-007', 'Club Colombia Negra', 8500, 12000, 'Cerveza'),
('CER-008', 'Club Colombia Roja', 7500, 11000, 'Cerveza'),
('CER-009', 'Poker botella', 5000, 7000, 'Cerveza'),
('CER-010', 'Poker lata', 3800, 5500, 'Cerveza'),
('CER-011', 'Pilsen botella', 5500, 7500, 'Cerveza'),
('CER-012', 'Costena botella', 5000, 7000, 'Cerveza'),
('CER-013', 'Corona extra', 10000, 14000, 'Cerveza'),
('CER-014', 'BBC Lager', 11000, 15000, 'Cerveza'),
('CER-015', 'BBC Septimazo IPA', 12000, 17000, 'Cerveza'),
('CER-016', 'Tres Cordilleras IPA', 11000, 16000, 'Cerveza'),
('CER-017', 'Tres Cordilleras Blanca', 10000, 15000, 'Cerveza'),
('CER-018', 'Apostol Blonde Ale', 11000, 16000, 'Cerveza'),
('CER-019', 'Bogota Beer Rose', 12000, 17000, 'Cerveza'),
('CER-020', 'Manigua Session IPA', 11000, 16000, 'Cerveza'),
-- AGUARDIENTES
('AGU-001', 'Aguardiente Antioqueno botella', 50000, 65000, 'Aguardiente'),
('AGU-002', 'Aguardiente Antioqueno Sin Azucar', 52000, 68000, 'Aguardiente'),
('AGU-003', 'Aguardiente Cristal botella', 45000, 58000, 'Aguardiente'),
('AGU-004', 'Aguardiente Cristal Oro', 60000, 75000, 'Aguardiente'),
('AGU-005', 'Aguardiente Nectar botella', 46000, 60000, 'Aguardiente'),
('AGU-006', 'Aguardiente Nectar Verde', 48000, 62000, 'Aguardiente'),
('AGU-007', 'Aguardiente Blanco del Valle', 42000, 55000, 'Aguardiente'),
('AGU-008', 'Aguardiente Real botella', 62000, 78000, 'Aguardiente'),
-- RONES
('RON-001', 'Ron Medellin Anejo', 68000, 85000, 'Ron'),
('RON-002', 'Ron Medellin Gran Reserva', 95000, 120000, 'Ron'),
('RON-003', 'Ron Viejo de Caldas', 62000, 80000, 'Ron'),
('RON-004', 'Ron Viejo de Caldas 5 anos', 75000, 95000, 'Ron'),
('RON-005', 'Ron La Hechicera', 150000, 180000, 'Ron'),
('RON-006', 'Ron Santa Fe', 60000, 78000, 'Ron'),
('RON-007', 'Ron Zacapa 23', 220000, 280000, 'Ron'),
-- WHISKY
('WHI-001', 'Whisky Old Parr', 180000, 220000, 'Whisky'),
('WHI-002', 'Whisky Old Parr 18 anos', 310000, 380000, 'Whisky'),
('WHI-003', 'Buchanans 12', 230000, 280000, 'Whisky'),
('WHI-004', 'Buchanans 18', 380000, 450000, 'Whisky'),
('WHI-005', 'Whisky Johnnie Walker Red', 145000, 180000, 'Whisky'),
('WHI-006', 'Whisky Johnnie Walker Black', 210000, 260000, 'Whisky'),
('WHI-007', 'Whisky Chivas Regal 12', 260000, 320000, 'Whisky'),
('WHI-008', 'Whisky Jack Daniels', 195000, 240000, 'Whisky'),
-- TEQUILA
('TEQ-001', 'Tequila Jose Cuervo', 145000, 180000, 'Tequila'),
('TEQ-002', 'Tequila Jose Cuervo Especial', 180000, 220000, 'Tequila'),
('TEQ-003', 'Tequila Patron Silver', 310000, 380000, 'Tequila'),
-- VODKA
('VOD-001', 'Vodka Absolut', 155000, 190000, 'Vodka'),
('VOD-002', 'Vodka Smirnoff', 95000, 120000, 'Vodka'),
('VOD-003', 'Vodka Grey Goose', 340000, 420000, 'Vodka'),
-- VINOS
('VIN-001', 'Vino tinto reserva', 68000, 85000, 'Vino'),
('VIN-002', 'Vino blanco reserva', 68000, 85000, 'Vino'),
('VIN-003', 'Vino rosado', 62000, 78000, 'Vino'),
('VIN-004', 'Vino espumoso', 95000, 120000, 'Vino'),
('VIN-005', 'Sangria de la casa', 35000, 45000, 'Vino'),
('VIN-006', 'Vino Gato Negro', 42000, 55000, 'Vino'),
-- CHAMPANA
('CHA-001', 'Champana Moet Chandon', 370000, 450000, 'Champana'),
('CHA-002', 'Champana Veuve Clicquot', 430000, 520000, 'Champana'),
-- OTROS
('OTR-001', 'Jagermeister', 200000, 250000, 'Otros'),
('OTR-002', 'Baileys', 170000, 210000, 'Otros'),
('OTR-003', 'Campari', 230000, 280000, 'Otros')
) AS d(codigo, nombre, valor_compra, valor_venta, tipo);

-- ==========================================
-- INVENTARIO (columna: stock)
-- ==========================================
INSERT INTO inventario (producto_id, sede_id, stock)
SELECT id, 1, 50 FROM productos;

-- ==========================================
-- VERIFICACION
-- ==========================================
SELECT 'tipos_producto' AS tabla, COUNT(*) AS total FROM tipos_producto
UNION ALL
SELECT 'productos', COUNT(*) FROM productos
UNION ALL
SELECT 'inventario', COUNT(*) FROM inventario;

-- ==========================================
-- PROVEEDORES
-- ==========================================
INSERT INTO proveedores (nombre, nit, contacto, telefono, email, direccion, active) VALUES
('Distribuidora Bavaria', '900123456-1', 'Carlos Pérez', '3105551234', 'ventas@bavaria.com', 'Calle 100 #15-20, Bogotá', true),
('Licores de Colombia', '900234567-2', 'María Gómez', '3105552345', 'contacto@licorescol.com', 'Carrera 7 #45-30, Bogotá', true),
('Cervecería Artesanal BBC', '900345678-3', 'Juan Rodríguez', '3105553456', 'pedidos@bbc.com.co', 'Zona Industrial, Bogotá', true),
('Vinos Premium', '900456789-4', 'Ana Martínez', '3105554567', 'info@vinospremium.com', 'Calle 85 #12-40, Bogotá', true),
('Distribuidora El Cóndor', '900567890-5', 'Pedro Sánchez', '3105555678', 'ventas@elcondor.com', 'Av. 68 #22-15, Bogotá', true);