package com.terraza.backend.repository;

import com.terraza.backend.model.Producto;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class ProductoRepository {

    private static final String SQL_BASE = """
            SELECT p.id, p.nombre, p.descripcion, p.precio, p.tipo_producto_id, t.nombre AS tipo_nombre,
                   p.proveedor_id, pr.nombre AS proveedor_nombre, p.activo, p.creado_en, p.actualizado_en
            FROM productos p
            JOIN tipos_producto t ON t.id = p.tipo_producto_id
            LEFT JOIN proveedores pr ON pr.id = p.proveedor_id
            """;

    private final JdbcTemplate jdbc;

    public List<Producto> findActivos() {
        return jdbc.query(SQL_BASE + " WHERE p.activo = TRUE ORDER BY p.nombre", (rs, rowNum) -> map(rs));
    }

    public Optional<Producto> findById(Long id) {
        return jdbc.query(SQL_BASE + " WHERE p.id = ?", (rs, rowNum) -> map(rs), id).stream().findFirst();
    }

    public Optional<Producto> findActivoById(Long id) {
        return jdbc.query(SQL_BASE + " WHERE p.id = ? AND p.activo = TRUE", (rs, rowNum) -> map(rs), id)
                .stream()
                .findFirst();
    }

    public boolean existeTipoActivo(Long tipoId) {
        Integer total = jdbc.queryForObject(
                "SELECT COUNT(*) FROM tipos_producto WHERE id = ? AND activo = TRUE",
                Integer.class,
                tipoId);
        return total != null && total > 0;
    }

    public boolean existeProveedorActivo(Long proveedorId) {
        Integer total = jdbc.queryForObject(
                "SELECT COUNT(*) FROM proveedores WHERE id = ? AND activo = TRUE",
                Integer.class,
                proveedorId);
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

    public Long insertar(String nombre, String descripcion, java.math.BigDecimal precio, Long tipoId, Long proveedorId) {
        return jdbc.queryForObject("""
                INSERT INTO productos (nombre, descripcion, precio, tipo_producto_id, proveedor_id, activo)
                VALUES (?, ?, ?, ?, ?, TRUE)
                RETURNING id
                """, Long.class, nombre, descripcion, precio, tipoId, proveedorId);
    }

    public int actualizar(
            Long id,
            String nombre,
            String descripcion,
            java.math.BigDecimal precio,
            Long tipoId,
            Long proveedorId) {
        return jdbc.update("""
                UPDATE productos
                SET nombre = ?, descripcion = ?, precio = ?, tipo_producto_id = ?, proveedor_id = ?,
                    actualizado_en = NOW()
                WHERE id = ?
                """, nombre, descripcion, precio, tipoId, proveedorId, id);
    }

    public int desactivar(Long id) {
        return jdbc.update("""
                UPDATE productos
                SET activo = FALSE, actualizado_en = NOW()
                WHERE id = ?
                """, id);
    }

    private Producto map(java.sql.ResultSet rs) throws java.sql.SQLException {
        Producto producto = new Producto();
        producto.setId(rs.getLong("id"));
        producto.setNombre(rs.getString("nombre"));
        producto.setDescripcion(rs.getString("descripcion"));
        producto.setPrecio(rs.getBigDecimal("precio"));
        producto.setTipoProductoId(rs.getLong("tipo_producto_id"));
        producto.setTipoNombre(rs.getString("tipo_nombre"));
        producto.setProveedorId(JdbcValues.longOrNull(rs, "proveedor_id"));
        producto.setProveedorNombre(rs.getString("proveedor_nombre"));
        producto.setActivo(rs.getBoolean("activo"));
        producto.setCreadoEn(JdbcValues.dateTimeOrNull(rs, "creado_en"));
        producto.setActualizadoEn(JdbcValues.dateTimeOrNull(rs, "actualizado_en"));
        return producto;
    }
}
