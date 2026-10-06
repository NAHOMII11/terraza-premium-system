package com.terraza.backend.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pagos")
public class PagoController {

    private final JdbcTemplate jdbcTemplate;

    public PagoController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // CU016, CU017, CU018 - Registrar pago (efectivo, tarjeta crédito, tarjeta débito)
    @PostMapping
    public ResponseEntity<?> registrar(@RequestBody Map<String, Object> body) {
        try {
            Long pedidoId = Long.valueOf(body.get("pedidoId").toString());
            Long cajeroId = Long.valueOf(body.get("cajeroId").toString());
            String metodo = (String) body.get("metodoPago");
            BigDecimal monto = new BigDecimal(body.get("monto").toString());
            BigDecimal cambio = body.get("cambio") != null
                ? new BigDecimal(body.get("cambio").toString())
                : BigDecimal.ZERO;

            // Validar método
            if (!List.of("EFECTIVO", "TARJETA_CREDITO", "TARJETA_DEBITO").contains(metodo)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Método de pago inválido"));
            }

            // Registrar el pago
            jdbcTemplate.update(
                "INSERT INTO pagos (pedido_id, cajero_id, metodo_pago, monto, cambio) " +
                "VALUES (?, ?, ?, ?, ?)",
                pedidoId, cajeroId, metodo, monto, cambio
            );

            // CU015 - Cerrar pedido automáticamente
            jdbcTemplate.update(
                "UPDATE pedidos SET estado = 'CERRADO', fecha_cierre = now(), " +
                "cajero_id = ?, updated_at = now() WHERE id = ?",
                cajeroId, pedidoId
            );

            // Liberar la mesa
            jdbcTemplate.update(
                "UPDATE mesas SET estado = 'DISPONIBLE', updated_at = now() " +
                "WHERE id = (SELECT mesa_id FROM pedidos WHERE id = ?)",
                pedidoId
            );

            return ResponseEntity.ok(Map.of(
                "message", "Pago registrado y pedido cerrado",
                "pedidoId", pedidoId
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/pedido/{pedidoId}")
    public ResponseEntity<List<Map<String, Object>>> listarPagos(@PathVariable Long pedidoId) {
        return ResponseEntity.ok(jdbcTemplate.queryForList(
            "SELECT id, metodo_pago AS \"metodoPago\", monto, cambio, fecha_pago AS \"fechaPago\" " +
            "FROM pagos WHERE pedido_id = ? ORDER BY fecha_pago DESC",
            pedidoId
        ));
    }
}