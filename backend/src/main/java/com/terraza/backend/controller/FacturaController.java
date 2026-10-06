package com.terraza.backend.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/facturas")
public class FacturaController {

    private final JdbcTemplate jdbcTemplate;

    public FacturaController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // CU019 - Generar factura en pantalla
    @GetMapping("/pedido/{pedidoId}")
    public ResponseEntity<?> generar(@PathVariable Long pedidoId) {
        try {
            // Datos del pedido
            Map<String, Object> pedido = jdbcTemplate.queryForMap(
                "SELECT p.id, p.total, p.fecha_apertura AS \"fechaApertura\", " +
                "       p.fecha_cierre AS \"fechaCierre\", p.estado, " +
                "       m.numero AS \"mesa\", s.nombre AS \"sede\", " +
                "       u.nombre AS \"mesero\" " +
                "FROM pedidos p " +
                "LEFT JOIN mesas m ON m.id = p.mesa_id " +
                "LEFT JOIN sedes s ON s.id = p.sede_id " +
                "LEFT JOIN usuarios u ON u.id = p.mesero_id " +
                "WHERE p.id = ?",
                pedidoId
            );

            // Detalle
            List<Map<String, Object>> detalle = jdbcTemplate.queryForList(
                "SELECT pr.nombre AS producto, dp.cantidad, " +
                "       dp.precio_unitario AS \"precioUnitario\", " +
                "       dp.subtotal " +
                "FROM detalle_pedido dp " +
                "JOIN productos pr ON pr.id = dp.producto_id " +
                "WHERE dp.pedido_id = ?",
                pedidoId
            );

            // Pago
            List<Map<String, Object>> pagos = jdbcTemplate.queryForList(
                "SELECT metodo_pago AS \"metodoPago\", monto, cambio " +
                "FROM pagos WHERE pedido_id = ?",
                pedidoId
            );

            Map<String, Object> factura = new HashMap<>();
            factura.put("pedido", pedido);
            factura.put("detalle", detalle);
            factura.put("pagos", pagos);

            return ResponseEntity.ok(factura);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}