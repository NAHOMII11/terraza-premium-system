package com.terraza.backend.repository;

import com.terraza.backend.model.Inventory;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class InventoryRepository {

    private final JdbcTemplate jdbc;

    public List<Inventory> listarPorSede(Long sedeId) {
        return jdbc.query(sqlInventario() + " WHERE i.sede_id = ? ORDER BY p.nombre",
                (rs, rowNum) -> map(rs), sedeId);
    }

    public Optional<Inventory> buscarPorId(Long id) {
        return jdbc.query(sqlInventario() + " WHERE i.id = ?",
                (rs, rowNum) -> map(rs), id).stream().findFirst();
    }

    public boolean existePorSedeYProducto(Long sedeId, Long productoId) {
        Integer total = jdbc.queryForObject(
                "SELECT COUNT(*) FROM inventario WHERE sede_id = ? AND producto_id = ?",
                Integer.class,
                sedeId,
                productoId);
        return total != null && total > 0;
    }

    public Long insertar(Long sedeId, Long productoId, Integer stock) {
        return jdbc.queryForObject("""
                INSERT INTO inventario (producto_id, sede_id, stock)
                VALUES (?, ?, ?)
                RETURNING id
                """, Long.class, productoId, sedeId, stock);
    }

    public int actualizarStock(Long id, Integer stock) {
        return jdbc.update("""
                UPDATE inventario
                SET stock = ?, updated_at = NOW()
                WHERE id = ?
                """, stock, id);
    }

    private String sqlInventario() {
        return """
                SELECT i.id, i.producto_id, p.nombre AS nombre_producto, p.codigo AS codigo_producto,
                       i.sede_id, i.stock
                FROM inventario i
                JOIN productos p ON p.id = i.producto_id
                """;
    }

    private Inventory map(ResultSet rs) throws SQLException {
        Inventory inventory = new Inventory();
        inventory.setId(rs.getLong("id"));
        inventory.setProductoId(rs.getLong("producto_id"));
        inventory.setNombreProducto(rs.getString("nombre_producto"));
        inventory.setCodigoProducto(rs.getString("codigo_producto"));
        inventory.setSedeId(rs.getLong("sede_id"));
        inventory.setStock(rs.getInt("stock"));
        return inventory;
    }
}
