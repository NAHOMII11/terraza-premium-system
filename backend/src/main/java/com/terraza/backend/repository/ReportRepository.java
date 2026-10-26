package com.terraza.backend.repository;

import com.terraza.backend.dto.InventorySoldRow;
import com.terraza.backend.dto.SalesReportRow;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.Date;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class ReportRepository {

    private final JdbcTemplate jdbc;

    public List<SalesReportRow> ventas(Long sedeId, LocalDate from, LocalDate to) {
        List<Object> args = new ArrayList<>();
        StringBuilder sql = new StringBuilder("""
                SELECT p.id, p.fecha_cierre, s.nombre AS sede, me.numero AS mesa,
                       p.total, pg.metodo_pago, c.nombre AS cajero
                FROM pedidos p
                JOIN sedes s ON s.id = p.sede_id
                LEFT JOIN mesas me ON me.id = p.mesa_id
                LEFT JOIN pagos pg ON pg.id = (
                    SELECT px.id FROM pagos px WHERE px.pedido_id = p.id ORDER BY px.fecha_pago DESC LIMIT 1
                )
                LEFT JOIN usuarios c ON c.id = pg.cajero_id
                WHERE p.estado = 'CERRADO'
                """);
        if (sedeId != null) {
            sql.append(" AND p.sede_id = ?");
            args.add(sedeId);
        }
        if (from != null) {
            sql.append(" AND p.fecha_cierre::date >= ?");
            args.add(Date.valueOf(from));
        }
        if (to != null) {
            sql.append(" AND p.fecha_cierre::date <= ?");
            args.add(Date.valueOf(to));
        }
        sql.append(" ORDER BY p.fecha_cierre DESC NULLS LAST, p.id DESC");
        return jdbc.query(sql.toString(), (rs, n) -> mapSale(rs), args.toArray());
    }

    public List<InventorySoldRow> inventarioVendido(Long sedeId, LocalDate from, LocalDate to) {
        List<Object> args = new ArrayList<>();
        StringBuilder sql = new StringBuilder("""
                SELECT p.fecha_apertura::date AS fecha, pr.codigo, pr.nombre,
                       SUM(d.cantidad) AS cantidad_vendida,
                       pr.valor_compra,
                       CASE WHEN SUM(d.cantidad) = 0 THEN 0
                            ELSE SUM(d.subtotal) / SUM(d.cantidad) END AS valor_venta,
                       SUM(d.subtotal) - SUM(d.cantidad * pr.valor_compra) AS ganancia,
                       s.nombre AS sede
                FROM detalle_pedido d
                JOIN pedidos p ON p.id = d.pedido_id
                JOIN productos pr ON pr.id = d.producto_id
                JOIN sedes s ON s.id = p.sede_id
                WHERE 1 = 1
                """);
        if (sedeId != null) {
            sql.append(" AND p.sede_id = ?");
            args.add(sedeId);
        }
        if (from != null) {
            sql.append(" AND p.fecha_apertura::date >= ?");
            args.add(Date.valueOf(from));
        }
        if (to != null) {
            sql.append(" AND p.fecha_apertura::date <= ?");
            args.add(Date.valueOf(to));
        }
        sql.append("""
                 GROUP BY p.fecha_apertura::date, pr.codigo, pr.nombre, pr.valor_compra, s.nombre
                 ORDER BY fecha DESC, s.nombre, pr.codigo
                """);
        return jdbc.query(sql.toString(), (rs, n) -> mapSold(rs), args.toArray());
    }

    private SalesReportRow mapSale(ResultSet rs) throws SQLException {
        SalesReportRow row = new SalesReportRow();
        row.setPedidoId(rs.getLong("id"));
        row.setFecha(JdbcValues.dateTimeOrNull(rs, "fecha_cierre"));
        row.setSede(rs.getString("sede"));
        row.setMesa(JdbcValues.integerOrNull(rs, "mesa"));
        row.setTotal(rs.getBigDecimal("total"));
        row.setMetodoPago(rs.getString("metodo_pago"));
        row.setCajero(rs.getString("cajero"));
        return row;
    }

    private InventorySoldRow mapSold(ResultSet rs) throws SQLException {
        InventorySoldRow row = new InventorySoldRow();
        Date fecha = rs.getDate("fecha");
        row.setFecha(fecha == null ? null : fecha.toLocalDate());
        row.setCodigo(rs.getString("codigo"));
        row.setNombre(rs.getString("nombre"));
        row.setCantidadVendida(rs.getInt("cantidad_vendida"));
        row.setValorCompra(rs.getBigDecimal("valor_compra"));
        BigDecimal venta = rs.getBigDecimal("valor_venta");
        row.setValorVenta(venta == null ? BigDecimal.ZERO : venta);
        row.setGanancia(rs.getBigDecimal("ganancia"));
        row.setSede(rs.getString("sede"));
        return row;
    }
}
