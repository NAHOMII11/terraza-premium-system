package com.terraza.backend.model;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class Producto {

    private Long id;
    private String codigo;
    private String nombre;
    private String descripcion;
    private BigDecimal valorCompra;
    private BigDecimal valorVenta;
    private Long tipoProductoId;
    private String tipoNombre;
    private Long proveedorId;
    private String proveedorNombre;
    private Boolean activo;
    private LocalDateTime creadoEn;
    private LocalDateTime actualizadoEn;
}
