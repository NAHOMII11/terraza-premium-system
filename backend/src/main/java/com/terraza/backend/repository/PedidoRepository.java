package com.terraza.backend.repository;

import com.terraza.backend.model.DetallePedido;
import com.terraza.backend.model.Pedido;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class PedidoRepository {

    private final JdbcTemplate jdbc;

    public Optional<Pedido> findById(Long id) {
        List<Pedido> pedidos = jdbc.query("""
                SELECT p.id, p.sede_id, p.mesa_id, p.mesero_id, m.nombre AS mesero_nombre,
                       p.cajero_id, c.nombre AS cajero_nombre, p.estado, p.total,
                       p.fecha_apertura, p.fecha_cierre, p.updated_at
                FROM pedidos p
                JOIN usuarios m ON m.id = p.mesero_id
                LEFT JOIN usuarios c ON c.id = p.cajero_id
                WHERE p.id = ?
                """, (rs, rowNum) -> mapPedido(rs), id);
        if (pedidos.isEmpty()) {
            return Optional.empty();
        }
        adjuntarDetalles(pedidos.getFirst());
        return Optional.of(pedidos.getFirst());
    }

    public Optional<Pedido> findByIdForUpdate(Long id) {
        List<Pedido> pedidos = jdbc.query("""
                SELECT p.id, p.sede_id, p.mesa_id, p.mesero_id, m.nombre AS mesero_nombre,
                       p.cajero_id, c.nombre AS cajero_nombre, p.estado, p.total,
                       p.fecha_apertura, p.fecha_cierre, p.updated_at
                FROM pedidos p
                JOIN usuarios m ON m.id = p.mesero_id
                LEFT JOIN usuarios c ON c.id = p.cajero_id
                WHERE p.id = ?
                FOR UPDATE OF p
                """, (rs, rowNum) -> mapPedido(rs), id);
        if (pedidos.isEmpty()) {
            return Optional.empty();
        }
        adjuntarDetalles(pedidos.getFirst());
        return Optional.of(pedidos.getFirst());
    }

    public List<Pedido> findAbiertosBySede(Long sedeId) {
        List<Pedido> pedidos = jdbc.query("""
                SELECT p.id, p.sede_id, p.mesa_id, p.mesero_id, m.nombre AS mesero_nombre,
                       p.cajero_id, c.nombre AS cajero_nombre, p.estado, p.total,
                       p.fecha_apertura, p.fecha_cierre, p.updated_at
                FROM pedidos p
                JOIN usuarios m ON m.id = p.mesero_id
                LEFT JOIN usuarios c ON c.id = p.cajero_id
                WHERE p.sede_id = ? AND p.estado = 'ABIERTO'
                ORDER BY p.fecha_apertura DESC
                """, (rs, rowNum) -> mapPedido(rs), sedeId);
        for (Pedido pedido : pedidos) {
            adjuntarDetalles(pedido);
        }
        return pedidos;
    }

    public Optional<Boolean> findActivoDeSede(Long sedeId) {
        return jdbc.query(
                        "SELECT active FROM sedes WHERE id = ?",
                        (rs, rowNum) -> rs.getBoolean("active"),
                        sedeId)
                .stream()
                .findFirst();
    }

    public boolean mesaPerteneceASede(Long mesaId, Long sedeId) {
        Integer total = jdbc.queryForObject("""
                SELECT COUNT(*) FROM mesas
                WHERE id = ? AND sede_id = ? AND active = TRUE
                """, Integer.class, mesaId, sedeId);
        return total != null && total > 0;
    }

    public Optional<Integer> lockStock(Long sedeId, Long productoId) {
        return jdbc.query("""
                SELECT stock FROM inventario
                WHERE sede_id = ? AND producto_id = ?
                FOR UPDATE
                """, (rs, rowNum) -> rs.getInt("stock"), sedeId, productoId).stream().findFirst();
    }

    public int actualizarStock(Long sedeId, Long productoId, int stock) {
        return jdbc.update("""
                UPDATE inventario
                SET stock = ?, updated_at = NOW()
                WHERE sede_id = ? AND producto_id = ?
                """, stock, sedeId, productoId);
    }

    public Long insertar(Long sedeId, Long mesaId, Long meseroId, BigDecimal total) {
        return jdbc.queryForObject("""
                INSERT INTO pedidos (sede_id, mesa_id, mesero_id, estado, total, fecha_apertura)
                VALUES (?, ?, ?, 'ABIERTO', ?, NOW())
                RETURNING id
                """, Long.class, sedeId, mesaId, meseroId, total);
    }

    public int actualizarCabecera(Long id, Long mesaId, BigDecimal total) {
        return jdbc.update("""
                UPDATE pedidos
                SET mesa_id = ?, total = ?, updated_at = NOW()
                WHERE id = ? AND estado = 'ABIERTO'
                """, mesaId, total, id);
    }

    public void reemplazarDetalles(Long pedidoId, List<DetallePedido> detalles) {
        jdbc.update("DELETE FROM detalle_pedido WHERE pedido_id = ?", pedidoId);
        insertarDetalles(pedidoId, detalles);
    }

    public void insertarDetalles(Long pedidoId, List<DetallePedido> detalles) {
        for (DetallePedido detalle : detalles) {
            jdbc.update("""
                    INSERT INTO detalle_pedido (pedido_id, producto_id, cantidad, precio_unitario, subtotal)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    pedidoId,
                    detalle.getProductoId(),
                    detalle.getCantidad(),
                    detalle.getPrecioUnitario(),
                    detalle.getSubtotal());
        }
    }

    private void adjuntarDetalles(Pedido pedido) {
        List<DetallePedido> detalles = jdbc.query("""
                SELECT d.id, d.pedido_id, d.producto_id, p.nombre AS producto_nombre,
                       d.cantidad, d.precio_unitario, d.subtotal, d.created_at
                FROM detalle_pedido d
                JOIN productos p ON p.id = d.producto_id
                WHERE d.pedido_id = ?
                ORDER BY d.id
                """, (rs, rowNum) -> mapDetalle(rs), pedido.getId());
        pedido.setDetalles(new ArrayList<>(detalles));
    }

    private Pedido mapPedido(ResultSet rs) throws SQLException {
        Pedido pedido = new Pedido();
        pedido.setId(rs.getLong("id"));
        pedido.setSedeId(rs.getLong("sede_id"));
        pedido.setMesaId(JdbcValues.longOrNull(rs, "mesa_id"));
        pedido.setMeseroId(rs.getLong("mesero_id"));
        pedido.setMeseroNombre(rs.getString("mesero_nombre"));
        pedido.setCajeroId(JdbcValues.longOrNull(rs, "cajero_id"));
        pedido.setCajeroNombre(rs.getString("cajero_nombre"));
        pedido.setEstado(rs.getString("estado"));
        pedido.setTotal(rs.getBigDecimal("total"));
        pedido.setFechaApertura(JdbcValues.dateTimeOrNull(rs, "fecha_apertura"));
        pedido.setFechaCierre(JdbcValues.dateTimeOrNull(rs, "fecha_cierre"));
        pedido.setActualizadoEn(JdbcValues.dateTimeOrNull(rs, "updated_at"));
        pedido.setDetalles(new ArrayList<>());
        return pedido;
    }

    private DetallePedido mapDetalle(ResultSet rs) throws SQLException {
        DetallePedido detalle = new DetallePedido();
        detalle.setId(rs.getLong("id"));
        detalle.setPedidoId(rs.getLong("pedido_id"));
        detalle.setProductoId(rs.getLong("producto_id"));
        detalle.setProductoNombre(rs.getString("producto_nombre"));
        detalle.setCantidad(rs.getInt("cantidad"));
        detalle.setPrecioUnitario(rs.getBigDecimal("precio_unitario"));
        detalle.setSubtotal(rs.getBigDecimal("subtotal"));
        return detalle;
    }
}
