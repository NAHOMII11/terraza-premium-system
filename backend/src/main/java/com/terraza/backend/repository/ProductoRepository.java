package com.terraza.backend.repository;

import com.terraza.backend.model.Producto;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class ProductoRepository {

    private final JdbcTemplate jdbc;

    public List<Producto> findActivos() {
        return jdbc.query("""
                SELECT p.id, p.codigo, p.nombre, p.descripcion, p.valor_compra, p.valor_venta,
                       p.tipo_producto_id, t.nombre AS tipo_nombre, p.proveedor_id,
                       pr.nombre AS proveedor_nombre, p.active, p.created_at, p.updated_at
                FROM productos p
                JOIN tipos_producto t ON t.id = p.tipo_producto_id
                LEFT JOIN proveedores pr ON pr.id = p.proveedor_id
                WHERE p.active = TRUE
                ORDER BY p.nombre
                """, (rs, rowNum) -> map(rs));
    }

    public Optional<Producto> findById(Long id) {
        return jdbc.query("""
                SELECT p.id, p.codigo, p.nombre, p.descripcion, p.valor_compra, p.valor_venta,
                       p.tipo_producto_id, t.nombre AS tipo_nombre, p.proveedor_id,
                       pr.nombre AS proveedor_nombre, p.active, p.created_at, p.updated_at
                FROM productos p
                JOIN tipos_producto t ON t.id = p.tipo_producto_id
                LEFT JOIN proveedores pr ON pr.id = p.proveedor_id
                WHERE p.id = ?
                """, (rs, rowNum) -> map(rs), id).stream().findFirst();
    }

    public Optional<Producto> findActivoById(Long id) {
        return jdbc.query("""
                SELECT p.id, p.codigo, p.nombre, p.descripcion, p.valor_compra, p.valor_venta,
                       p.tipo_producto_id, t.nombre AS tipo_nombre, p.proveedor_id,
                       pr.nombre AS proveedor_nombre, p.active, p.created_at, p.updated_at
                FROM productos p
                JOIN tipos_producto t ON t.id = p.tipo_producto_id
                LEFT JOIN proveedores pr ON pr.id = p.proveedor_id
                WHERE p.id = ? AND p.active = TRUE
                """, (rs, rowNum) -> map(rs), id).stream().findFirst();
    }

    public boolean existeTipoActivo(Long tipoId) {
        Integer total = jdbc.queryForObject(
                "SELECT COUNT(*) FROM tipos_producto WHERE id = ? AND active = TRUE",
                Integer.class,
                tipoId);
        return total != null && total > 0;
    }

    public boolean existeProveedorActivo(Long proveedorId) {
        Integer total = jdbc.queryForObject(
                "SELECT COUNT(*) FROM proveedores WHERE id = ? AND active = TRUE",
                Integer.class,
                proveedorId);
        return total != null && total > 0;
    }

    public boolean existeCodigo(String codigo) {
        Integer total = jdbc.queryForObject(
                "SELECT COUNT(*) FROM productos WHERE LOWER(codigo) = LOWER(?)",
                Integer.class,
                codigo);
        return total != null && total > 0;
    }

    public boolean existeCodigoEnOtro(String codigo, Long id) {
        Integer total = jdbc.queryForObject(
                "SELECT COUNT(*) FROM productos WHERE LOWER(codigo) = LOWER(?) AND id <> ?",
                Integer.class,
                codigo,
                id);
        return total != null && total > 0;
    }

    public boolean existeNombreYTipo(String nombre, Long tipoId) {
        Integer total = jdbc.queryForObject("""
                SELECT COUNT(*) FROM productos
                WHERE LOWER(nombre) = LOWER(?) AND tipo_producto_id = ?
                """, Integer.class, nombre, tipoId);
        return total != null && total > 0;
    }

    public boolean existeNombreYTipoEnOtro(String nombre, Long tipoId, Long id) {
        Integer total = jdbc.queryForObject("""
                SELECT COUNT(*) FROM productos
                WHERE LOWER(nombre) = LOWER(?) AND tipo_producto_id = ? AND id <> ?
                """, Integer.class, nombre, tipoId, id);
        return total != null && total > 0;
    }

    public Long insertar(
            String codigo,
            String nombre,
            String descripcion,
            BigDecimal valorCompra,
            BigDecimal valorVenta,
            Long tipoId,
            Long proveedorId) {
        return jdbc.queryForObject("""
                INSERT INTO productos (
                    codigo, nombre, descripcion, valor_compra, valor_venta, tipo_producto_id, proveedor_id, active
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)
                RETURNING id
                """, Long.class, codigo, nombre, descripcion, valorCompra, valorVenta, tipoId, proveedorId);
    }

    public int actualizar(
            Long id,
            String codigo,
            String nombre,
            String descripcion,
            BigDecimal valorCompra,
            BigDecimal valorVenta,
            Long tipoId,
            Long proveedorId) {
        return jdbc.update("""
                UPDATE productos
                SET codigo = ?, nombre = ?, descripcion = ?, valor_compra = ?, valor_venta = ?,
                    tipo_producto_id = ?, proveedor_id = ?, updated_at = NOW()
                WHERE id = ?
                """, codigo, nombre, descripcion, valorCompra, valorVenta, tipoId, proveedorId, id);
    }

    public int desactivar(Long id) {
        return jdbc.update("""
                UPDATE productos
                SET active = FALSE, updated_at = NOW()
                WHERE id = ?
                """, id);
    }

    private Producto map(ResultSet rs) throws SQLException {
        Producto producto = new Producto();
        producto.setId(rs.getLong("id"));
        producto.setCodigo(rs.getString("codigo"));
        producto.setNombre(rs.getString("nombre"));
        producto.setDescripcion(rs.getString("descripcion"));
        producto.setValorCompra(rs.getBigDecimal("valor_compra"));
        producto.setValorVenta(rs.getBigDecimal("valor_venta"));
        producto.setTipoProductoId(rs.getLong("tipo_producto_id"));
        producto.setTipoNombre(rs.getString("tipo_nombre"));
        producto.setProveedorId(JdbcValues.longOrNull(rs, "proveedor_id"));
        producto.setProveedorNombre(rs.getString("proveedor_nombre"));
        producto.setActivo(rs.getBoolean("active"));
        producto.setCreadoEn(JdbcValues.dateTimeOrNull(rs, "created_at"));
        producto.setActualizadoEn(JdbcValues.dateTimeOrNull(rs, "updated_at"));
        return producto;
    }
}
