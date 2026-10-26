package com.terraza.backend.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
public class InventorySoldRow {
    private LocalDate fecha;
    private String codigo;
    private String nombre;
    private Integer cantidadVendida;
    private BigDecimal valorCompra;
    private BigDecimal valorVenta;
    private BigDecimal ganancia;
    private String sede;
}
