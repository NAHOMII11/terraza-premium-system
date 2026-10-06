package com.terraza.backend.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inventory")
public class InventarioController {

    private final JdbcTemplate jdbcTemplate;

    public InventarioController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listar(@RequestParam Long sedeId) {
        return ResponseEntity.ok(jdbcTemplate.queryForList(
            "SELECT i.id, " +
            "       i.producto_id AS \"productoId\", " +
            "       p.nombre      AS \"productoNombre\", " +
            "       i.stock       AS \"cantidad\", " +
            "       i.sede_id     AS \"sedeId\" " +
            "FROM inventario i " +
            "JOIN productos p ON p.id = i.producto_id " +
            "WHERE i.sede_id = ? ORDER BY p.nombre",
            sedeId
        ));
    }

    // CU012 - Registrar producto en inventario (crear)
    @PostMapping
    public ResponseEntity<?> crear(@RequestBody Map<String, Object> body) {
        try {
            jdbcTemplate.update(
                "INSERT INTO inventario (producto_id, sede_id, stock) VALUES (?, ?, ?) " +
                "ON CONFLICT (sede_id, producto_id) DO UPDATE SET stock = EXCLUDED.stock, updated_at = now()",
                body.get("productoId"), body.get("sedeId"), body.get("stock")
            );
            return ResponseEntity.ok(Map.of("message", "Inventario actualizado"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // CU013 - Actualizar stock
    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            jdbcTemplate.update(
                "UPDATE inventario SET stock = ?, updated_at = now() WHERE id = ?",
                body.get("stock"), id
            );
            return ResponseEntity.ok(Map.of("id", id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}