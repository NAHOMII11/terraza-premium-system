package com.terraza.backend.repository;

import com.terraza.backend.dto.InvoiceDTO;
import com.terraza.backend.dto.InvoiceLineDTO;
import com.terraza.backend.model.Payment;
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
public class PaymentRepository {

    private final JdbcTemplate jdbc;

    public boolean existePago(Long pedidoId) {
        Integer total = jdbc.queryForObject(
                "SELECT COUNT(*) FROM pagos WHERE pedido_id = ?",
                Integer.class,
                pedidoId);
        return total != null && total > 0;
    }

    public Long insertar(Long pedidoId, Long cajeroId, String metodoPago, BigDecimal monto, BigDecimal cambio) {
        return jdbc.queryForObject("""
                INSERT INTO pagos (pedido_id, cajero_id, metodo_pago, monto, cambio, fecha_pago)
                VALUES (?, ?, ?, ?, ?, NOW())
                RETURNING id
                """, Long.class, pedidoId, cajeroId, metodoPago, monto, cambio);
    }

    public int cerrarPedido(Long pedidoId, Long cajeroId) {
        return jdbc.update("""
                UPDATE pedidos
                SET estado = 'CERRADO', cajero_id = ?, fecha_cierre = NOW(), updated_at = NOW()
                WHERE id = ? AND estado = 'ABIERTO'
                """, cajeroId, pedidoId);
    }

    public Optional<InvoiceDTO> buscarFactura(Long pedidoId) {
        return jdbc.query("""
                SELECT p.id AS pedido_id, p.sede_id, s.nombre AS sede_nombre, p.mesa_id,
                       me.numero AS mesa_numero, u.nombre AS mesero_nombre, p.estado, p.total,
                       p.fecha_apertura, p.fecha_cierre
                FROM pedidos p
                JOIN sedes s ON s.id = p.sede_id
                JOIN usuarios u ON u.id = p.mesero_id
                LEFT JOIN mesas me ON me.id = p.mesa_id
                WHERE p.id = ?
                """, (rs, rowNum) -> mapFactura(rs), pedidoId).stream().findFirst();
    }

    public List<InvoiceLineDTO> listarLineas(Long pedidoId) {
        return jdbc.query("""
                SELECT d.producto_id, pr.nombre AS producto_nombre, d.cantidad,
                       d.precio_unitario, d.subtotal
                FROM detalle_pedido d
                JOIN productos pr ON pr.id = d.producto_id
                WHERE d.pedido_id = ?
                ORDER BY d.id
                """, (rs, rowNum) -> mapLinea(rs), pedidoId);
    }

    public Optional<Payment> buscarPagoPorPedido(Long pedidoId) {
        return jdbc.query("""
                SELECT pg.id, pg.pedido_id, pg.cajero_id, c.nombre AS cajero_nombre,
                       pg.metodo_pago, pg.monto, pg.cambio, pg.fecha_pago
                FROM pagos pg
                JOIN usuarios c ON c.id = pg.cajero_id
                WHERE pg.pedido_id = ?
                ORDER BY pg.fecha_pago DESC
                LIMIT 1
                """, (rs, rowNum) -> mapPago(rs), pedidoId).stream().findFirst();
    }

    private InvoiceDTO mapFactura(ResultSet rs) throws SQLException {
        InvoiceDTO factura = new InvoiceDTO();
        factura.setPedidoId(rs.getLong("pedido_id"));
        factura.setSedeId(rs.getLong("sede_id"));
        factura.setSedeNombre(rs.getString("sede_nombre"));
        factura.setMesaId(JdbcValues.longOrNull(rs, "mesa_id"));
        factura.setMesaNumero(JdbcValues.integerOrNull(rs, "mesa_numero"));
        factura.setMeseroNombre(rs.getString("mesero_nombre"));
        factura.setEstado(rs.getString("estado"));
        factura.setTotal(rs.getBigDecimal("total"));
        factura.setFechaApertura(JdbcValues.dateTimeOrNull(rs, "fecha_apertura"));
        factura.setFechaCierre(JdbcValues.dateTimeOrNull(rs, "fecha_cierre"));
        return factura;
    }

    private InvoiceLineDTO mapLinea(ResultSet rs) throws SQLException {
        InvoiceLineDTO linea = new InvoiceLineDTO();
        linea.setProductoId(rs.getLong("producto_id"));
        linea.setProductoNombre(rs.getString("producto_nombre"));
        linea.setCantidad(rs.getInt("cantidad"));
        linea.setPrecioUnitario(rs.getBigDecimal("precio_unitario"));
        linea.setSubtotal(rs.getBigDecimal("subtotal"));
        return linea;
    }

    private Payment mapPago(ResultSet rs) throws SQLException {
        Payment payment = new Payment();
        payment.setId(rs.getLong("id"));
        payment.setPedidoId(rs.getLong("pedido_id"));
        payment.setCajeroId(rs.getLong("cajero_id"));
        payment.setCajeroNombre(rs.getString("cajero_nombre"));
        payment.setMetodoPago(rs.getString("metodo_pago"));
        payment.setMonto(rs.getBigDecimal("monto"));
        payment.setCambio(rs.getBigDecimal("cambio"));
        payment.setFechaPago(JdbcValues.dateTimeOrNull(rs, "fecha_pago"));
        return payment;
    }
}
