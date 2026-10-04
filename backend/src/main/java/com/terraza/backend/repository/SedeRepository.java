package com.terraza.backend.repository;

import com.terraza.backend.model.Sede;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class SedeRepository {

    private final JdbcTemplate jdbc;

    public List<Sede> findAll() {
        return jdbc.query("""
                SELECT id, nombre, direccion, telefono, ciudad, active, created_at, updated_at
                FROM sedes
                ORDER BY nombre
                """, (rs, rowNum) -> map(rs));
    }

    public Optional<Sede> findById(Long id) {
        return jdbc.query("""
                SELECT id, nombre, direccion, telefono, ciudad, active, created_at, updated_at
                FROM sedes
                WHERE id = ?
                """, (rs, rowNum) -> map(rs), id).stream().findFirst();
    }

    public boolean existeActiva(Long id) {
        Integer total = jdbc.queryForObject(
                "SELECT COUNT(*) FROM sedes WHERE id = ? AND active = TRUE",
                Integer.class,
                id);
        return total != null && total > 0;
    }

    public boolean existeNombre(String nombre) {
        Integer total = jdbc.queryForObject(
                "SELECT COUNT(*) FROM sedes WHERE LOWER(nombre) = LOWER(?)",
                Integer.class,
                nombre);
        return total != null && total > 0;
    }

    public boolean existeNombreEnOtra(String nombre, Long id) {
        Integer total = jdbc.queryForObject(
                "SELECT COUNT(*) FROM sedes WHERE LOWER(nombre) = LOWER(?) AND id <> ?",
                Integer.class,
                nombre,
                id);
        return total != null && total > 0;
    }

    public Long insertar(String nombre, String direccion, String telefono, String ciudad) {
        return jdbc.queryForObject("""
                INSERT INTO sedes (nombre, direccion, telefono, ciudad, active)
                VALUES (?, ?, ?, ?, TRUE)
                RETURNING id
                """, Long.class, nombre, direccion, telefono, ciudad);
    }

    public int actualizar(Long id, String nombre, String direccion, String telefono, String ciudad) {
        return jdbc.update("""
                UPDATE sedes
                SET nombre = ?, direccion = ?, telefono = ?, ciudad = ?, updated_at = NOW()
                WHERE id = ?
                """, nombre, direccion, telefono, ciudad, id);
    }

    private Sede map(ResultSet rs) throws SQLException {
        Sede sede = new Sede();
        sede.setId(rs.getLong("id"));
        sede.setNombre(rs.getString("nombre"));
        sede.setDireccion(rs.getString("direccion"));
        sede.setTelefono(rs.getString("telefono"));
        sede.setCiudad(rs.getString("ciudad"));
        sede.setActivo(rs.getBoolean("active"));
        sede.setCreadoEn(JdbcValues.dateTimeOrNull(rs, "created_at"));
        sede.setActualizadoEn(JdbcValues.dateTimeOrNull(rs, "updated_at"));
        return sede;
    }
}
