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

    @NotNull(message = "Order is required")
    private Long pedidoId;

    @NotNull(message = "Payment method is required")
    @Pattern(
            regexp = "EFECTIVO|TARJETA_CREDITO|TARJETA_DEBITO",
            message = "Payment method must be EFECTIVO, TARJETA_CREDITO or TARJETA_DEBITO")
    private String metodoPago;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.00", message = "Amount cannot be negative")
    @Digits(integer = 10, fraction = 2, message = "Amount format is invalid")
    private BigDecimal monto;

    @NotNull(message = "Cashier is required")
    private Long cajeroId;
}
