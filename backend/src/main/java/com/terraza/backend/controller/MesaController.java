package com.terraza.backend.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tables")
public class MesaController {

    private final JdbcTemplate jdbcTemplate;

    public MesaController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listar(@RequestParam Long sedeId) {
        List<Map<String, Object>> mesas = jdbcTemplate.queryForList(
            "SELECT id, numero, capacidad, estado, sede_id AS sedeId FROM mesas WHERE sede_id = ? AND active = true ORDER BY numero",
            sedeId
        );
        return ResponseEntity.ok(mesas);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> actualizar(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {

        String estado = (String) body.get("estado");
        if (estado == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "estado requerido"));
        }
        jdbcTemplate.update("UPDATE mesas SET estado = ? WHERE id = ?", estado, id);
        return ResponseEntity.ok(Map.of("id", id, "estado", estado));
    }
}