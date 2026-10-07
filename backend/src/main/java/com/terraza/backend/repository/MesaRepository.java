package com.terraza.backend.repository;

import com.terraza.backend.model.Mesa;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class MesaRepository {

    private final JdbcTemplate jdbc;

    public List<Mesa> listarPorSede(Long sedeId) {
        return jdbc.query("""
                SELECT id, numero, capacidad, sede_id, estado, active
                FROM mesas
                WHERE sede_id = ? AND active = TRUE
                ORDER BY numero
                """, (rs, rowNum) -> map(rs), sedeId);
    }

    public Optional<Mesa> buscarPorId(Long id) {
        return jdbc.query("""
                SELECT id, numero, capacidad, sede_id, estado, active
                FROM mesas
                WHERE id = ? AND active = TRUE
                """, (rs, rowNum) -> map(rs), id).stream().findFirst();
    }

    public int actualizarEstado(Long id, String estado) {
        return jdbc.update("""
                UPDATE mesas
                SET estado = ?, updated_at = NOW()
                WHERE id = ? AND active = TRUE
                """, estado, id);
    }

    private Mesa map(ResultSet rs) throws SQLException {
        Mesa mesa = new Mesa();
        mesa.setId(rs.getLong("id"));
        mesa.setNumero(rs.getInt("numero"));
        mesa.setCapacidad(rs.getInt("capacidad"));
        mesa.setSedeId(rs.getLong("sede_id"));
        mesa.setEstado(rs.getString("estado"));
        mesa.setActivo(rs.getBoolean("active"));
        return mesa;
    }
}
