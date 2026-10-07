package com.terraza.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class CreatePaymentDTO {

    @NotNull(message = "El pedido es obligatorio")
    private Long pedidoId;

    @NotNull(message = "El método de pago es obligatorio")
    @Pattern(
            regexp = "EFECTIVO|TARJETA_CREDITO|TARJETA_DEBITO",
            message = "El método de pago debe ser EFECTIVO, TARJETA_CREDITO o TARJETA_DEBITO")
    private String metodoPago;

    @NotNull(message = "El monto es obligatorio")
    @DecimalMin(value = "0.00", message = "El monto no puede ser negativo")
    @Digits(integer = 10, fraction = 2, message = "El monto tiene un formato inválido")
    private BigDecimal monto;

    @NotNull(message = "El cajero es obligatorio")
    private Long cajeroId;
}
