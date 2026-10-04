package com.terraza.backend.repository;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class AuditoriaRepository {

    private final JdbcTemplate jdbc;

    public void insertar(Long usuarioId, String accion, String entidad, Long entidadId, String detalle) {
        jdbc.update("""
                INSERT INTO auditoria (usuario_id, accion, entidad, entidad_id, detalle)
                VALUES (?, ?, ?, ?, ?)
                """, usuarioId, accion, entidad, entidadId, detalle);
    }
}
