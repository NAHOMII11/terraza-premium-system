package com.terraza.backend.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/proveedores")
public class ProveedorController {

    private final JdbcTemplate jdbcTemplate;

    public ProveedorController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listar() {
        return ResponseEntity.ok(jdbcTemplate.queryForList(
            "SELECT id, nombre, nit, contacto, telefono, email, direccion, active " +
            "FROM proveedores WHERE active = true ORDER BY nombre"
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> obtener(@PathVariable Long id) {
        List<Map<String, Object>> r = jdbcTemplate.queryForList(
            "SELECT * FROM proveedores WHERE id = ?", id
        );
        return r.isEmpty() ? ResponseEntity.notFound().build() : ResponseEntity.ok(r.get(0));
    }

    @PostMapping
    public ResponseEntity<?> crear(@RequestBody Map<String, Object> body) {
        try {
            jdbcTemplate.update(
                "INSERT INTO proveedores (nombre, nit, contacto, telefono, email, direccion, active) " +
                "VALUES (?, ?, ?, ?, ?, ?, true)",
                body.get("nombre"),
                body.get("nit"),
                body.get("contacto"),
                body.get("telefono"),
                body.get("email"),
                body.get("direccion")
            );
            return ResponseEntity.ok(Map.of("message", "Proveedor creado"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            jdbcTemplate.update(
                "UPDATE proveedores SET nombre = ?, nit = ?, contacto = ?, telefono = ?, " +
                "email = ?, direccion = ?, updated_at = now() WHERE id = ?",
                body.get("nombre"),
                body.get("nit"),
                body.get("contacto"),
                body.get("telefono"),
                body.get("email"),
                body.get("direccion"),
                id
            );
            return ResponseEntity.ok(Map.of("id", id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        jdbcTemplate.update("UPDATE proveedores SET active = false WHERE id = ?", id);
        return ResponseEntity.ok(Map.of("id", id, "active", false));
    }
}