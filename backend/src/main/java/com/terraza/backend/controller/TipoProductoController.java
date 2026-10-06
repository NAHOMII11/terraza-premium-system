package com.terraza.backend.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tipos-producto")
public class TipoProductoController {

    private final JdbcTemplate jdbcTemplate;

    public TipoProductoController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listar() {
        return ResponseEntity.ok(jdbcTemplate.queryForList(
            "SELECT id, nombre, descripcion, active FROM tipos_producto " +
            "WHERE active = true ORDER BY nombre"
        ));
    }

    @PostMapping
    public ResponseEntity<?> crear(@RequestBody Map<String, Object> body) {
        try {
            jdbcTemplate.update(
                "INSERT INTO tipos_producto (nombre, descripcion, active) VALUES (?, ?, true)",
                body.get("nombre"), body.get("descripcion")
            );
            return ResponseEntity.ok(Map.of("message", "Tipo creado"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            jdbcTemplate.update(
                "UPDATE tipos_producto SET nombre = ?, descripcion = ?, updated_at = now() WHERE id = ?",
                body.get("nombre"), body.get("descripcion"), id
            );
            return ResponseEntity.ok(Map.of("id", id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        jdbcTemplate.update("UPDATE tipos_producto SET active = false WHERE id = ?", id);
        return ResponseEntity.ok(Map.of("id", id, "active", false));
    }
}