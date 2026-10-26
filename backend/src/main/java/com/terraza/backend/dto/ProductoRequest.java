package com.terraza.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class ProductoRequest {

    @NotBlank(message = "Code is required")
    @Size(max = 50, message = "Code is too long")
    private String codigo;

    @NotBlank(message = "Name is required")
    @Size(max = 150, message = "Name is too long")
    private String nombre;

    @Size(max = 500, message = "Description is too long")
    private String descripcion;

    @NotNull(message = "Purchase price is required")
    @DecimalMin(value = "0.00", message = "Purchase price cannot be negative")
    @Digits(integer = 10, fraction = 2, message = "Purchase price format is invalid")
    private BigDecimal valorCompra;

    @NotNull(message = "Sale price is required")
    @DecimalMin(value = "0.00", message = "Sale price cannot be negative")
    @Digits(integer = 10, fraction = 2, message = "Sale price format is invalid")
    private BigDecimal valorVenta;

    @NotNull(message = "Product type is required")
    private Long tipoProductoId;

    private Long proveedorId;
}
