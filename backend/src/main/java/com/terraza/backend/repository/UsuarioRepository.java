package com.terraza.backend.repository;

import com.terraza.backend.model.Usuario;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class UsuarioRepository {

    private final JdbcTemplate jdbc;

    public List<Usuario> findActivos() {
        return jdbc.query("""
                SELECT u.id, u.nombre, u.email, u.rol_id, r.nombre AS rol_nombre,
                       r.descripcion AS rol_descripcion, u.sede_id, s.nombre AS sede_nombre,
                       u.active, u.created_at, u.updated_at
                FROM usuarios u
                JOIN roles r ON r.id = u.rol_id
                LEFT JOIN sedes s ON s.id = u.sede_id
                WHERE u.active = TRUE
                ORDER BY u.nombre
                """, (rs, rowNum) -> map(rs, false));
    }

    public Optional<Usuario> findById(Long id) {
        return jdbc.query("""
                SELECT u.id, u.nombre, u.email, u.rol_id, r.nombre AS rol_nombre,
                       r.descripcion AS rol_descripcion, u.sede_id, s.nombre AS sede_nombre,
                       u.active, u.created_at, u.updated_at
                FROM usuarios u
                JOIN roles r ON r.id = u.rol_id
                LEFT JOIN sedes s ON s.id = u.sede_id
                WHERE u.id = ?
                """, (rs, rowNum) -> map(rs, false), id).stream().findFirst();
    }

    public Optional<Usuario> findByEmail(String email) {
        return jdbc.query("""
                SELECT u.id, u.nombre, u.email, u.password_hash, u.rol_id, r.nombre AS rol_nombre,
                       r.descripcion AS rol_descripcion, u.sede_id, s.nombre AS sede_nombre,
                       u.active, u.created_at, u.updated_at
                FROM usuarios u
                JOIN roles r ON r.id = u.rol_id
                LEFT JOIN sedes s ON s.id = u.sede_id
                WHERE LOWER(u.email) = LOWER(?)
                """, (rs, rowNum) -> map(rs, true), email).stream().findFirst();
    }

    public boolean existeEmail(String email) {
        Integer total = jdbc.queryForObject(
                "SELECT COUNT(*) FROM usuarios WHERE LOWER(email) = LOWER(?)",
                Integer.class,
                email);
        return total != null && total > 0;
    }

    public boolean existeEmailEnOtro(String email, Long id) {
        Integer total = jdbc.queryForObject(
                "SELECT COUNT(*) FROM usuarios WHERE LOWER(email) = LOWER(?) AND id <> ?",
                Integer.class,
                email,
                id);
        return total != null && total > 0;
    }

    public Optional<String> findRolActivo(Long rolId) {
        return jdbc.query(
                        "SELECT nombre FROM roles WHERE id = ? AND active = TRUE",
                        (rs, rowNum) -> rs.getString("nombre"),
                        rolId)
                .stream()
                .findFirst();
    }

    public Long insertar(String nombre, String email, String passwordHash, Long rolId, Long sedeId) {
        return jdbc.queryForObject("""
                INSERT INTO usuarios (nombre, email, password_hash, rol_id, sede_id, active)
                VALUES (?, ?, ?, ?, ?, TRUE)
                RETURNING id
                """, Long.class, nombre, email, passwordHash, rolId, sedeId);
    }

    public int actualizar(Long id, String nombre, String email, Long rolId, Long sedeId) {
        return jdbc.update("""
                UPDATE usuarios
                SET nombre = ?, email = ?, rol_id = ?, sede_id = ?, updated_at = NOW()
                WHERE id = ?
                """, nombre, email, rolId, sedeId, id);
    }

    public int actualizarPassword(Long id, String passwordHash) {
        return jdbc.update("""
                UPDATE usuarios
                SET password_hash = ?, updated_at = NOW()
                WHERE id = ?
                """, passwordHash, id);
    }

    public int actualizarActivo(Long id, boolean activo) {
        return jdbc.update("""
                UPDATE usuarios
                SET active = ?, updated_at = NOW()
                WHERE id = ?
                """, activo, id);
    }

    private Usuario map(ResultSet rs, boolean incluirPassword) throws SQLException {
        Usuario usuario = new Usuario();
        usuario.setId(rs.getLong("id"));
        usuario.setNombre(rs.getString("nombre"));
        usuario.setEmail(rs.getString("email"));
        if (incluirPassword) {
            usuario.setPassword(rs.getString("password_hash"));
        }
        usuario.setRolId(rs.getLong("rol_id"));
        usuario.setRolNombre(rs.getString("rol_nombre"));
        usuario.setRolDescripcion(rs.getString("rol_descripcion"));
        usuario.setSedeId(JdbcValues.longOrNull(rs, "sede_id"));
        usuario.setSedeNombre(rs.getString("sede_nombre"));
        usuario.setActivo(rs.getBoolean("active"));
        usuario.setCreadoEn(JdbcValues.dateTimeOrNull(rs, "created_at"));
        usuario.setActualizadoEn(JdbcValues.dateTimeOrNull(rs, "updated_at"));
        return usuario;
    }
}
