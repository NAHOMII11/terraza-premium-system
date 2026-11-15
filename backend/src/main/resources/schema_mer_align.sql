-- Alinea una base terraza_premium ya creada con el modelo relacional (12 tablas).
-- No borra datos. Ejecutar: psql -U postgres -d terraza_premium -f src/main/resources/schema_mer_align.sql

CREATE UNIQUE INDEX IF NOT EXISTS uq_pagos_pedido ON pagos (pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_sede_estado ON pedidos (sede_id, estado);
CREATE INDEX IF NOT EXISTS idx_inventario_producto ON inventario (producto_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios (rol_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_sede ON usuarios (sede_id);
CREATE INDEX IF NOT EXISTS idx_productos_tipo ON productos (tipo_producto_id);
CREATE INDEX IF NOT EXISTS idx_productos_proveedor ON productos (proveedor_id);
CREATE INDEX IF NOT EXISTS idx_mesas_sede ON mesas (sede_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_mesa ON pedidos (mesa_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_mesero ON pedidos (mesero_id);
CREATE INDEX IF NOT EXISTS idx_detalle_pedido ON detalle_pedido (pedido_id);
CREATE INDEX IF NOT EXISTS idx_pagos_cajero ON pagos (cajero_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON auditoria (usuario_id);
