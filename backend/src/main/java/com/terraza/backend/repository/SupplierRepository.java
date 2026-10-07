package com.terraza.backend.repository;

import com.terraza.backend.model.Supplier;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class SupplierRepository {

    private final JdbcTemplate jdbc;

    public List<Supplier> listarActivos() {
        return jdbc.query(sql() + " WHERE active = TRUE ORDER BY nombre", (rs, rowNum) -> map(rs));
    }

    public Optional<Supplier> buscarPorId(Long id) {
        return jdbc.query(sql() + " WHERE id = ?", (rs, rowNum) -> map(rs), id).stream().findFirst();
    }

    public boolean existeNit(String nit) {
        Integer total = jdbc.queryForObject(
                "SELECT COUNT(*) FROM proveedores WHERE LOWER(nit) = LOWER(?)",
                Integer.class,
                nit);
        return total != null && total > 0;
    }

    public boolean existeNitEnOtra(String nit, Long id) {
        Integer total = jdbc.queryForObject(
                "SELECT COUNT(*) FROM proveedores WHERE LOWER(nit) = LOWER(?) AND id <> ?",
                Integer.class,
                nit,
                id);
        return total != null && total > 0;
    }

    public int actualizar(Long id, String nombre, String nit, String contacto, String telefono, String email, String direccion) {
        return jdbc.update("""
                UPDATE proveedores
                SET nombre = ?, nit = ?, contacto = ?, telefono = ?, email = ?, direccion = ?, updated_at = NOW()
                WHERE id = ?
                """, nombre, nit, contacto, telefono, email, direccion, id);
    }

    public Long insertar(String nombre, String nit, String contacto, String telefono, String email, String direccion) {
        return jdbc.queryForObject("""
                INSERT INTO proveedores (nombre, nit, contacto, telefono, email, direccion, active)
                VALUES (?, ?, ?, ?, ?, ?, TRUE)
                RETURNING id
                """, Long.class, nombre, nit, contacto, telefono, email, direccion);
    }

    private String sql() {
        return """
                SELECT id, nombre, nit, contacto, telefono, email, direccion, active
                FROM proveedores
                """;
    }

    private Supplier map(ResultSet rs) throws SQLException {
        Supplier supplier = new Supplier();
        supplier.setId(rs.getLong("id"));
        supplier.setNombre(rs.getString("nombre"));
        supplier.setNit(rs.getString("nit"));
        supplier.setContacto(rs.getString("contacto"));
        supplier.setTelefono(rs.getString("telefono"));
        supplier.setEmail(rs.getString("email"));
        supplier.setDireccion(rs.getString("direccion"));
        supplier.setActivo(rs.getBoolean("active"));
        return supplier;
    }
}
