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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class PedidoRepository {

    private static final String SQL_PEDIDO = """
            SELECT p.id, p.sede_id, p.mesa_id, p.usuario_id, u.nombre AS usuario_nombre,
                   p.estado, p.total, p.creado_en, p.actualizado_en
            FROM pedidos p
            JOIN usuarios u ON u.id = p.usuario_id
            """;

    private final JdbcTemplate jdbc;

    public Optional<Pedido> findById(Long id) {
        return cargar(SQL_PEDIDO + " WHERE p.id = ?", id);
    }

    public Optional<Pedido> findByIdForUpdate(Long id) {
        return cargar(SQL_PEDIDO + " WHERE p.id = ? FOR UPDATE OF p", id);
    }

    public List<Pedido> findAbiertosBySede(Long sedeId) {
        List<Pedido> pedidos = jdbc.query(
                SQL_PEDIDO + " WHERE p.sede_id = ? AND p.estado = 'ABIERTO' ORDER BY p.creado_en DESC",
                (rs, rowNum) -> mapPedido(rs),
                sedeId);
        adjuntarDetalles(pedidos);
        return pedidos;
    }

    public Optional<Boolean> findActivoDeSede(Long sedeId) {
        return jdbc.query(
                        "SELECT activo FROM sedes WHERE id = ?",
                        (rs, rowNum) -> rs.getBoolean("activo"),
                        sedeId)
                .stream()
                .findFirst();
    }

    public boolean mesaPerteneceASede(Long mesaId, Long sedeId) {
        Integer total = jdbc.queryForObject("""
                SELECT COUNT(*) FROM mesas
                WHERE id = ? AND sede_id = ? AND activo = TRUE
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
                SET stock = ?, actualizado_en = NOW()
                WHERE sede_id = ? AND producto_id = ?
                """, stock, sedeId, productoId);
    }

    public Long insertar(Long sedeId, Long mesaId, Long usuarioId, BigDecimal total) {
        return jdbc.queryForObject("""
                INSERT INTO pedidos (sede_id, mesa_id, usuario_id, estado, total)
                VALUES (?, ?, ?, 'ABIERTO', ?)
                RETURNING id
                """, Long.class, sedeId, mesaId, usuarioId, total);
    }

    public int actualizarCabecera(Long id, Long mesaId, BigDecimal total) {
        return jdbc.update("""
                UPDATE pedidos
                SET mesa_id = ?, total = ?, actualizado_en = NOW()
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

    private Optional<Pedido> cargar(String sql, Long id) {
        List<Pedido> pedidos = jdbc.query(sql, (rs, rowNum) -> mapPedido(rs), id);
        if (pedidos.isEmpty()) {
            return Optional.empty();
        }
        adjuntarDetalles(pedidos);
        return Optional.of(pedidos.getFirst());
    }

    private void adjuntarDetalles(List<Pedido> pedidos) {
        if (pedidos.isEmpty()) {
            return;
        }
        Map<Long, Pedido> porId = new LinkedHashMap<>();
        for (Pedido pedido : pedidos) {
            pedido.setDetalles(new ArrayList<>());
            porId.put(pedido.getId(), pedido);
        }
        String placeholders = String.join(", ", pedidos.stream().map(pedido -> "?").toList());
        Object[] args = pedidos.stream().map(Pedido::getId).toArray();
        String sql = """
                SELECT d.id, d.pedido_id, d.producto_id, p.nombre AS producto_nombre,
                       d.cantidad, d.precio_unitario, d.subtotal
                FROM detalle_pedido d
                JOIN productos p ON p.id = d.producto_id
                WHERE d.pedido_id IN (
                """ + placeholders + ") ORDER BY d.id";
        List<DetallePedido> detalles = jdbc.query(sql, (rs, rowNum) -> mapDetalle(rs), args);
        for (DetallePedido detalle : detalles) {
            porId.get(detalle.getPedidoId()).getDetalles().add(detalle);
        }
    }

    private Pedido mapPedido(ResultSet rs) throws SQLException {
        Pedido pedido = new Pedido();
        pedido.setId(rs.getLong("id"));
        pedido.setSedeId(rs.getLong("sede_id"));
        pedido.setMesaId(JdbcValues.longOrNull(rs, "mesa_id"));
        pedido.setUsuarioId(rs.getLong("usuario_id"));
        pedido.setUsuarioNombre(rs.getString("usuario_nombre"));
        pedido.setEstado(rs.getString("estado"));
        pedido.setTotal(rs.getBigDecimal("total"));
        pedido.setCreadoEn(JdbcValues.dateTimeOrNull(rs, "creado_en"));
        pedido.setActualizadoEn(JdbcValues.dateTimeOrNull(rs, "actualizado_en"));
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
