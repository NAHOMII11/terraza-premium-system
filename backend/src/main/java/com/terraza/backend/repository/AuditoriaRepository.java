package com.terraza.backend.repository;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class AuditoriaRepository {

    private final JdbcTemplate jdbc;

    public void insertar(Long usuarioId, String operacion, String detalle, String ip, Long sedeId) {
        jdbc.update("""
                INSERT INTO auditoria (usuario_id, operacion, detalle, ip, sede_id)
                VALUES (?, ?, ?, ?, ?)
                """, usuarioId, operacion, detalle, ip, sedeId);
    }
}
