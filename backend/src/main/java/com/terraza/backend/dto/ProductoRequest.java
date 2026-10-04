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

    @NotBlank(message = "El código es obligatorio")
    @Size(max = 50, message = "El código es demasiado largo")
    private String codigo;

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 150, message = "El nombre es demasiado largo")
    private String nombre;

    @Size(max = 500, message = "La descripción es demasiado larga")
    private String descripcion;

    @NotNull(message = "El valor de compra es obligatorio")
    @DecimalMin(value = "0.00", message = "El valor de compra no puede ser negativo")
    @Digits(integer = 10, fraction = 2, message = "El valor de compra tiene un formato inválido")
    private BigDecimal valorCompra;

    @NotNull(message = "El valor de venta es obligatorio")
    @DecimalMin(value = "0.00", message = "El valor de venta no puede ser negativo")
    @Digits(integer = 10, fraction = 2, message = "El valor de venta tiene un formato inválido")
    private BigDecimal valorVenta;

    @NotNull(message = "El tipo de producto es obligatorio")
    private Long tipoProductoId;

    private Long proveedorId;
}
