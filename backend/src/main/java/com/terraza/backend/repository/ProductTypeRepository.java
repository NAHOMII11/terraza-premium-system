package com.terraza.backend.repository;

import com.terraza.backend.model.ProductType;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class ProductTypeRepository {

    private final JdbcTemplate jdbc;

    public List<ProductType> listarActivos() {
        return jdbc.query("""
                SELECT id, nombre, descripcion, active
                FROM tipos_producto
                WHERE active = TRUE
                ORDER BY nombre
                """, (rs, rowNum) -> map(rs));
    }

    public Optional<ProductType> buscarPorId(Long id) {
        return jdbc.query("""
                SELECT id, nombre, descripcion, active
                FROM tipos_producto
                WHERE id = ?
                """, (rs, rowNum) -> map(rs), id).stream().findFirst();
    }

    public boolean existeNombre(String nombre) {
        Integer total = jdbc.queryForObject(
                "SELECT COUNT(*) FROM tipos_producto WHERE LOWER(nombre) = LOWER(?)",
                Integer.class,
                nombre);
        return total != null && total > 0;
    }

    public Long insertar(String nombre, String descripcion) {
        return jdbc.queryForObject("""
                INSERT INTO tipos_producto (nombre, descripcion, active)
                VALUES (?, ?, TRUE)
                RETURNING id
                """, Long.class, nombre, descripcion);
    }

    private ProductType map(ResultSet rs) throws SQLException {
        ProductType productType = new ProductType();
        productType.setId(rs.getLong("id"));
        productType.setNombre(rs.getString("nombre"));
        productType.setDescripcion(rs.getString("descripcion"));
        productType.setActivo(rs.getBoolean("active"));
        return productType;
    }
}
