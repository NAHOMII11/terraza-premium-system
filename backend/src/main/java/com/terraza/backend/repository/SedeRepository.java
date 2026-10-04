package com.terraza.backend.repository;

import com.terraza.backend.model.Sede;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class SedeRepository {

    private final JdbcTemplate jdbc;

    public List<Sede> findAll() {
        return jdbc.query("""
                SELECT id, nombre, direccion, telefono, activo, creado_en
                FROM sedes
                ORDER BY nombre
                """, (rs, rowNum) -> map(rs));
    }

    public Optional<Sede> findById(Long id) {
        return jdbc.query("""
                SELECT id, nombre, direccion, telefono, activo, creado_en
                FROM sedes
                WHERE id = ?
                """, (rs, rowNum) -> map(rs), id).stream().findFirst();
    }

    public boolean existeActiva(Long id) {
        Integer total = jdbc.queryForObject(
                "SELECT COUNT(*) FROM sedes WHERE id = ? AND activo = TRUE",
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

    public Long insertar(String nombre, String direccion, String telefono) {
        return jdbc.queryForObject("""
                INSERT INTO sedes (nombre, direccion, telefono, activo)
                VALUES (?, ?, ?, TRUE)
                RETURNING id
                """, Long.class, nombre, direccion, telefono);
    }

    public int actualizar(Long id, String nombre, String direccion, String telefono) {
        return jdbc.update("""
                UPDATE sedes
                SET nombre = ?, direccion = ?, telefono = ?
                WHERE id = ?
                """, nombre, direccion, telefono, id);
    }

    private Sede map(java.sql.ResultSet rs) throws java.sql.SQLException {
        Sede sede = new Sede();
        sede.setId(rs.getLong("id"));
        sede.setNombre(rs.getString("nombre"));
        sede.setDireccion(rs.getString("direccion"));
        sede.setTelefono(rs.getString("telefono"));
        sede.setActivo(rs.getBoolean("activo"));
        sede.setCreadoEn(JdbcValues.dateTimeOrNull(rs, "creado_en"));
        return sede;
    }
}
